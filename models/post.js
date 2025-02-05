const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const post = new Schema({
    id: { type: ObjectId }, // khóa chính
    userId: {
        type: ObjectId,
        ref: 'user',
    },
    content: {
        type: String, // kiểu dữ liệu
        default: null
    },
    images: [{
        type: String, // kiểu dữ liệu
        default: null
    }],
    status: {
        type: Number, // kiểu dữ liệu
        // 0 xoá (vào thùng rác)
        // 1 công khai
        // 2 bạn bè
        // 3 chỉ mình tôi
    },
    likes: [{
        type: ObjectId,
        ref: 'interation',
    }],
    comments: [{
        type: ObjectId,
        ref: 'interation',
    }],
    updatedAt: {
        type: Date, // kiểu dữ liệu
        default: Date.now()
    },
    createdAt: {
        type: Date, // kiểu dữ liệu
        default: Date.now()
    },
});
module.exports = mongoose.models.post || mongoose.model('post', post);
