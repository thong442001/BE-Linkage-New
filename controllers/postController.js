const posts = require("../models/post");
const users = require("../models/user");
const relationship = require("../models/relationship");
const post_reaction = require("../models/post_reaction");
const comment = require("../models/comment");
const comment_reaction = require("../models/comment_reaction");
const noti_token = require("../models/noti_token");
const notification = require("../models/notification");
const axios = require("axios");

module.exports = {
    addPost,
    allProfile,// api cho trang profile
    getAllPostsInHome, //all posts in home
    getPostsUserIdDestroyTrue,// thùng rác
    changeDestroyPost,// xóa và hôi phục
    deletePost,// delete vĩnh viễn
    getChiTietPost,// chiTietPost
    notiLiveStream, // noti livestream
}

async function addPost(ID_user, caption, medias, status, type, ID_post_shared, tags) {
    try {
        const newItem = {
            ID_user,
            caption,
            medias,
            status,
            type,
            ID_post_shared,
            tags,
        };
        const newPost = await posts.create(newItem);

        // nếu status 'Chỉ mình tôi' thì ko thông báo
        if (status != 'Chỉ mình tôi') {
            // 📢 Xác định loại thông báo
            let notificationType = '';
            if (['Share', 'Tag', 'Normal'].includes(type)) {
                notificationType = 'Đã đăng bài mới';
            } else if (type === 'Story') {
                notificationType = 'Đã đăng story mới';
            } else {
                return newPost._id; // Không gửi thông báo nếu không thuộc loại hợp lệ
            }

            // 🔍 Tìm tất cả bạn bè của người đăng bài
            const relationships = await relationship.find({
                $or: [
                    { ID_userA: ID_user, relation: 'Bạn bè' },
                    { ID_userB: ID_user, relation: 'Bạn bè' },
                ],
            });

            const friendIds = relationships.map(r =>
                r.ID_userA.toString() === ID_user.toString() ? r.ID_userB.toString() : r.ID_userA.toString()
            );

            if (friendIds.length === 0) return newPost._id; // Không có bạn bè để gửi thông báo

            // 🔔 Tạo thông báo cho từng bạn bè
            const notifications = friendIds.map(friendId => ({
                ID_post: newPost._id,
                ID_user: friendId,
                type: notificationType,
            }));

            // 💾 Lưu thông báo vào database
            const createdNotifications = await notification.insertMany(notifications);

            // 🎯 Ghép `ID_user` với `notificationId`
            const notificationMap = createdNotifications.reduce((acc, noti) => {
                acc[noti.ID_user.toString()] = noti._id.toString();
                return acc;
            }, {});

            // 🔍 Tìm FCM tokens của bạn bè (lấy cả danh sách tokens)
            const fcmData = await noti_token.find({ ID_user: { $in: friendIds } }).select('ID_user tokens');

            // 📤 Chuẩn bị danh sách thông báo
            const messages = [];
            fcmData.forEach(({ ID_user, tokens }) => {
                if (tokens && tokens.length > 0) {
                    tokens.forEach(token => {
                        messages.push({
                            token,
                            notificationId: notificationMap[ID_user.toString()],
                        });
                    });
                }
            });

            if (messages.length === 0) return newPost._id; // Không có token hợp lệ

            // 🚀 Gửi từng thông báo riêng lẻ
            await Promise.all(messages.map(({ token, notificationId }) =>
                axios.post(
                    //`http://localhost:3001/gg/send-notification`,
                    `https://linkage.id.vn/gg/send-notification`,
                    {
                        fcmTokens: [token], // Chỉ gửi cho 1 user
                        title: "Thông báo",
                        body: null,
                        ID_noties: [notificationId], // Notification tương ứng
                    })
            ));
        }

        return newPost._id; // Thành công
    } catch (error) {
        console.log("Lỗi khi đăng bài:", error);
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
                    ],
                    select: '-__v' // Lấy tất cả các thuộc tính trừ __v (hoặc bỏ select nếu muốn lấy hết)
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
                        ],
                        select: '-__v' // Lấy tất cả các thuộc tính trừ __v (hoặc bỏ select nếu muốn lấy hết)
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
                        ],
                        select: '-__v' // Lấy tất cả các thuộc tính trừ __v (hoặc bỏ select nếu muốn lấy hết)
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

        // post_reactions comment(lấy các reaction của từng bài post)
        if (rPosts.length > 0) {
            const postIds = rPosts.map(post => post._id);

            // Tìm tất cả reactions của danh sách bài post
            const allReactions = await post_reaction.find({ ID_post: { $in: postIds } })
                .populate('ID_user', 'first_name last_name avatar')
                .populate('ID_reaction', 'name icon')
                .sort({ createdAt: 1 })
                .lean();

            // Tìm tất cả comment của danh sách bài post
            const allCommetn = await comment.find({ ID_post: { $in: postIds } })
                .populate('ID_user', 'first_name last_name avatar')
                .populate({
                    path: 'ID_comment_reply',
                    populate: { path: 'ID_user', select: 'first_name last_name avatar' },
                })
                .sort({ createdAt: 1 })
                .lean();

            // Nhóm reactions theo ID_post
            const reactionMap = {};
            allReactions.forEach(reaction => {
                if (!reactionMap[reaction.ID_post]) {
                    reactionMap[reaction.ID_post] = [];  // Nếu chưa có mảng này, tạo mảng rỗng
                }
                reactionMap[reaction.ID_post].push(reaction); // Thêm reaction vào mảng của post đó
            });

            // Nhóm comment theo ID_post
            const commetnMap = {};
            allCommetn.forEach(comment => {
                if (!commetnMap[comment.ID_post]) {
                    commetnMap[comment.ID_post] = [];  // Nếu chưa có mảng này, tạo mảng rỗng
                }
                commetnMap[comment.ID_post].push(comment); // Thêm reaction vào mảng của post đó
            });


            // Gán vào rPosts
            rPosts.forEach(post => {
                post.post_reactions = reactionMap[post._id] || [];
            });
            // Gán vào rPosts
            rPosts.forEach(post => {
                post.comments = commetnMap[post._id] || [];
            });
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
                .populate({
                    path: 'ID_post_shared',
                    populate: [
                        { path: 'ID_user', select: 'first_name last_name avatar' },
                        { path: 'tags', select: 'first_name last_name avatar' }
                    ],
                    select: '-__v' // Lấy tất cả các thuộc tính trừ __v (hoặc bỏ select nếu muốn lấy hết)
                })
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


        // post_reactions comment(lấy các reaction của từng bài post)
        if (rPosts.length > 0) {
            const postIds = rPosts.map(post => post._id);

            // Tìm tất cả reactions của danh sách bài post
            const allReactions = await post_reaction.find({ ID_post: { $in: postIds } })
                .populate('ID_user', 'first_name last_name avatar')
                .populate('ID_reaction', 'name icon')
                .sort({ createdAt: 1 })
                .lean();

            // Tìm tất cả comment của danh sách bài post
            const allCommetn = await comment.find({ ID_post: { $in: postIds } })
                .populate('ID_user', 'first_name last_name avatar')
                .populate({
                    path: 'ID_comment_reply',
                    populate: { path: 'ID_user', select: 'first_name last_name avatar' },
                })
                .sort({ createdAt: 1 })
                .lean();

            // Nhóm reactions theo ID_post
            const reactionMap = {};
            allReactions.forEach(reaction => {
                if (!reactionMap[reaction.ID_post]) {
                    reactionMap[reaction.ID_post] = [];  // Nếu chưa có mảng này, tạo mảng rỗng
                }
                reactionMap[reaction.ID_post].push(reaction); // Thêm reaction vào mảng của post đó
            });

            // Nhóm comment theo ID_post
            const commetnMap = {};
            allCommetn.forEach(comment => {
                if (!commetnMap[comment.ID_post]) {
                    commetnMap[comment.ID_post] = [];  // Nếu chưa có mảng này, tạo mảng rỗng
                }
                commetnMap[comment.ID_post].push(comment); // Thêm reaction vào mảng của post đó
            });


            // Gán vào rPosts
            rPosts.forEach(post => {
                post.post_reactions = reactionMap[post._id] || [];
            });
            // Gán vào rPosts
            rPosts.forEach(post => {
                post.comments = commetnMap[post._id] || [];
            });
        }

        return { rPosts, rStories };

    } catch (error) {
        console.log(error);
        throw error;
    }
}

// trang thùng rác (trash)
async function getPostsUserIdDestroyTrue(me) {
    try {
        const rPosts = await posts.find({
            "ID_user": me,
            "_destroy": true,
            type: { $ne: 'Story' },
        }).populate('ID_user', 'first_name last_name avatar')
            .populate('tags', 'first_name last_name avatar')
            .populate({
                path: 'ID_post_shared',
                populate: [
                    { path: 'ID_user', select: 'first_name last_name avatar' },
                    { path: 'tags', select: 'first_name last_name avatar' }
                ],
                select: '-__v' // Lấy tất cả các thuộc tính trừ __v (hoặc bỏ select nếu muốn lấy hết)
            })
            .sort({ createdAt: -1 })
            .lean();

        // post_reactions comment(lấy các reaction của từng bài post)
        if (rPosts.length > 0) {
            const postIds = rPosts.map(post => post._id);

            // Tìm tất cả reactions của danh sách bài post
            const allReactions = await post_reaction.find({ ID_post: { $in: postIds } })
                .populate('ID_user', 'first_name last_name avatar')
                .populate('ID_reaction', 'name icon')
                .sort({ createdAt: 1 })
                .lean();

            // Tìm tất cả comment của danh sách bài post
            const allCommetn = await comment.find({ ID_post: { $in: postIds } })
                .populate('ID_user', 'first_name last_name avatar')
                .populate({
                    path: 'ID_comment_reply',
                    populate: { path: 'ID_user', select: 'first_name last_name avatar' },
                })
                .sort({ createdAt: 1 })
                .lean();

            // Nhóm reactions theo ID_post
            const reactionMap = {};
            allReactions.forEach(reaction => {
                if (!reactionMap[reaction.ID_post]) {
                    reactionMap[reaction.ID_post] = [];  // Nếu chưa có mảng này, tạo mảng rỗng
                }
                reactionMap[reaction.ID_post].push(reaction); // Thêm reaction vào mảng của post đó
            });

            // Nhóm comment theo ID_post
            const commetnMap = {};
            allCommetn.forEach(comment => {
                if (!commetnMap[comment.ID_post]) {
                    commetnMap[comment.ID_post] = [];  // Nếu chưa có mảng này, tạo mảng rỗng
                }
                commetnMap[comment.ID_post].push(comment); // Thêm reaction vào mảng của post đó
            });


            // Gán vào rPosts
            rPosts.forEach(post => {
                post.post_reactions = reactionMap[post._id] || [];
            });
            // Gán vào rPosts
            rPosts.forEach(post => {
                post.comments = commetnMap[post._id] || [];
            });
        }

        return rPosts;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function changeDestroyPost(_id) {
    try {
        const result = await posts.findById(_id);
        if (result) {
            result._destroy = !result._destroy;
            await result.save();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        return false;
    }
}

// delete post vĩnh viễn
async function deletePost(_id) {
    try {
        await Promise.all([
            // Xóa tất cả reactions của bài post
            post_reaction.deleteMany({ ID_post: _id }),

            // Xóa tất cả comments liên quan đến bài post
            comment.deleteMany({ ID_post: _id }),

            // Xóa bài post
            posts.findByIdAndDelete(_id),
        ]);

        return true;
    } catch (error) {
        console.error("Lỗi khi xóa bài post:", error);
        return false;
    }
}


// chi tiết bài post
async function getChiTietPost(ID_post) {
    try {
        // Lấy bài post trước
        const post = await posts.findById(ID_post)
            .populate('ID_user', 'first_name last_name avatar')
            .populate('tags', 'first_name last_name avatar')
            .populate({
                path: 'ID_post_shared',
                populate: [
                    { path: 'ID_user', select: 'first_name last_name avatar' },
                    { path: 'tags', select: 'first_name last_name avatar' }
                ],
                select: '-__v'
            })
            .lean();

        if (!post) return null; // Nếu không có bài post, trả về null

        // Lấy comments trước để có ID_comment
        const postComments = await comment.find({ ID_post: ID_post })
            .populate('ID_user', 'first_name last_name avatar')
            .populate({
                path: 'ID_comment_reply',
                populate: { path: 'ID_user', select: 'first_name last_name avatar' },
                select: 'content createdAt'
            })
            .sort({ createdAt: 1 })
            .lean();

        // Lấy post reactions và comment reactions song song
        const [postReactions, commentReactions] = await Promise.all([
            post_reaction.find({ ID_post: ID_post })
                .populate('ID_user', 'first_name last_name avatar')
                .populate('ID_reaction', 'name icon')
                .sort({ createdAt: 1 })
                .lean(),

            postComments.length > 0
                ? comment_reaction.find({ ID_comment: { $in: postComments.map(cmt => cmt._id) } })
                    .populate('ID_user', 'first_name last_name avatar')
                    .populate('ID_reaction', 'name icon')
                    .sort({ createdAt: 1 })
                    .lean()
                : [] // Nếu không có comment thì tránh lỗi query rỗng
        ]);

        // Xử lý phản ứng cho comment
        const commentReactionMap = {};
        commentReactions.forEach(reaction => {
            if (!commentReactionMap[reaction.ID_comment]) {
                commentReactionMap[reaction.ID_comment] = [];
            }
            commentReactionMap[reaction.ID_comment].push(reaction);
        });

        // Xử lý comment bằng reduce để giảm số vòng lặp
        const commentMap = postComments.reduce((map, cmt) => {
            map[cmt._id] = {
                ...cmt,
                replys: [],
                comment_reactions: commentReactionMap[cmt._id] || [] // Gắn reactions vào từng comment
            };
            return map;
        }, {});

        const rootComments = [];

        postComments.forEach((cmt) => {
            if (cmt.ID_comment_reply) {
                commentMap[cmt.ID_comment_reply._id]?.replys.push(commentMap[cmt._id]);
            } else {
                rootComments.push(commentMap[cmt._id]);
            }
        });

        // Gắn dữ liệu vào object post
        post.post_reactions = postReactions;
        post.comments = rootComments;
        post.countComments = postComments.length;

        return post;
    } catch (error) {
        console.error("Error in getChiTietPost:", error);
        throw error;
    }
}


async function notiLiveStream(ID_livestream, ID_user) {
    try {

        // 🔍 Tìm tất cả bạn bè của người đăng bài
        const relationships = await relationship.find({
            $or: [
                { ID_userA: ID_user, relation: 'Bạn bè' },
                { ID_userB: ID_user, relation: 'Bạn bè' },
            ],
        });

        // Tạo danh sách friendIds và ánh xạ ID_relationship
        const friendData = relationships.map(r => ({
            friendId: r.ID_userA.toString() === ID_user.toString() ? r.ID_userB.toString() : r.ID_userA.toString(),
            ID_relationship: r._id.toString(),
        }));

        if (friendData.length === 0) return true; // Không có bạn bè để gửi thông báo

        // 🔔 Tạo thông báo cho từng bạn bè
        const notifications = friendData.map(({ friendId, ID_relationship }) => ({
            ID_relationship: ID_relationship, // Gắn ID_relationship vào thông báo
            content: ID_livestream,
            ID_user: friendId,
            type: 'Đang livestream',
        }));


        // 💾 Lưu thông báo vào database
        const createdNotifications = await notification.insertMany(notifications);

        // 🎯 Ghép `ID_user` với `notificationId`
        const notificationMap = createdNotifications.reduce((acc, noti) => {
            acc[noti.ID_user.toString()] = noti._id.toString();
            return acc;
        }, {});

        // 🔍 Tìm FCM tokens của bạn bè
        const fcmTokens = await noti_token.find({ ID_user: { $in: friendData.map(f => f.friendId) } }).select('ID_user tokens');

        // 📤 Ghép token với notificationId
        // const messages = fcmTokens
        //     .map(({ ID_user, token }) => ({
        //         token,
        //         notificationId: notificationMap[ID_user.toString()],
        //     }))
        //     .filter(({ token }) => token && token.trim().length > 0); // Lọc token hợp lệ
        const messages = [];
        fcmTokens.forEach(({ ID_user, tokens }) => {
            if (tokens && tokens.length > 0) {
                tokens.forEach(token => {
                    messages.push({
                        token,
                        notificationId: notificationMap[ID_user.toString()],
                    });
                });
            }
        });

        if (messages.length === 0) return true; // Không có token hợp lệ

        // 🚀 Gửi từng thông báo riêng lẻ
        await Promise.all(messages.map(({ token, notificationId }) =>
            axios.post(
                //`http://localhost:3001/gg/send-notification`,
                `https://linkage.id.vn/gg/send-notification`,
                {
                    fcmTokens: [token], // Chỉ gửi cho 1 user
                    title: "Thông báo",
                    body: null,
                    ID_noties: [notificationId], // Notification tương ứng
                })
        ));

        console.log('noti live stream thành công')
        return true;

    } catch (error) {
        console.log(error);
        throw error;
    }
}