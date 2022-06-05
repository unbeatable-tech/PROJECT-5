// IMPORT JSONWEBTOKEN PACKAGE-------
const jwt = require('jsonwebtoken')

// IMPORT USERMODEL FOR DB CALLS-----
const userModel = require("../models/userModel")


const authentication =  (req, res, next) => {
    try {
        let barer = req.headers["Authorization"];
        if (!barer) barer = req.headers["authorization"];
        if (!barer) {
            return res.status(400).send({ status: false, msg: "Token required! Please login to generate token" });
        }
        
        const splitToken = barer.split(' ');
        const token = splitToken[1];

        let tokenValidity = jwt.decode(token, "Group-4");
        let tokenTime = (tokenValidity.exp) * 1000;
        let CreatedTime = Date.now()
       
        if (CreatedTime > tokenTime) {
            return res.status(400).send({ status: false, msg: "token is expired, login again" })
        }

        const decoded =  jwt.verify(token, 'Group-4');
        if(!decoded) {
            return res.status(403).send({status: false, message: `Invalid authentication token in request`})  
        }

        //set token userid in request body----
        req.userId = decoded.userId
        next()
    } catch (error) {
        res.status(500).send({status: false, message: error.message})
    }
}



module.exports={authentication}