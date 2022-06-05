const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: [true, "User First Name is required"],
        trim: true,
    },
    lname: {
        type: String,
        required: [true, "User Last Name is required"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "User Email is required"],
        unique: [true, "Email address already exist"],
        // validate: [Validator.isValidEmail, "Please enter a valid Email address"],
        trim: true,
    },
    profileImage: {
        type: String,
        required: [true, "User profile picture is required"],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, "User phone number is required"],
        unique: [true, "Phone number already exist"],
        // validate: [Validator.isValidPhone, "Please enter a valid phone number"],
        trim: true,
    },
    password: {
        type: String,
        required: [true, "password is required"],
    },
    address: {
        shipping: {
            street: {
                type: String,
                required: [true, "Street name is required"],
                trim: true,
            },
            city: {
                type: String,
                required: [true, "City name is required"],
                trim: true,
            },
            pincode: {
                type: Number,
                required: [true, "Area Pin code is required"],
            },
        },
        billing: {
            street: {
                type: String,
                required: [true, "Street name is required"],
                trim: true,
            },
            city: {
                type: String,
                required: [true, "City name is required"],
                trim: true,
            },
            pincode: {
                type: Number,
                required: [true, "Area Pin code is required"],

            },
        },
    },
}, { timestamps: true });

module.exports = mongoose.model('user', userSchema)