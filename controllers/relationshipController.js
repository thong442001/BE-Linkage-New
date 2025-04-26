const axios = require("axios");
const relationship = require("../models/relationship");
const noti_token = require("../models/noti_token");
const notification = require("../models/notification");
const user = require("../models/user");

module.exports = {
    getRelationshipAvsB,
    guiLoiMoiKetBan,
    chapNhanLoiMoiKetBan,
    huyLoiMoiKetBan,
    huyBanBe,
    getAllLoiMoiKetBan,
    getAllFriendOfID_user,
    getFriendSuggestions,// gợi ý bạn bè
    getMutualFriendCount,
    cleanDuplicateRelationships
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
// async function guiThongBao(ID_user, ID_noti) {
//     try {

//         const check_noti_token = await noti_token.findOne({ "ID_user": ID_user });
//         if (!check_noti_token || !check_noti_token.tokens) return;

//         await axios.post(
//             //`http://localhost:3001/gg/send-notification`,
//             `https://linkage.id.vn/gg/send-notification`,
//             {
//                 fcmTokens: check_noti_token.tokens,
//                 title: "Thông báo",
//                 body: null,
//                 ID_noties: [ID_noti],
//             },
//         );
//         return;
//     } catch (error) {
//         console.error("⚠️ Lỗi khi gửi thông báo FCM:", error.response?.data || error.message);
//     }
// }
async function guiThongBao(ID_user, ID_noti) {
    try {
        console.log("Bắt đầu gửi thông báo cho user:", ID_user.toString(), "với ID_noti:", ID_noti.toString());

        // Tìm token FCM của người dùng
        const check_noti_token = await noti_token.findOne({ ID_user });
        console.log("Kết quả tìm token:", check_noti_token);

        if (!check_noti_token || !check_noti_token.tokens || check_noti_token.tokens.length === 0) {
            console.log("Không tìm thấy token FCM hợp lệ cho user:", ID_user.toString());
            return;
        }

        // Chuẩn bị payload gửi thông báo
        const payload = {
            fcmTokens: check_noti_token.tokens,
            title: "Thông báo",
            body: null,
            ID_noties: [ID_noti],
        };
        console.log("Payload gửi thông báo:", payload);

        // Gửi thông báo qua API
        const response = await axios.post(
            `https://linkage.id.vn/gg/send-notification`,
            payload
        );
        console.log("Kết quả gửi thông báo:", response.data);

        // Xử lý token không hợp lệ
        if (response.data.success && response.data.response) {
            const invalidTokens = response.data.response
                .filter(res => res.error && res.error.includes("Requested entity was not found"))
                .map(res => res.token);

            if (invalidTokens.length > 0) {
                await noti_token.updateOne(
                    { ID_user },
                    { $pull: { tokens: { $in: invalidTokens } } }
                );
                console.log(`🗑️ Đã xóa ${invalidTokens.length} token không hợp lệ cho user: ${ID_user}`);
            }
        }

    } catch (error) {
        console.error("⚠️ Lỗi khi gửi thông báo FCM:", error.response?.data || error.message);
        throw error;
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

async function getMutualFriendCount(me, otherUserId) {
    try {
        // Lấy danh sách bạn bè của me
        const myFriends = await relationship.find({
            $or: [
                { ID_userA: me, relation: 'Bạn bè' },
                { ID_userB: me, relation: 'Bạn bè' },
            ],
        }).lean();

        const myFriendIds = myFriends.map((rel) =>
            rel.ID_userA.toString() === me ? rel.ID_userB.toString() : rel.ID_userA.toString()
        );

        // Lấy danh sách bạn bè của otherUserId
        const otherFriends = await relationship.find({
            $or: [
                { ID_userA: otherUserId, relation: 'Bạn bè' },
                { ID_userB: otherUserId, relation: 'Bạn bè' },
            ],
        }).lean();

        const otherFriendIds = otherFriends.map((rel) =>
            rel.ID_userA.toString() === otherUserId ? rel.ID_userB.toString() : rel.ID_userA.toString()
        );

        // Tính số bạn bè chung
        const mutualFriends = myFriendIds.filter((friendId) => otherFriendIds.includes(friendId));
        return mutualFriends.length;
    } catch (error) {
        console.error("❌ Lỗi khi tính số bạn bè chung:", error);
        throw error;
    }
}

async function getFriendSuggestions(me) {
    try {
        console.log('🚀 Bắt đầu getFriendSuggestions cho user:', me);

        // Bước 1: Lấy danh sách bạn bè của me
        const myFriends = await relationship.find({
            $or: [
                { ID_userA: me, relation: 'Bạn bè' },
                { ID_userB: me, relation: 'Bạn bè' },
            ],
        }).lean();
        console.log('👥 Số bạn bè của me:', myFriends.length);

        const myFriendIds = myFriends.map((rel) =>
            rel.ID_userA.toString() === me ? rel.ID_userB.toString() : rel.ID_userA.toString()
        );
        console.log('🆔 ID bạn bè của me:', myFriendIds);

        // Bước 2: Lấy bạn bè của bạn bè
        const friendOfFriends = await relationship.find({
            $or: [
                { ID_userA: { $in: myFriendIds }, relation: 'Bạn bè' },
                { ID_userB: { $in: myFriendIds }, relation: 'Bạn bè' },
            ],
        }).lean();
        console.log('👥 Số bạn bè của bạn bè:', friendOfFriends.length);

        // Bước 3: Tạo danh sách gợi ý
        const suggestionsMap = new Map();
        for (const rel of friendOfFriends) {
            const otherUserId =
                rel.ID_userA.toString() === me
                    ? rel.ID_userB.toString()
                    : rel.ID_userB.toString() === me
                        ? rel.ID_userA.toString()
                        : rel.ID_userA.toString() === myFriendIds.find((id) => id === rel.ID_userA.toString())
                            ? rel.ID_userB.toString()
                            : rel.ID_userA.toString();
            console.log('🔍 Kiểm tra otherUserId:', otherUserId);

            // Bỏ qua nếu là me hoặc đã là bạn bè
            if (!otherUserId || myFriendIds.includes(otherUserId) || otherUserId === me) {
                console.log('⏭ Bỏ qua otherUserId:', otherUserId);
                continue;
            }

            // Kiểm tra mối quan hệ hiện tại
            const existingRelation = await relationship.findOne({
                $or: [
                    { ID_userA: me, ID_userB: otherUserId },
                    { ID_userA: otherUserId, ID_userB: me },
                ],
            }).lean();
            console.log('🔗 Mối quan hệ hiện tại:', existingRelation);

            // Chỉ gợi ý nếu chưa có lời mời kết bạn hoặc không phải bạn bè
            if (existingRelation && existingRelation.relation !== 'Người lạ') {
                console.log('⏭ Bỏ qua vì không phải Người lạ:', existingRelation.relation);
                continue;
            }

            // Tính số bạn bè chung
            const mutualFriendCount = await getMutualFriendCount(me, otherUserId);
            console.log('👥 Số bạn bè chung với', otherUserId, ':', mutualFriendCount);

            if (mutualFriendCount > 0) {
                suggestionsMap.set(otherUserId, {
                    userId: otherUserId,
                    mutualFriendCount,
                    relationshipId: existingRelation ? existingRelation._id : null,
                });
            }
        }

        // Bước 4: Sắp xếp danh sách gợi ý
        const suggestions = Array.from(suggestionsMap.values()).sort(
            (a, b) => b.mutualFriendCount - a.mutualFriendCount
        );
        console.log('📋 Số gợi ý trước khi populate:', suggestions.length);

        // Bước 5: Populate thông tin người dùng
        const populatedSuggestions = await Promise.all(
            suggestions.map(async (suggestion) => {
                const userData = await user
                    .findById(suggestion.userId)
                    .select('first_name last_name avatar')
                    .lean();
                console.log('👤 Populate user:', suggestion.userId, userData);
                return {
                    ...suggestion,
                    user: userData,
                };
            })
        );

        console.log('✅ Kết quả cuối cùng:', populatedSuggestions);
        return populatedSuggestions;
    } catch (error) {
        console.error("❌ Lỗi khi lấy gợi ý kết bạn:", error);
        throw error;
    }
}

async function cleanDuplicateRelationships() {
    try {
        const allRelationships = await relationship.find().lean();
        const seen = new Set();
        const duplicates = [];

        for (const rel of allRelationships) {
            const key1 = `${rel.ID_userA}-${rel.ID_userB}`;
            const key2 = `${rel.ID_userB}-${rel.ID_userA}`;
            if (seen.has(key1) || seen.has(key2)) {
                duplicates.push(rel._id);
            } else {
                seen.add(key1);
                seen.add(key2);
            }
        }

        if (duplicates.length > 0) {
            await relationship.deleteMany({ _id: { $in: duplicates } });
            console.log(`Đã xóa ${duplicates.length} bản ghi trùng lặp`);
        } else {
            console.log('Không có bản ghi trùng lặp');
        }
    } catch (error) {
        console.error('Lỗi khi xóa bản ghi trùng lặp:', error);
    }
}
