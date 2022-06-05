const productModel = require("../models/productModel")
const AWS = require("aws-sdk")
const mongoose = require("mongoose");
//const currencySymbol = require("currency-symbol-map");

// validation for objectId-----
const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)

}

const isValidInputBody = function (object) {
    return Object.keys(object).length > 0
}

const isValidInputValue = function (value) {
    if (typeof (value) === 'undefined' || value === null) return false
    if (typeof (value) === 'string' && value.trim().length > 0) return true
    return false
}

const isValidPrice = function (price) {
    let regexForPrice = /^\d+(\.\d{1,2})?$/
    return regexForPrice.test(price)
};


const isValidImageType = function (value) {
    const regexForMimeTypes = /image\/png|image\/jpeg|image\/jpg/;
    return regexForMimeTypes.test(value)
}

// aws configuration--------
AWS.config.update({
    accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link------
        let s3 = new AWS.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",  //HERE
            Key: "project05_group04/" + file.originalname, //HERE 
            Body: file.buffer
        }


        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            console.log(data)
            console.log("file uploaded succesfully")
            return resolve(data.Location)
        })
    })
}


//VALIDATION FOR STRINGS-----

const isValid = function (value) {
    if (typeof value == undefined || value == null) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    if (typeof value === 'Number' && value.toString().trim().length === 0) return false;
    return true;
}
//VALIDATION FOR CHECK DATA IN REQ BODY-----


const createProduct = async function (req, res) {
    try {

        let data = req.body;
        let files = req.files;

        if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, msg: "please input some data..!!" }) };
        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data;

        //title validation-----

        if (!title) { return res.status(400).send({ status: false, msg: "title required..!!" }) };

        if (!isValid(title)) return res.status(400).send({ status: false, msg: "title required..!!" });

        let duplicateTitle = await productModel.findOne({ title: title });

        if (duplicateTitle) return res.status(400).send({ status: false, msg: "title already exist in use..!!" });

        // description validation------

        if (!description) return res.status(400).send({ status: false, msg: "description required..!!" });

        if (!isValid(description)) return res.status(400).send({ status: false, msg: "description required..!!" });


        if (!price) return res.status(400).send({ status: false, msg: "price required..!!" });
        if (!currencyId) return res.status(400).send({ status: false, msg: "currencyId required..!!" });
        if (!currencyFormat) return res.status(400).send({ status: false, msg: "currency format required..!!" });


        //IF SIZE IS IN STRING----
        if (availableSizes) {
            if (typeof (availableSizes == "string")) {
                if (!isValidInputValue(availableSizes)) {
                    return res.status(400).send({ status: false, message: "Invalid format of availableSizes" });
                }
                let availableSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                for (let i = 0; i < availableSize.length; i++) {
                    if (availableSizes == availableSize[i]) {
                        continue;
                    }
                }
            } else {
                return res.status(400).send({ status: false, message: `avilablesize is ["S", "XS", "M", "X", "L", "XXL", "XL"] select size from avilablesize` });
            }
        }

        //IF SIZE IS IN ARRAY----
        console.log(availableSizes)
        let size = availableSizes.split(",").map(x => (x))
        if (availableSizes) {
            console.log(size)
            let availableSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]

            for (let i = 0; i < availableSize.length; i++) {
                for (let j = 0; j < size.length; j++)
                    if (size[j] == availableSize[i]) {
                        continue;
                    }
            }
        } else {
            return res.status(400).send({ status: false, message: `avilablesize is ["S", "XS", "M", "X", "L", "XXL", "XL"] select size from avilablesize` });
        }
        data.availableSizes = size


        if (currencyId != "INR") return res.status(400).send({ status: false, msg: "only indian currencyId INR accepted..!!" })

        if (currencyFormat != "₹") return res.status(400).send({ status: false, msg: "only indian currency ₹ accepted..!!" });


        if (!isValidImageType(files[0].mimetype)) {
            return res.status(400).send({ status: false, message: "Only images can be uploaded (jpeg/jpg/png)" });
        }

        var profileImagessweetselfie = await uploadFile(files[0]);


        data.productImage = profileImagessweetselfie;

        //data.availableSizes = JSON.parse(availableSizes);

        if (!data.productImage) return res.status(400).send({ status: false, msg: "productImage required..!!" });
        // 
        const created = await productModel.create(data);

        return res.status(201).send({ status: true, data: created });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ status: false, msg: err.message })
    }
}

const getProduct = async function (req, res) {
    try {
        //DESTRUCTURING DATA FETCHED FROM QUERY PARAMS-----
        let { name, size, priceGreaterThan, priceLessThan } = req.query

        // CHECK FILTER PRESENT OR NOT-----
        if (Object.keys(req.query).length == 0) {
            let find = await productModel.find({ isDeleted: false }).sort({ title: 1 })
            res.status(200).send({ status: true, message: "ProductList", data: find })
        }
        else if (name || size || priceGreaterThan || priceLessThan) {
            //console.log(name, size, priceGreaterThan, priceLessThan)
            let obj = {
                isDeleted: false
            };
            let obj2 = {}
            //IF PRODUCT NAME PRESENT IN QUERY PARAMS----
            if (name) {
                if (!isValidInputValue(name)) {
                    return res.status(400).send({ status: false, msg: "product name is required..!!" });
                }
                obj.title = name 
                
            }
            //IF PRODUCT SIZE PRESENT IN QUERY PARAMS----
            

            //IF PRODUCT PRISE PRESENT IN QUERY PARAMS----
            if (priceGreaterThan) {
                if (!isValidPrice(priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: "Invalid price" });
                }
                obj.$gt = priceGreaterThan
            }
            
            if (priceLessThan) {
                if (!isValidPrice(priceLessThan)) {
                    return res.status(400).send({ status: false, message: "Invalid price" });
                }
                obj.$lt = priceLessThan
            }
            //IF MORE THEN ONE FILTER PRESENT FOR SINGLE ATTRIBUTE-----
            if (size) {
                obj2.availableSizes = size
            }
            if(Object.keys(obj2) != 0){
            for (let key in obj2) {
                if (typeof (obj2[key]) == "string") {
                    obj2[key] = obj2[key].split(",")
                    for (let i = 0; i < obj2[key].length; i++)
                        obj2[key][i] = obj2[key][i].toUpperCase().trim()
                    //$all in mongo that select the documents where the field holdes an array and contain all elements----
                    obj2[key] = { $all: obj2[key] }

                }
                else {
                    obj2[key] = { $all: obj2[key] }
                }
            }
        
            //VALIDATION FOR SIZE-----
            if (obj2.availableSizes) {
                let availableSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                for (let i = 0; i < availableSize.length; i++) {
                    for (let j = 0; j < (obj2.availableSizes.$all).length; j++)
                        if (obj2.availableSizes.$all[j] == availableSize[i]) {
                            continue;
                        }
                }
            } else {
                return res.status(400).send({ status: false, message: "Invalid format of Sizes" });

            }
            }
            // console.log(obj)
            //let {a=9},let{ b= 10 }  let c = {a=9,b=10} === {...a,...b}
            //spread operator doing yhe concat job i.e add obj----
            const filterData = await productModel.find({ ...obj, ...obj2 }).sort({ price: 1 })

            if (filterData.length == 0) {
                return res.status(400).send({ status: false, message: "prodect not found" })
            }

            res.status(200).send({ status: true, data: filterData })
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



/******************Get product by id************ */

const getProductById = async function (req, res) {

    try {
        //FETCH PRODUCT ID FROM PAREMS-----
        let productId = req.params.productId

        // VALIDATE COJECT ID------
        if (!isValidObjectId(productId)) {
            return res.status({ sttaus: false, msg: "invalid product Id" })
        }
        //CHECK PRODUCT PRESENT WITH GIVEN PRDUCT-ID IS DELETE OR NOT IF NOT NOT DELETED RETURN DOCUMENT-----
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(400).send({ status: false, msg: "No product available or product deleted" })
        }
        return res.status(200).send({ status: true, msg: "Success", data: product })

    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })
    }
}


//************UPDATE A PRODUCT DETAILS*************** */

const updateProductDetails = async function (req, res) {
    try {
        const queryParams = req.query;
        const requestBody = { ...req.body };
        const productId = req.params.productId;
        const image = req.files;
        // no data is required from query params
        if (isValidInputBody(queryParams)) {
            return res.status(404).send({ status: false, message: "Page not found" });
        }
        // checking product exist with product ID
        const productByProductId = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!productByProductId) {
            return res.status(404).send({ status: false, message: "No product found by product id" });
        }

        if (!isValidInputBody(requestBody) && typeof image === undefined) {
            return res.status(400).send({ status: false, message: "Update related product data required", });
        }

        let {
            title,
            description,
            price,
            isFreeShipping,
            style,
            availableSizes,
            installments,
        } = requestBody;
        // creating an empty object 
        const updates = { $set: {} };

        //console.log(requestBody)
        // if request body has key name "title" then after validating its value, same is added to updates object

        if (requestBody.hasOwnProperty("title")) {
            if (!isValidInputValue(title)) {
                return res.status(400).send({ status: false, message: "Invalid title" });
            }
            console.log(isValidInputValue(title))
            const notUniqueTitle = await productModel.findOne({ title: title, });
            //console.log(notUniqueTitle)
            if (notUniqueTitle) {
                return res.status(400).send({ status: false, message: "Product title already exist" });
            }

            updates["$set"]["title"] = title.trim();
            //console.log(updates)
        }
        // if request body has key name "description" then after validating its value, same is added to updates object
        if (requestBody.hasOwnProperty("description")) {
            if (!isValidInputValue(description)) {
                return res.status(400).send({ status: false, message: "Invalid description" });
            }
            updates["$set"]["description"] = description.trim();
        }
        // if request body has key name "price" then after validating its value, same is added to updates object
        if (requestBody.hasOwnProperty("price")) {
            if (!isValidPrice(price)) {
                return res.status(400).send({ status: false, message: "Invalid price" });
            }
            updates["$set"]["price"] = price;
        }
        // if request body has key name "isFreeShipping" then after validating its value, same is added to updates object
        if (requestBody.hasOwnProperty("isFreeShipping")) {
            if (["true", "false"].includes(isFreeShipping) === false) {
                return res.status(400).send({ status: false, message: "isFreeShipping should be boolean" });
            }
            updates["$set"]["isFreeShipping"] = isFreeShipping;
        }
        // if request body has key name "style" then after validating its value, same is added to updates object
        if (requestBody.hasOwnProperty("style")) {
            if (!isValidInputValue(style)) {
                return res.status(400).send({ status: false, message: "Invalid style" });
            }
            updates["$set"]["style"] = style;
        }

        if (availableSizes) {
            console.log("1111")
            if (typeof (availableSizes == "string")) {
                if (!isValidInputValue(availableSizes)) {
                    return res.status(400).send({ status: false, message: "Invalid format of availableSizes" });
                }
                let availableSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                for (let i = 0; i < availableSize.length; i++) {
                    if (availableSizes == availableSize[i]) {
                        continue;
                    }
                }
            } else {
                return res.status(400).send({ status: false, message: `avilablesize is ["S", "XS", "M", "X", "L", "XXL", "XL"] select size from avilablesize` });
            }
        }
        updates["$set"]["availableSizes"] = availableSizes;

        //IF SIZE IS IN ARRAY----
        //console.log(availableSizes)
        if (availableSizes) {
            console.log("22222")
            let size = availableSizes.split(",").map(x => (x))
            let availableSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            if (availableSize) {
                for (let i = 0; i < availableSize.length; i++) {
                    for (let j = 0; j < size.length; j++)
                        if (size[j] == availableSize[i]) {
                            continue;
                        }
                }
                updates["$set"]["availableSizes"] = size;
            } else {
                return res.status(400).send({ status: false, message: `avilablesize is ["S", "XS", "M", "X", "L", "XXL", "XL"] select size from avilablesize` });
            }
        }


        // if request body has key name "installments" then after validating its value, same is added to updates object
        if (requestBody.hasOwnProperty("installments")) {
            if (!isValid(installments)) {
                return res.status(400).send({ status: false, message: "invalid installments" });
            }
            updates["$set"]["installments"] = Number(installments);
        }
        // if request body has key name "image" then after validating its value, same is added to updates object
        if (typeof image !== undefined) {
            if (image && image.length > 0) {
                if (!isValidImageType(image[0].mimetype)) {
                    return res.status(400).send({ status: false, message: "Only images can be uploaded (jpeg/jpg/png)" });
                }
                const productImageUrl = await uploadFile(image[0]);
                updates["$set"]["productImage"] = productImageUrl;
            }
        }

        if (Object.keys(updates["$set"]).length === 0) {
            return res.json("nothing is updated");
        }
        // updating product data of given ID by passing updates object
        const updatedProduct = await productModel.findOneAndUpdate({ _id: productId }, updates, { new: true });

        res.status(200).send({ status: true, message: "Product data updated successfully", data: updatedProduct });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

/*****************Delete product******************** */

const delProduct = async function (req, res) {
    try {
        //FETCH PRODUCT ID FROM PAREMS-----
        let productId = req.params.productId

        // VALIDATE COJECT ID------
        if (!isValidObjectId(productId)) {
            return res.status({ sttaus: false, msg: "invalid product Id" })

        }
        //CHECK PRODUCT PRESENT WITH GIVEN PRDUCT-ID IS DELETE OR NOT-----
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(400).send({ status: false, msg: `${productId} doesn't exist or already deleted` })
        }
        //IF PRODUCT IS NOT DELETED THEN MAKE IT DELETE----
        let deleteProduct = await productModel.findOneAndUpdate({ _id: productId }, { isDeleted: true, deletedAt: Date.now() }, { new: true })
        return res.status(200).send({ status: true, msg: "Success", data: deleteProduct })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })
    }
}

// MAKE MODEULE PUBLIC AND EXPORT FROM HERE----
module.exports = { getProductById, delProduct, getProduct, createProduct, updateProductDetails }