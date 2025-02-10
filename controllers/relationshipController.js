const relationship = require("../models/relationship");

module.exports = {
    getRelationshipAvsB,
    guiLoiMoiKetBan,
    chapNhanLoiMoiKetBan,
    huyLoiMoiKetBan,
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
        // gửi lời mời kết bạn bắt buộc phải có sẵn và relation: 'Người lạ"
        const relation = await relationship.findById(ID_relationship);
        if (relation && relation.relation == 'Người lạ') {
            //return find1;
            // tìm me ở A
            if (relation.ID_userA == me) {
                relation.relation = 'A gửi lời kết bạn B';
                await relation.save();
                return relation;
            } else if (relation.ID_userB == me) {
                relation.relation = 'B gửi lời kết bạn A';
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

async function huyLoiMoiKetBan(ID_relationship) {
    try {
        // chapNhanLoiMoiKetBan là set lại relation: 'Người lạ'
        const relation = await relationship.findById(ID_relationship);
        if (relation && (relation.relation == 'A gửi lời kết bạn B' || relation.relation == 'B gửi lời kết bạn A')) {
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