const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const post_reaction = new Schema({
    ID_post: {
        type: ObjectId,
        ref: 'post',
        required: true, // bắt buộc phải có
    },
    ID_user: {
        type: ObjectId,
        ref: 'user',
        required: true, // bắt buộc phải có
    },
    ID_reaction: {
        type: ObjectId,
        ref: 'reaction',
        required: true, // bắt buộc phải có
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.post_reaction || mongoose.model('post_reaction', post_reaction);
