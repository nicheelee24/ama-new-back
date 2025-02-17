const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    platform: {
        type: String,
    },
    clientCode: {
        type: String,
    },
    sign: {
        type: String,
    },
    status: {
        type: String,
    },
    payAmount: {
        type: Number,
    },
    chainName: {
        type: String,
    },
    trxNo: {
        type: String,
    },
    token: {
        type: String,
    }
    ,
    coinUnit: {
        type: String,
    },
    type: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("transactions", transactionSchema);
