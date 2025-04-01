const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const phone_otp = new Schema({
    phone: {
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
module.exports = mongoose.models.phone_otp || mongoose.model('phone_otp', phone_otp);
