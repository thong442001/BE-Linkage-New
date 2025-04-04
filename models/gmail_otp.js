const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const gmail_otp = new Schema({
    gmail: {
        type: String,
        required: true, // bắt buộc phải có
        unique: true, // không được trùng
    },
    otp: {
        type: String,
        default: null,
    },
    expiresAt: {
        type: Date
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.gmail_otp || mongoose.model('gmail_otp', gmail_otp);
