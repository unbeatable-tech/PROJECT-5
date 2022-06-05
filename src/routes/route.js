const express = require('express')
const router = express.Router()
const UserController = require('../controllers/userController')
const prodectController = require('../controllers/productController')
const middleware = require('../middleware/middleware')
const cartController = require("../controllers/cartController")
const orderController = require('../controllers/orderController')

//test-api
router.get('/test-me', function(req, res) {
    res.send({ status: true, message: "test-api working fine" })
})

//*********************************USERS APIS*********************************************/
router.post('/register', UserController.userRegistration)
router.post('/login', UserController.login)
router.get("/user/:userId/profile",middleware.authentication, UserController.getUser)
router.put("/user/:userId/profile",middleware.authentication, UserController.updateUser)


//**********************************PRODUCTS APIS****************************************/
router.post('/products',prodectController.createProduct)
router.get('/products',prodectController.getProduct)
router.get('/products/:productId',prodectController.getProductById)
router.put('/products/:productId',prodectController.updateProductDetails)
router.delete('/products/:productId',prodectController.delProduct)


//************************************CARTS APIS****************************************/
router.post('/users/:userId/cart',middleware.authentication,cartController.AddProductToCart)
router.get('/users/:userId/cart',middleware.authentication,cartController.getCart)
router.put('/users/:userId/cart',middleware.authentication,cartController.updateCart)
router.delete('/users/:userId/cart',middleware.authentication,cartController.delCart)

//************************************ORDERS APIS****************************************/
router.post('/users/:userId/orders',middleware.authentication,orderController.createOrder)
router.put('/users/:userId/orders',middleware.authentication,orderController.changeStatus)

module.exports = router