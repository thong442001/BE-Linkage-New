const reaction = require("../models/reaction");

module.exports = {
    addReaction,
    getAllReaction,
}

async function addReaction(name, icon) {
    try {
        const newItem = {
            name,
            icon,
        };
        const newReaction = await reaction.create(newItem);
        //console.log(newReaction);
        return newReaction;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function getAllReaction() {
    try {
        const reactions = await reaction.find()
        //.sort({ createdAt: 1 });
        return reactions;
    } catch (error) {
        console.log(error);
        throw error;
    }
}
