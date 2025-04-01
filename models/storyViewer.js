const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const storyViewer = new Schema({
    ID_post: {
        type: ObjectId,
        ref: 'post',
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
module.exports = mongoose.models.storyViewer || mongoose.model('storyViewer', storyViewer);
