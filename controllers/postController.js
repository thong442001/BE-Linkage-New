const posts = require("../models/post");

module.exports = {
    getMyPosts,
    getAllPostsUserId,
    getPostsUserIdDestroyFalse,
    getPostsUserIdDestroyTrue,
    addPost,
    destroyPost,
    deletePost,
    editNameAndAvatar,// chung
}

async function getAllPostsUserId(userId) {
    try {
        const result = await posts.find({ "userId": userId });
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function getPostsUserIdDestroyFalse(userId) {
    try {
        const result = await posts.find({ "userId": userId, "destroy": false });
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function getPostsUserIdDestroyTrue(userId) {
    try {
        const result = await posts.find({ "userId": userId, "destroy": true });
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// posts trong trang cá nhân của tôi
async function getMyPosts(userId) {
    try {
        const result = await posts.find({ "userId": userId, "status": { $ne: 0 } })//$ne -> !=
            .populate("userId", "displayName avatar")// FK
            .sort({ 'createdAt': -1 });// xếp sắp (1->tăng dần) (-1->giảm dần)


        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function addPost(userId, content, images, status) {
    try {
        const newItem = {
            userId,
            // displayName,
            // avatar,
            content,
            images,
            status,
        };
        const newPost = await posts.create(newItem);
        //console.log(newPost);
        return newPost._id;
    } catch (error) {
        console.log(error);
        return false;
    }
}

// đổi destroy thành true
async function destroyPost(body) {
    try {
        const { id } = body;
        const result = await posts.findById(id);
        if (result) {

            result.destroy = true;
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
async function deletePost(id) {
    try {
        // xóa post vĩnh viễn
        await posts.findByIdAndDelete(id);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

// ************* chung *************

async function editNameAndAvatar(userId, displayName, avatar) {
    try {
        const itemEdit = await posts.find({ "userId": userId }).updateMany({ "displayName": displayName, "avatar": avatar });
        //console.log(itemEdit);
        return true;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

