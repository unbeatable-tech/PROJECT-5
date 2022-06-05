// IMPORT USERMODEL MODULE & PACKAGE------
const UserModel = require("../models/userModel");
const AWS = require('aws-sdk')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require('../models/userModel')

//VALIDATION FOR STRINGS-----
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}
//VALIDATION FOR CHECK DATA IN REQ BODY-----
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}


//*********************************************AWS CONFIG******************************************** */

AWS.config.update({
    accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
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


const isValidInputBody = function (object) {
    return Object.keys(object).length > 0
}

//VALIDATION FOR STRING------
const isValidInputValue = function (value) {
    if (typeof (value) === 'undefined' || value === null) return false
    if (typeof (value) === 'string' && value.trim().length > 0) return true
    return false
}

//VALIDATION FOR CHARACTERS----
const isValidOnlyCharacters = function (value) {
    return /^[A-Za-z]+$/.test(value)
}

//VALIDATION FOR ADDRESS-----
const isValidAddress = function (value) {
    if (typeof (value) === "undefined" || value === null) return false;
    if (typeof (value) === "object" && Array.isArray(value) === false && Object.keys(value).length > 0) return true;
    return false;
};

//VALIDATION FOR EMAIL-----
const isValidEmail = function (email) {
    const regexForEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regexForEmail.test(email);
};

//VALIDATION FOR PHONE NUMBER-----
const isValidPhone = function (phone) {
    const regexForMobile = /^[6-9]\d{9}$/;
    return regexForMobile.test(phone);
};

//VALIDATION FOR PASSWORD-----
const isValidPassword = function (password) {
    const regexForPass = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,15}$/;
    return regexForPass.test(password);
};

// VALIDATION FOR PIN-CODE-----
const isValidPincode = function (pincode) {
    const regexForPass = /^[1-9][0-9]{5}$/
    return regexForPass.test(pincode);
};

//VALIDATION FOR FILE ONLY IMAGE-----
const isValidImageType = function (value) {
    const regexForMimeTypes = /image\/png|image\/jpeg|image\/jpg/;
    return regexForMimeTypes.test(value)
}

//*********************************************USER REGISTRATION******************************************** */

const userRegistration = async function (req, res) {
    try {
        //FETCH DATA FROM REQUEST AND DESTRUCTURING-----
        const requestBody = { ...req.body };
        const queryParams = req.query;
        const image = req.files;

        //NO DATA IS REQUIRE FORM QUERY PAREMS-----
        if (isValidInputBody(queryParams)) {
            return res.status(404).send({ status: false, message: "Page not found" });
        }

        // CHECK REQUEST BODY IS EMPTY OR NOT-----
        if (!isValidInputBody(requestBody)) {
            return res.status(400).send({ status: false, message: "User data is required for registration" });
        }

        //DESTRUCTURING DATA FROM REQUEST BODY-----
        let { fname, lname, email, phone, password, address } = requestBody;

        //EACH KEY VALIDATION STARTS HERE----- 
        if (!isValidInputValue(fname) || !isValidOnlyCharacters(fname)) {
            return res.status(400).send({ status: false, message: "First name is required and it should contain only alphabets" });
        }

        if (!isValidInputValue(lname) || !isValidOnlyCharacters(lname)) {
            return res.status(400).send({ status: false, message: "Last name is required and it should contain only alphabets" });
        }

        if (!isValidInputValue(email) || !isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "email address is required and should be a valid email address" });
        }
        //CHEACK GIVEN EMAIL IS UNIQUE----- 
        const notUniqueEmail = await UserModel.findOne({ email });

        if (notUniqueEmail) {
            return res.status(400).send({ status: false, message: "Email address already exist" });
        }

        if (!isValidInputValue(phone) || !isValidPhone(phone)) {
            return res.status(400).send({ status: false, message: "Phone number is required and should be a valid mobile number" });
        }

        const notUniquePhone = await UserModel.findOne({ phone });

        //CHECK GIVEN PHONE IS UNIQUE------
        if (notUniquePhone) {
            return res.status(400).send({ status: false, message: "phone number already exist" });
        }

        // if (!isValidInputValue(password) || !isValidPassword(password)) {
        //     return res.status(400).send({ status: false, message: "password is required and should be of 8 to 15 characters and  must have 1 letter and 1 number" });
        // }

        if (!isValidInputValue(address)) {
            return res.status(400).send({ status: false, message: "address is required" });
        }

        //CONVERT ADDRESS INTO OBJECT------ 
        address = JSON.parse(address);

        if (!isValidAddress(address)) {
            return res.status(400).send({ status: false, message: "Invalid address" });
        }

        const { shipping, billing } = address;

        if (!isValidAddress(shipping)) {
            return res.status(400).send({ status: false, message: "Shipping address is required" });
        } else {
            let { street, city, pincode } = shipping;

            if (!isValidInputValue(street)) {
                return res.status(400).send({ status: false, message: "Shipping address: street name is required " });
            }

            if (!isValidPincode(pincode)) {
                return res.status(400).send({ status: false, message: "Shipping address: pin code should be valid like: 335659 " });
            }

            if (!isValidInputValue(city)) {
                return res.status(400).send({ status: false, message: "Shipping address: city name is required " });
            }
        }

        if (!isValidAddress(billing)) {
            return res.status(400).send({ status: false, message: "Billing address is required" });
        }
        else {
            let { street, city, pincode } = billing;

            if (!isValidInputValue(street)) {
                return res.status(400).send({ status: false, message: "Billing address: street name is required " });
            }

            if (!isValidPincode(pincode)) {
                return res.status(400).send({ status: false, message: "Billing address: pin code should be valid like: 335659 " });
            }

            if (!isValidInputValue(city)) {
                return res.status(400).send({ status: false, message: "Shipping address: city name is required ", });
            }

        }

        if (!image || image.length == 0) {
            return res.status(400).send({ status: false, message: "no profile image found" });
        }

        if (!isValidImageType(image[0].mimetype)) {
            return res.status(400).send({ status: false, message: "Only images can be uploaded (jpeg/jpg/png)" });
        }

        const uploadedProfilePictureUrl = await uploadFile(image[0]);

        //PASSWORD ENCRYPTION BY USING BCRYPT----- 
        const salt = await bcrypt.genSalt(13);
        const encryptedPassword = await bcrypt.hash(password, salt);

        const userData = {
            fname: fname.trim(),
            lname: lname.trim(),
            email: email.trim(),
            profileImage: uploadedProfilePictureUrl,
            phone: phone.trim(),
            password: encryptedPassword,
            address: address,
        };
        // CREATE DATA IN DATABASE----- 
        const newUser = await UserModel.create(userData);

        res.status(201).send({ status: true, message: "User successfully registered", data: newUser, });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};


const login = async function (req, res) {

    try {
        //FETCH DATA FROM REQ.BODY----
        let body = req.body

        // DESTRUCTURING DATA FETCH BY BODY----
        const { email, password } = body

        //VALIDATION FOR CHECK REQUEST BODY IS EMPTY OR NOT----
        if (!isValidRequestBody(body)) {
            return res.status(400).send({ status: false, msg: "pls provide details to login" })
        }

        //VALIDATE EMAIL BY USING REGEX------
        if (!isValid(email)) {
            return res.status(400).send({ status: false, msg: "pls provide valid email" })
        }

        if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({ status: false, message: `${email} should be a valid email address` })

        }

        // VALIDATE PASSWORD BY USING REGEX------
        if (!isValid(password)) {
            return res.status(400).send({ status: false, msg: "pls provide valid password" })
        }

        if (!(/^[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(password))) {
            return res.status(400).send({ status: false, message: `Password length should be A Valid Password And Length Should Be in between 8 to 15 ` });

        }

        // MAKE A DB CALL TO FIND DOCUMENT PRESENT WITH GIVEN EMAIL-----
        let user = await userModel.findOne({ email: email })
        if (!user) {
            return res.status(400).send({ status: false, msg: "Invalid credentials" })
        }

        //COMPARE PASSWORD PRESENT IN BODY WITH PASSWORD PRESENT IN DOCUMENT OF USER------
        const passwordDetails = await bcrypt.compare(body.password, user.password)
        if (!passwordDetails) {
            return res.status(400).send({ status: false, msg: "password is incorrect pls provide correct passwords" })
        }

        //GENERATE JWT TOKEN IF EMAIL AND PASSWORD IS CORRECT-----
        const token = jwt.sign({
            userId: user._id, iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 180
        }, "Group-4")
        //.FLOOR() IS A FUNCTION THAT IS USED TO RETURN THE LARGEST INTEGER----
        return res.status(200).send({ status: true, message: "User login successfull", data: { userId: user._id, token: token } })

    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })
    }
}


const getUser = async function (req, res) {
    try {
        //FETCH USERID FROM THE PARAMS-----
        const userIdInParams = req.params.userId
        //console.log(userIdInParams)
        let decodedToken = req.userId
        //console.log(decodedToken)

        //CHECK USERID GIVEN IN PAREM IS VALID OR NOT-----
        if (userIdInParams.length != 24) {
            return res.status(400).send({ status: false, message: "invalid object id" })
        }

        // COMPARE USERID PRESENT IN PAREMS AND TOKEN-----
        if (decodedToken != userIdInParams) {
            return res.status(403).send({ status: false, message: "User Not authorized!" })
        }

        //MAKE DB CALL TO FIND USER DOCUMENT BY USERID----
        let userDetail = await userModel.findOne({ _id: userIdInParams })
        if (!userDetail) {
            return res.status(400).send({ status: false, message: "User profile not found" })
        }
        res.status(200).send({ status: true, message: "User profile details", data: userDetail })

    } catch (err) {
        return res.status(500).send({ status: false, Message: err.Message })
    }
}

const updateUser = async function (req, res) {
    try {
        //FETCH DATA FROM REQUEST BODY-----
        let data = req.body;

        //FETCH USER ID FROM PARAMS----- 
        const userIdFromParams = req.params.userId;

        //CHECK COJECT ID IS VALID OR NOT-----
        if (userIdFromParams.length != 24) {
            return res.status(400).send({ status: false, message: "invalid object id" })
        }

        //FETCH USER ID PRESENT IN TOKEN BY REQUEST BODY-----
        const userIdFromToken = req.userId;

        if (userIdFromParams != userIdFromToken) {
            return res.status(403).send({ status: false, message: "you are not authorised" })
        }

        //DESTRUCTURING OF DATA-----
        const { fname, lname, email, phone, password, address } = data;

        const updatedData = {}
        const userByuserId = await userModel.findById(userIdFromParams);
        if (!userByuserId) return res.status(404).send({ status: false, message: 'user not found..!!' });
        if (userIdFromToken != userIdFromParams) return res.status(403).send({ status: false, message: "Unauthorized access..!!" })


        //=======================================fname validation=====================================

        if (fname) {
            if (!isValid(fname)) return res.status(400).send({ status: false, Message: "First name is invalid..!!" });
            updatedData.fname = fname
        }

        //===================================lname validation==========================================

        if (lname) {
            if (!isValid(lname)) return res.status(400).send({ status: false, Message: "Last name is invalid...!!" });
            updatedData.lname = lname
        }

        //================================email validation==============================================

        if (email) {
            if (!(isValidEmail(email.trim()))) return res.status(400).send({ status: false, msg: "Please provide a valid email..!!" });
            const isEmailUsed = await userModel.findOne({ email: email });
            if (isEmailUsed) return res.status(400).send({ status: false, msg: "email must be unique..!!" });
            updatedData.email = email;
        }

        //=======================profile pic upload and validation==========================
        //LEVEL OF CODING IT INDICATES THE DEFICELTY LEVEL I.E FORM 4 TO 14
        let saltRounds = 10;
        const image = req.files;


        if (typeof image !== undefined) {
            if (image && image.length > 0) {
                if (!isValidImageType(image[0].mimetype)) {
                    return res.status(400).send({ status: false, message: "Only images can be uploaded (jpeg/jpg/png)" });
                }

                const profilePic = await uploadFile(image[0]);
                updatedData.profileImage = profilePic;
            }
        }
        //===============================phone validation-========================================

        if (phone) {

            if (!(isValidPhone(phone))) return res.status(400).send({ status: false, msg: "please provide a valid phone number..!!" });

            const isPhoneUsed = await userModel.findOne({ phone: phone });
            if (isPhoneUsed) return res.status(400).send({ status: false, msg: "phone number must be unique..!!" });
            updatedData.phone = phone;
        }

        //======================================password validation-====================================

        if (password) {
            if (!isValid(password)) return res.status(400).send({ status: false, message: "password is required..!!" });
            const encryptPassword = await bcrypt.hash(password, saltRounds);
            updatedData.password = encryptPassword;
        }

        //========================================address validation=================================

        if (address) {

            if (address.shipping) {
                if (address.shipping.street) {
                    if (!isValid(address.shipping.street)) return res.status(400).send({ status: false, Message: "street name is required..!!" });
                    updatedData["address.shipping.street"] = address.shipping.street;
                }

                if (address.shipping.city) {
                    if (!isValid(address.shipping.city)) return res.status(400).send({ status: false, Message: "city name is required..!!" });
                    updatedData["address.shipping.city"] = address.shipping.city;
                }

                if (address.shipping.pincode) {
                    if (!isValid(address.shipping.pincode)) return res.status(400).send({ status: false, Message: "pincode is required..!!" });
                    updatedData["address.shipping.pincode"] = address.shipping.pincode;
                }
            }

            if (address.billing) {
                if (address.billing.street) {
                    if (!isValid(address.billing.street)) return res.status(400).send({ status: false, Message: "Please provide street name in billing address..!!" });
                    updatedData["address.billing.street"] = address.billing.street;
                }

                if (address.billing.city) {
                    if (!isValid(address.billing.city)) return res.status(400).send({ status: false, Message: "Please provide city name in billing address..!!" });
                    updatedData["address.billing.city"] = address.billing.city
                }

                if (address.billing.pincode) {
                    if (!isValid(address.billing.pincode)) return res.status(400).send({ status: false, Message: "Please provide pincode in billing address..!!;" })
                    updatedData["address.billing.pincode"] = address.billing.pincode;
                }
            }
        }
        if (Object.keys(updatedData) == 0) {
            return res.status(400).send({ status: false, msg: "please provide data to update..!!" })
        }

        //=========================================update data=============================

        const updatedUser = await userModel.findOneAndUpdate({ _id: userIdFromParams }, updatedData, { new: true });

        return res.status(200).send({ status: true, message: "User profile updated", data: updatedUser });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ staus: false, message: err.message });
    }

}
module.exports = { login, getUser, updateUser, userRegistration }