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
    _destroy: {
        type: Boolean, // kiểu dữ liệu
        default: false
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.reaction || mongoose.model('reaction', reaction);
