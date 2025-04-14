import mongoose from "mongoose";

const customerCreateAccountSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    accountnumber: {
        type: Number,
        required: true,
    },
    balance: {
        type: Number,
        default: 100000, // Default balance set to 100000
        required: true,

    },
}, { timestamps: true });

const CustomerCreateAccount = mongoose.model("CustomerCreateAccount", customerCreateAccountSchema);
export default CustomerCreateAccount;