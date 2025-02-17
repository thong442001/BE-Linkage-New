const posts = require("../models/post");
const users = require("../models/user");
const relationship = require("../models/relationship");

module.exports = {
    addPost,
    getProfile,// api cho trang profile
}

async function addPost(
    ID_user,
    caption,
    medias,
    status,
    ID_post_shared,
    tags
) {
    try {
        const newItem = {
            ID_user: ID_user,
            caption: caption,
            medias: medias,
            status: status,
            ID_post_shared: ID_post_shared,
            tags: tags,
        };
        const newPost = await posts.create(newItem);
        //console.log(newPost);
        return newPost._id;
    } catch (error) {
        console.log(error);
        return false;
    }
}

// api trang cá nhân
async function getProfile(ID_user, me) {
    try {
        let rUser, rRelationship, rPosts;
        rUser = await users.findById(ID_user);
        // check profile của mình hay ng khác
        if (ID_user == me) {
            rPosts = await posts.find({
                $and: [
                    { ID_user: me },
                    { _destroy: false }
                ]
            });
            rRelationship = null;
        } else {
            rRelationship = await relationship.findOne({
                $or: [
                    { ID_userA: ID_user, ID_userB: me },
                    { ID_userA: me, ID_userB: ID_user }
                ]
            }).lean();
            if (!rRelationship) {
                // Nếu chưa có, 
                // tạo mới với trạng thái "Người lạ"
                rRelationship = await relationship.create({
                    ID_userA: ID_user,
                    ID_userB: me,
                    relation: 'Người lạ',
                });
            }
            // lấy post status dựa trên relation
            if (rRelationship.relation == 'Bạn bè') {
                rPosts = await posts.find({
                    $and: [
                        { ID_user: ID_user },
                        { _destroy: false },
                        {
                            $or: [
                                { status: "Công khai" },
                                { status: "Bạn bè" }
                            ]
                        }
                    ]
                });
            } else {
                rPosts = await posts.find({
                    $and: [
                        { ID_user: ID_user },
                        { _destroy: false },
                        { status: "Công khai" }
                    ]
                });
            }
        }
        return { rUser, rRelationship, rPosts };

    } catch (error) {
        console.log(error);
        throw error;
    }
}

// async function getAllPostsUserId(userId) {
//     try {
//         const result = await posts.find({ "userId": userId });
//         return result;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }

// async function getPostsUserIdDestroyFalse(userId) {
//     try {
//         const result = await posts.find({ "userId": userId, "destroy": false });
//         return result;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }

// async function getPostsUserIdDestroyTrue(userId) {
//     try {
//         const result = await posts.find({ "userId": userId, "destroy": true });
//         return result;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }

// posts trong trang cá nhân của tôi
// async function getMyPosts(userId) {
//     try {
//         const result = await posts.find({ "userId": userId, "status": { $ne: 0 } })//$ne -> !=
//             .populate("userId", "displayName avatar")// FK
//             .sort({ 'createdAt': -1 });// xếp sắp (1->tăng dần) (-1->giảm dần)


//         return result;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }


// đổi destroy thành true
// async function destroyPost(body) {
//     try {
//         const { id } = body;
//         const result = await posts.findById(id);
//         if (result) {

//             result.destroy = true;
//             await result.save();

//             return true;
//         } else {
//             return false;
//         }
//     } catch (error) {
//         console.log(error);
//         return false;
//     }
// }

// delete post vĩnh viễn
// async function deletePost(id) {
//     try {
//         // xóa post vĩnh viễn
//         await posts.findByIdAndDelete(id);
//         return true;
//     } catch (error) {
//         console.log(error);
//         return false;
//     }
// }

// ************* chung *************

// async function editNameAndAvatar(userId, displayName, avatar) {
//     try {
//         const itemEdit = await posts.find({ "userId": userId }).updateMany({ "displayName": displayName, "avatar": avatar });
//         //console.log(itemEdit);
//         return true;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }

