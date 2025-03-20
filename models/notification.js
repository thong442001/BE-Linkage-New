const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const notification = new Schema({
    ID_post: { // share, tag, bạn bè đăng bài post mới
        type: ObjectId,
        ref: 'post',
        default: null,
    },
    ID_relationship: {// lời mời kết bạn, chấp nhận
        type: ObjectId,
        ref: 'relationship',
        default: null,
    },
    ID_group: {// đc thêm vào nhóm, call video, call thường
        type: ObjectId,
        ref: 'group',
        default: null,
    },
    ID_message: {// tin nhắn 
        type: ObjectId,
        ref: 'message',
        default: null,
    },
    ID_comment: {// comment bài post
        type: ObjectId,
        ref: 'comment',
        default: null,
    },
    ID_post_reaction: {// thả biểu cảm bài post
        type: ObjectId,
        ref: 'post_reaction',
        default: null,
    },
    ID_user: {// ng nhận
        type: ObjectId,
        ref: 'user',
    },
    content: {
        type: String, // kiểu dữ liệu
        default: null
    },
    type: {
        type: String, // kiểu dữ liệu
        enum: [
            'Lời mời kết bạn',// relationship
            'Đã thành bạn bè của bạn',
            'Tin nhắn mới',// message
            'Bạn đã được mời vào nhóm mới',// group
            'Bạn có 1 cuộc gọi đến',
            'Bạn có 1 cuộc gọi video đến',
            'Đã đăng bài mới',// post
            'Đã đăng story mới',
            'Đang livestream',
            'Đã thả biểu cảm vào bài viết của bạn',
            'Đã bình luận vào bài viết của bạn',
            'Đã trả lời bình luận của bạn',// comment
            'Tài khoản bị khóa', // user banned
            'Mời chơi game 3 lá', // game 3 la
        ],
    },
    statusSeen: {
        type: Boolean, // kiểu dữ liệu
        default: true
    },
    _destroy: {
        type: Boolean, // kiểu dữ liệu
        default: false
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.notification || mongoose.model('notification', notification);
