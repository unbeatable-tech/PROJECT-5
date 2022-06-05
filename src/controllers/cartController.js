const CartModel = require("../models/cartModel.js");
const cartModel = require("../models/cartModel.js");
const ProductModel = require("../models/productModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel")
const mongoose = require('mongoose')


//**************************************************VALIDATORS **************************************************** */

const isValidInputBody = function (object) {
    return Object.keys(object).length > 0
}


const isValidInputValue = function (value) {
    if (typeof (value) === 'undefined' || value === null) return false
    if (typeof (value) === 'string' && value.trim().length > 0) return true
    return false
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId);
};





//*********************************************ADD PRODUCT TO CART***************************************************** */

const AddProductToCart = async function (req, res) {
    try {
        const requestBody = req.body;
        const queryParams = req.query;
        const userId = req.params.userId;

        // query params must be empty
        if (isValidInputBody(queryParams)) {
            return res.status(404).send({ status: false, message: " page not found" });
        }
        //  provide authorization to user 
        const userIdToken = req.userId
        if (userIdToken != userId) {
            return res.status(403).send({ status: false, msg: "you are not authorized" })
        }

        // using destructuring
        const { productId, cartId } = requestBody;

        // validating product id
        if (!isValidInputValue(productId) || !isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Product ID is required and should be valid" });
        }

        if (cartId) {
            if (!isValidInputValue(cartId) || !isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "Cart ID should be valid" });
            }
        }
        // product details
        const productByProductId = await ProductModel.findOne({ _id: productId, isDeleted: false, deletedAt: null });

        if (!productByProductId) {
            return res.status(404).send({ status: false, message: `No product found by ${productId}` });
        }

        // checking whether product is in stock or not
        if (productByProductId.installments === 0) {
            return res.status(400).send({ status: false, message: `product is out of stock` });
        }

        // users cart details
        const userCartDetails = await CartModel.findOne({ userId: userId });


        // if cart is empty then adding product to cart's items array...(new)
        if (userCartDetails == null) {

            const createcart = await CartModel.create({ userId: userId, totalPrice: 0, totalItems: 0 })
            // console.log(createcart)

            const productData = { productId: productId, quantity: 1 };

            const cartData = { items: [productData], totalPrice: productByProductId.price, totalItems: 1 };

            const newCart = await CartModel.findOneAndUpdate({ userId: userId }, { $set: cartData }, { new: true }).select({ items: { _id: 0 } });
            // console.log(newCart)
            return res.status(200).send({
                status: true, message: "Product added to cart", data: newCart
            });
        }

        // checking whether product exist in cart or not
        const isProductExistsInCart = userCartDetails.items.filter(
            (productData) => productData["productId"].toString() === productId);

        // if product exist thus increasing its quantity
        if (isProductExistsInCart.length > 0) {
            let product = { productId: 1, quantity: 1, _id: 0 }
            const updateExistingProductQuantity = await CartModel.findOneAndUpdate({ userId: userId, "items.productId": productId }, { $inc: { totalPrice: +productByProductId.price, "items.$.quantity": +1, }, }, { new: true }).select({ items: { _id: 0 } })
            console.log(updateExistingProductQuantity)

            return res.status(200).send({ status: true, message: "Product quantity updated to cart", data: updateExistingProductQuantity });
        }

        // if product id coming from request body is not present in cart thus adding new product to cart
        const addNewProductToCart = await CartModel.findOneAndUpdate({ userId: userId }, {
            $addToSet: { items: { productId: productId, quantity: 1 } },
            $inc: { totalItems: +1, totalPrice: +productByProductId.price },
        }, { new: true }).select({ items: { _id: 0 } })

        return res.status(200).send({ status: true, message: "Item updated to cart", data: addNewProductToCart });
    } catch (error) {

        res.status(500).send({ error: error.message });
    }
}

const getCart = async function (req, res) {
    try {
        //Fetch userid freom params
        const userId = req.params.userId

        //validation for userid
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "pls add valid userid" })
        }

        const checkUser = await userModel.findOne({ _id: userId })
        if (!checkUser) {
            return res.status(404).send({ status: false, msg: "No user exist" })
        }

        //fetch userid from req.body present in token
        const userIdToken = req.userId

        // provide authorization to user
        if (userIdToken != userId) {
            return res.status(403).send({ status: false, msg: "you are not authorized" })
        }

        const checkCart = await cartModel.findOne({ userId: userId }).select({ items: { _id: 0 } })
        if (!checkCart) {
            return res.status(404).send({ status: false, msg: "cart doesn't exist" })
        }
        return res.status(200).send({ status: true, msg: "succes", data: checkCart })

    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })

    }

}


const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        let requestBody = req.body;
        let userIdFromToken = req.userId;

        //validation starts.
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid userId in body..!!" });

        let findUser = await userModel.findOne({ _id: userId })
        if (!findUser) return res.status(400).send({ status: false, message: "UserId does not exits..!!" });


        //Authentication & authorization
        if (findUser._id.toString() != userIdFromToken) return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match..!!` });

        //Extract body
        const { cartId, productId, removeProduct } = requestBody

        //cart validation
        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Invalid cartId in body..!!" });

        let findCart = await cartModel.findById({ _id: cartId })
        if (!findCart) return res.status(400).send({ status: false, message: "cartId does not exists..!!" });

        //product validation
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid productId in body..!!" });

        let findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) return res.status(400).send({ status: false, message: "productId does not exists..!!" });

        //finding if products exits in cart
        let isProductinCart = await cartModel.findOne({ items: { $elemMatch: { productId: productId } } })
        if (!isProductinCart) return res.status(400).send({ status: false, message: `This ${productId} product does not exists in the cart..!!` });

        //removeProduct validation either 0 or 1.
        if (!(!isNaN(Number(removeProduct)))) return res.status(400).send({ status: false, message: `removeProduct should be a valid number either 0 or 1..!!` });

        //removeProduct => 0 for product remove completely, 1 for decreasing its quantity.
        if (!((removeProduct === 0) || (removeProduct === 1))) return res.status(400).send({ status: false, message: 'removeProduct should be 0 (product is to be removed) or 1(quantity has to be decremented by 1)..!! ' });


        let findQuantity = findCart.items.find(x => x.productId.toString() === productId)
        //console.log(findQuantity)

        if (removeProduct === 0) {
            let totalAmount = findCart.totalPrice - (findProduct.price * findQuantity.quantity) // substract the amount of product*quantity

            await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } } }, { new: true }).select({ items: { _id: 0 } })

            let quantity = findCart.totalItems - 1
            let data = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true }) //update the cart with total items and totalprice

            return res.status(200).send({ status: true, message: `${productId} is been removed`, data: data })
        }

        // decrement quantity
        let totalAmount = findCart.totalPrice - findProduct.price
        let itemsArr = findCart.items

        for (i in itemsArr) {
            if (itemsArr[i].productId.toString() == productId) {
                itemsArr[i].quantity = itemsArr[i].quantity - 1

                if (itemsArr[i].quantity < 1) {
                    await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } } }, { new: true })
                    let quantity = findCart.totalItems - 1

                    let data = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true }) //update the cart with total items and totalprice

                    return res.status(200).send({ status: true, message: `No such quantity/product exist in cart`, data: data })
                }
            }
        }
        let data = await cartModel.findOneAndUpdate({ _id: cartId }, { items: itemsArr, totalPrice: totalAmount }, { new: true }).select({ items: { _id: 0 } })

        return res.status(200).send({ status: true, message: `${productId} quantity is been reduced By 1`, data: data })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


const delCart = async function (req, res) {
    try {
        //fetch userid fron params
        const userId = req.params.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "invalid userId" })
        }

        //provide authorization to user
        const userToken = req.userId
        if (userToken != userId) {
            return res.status(403).send({ status: false, msg: "You are not authorized!" })
        }

        const checkUser = await userModel.findOne({ _id: userId })
        if (!checkUser) {
            return res.satus(404).send({ status: false, msg: "User doesn't esxist" })

        }
        //fetch cart docment from db by userid
        const checkCart = await cartModel.find({ userId: userId })
        if (!checkCart) {
            return res.status(404).send({ sttaus: false, msg: "cart doesn't exist" })
        }
        const deleteCart = await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true })
        return res.status(204).send({ status: true, message: "empty cart", data: deleteCart })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })
    }
}


module.exports = { getCart, delCart, AddProductToCart, updateCart }