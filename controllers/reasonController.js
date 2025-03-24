const reason = require("../models/reason");

module.exports = {
    addReason,
    getAllReason,
}

async function addReason(reasonText) {
    try {
        const newItem = {
            reason_text: reasonText // Đổi tên để phù hợp với schema
        };
        const newReason = await reason.create(newItem);
        //console.log(newReason);
        return newReason;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function getAllReason() {
    try {
        const reasons = await reason.find()
            .sort({ createdAt: 1 });
        return reasons;
    } catch (error) {
        console.log(error);
        throw error;
    }
}
