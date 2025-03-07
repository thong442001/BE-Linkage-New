const axios = require("axios");
const relationship = require("../models/relationship");
const noti_token = require("../models/noti_token");
const notification = require("../models/notification");

module.exports = {
    getRelationshipAvsB,
    guiLoiMoiKetBan,
    chapNhanLoiMoiKetBan,
    setRelationNguoiLa,
    getAllLoiMoiKetBan,
    getAllFriendOfID_user,
}

async function getRelationshipAvsB(ID_user, me) {
    try {
        // const find1 = await relationship.findOne({
        //     $and: [
        //         { ID_userA: ID_user },
        //         { ID_userB: me }
        //     ]
        // });
        // if (find1) {
        //     return find1;
        // } else {
        //     const find2 = await relationship.findOne({
        //         $and: [
        //             { ID_userA: me },
        //             { ID_userB: ID_user }
        //         ]
        //     });
        //     if (find2) {
        //         return find2;
        //     }
        //     // chưa có mối quan hệ
        //     // tạo mối quan hệ (Người lạ)
        //     const newItem = {
        //         ID_userA: ID_user,
        //         ID_userB: me,
        //         relation: 'Người lạ',
        //     };
        //     const newRelationship = await relationship.create(newItem);
        //     return newRelationship;
        // }
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
            .populate('ID_userA', 'first_name last_name avatar')
            .populate('ID_userB', 'first_name last_name avatar')
            .lean();

        if (!relation || relation.relation !== 'Người lạ') {
            return false;
        }

        let newRelationStatus = "";
        let receiverId = ""; // Người nhận lời mời kết bạn

        if (relation.ID_userA == me) {
            newRelationStatus = 'A gửi lời kết bạn B';
            receiverId = relation.ID_userB; // Người nhận là B
        } else if (relation.ID_userB == me) {
            newRelationStatus = 'B gửi lời kết bạn A';
            receiverId = relation.ID_userA; // Người nhận là A
        } else {
            return false;
        }

        // Cập nhật trạng thái lời mời kết bạn
        relation.relation = newRelationStatus;
        await relation.save();

        // tạo notification
        const notificationItem = {
            ID_relationship: relation._id,
            ID_user: receiverId,
            content: me == relation.ID_userA
                ? `${relation.ID_userA.first_name} ${relation.ID_userA.last_name} đã gửi lời mời kết bạn với bạn`
                : `${relation.ID_userB.first_name} ${relation.ID_userB.last_name} đã gửi lời mời kết bạn với bạn`,
            type: 'Lời mời kết bạn',
        }
        const newNotification = await notification.create(notificationItem);

        // Gửi thông báo cho người nhận lời mời
        await guiThongBaoKetBan(receiverId, newNotification);

        return relation;
    } catch (error) {
        console.error("❌ Lỗi khi gửi lời mời kết bạn:", error);
        throw error;
    }
}

// 🛠 Hàm gửi thông báo kết bạn
async function guiThongBaoKetBan(ID_user, notifi) {
    try {
        const check_noti_token = await noti_token.findOne({ "ID_user": ID_user });
        if (!check_noti_token || !check_noti_token.token) return;

        await axios.post(
            `https://linkage.id.vn/gg/send-notification`,
            {
                fcmToken: check_noti_token.token,
                title: "Thông báo",
                body: notifi.content,
                data: notifi
            }
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

async function setRelationNguoiLa(ID_relationship) {
    try {
        // chapNhanLoiMoiKetBan là set lại relation: 'Người lạ'
        const relation = await relationship.findById(ID_relationship);
        if (relation) {
            // set lại
            relation.relation = 'Người lạ';
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