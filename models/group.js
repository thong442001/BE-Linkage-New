const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const group = new Schema({
    name: {
        type: String, // kiểu dữ liệu
        default: null,
    },
    avatar: {
        type: String, // kiểu dữ liệu
        default: null,
    },
    members: [{
        type: ObjectId,
        ref: 'user'
    }],
    isPrivate: { // Đánh dấu là nhóm riêng tư 2 người
        type: Boolean,
        default: true
    },
    _destroy: {
        type: Boolean, // kiểu dữ liệu
        default: false
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.group || mongoose.model('group', group);
