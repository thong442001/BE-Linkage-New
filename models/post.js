const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const post = new Schema({
    ID_user: {
        type: ObjectId,
        ref: 'user',
        required: true, // bắt buộc phải có
    },
    caption: {
        type: String, // kiểu dữ liệu
        default: null
    },
    medias: [{
        type: String, // kiểu dữ liệu
        default: null
    }],
    status: {
        type: String, // kiểu dữ liệu
        enum: [
            'Công khai',
            'Bạn bè',
            'Chỉ mình tôi',
        ],
    },
    type: {
        type: String, // kiểu dữ liệu
        enum: [
            'Story',
            'Share',
            'Tag',
            'Normal',
            'Ban',// khóa
        ],
    },
    ID_post_shared: {
        type: ObjectId,
        ref: 'post',
    },
    tags: [{
        type: ObjectId,
        ref: 'user',
    }],
    _destroy: {
        type: Boolean, // kiểu dữ liệu
        default: false
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.post || mongoose.model('post', post);
