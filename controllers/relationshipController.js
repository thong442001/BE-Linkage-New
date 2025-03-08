const axios = require("axios");
const relationship = require("../models/relationship");
const noti_token = require("../models/noti_token");
const notification = require("../models/notification");

module.exports = {
    getRelationshipAvsB,
    guiLoiMoiKetBan,
    chapNhanLoiMoiKetBan,
    huyLoiMoiKetBan,
    huyBanBe,
    getAllLoiMoiKetBan,
    getAllFriendOfID_user,
}

async function getRelationshipAvsB(ID_user, me) {
    try {
        let relationshipData = await relationship.findOne({
            $or: [
                { ID_userA: ID_user, ID_userB: me },
                { ID_userA: me, ID_userB: ID_user }
            ]
        }).lean();

        // Nếu có mối quan hệ, trả về luôn
        if (relationshipData) return relationshipData;

        // Nếu chưa có, tạo mới với trạng thái "Người lạ"
        return await relationship.create({
            ID_userA: ID_user,
            ID_userB: me,
            relation: 'Người lạ',
        });

    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function guiLoiMoiKetBan(ID_relationship, me) {
    try {
        // Tìm quan hệ giữa hai người
        const relation = await relationship.findById(ID_relationship)

        if (!relation || relation.relation !== 'Người lạ') {
            console.log("relation ko có")
            return false;
        }

        let newRelationStatus = "";
        let receiverId; // Người nhận lời mời kết bạn

        if (relation.ID_userA.equals(me)) {
            newRelationStatus = 'A gửi lời kết bạn B';
            receiverId = relation.ID_userB;
        } else if (relation.ID_userB.equals(me)) {
            newRelationStatus = 'B gửi lời kết bạn A';
            receiverId = relation.ID_userA;
        } else {
            console.log("ss ID vs me k đc")
            return false;
        }

        // Cập nhật trạng thái lời mời kết bạn
        relation.relation = newRelationStatus;
        await relation.save();

        // Tạo notification
        const notificationItem = new notification({
            ID_relationship: relation._id,
            ID_user: receiverId,
            type: 'Lời mời kết bạn',
        });

        await notificationItem.save();

        // Gửi thông báo cho người nhận lời mời
        await guiThongBao(receiverId, notificationItem._id);

        return relation;
    } catch (error) {
        console.error("❌ Lỗi khi gửi lời mời kết bạn:", error);
        throw error;
    }
}


// 🛠 Hàm gửi thông báo kết bạn
async function guiThongBao(ID_user, ID_noti) {
    try {

        const check_noti_token = await noti_token.findOne({ "ID_user": ID_user });
        if (!check_noti_token || !check_noti_token.token) return;

        await axios.post(
            //`http://localhost:3001/gg/send-notification`,
            `https://linkage.id.vn/gg/send-notification`,
            {
                fcmTokens: [check_noti_token.token],
                title: "Thông báo",
                body: null,
                ID_noties: [ID_noti],
            },
        );
        return;
    } catch (error) {
        console.error("⚠️ Lỗi khi gửi thông báo FCM:", error.response?.data || error.message);
    }
}


async function chapNhanLoiMoiKetBan(ID_relationship) {
    try {
        // chapNhanLoiMoiKetBan là set lại relation: 'Bạn bè'
        const relation = await relationship.findById(ID_relationship);
        if (relation && (relation.relation == 'A gửi lời kết bạn B' || relation.relation == 'B gửi lời kết bạn A')) {

            let receiverId; // Người gửi lời mời kết bạn
            if (relation.relation == 'A gửi lời kết bạn B') {
                receiverId = relation.ID_userA;
            } else if (relation.relation == 'B gửi lời kết bạn A') {
                receiverId = relation.ID_userB;
            }

            // Tạo notification
            const notificationItem = new notification({
                ID_relationship: relation._id,
                ID_user: receiverId,
                type: 'Đã thành bạn bè của bạn',
            });
            await notificationItem.save();

            // Gửi thông báo cho người nhận lời mời
            await guiThongBao(receiverId, notificationItem._id);

            // set lại
            relation.relation = 'Bạn bè';
            await relation.save();

            return relation;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function huyLoiMoiKetBan(ID_relationship) {
    try {
        const relation = await relationship.findById(ID_relationship);
        if (relation) {
            if (relation.relation == 'A gửi lời kết bạn B' || relation.relation == 'B gửi lời kết bạn A') {
                // set lại
                relation.relation = 'Người lạ';
                await relation.save();
                return relation;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function huyBanBe(ID_relationship) {
    try {
        const relation = await relationship.findById(ID_relationship);
        if (relation) {
            if (relation.relation == 'Bạn bè') {
                // set lại
                relation.relation = 'Người lạ';
                await relation.save();
                return relation;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// get all lời mời kết bạn
async function getAllLoiMoiKetBan(me) {
    try {
        // Tìm tất cả các lời mời kết bạn
        const relationships = await relationship.find({
            $or: [
                { ID_userA: me, relation: 'B gửi lời kết bạn A' },
                { ID_userB: me, relation: 'A gửi lời kết bạn B' }
            ]
        })
            .populate('ID_userA', 'first_name last_name avatar')
            .populate('ID_userB', 'first_name last_name avatar')
            .lean(); // Convert to plain JS objects

        return relationships;

        // **** cách 2 ****
        // const relationships = find1.concat(find2);
        // await relationships.populate('ID_userA', 'first_name last_name avatar')
        //     .populate('ID_userB', 'first_name last_name avatar');
        // return relationships;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// get all bạn bè
async function getAllFriendOfID_user(me) {
    try {
        // Tìm tất cả các bạn bè
        const relationships = await relationship.find({
            $or: [
                { ID_userA: me, relation: 'Bạn bè' },
                { ID_userB: me, relation: 'Bạn bè' }
            ]
        })
            .populate('ID_userA', 'first_name last_name avatar')
            .populate('ID_userB', 'first_name last_name avatar')
            .lean(); // Convert to plain JS objects

        return relationships;

    } catch (error) {
        console.log(error);
        throw error;
    }
}