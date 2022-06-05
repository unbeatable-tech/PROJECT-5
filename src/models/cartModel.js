const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "user",
        required: [true, "userId is required"],
        unique: true
    },
    items: [{
        productId: {
            type: ObjectId,
            ref: "product",
            required: [true, "productId is required"],
        },
        quantity: {
            type: Number,
            required: [true, "product quantity is required"],
            min: 1,
            trim: true
        }
    }],
    totalPrice: { type: Number, required: [true, "total Price is required"] },
    totalItems: { type: Number, required: [true, "total Items is required"] },
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);