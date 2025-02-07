const relationship = require("../models/relationship");

module.exports = {
    getRelationshipAvsB,
    guiLoiMoiKetBan,
    chapNhanLoiMoiKetBan,
    huyLoiMoiKetBan,
    getAllLoiMoiKetBan,
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
        console.log("*****1");
        let relationshipData = await relationship.findOne({
            $or: [
                { ID_userA: ID_user, ID_userB: me },
                { ID_userA: me, ID_userB: ID_user }
            ]
        }).lean();
        console.log("*****2");

        // Nếu có mối quan hệ, trả về luôn
        if (relationshipData) return relationshipData;
        console.log("*****3");

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
                return true;
            } else if (relation.ID_userB == me) {
                relation.relation = 'B gửi lời kết bạn A';
                await relation.save();
                return true;
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
            return true;
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
            return true;
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
        const find1 = await relationship.find({
            $and: [
                { ID_userA: me },
                { relation: 'B gửi lời kết bạn A' }
            ]
        });
        const find2 = await relationship.find({
            $and: [
                { ID_userB: me },
                { relation: 'A gửi lời kết bạn B' }
            ]
        });
        // **** cách 1 ****
        // Gộp mảng
        const relationships = [...find1, ...find2];

        // Populate từng đối tượng trong mảng
        const populatedRelationships = await Promise.all(
            relationships.map(async (relationshipItem) => {
                const populatedItem = await relationshipItem
                    .populate('ID_userA', 'first_name last_name avatar')
                    .populate('ID_userB', 'first_name last_name avatar');
                return populatedItem;
            })
        );

        return populatedRelationships;

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