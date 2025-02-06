const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const message_reaction = new Schema({
    ID_message: {
        type: ObjectId,
        ref: 'message',
    },
    ID_user: {
        type: ObjectId,
        ref: 'user',
    },
    ID_reaction: {
        type: ObjectId,
        ref: 'reaction',
    },
    quantity: {
        type: Number,
        required: true, // bắt buộc phải có
        default: 1,
    },
    _destroy: {
        type: Boolean, // kiểu dữ liệu
        default: false
    },
}, {
    timestamps: true

});
module.exports = mongoose.models.message_reaction || mongoose.model('message_reaction', message_reaction);
