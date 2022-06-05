const orderModel = require("../models/orderModel")
const userModel = require("../models/userModel")
const OrderModel = require("../models/orderModel");
const CartModel = require("../models/cartModel.js");
const ProductModel = require("../models/productModel");
const mongoose = require('mongoose')

//**************************************************VALIDATORS **************************************************** */
const isValidInputBody = function (object) {
    return Object.keys(object).length > 0
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId);
};

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

//*******************************************CREATE ORDER*************************************************** */

const createOrder = async function (req, res) {
    try {
        const requestBody = req.body;
        const queryParams = req.query;
        const userId = req.params.userId;
        const decodedToken = req.userId;

        // query params must be empty
        if (isValidInputBody(queryParams)) {
            return res.status(404).send({ status: false, message: " page not found" });
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "invalid userId " });
        }

        // using destructuring
        let { cancellable } = req.body;
       
        // getting user's cart details
        const userCartDetail = await CartModel.findOne({ userId: userId }).select({
            items: 1,
            userId: 1,
            totalItems: 1,
            totalPrice: 1,
        });
        console.log(userCartDetail)
        if (!userCartDetail) {
            return res.status(404).send({ status: false, message: "cart detail not found" });
        }

        // authorization
        if (decodedToken != userId) {
            console.log(decodedToken, userId)
            return res.status(403).send({ status: false, message: "Authorization failed" })
        }

        if (userCartDetail.items.length === 0) {
            return res.status(400).send({ status: false, message: "Cart is empty" });
        }


        //total product quantity in cart
        // const totalQuantity = userCartDetail.items.reduce((a, b) => a.quantity + b.quantity);

        /*****prince bro if above doesn't work try below code some syntex difference*********/

        const totalQuantity = userCartDetail.items.reduce(
            (a, b) => a + b.quantity, 0
        );
        //console.log(totalQuantity, "222")
        // All products are available or not
        const allProductsInCart = userCartDetail.items;

        for (let i = 0; i < allProductsInCart.length; i++) {
            const isProductInStock = await ProductModel.findById(allProductsInCart[i].productId);
            if (isProductInStock.installments < allProductsInCart[i].quantity) {
                //console.log(isProductInStock.installments, "kjhjkgkjgkjgkjgbkj", allProductsInCart[i].quantity)
                return res.status(400).send({ status: false, message: `${allProductsInCart[i].productId} is out of stock`, });
            }
        }

        if (requestBody.hasOwnProperty("cancellable")) {
            if (typeof cancellable !== "boolean") { return res.status(400).send({ status: false, message: "cancellable should be a boolean" }); }
            cancellable = cancellable;
        } else {
            cancellable = true;
        }

        const orderData = {
            userId: userId,
            items: userCartDetail.items,
            totalItems: userCartDetail.totalItems,
            totalPrice: userCartDetail.totalPrice,
            totalQuantity: totalQuantity,
            cancellable: cancellable,
            status: "pending",
            isDeleted: false,
            deletedAt: null,
        };

        const orderPlaced = await OrderModel.create(orderData);
        let Id = orderPlaced._id
        let findOrder = await orderModel.findOne({ _id: Id }).select({ items: { _id: 0 } })

        //updating product stock
        // const itemsInCart = userCartDetail.items;
        // for (let i = 0; i < itemsInCart.length; i++) {
        //     const updateProductInstallments = await ProductModel.findOneAndUpdate({ _id: itemsInCart[i].productId }, { $inc: { installments: -itemsInCart[i].quantity } }, { new: true });
        //     console.log(updateProductInstallments)
        // }

        //making cart empty again
        const makeCartEmpty = await CartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true });
        console.log(makeCartEmpty)

        res.status(201).send({ status: true, message: "order placed", data: findOrder });

    } catch (error) {
        res.status(500).send({ error: error.message });
        console.log(error)
    }
};


//*******************************************UPDATE ORDER*************************************************** */

let changeStatus = async function (req, res) {
    try {
        let { status } = req.body
        let paramUserId = req.params.userId;
        let tokenUserId = req.userId;

        if (!isValidInputValue(status) || !isValidOnlyCharacters(status)) {
            return res.status(400).send({ status: false, message: "provide status for update" });
        }

        if (!isValidObjectId(paramUserId)) {
            return res.status(400).send({ status: false, message: "Invalid userId" })
        }

        let userInDb = await userModel.findOne({ _id: paramUserId })

        if (!userInDb) {
            return res.status(400).send({ status: false, message: `user not present with is id: ${paramUserId}` })
        }

        if (paramUserId != tokenUserId) {
            return res.status(403).send({ status: false, message: "you are not authorised" })
        }

        let orderDetails = await orderModel.findOne({ userId: paramUserId, status: "pending" })
        //console.log(orderDetails)
        if (!orderDetails) {
            return res.status(400).send({ status: false, message: "no order details found" })
        }
        if (status == "pending") {
            return res.status(400).send({ status: false, message: "alrady in pending" })
        }
        if (status == "pending") {
            return res.status(400).send({ status: false, message: "alrady in pending" })
        }

        if (status == "cancled") {

            if (orderDetails.cancellable == false) {
                return res.status(400).send({ status: false, message: "Your order is not cancellable" })
            }
            if (orderDetails.status == "cancled") {
                return res.status(400).send({ status: false, message: "alrady cancled" })
            }
            let updateStatus = status

            let updateOrder = await orderModel.findOneAndUpdate({ userId: paramUserId, status: "pending" }, { $set: { status: updateStatus } }, { new: true }).select({ items: { _id: 0 } })

            return res.status(200).send({ status: true, message: "Order cancled succesfully", data: updateOrder })
        }

        if (status == "completed") {
            if (orderDetails.status == "completed") {
                return res.status(400).send({ status: false, message: "alrady completed" })
            }
            let updateStatus = status

            let updateOrder = await orderModel.findOneAndUpdate({ userId: paramUserId, status: "pending" }, { $set: { status: updateStatus } }, { new: true }).select({ items: { _id: 0 } })

            return res.status(200).send({ status: true, message: "Order cancled succesfully", data: updateOrder })
        }
        // const userCartDetail = await CartModel.findOne({ userId: paramUserId })
        // const itemsInCart = userCartDetail.items;
        // for (let i = 0; i < itemsInCart.length; i++) {
        //     const updateProductInstallments = await ProductModel.findOneAndUpdate({ _id: itemsInCart[i].productId }, { $inc: { installments: +itemsInCart[i].quantity } }, { new: true });
        //     console.log(updateProductInstallments)
        // }

    }
    catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}

module.exports = { changeStatus, createOrder }