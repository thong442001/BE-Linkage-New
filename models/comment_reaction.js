const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const comment_reaction = new Schema({
    ID_comment: {
        type: ObjectId,
        ref: 'comment',
    },
    ID_user: {
        type: ObjectId,
        ref: 'user',
    },
    ID_reaction: {
        type: ObjectId,
        ref: 'reaction',
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.comment_reaction || mongoose.model('comment_reaction', comment_reaction);
