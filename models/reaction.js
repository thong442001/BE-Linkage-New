const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const reaction = new Schema({
    name: {
        type: String,
        required: true, // bắt buộc phải có
        unique: true, // không được trùng
    },
    icon: {
        type: String,
        required: true, // bắt buộc phải có
        unique: true, // không được trùng
    },
    updatedAt: {
        type: Date, // kiểu dữ liệu
        default: Date.now()
    },
    createdAt: {
        type: Date, // kiểu dữ liệu
        default: Date.now()
    },
    _destroy: {
        type: Boolean, // kiểu dữ liệu
        default: false
    },
});
module.exports = mongoose.models.reaction || mongoose.model('reaction', reaction);
