const posts = require("../models/post");
const users = require("../models/user");
const relationship = require("../models/relationship");

module.exports = {
    addPost,
    allProfile,// api cho trang profile
    getAllPostsInHome, //all posts in home
}

async function addPost(
    ID_user,
    caption,
    medias,
    status,
    type,
    ID_post_shared,
    tags
) {
    try {
        const newItem = {
            ID_user: ID_user,
            caption: caption,
            medias: medias,
            status: status,
            type: type,
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
async function allProfile(ID_user, me) {
    try {
        let rUser, rRelationship, rPosts, rFriends, rStories;
        rUser = await users.findById(ID_user);
        // Tìm tất cả các bạn bè
        rFriends = await relationship.find({
            $or: [
                { ID_userA: ID_user, relation: 'Bạn bè' },
                { ID_userB: ID_user, relation: 'Bạn bè' }
            ]
        })
            .populate('ID_userA', 'first_name last_name avatar')
            .populate('ID_userB', 'first_name last_name avatar')
            .sort({ createdAt: 1 })
            .lean(); // Convert to plain JS objects
        //lấy timestamps 24h trc
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        // check profile của mình hay ng khác
        if (ID_user == me) {
            //post
            rPosts = await posts.find({
                $and: [
                    { _destroy: false },
                    { type: { $ne: 'Story' } },
                    {
                        $or: [
                            { ID_user: me },  // Bài viết do user đăng
                            {
                                tags: me,  // User được tag vào bài viết
                                status: { $ne: 'Chỉ mình tôi' }  // Không phải bài viết riêng tư
                            }
                        ]
                    }
                ]
            })
                .populate('ID_user', 'first_name last_name avatar')
                .populate('tags', 'first_name last_name avatar')
                .populate({
                    path: 'ID_post_shared',
                    populate: [
                        { path: 'ID_user', select: 'first_name last_name avatar' },
                        { path: 'tags', select: 'first_name last_name avatar' }
                    ]
                })
                .sort({ createdAt: -1 })
                .lean();
            //story
            rStories = await posts.find({
                _destroy: false,
                type: 'Story',
                ID_user: me,
                createdAt: { $gte: new Date(twentyFourHoursAgo) } // Lọc Story trong 24 giờ qua
            })
                .populate('ID_user', 'first_name last_name avatar')
                .sort({ createdAt: 1 })
                .lean();
            // ko có mối quan hệ vì trang cá nhân của chính mình
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
                //post
                let postFilter = {
                    _destroy: false,
                    type: { $ne: 'Story' },
                    status: { $ne: 'Chỉ mình tôi' },
                    $or: [
                        { ID_user: ID_user },  // Bài viết do user đăng
                        {
                            tags: ID_user,  // User được tag vào bài viết
                            status: { $ne: 'Chỉ mình tôi' }  // Không phải bài viết riêng tư
                        }
                    ]
                };

                rPosts = await posts.find(postFilter)
                    .populate('ID_user', 'first_name last_name avatar')
                    .populate('tags', 'first_name last_name avatar')
                    .populate({
                        path: 'ID_post_shared',
                        populate: [
                            { path: 'ID_user', select: 'first_name last_name avatar' },
                            { path: 'tags', select: 'first_name last_name avatar' }
                        ]
                    })
                    .sort({ createdAt: -1 })
                    .lean();
                //story
                rStories = await posts.find({
                    _destroy: false,
                    type: 'Story',
                    ID_user: ID_user,
                    status: { $ne: 'Chỉ mình tôi' },
                    createdAt: { $gte: new Date(twentyFourHoursAgo) } // Lọc Story trong 24 giờ qua
                })
                    .populate('ID_user', 'first_name last_name avatar')
                    .sort({ createdAt: 1 })
                    .lean();
            } else {
                //post
                let postFilter = {
                    //ID_user: ID_user,
                    _destroy: false,
                    status: "Công khai",
                    $or: [
                        { ID_user: ID_user },  // Bài viết do user đăng
                        {
                            tags: ID_user,  // User được tag vào bài viết
                            status: "Công khai", // Không phải bài viết riêng tư
                        }
                    ]
                };

                rPosts = await posts.find(postFilter)
                    .populate('ID_user', 'first_name last_name avatar')
                    .populate('tags', 'first_name last_name avatar')
                    .populate({
                        path: 'ID_post_shared',
                        populate: [
                            { path: 'ID_user', select: 'first_name last_name avatar' },
                            { path: 'tags', select: 'first_name last_name avatar' }
                        ]
                    })
                    .sort({ createdAt: -1 })
                    .lean();
                //story
                rStories = await posts.find({
                    _destroy: false,
                    type: 'Story',
                    ID_user: ID_user,
                    status: "Công khai", // Bài viết công khai
                    createdAt: { $gte: new Date(twentyFourHoursAgo) } // Lọc Story trong 24 giờ qua
                })
                    .populate('ID_user', 'first_name last_name avatar')
                    .sort({ createdAt: 1 })
                    .lean();
            }
        }

        return { rUser, rRelationship, rPosts, rFriends, rStories };

    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function getAllPostsInHome(me) {
    try {
        // Tìm tất cả bạn bè
        let rPosts, rStories;
        const rFriends = await relationship.find({
            $or: [
                { ID_userA: me, relation: 'Bạn bè' },
                { ID_userB: me, relation: 'Bạn bè' }
            ]
        })
            .sort({ createdAt: -1 })
            .lean(); // Convert to plain objects for better performance

        // Lấy danh sách ID bạn bè
        const friendIDs = new Set();
        rFriends.forEach(f => {
            friendIDs.add(f.ID_userA.toString() === me.toString() ? f.ID_userB : f.ID_userA);
        });
        friendIDs.add(me); // Thêm ID của mình

        // Hàm lấy bài viết
        const getPosts = async (filter) => {
            return posts.find(filter)
                .populate('ID_user', 'first_name last_name avatar')
                .populate('tags', 'first_name last_name avatar')
                .sort({ createdAt: -1 })
                .lean();
        };

        // Lấy tất cả bài post của mình và bạn bè
        rPosts = await getPosts({
            ID_user: { $in: [...friendIDs] },
            _destroy: false,
            type: { $ne: 'Story' },
            $or: [{ status: "Công khai" }, { status: "Bạn bè" }]
        });

        // Lấy tất cả story của mình và bạn bè (trong 24 giờ qua)
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        const rawStories = await getPosts({
            ID_user: { $in: [...friendIDs] },
            _destroy: false,
            type: "Story",
            createdAt: { $gte: new Date(twentyFourHoursAgo) },
            $or: [{ status: "Công khai" }, { status: "Bạn bè" }]
        });

        // Gộp các story theo từng user
        rStories = rawStories.reduce((acc, story) => {
            const userId = story.ID_user._id.toString();
            if (!acc[userId]) {
                acc[userId] = {
                    user: story.ID_user, // Thông tin user
                    stories: []          // Danh sách story của user
                };
            }
            acc[userId].stories.push(story);
            return acc;
        }, {});

        // Convert object thành mảng
        //rStories = Object.values(rStories);

        // Convert object thành mảng và sort stories theo createdAt tăng dần
        rStories = Object.values(rStories).map(userStories => ({
            ...userStories,
            stories: userStories.stories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        }));

        return { rPosts, rStories };

    } catch (error) {
        console.log(error);
        throw error;
    }
}


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

