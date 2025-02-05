const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const user = new Schema({
    first_name: {
        type: String, // kiểu dữ liệu
        required: true, // bắt buộc phải có
    },
    last_name: {
        type: String, // kiểu dữ liệu
        required: true, // bắt buộc phải có
    },
    dateOfBirth: {
        type: String, // kiểu dữ liệu
        required: true, // bắt buộc phải có
    },
    sex: { // kiểu tin nhắn
        type: String, // kiểu dữ liệu
        enum: ['Nam', 'Nữ', 'Khác'],
        default: "Khác",
    },
    email: {
        type: String, // kiểu dữ liệu
        default: null,
    },
    phone: {
        type: String, // kiểu dữ liệu
        default: null,
    },
    password: {
        type: String, // kiểu dữ liệu
        required: true, // bắt buộc phải có
    },
    avatar: {
        type: String, // kiểu dữ liệu
        default: "https://i.pinimg.com/564x/14/30/f2/1430f2a57ce798b01b075c3e88df5dc9.jpg",// avatar mặc định 
    },
    background: {
        type: String, // kiểu dữ liệu
        default: null,
    },
    bio: {
        type: String, // kiểu dữ liệu
        default: null,
    },
    QR: {
        type: String, // kiểu dữ liệu
        default: null,
    },
    isActive: {
        type: Number, // kiểu dữ liệu
        default: 1,
        // 0 bị khoá
        // 1 mặc định
        // 2 riêng tư
    },
    role: {
        type: Number, // kiểu dữ liệu
        default: 2,
        // 0: user bi khoa
        // 1: admin 
        // 2: user
    },
}, {
    timestamps: true

});
module.exports = mongoose.models.user || mongoose.model('user', user);
