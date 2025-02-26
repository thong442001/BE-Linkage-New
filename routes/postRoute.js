var express = require('express');
var router = express.Router();

const postController = require("../controllers/postController")

//checkToken
const checkToken = require("./checkToken");


/**
 * @swagger
 * /post/add:
 *   post:
 *     tags:
 *     - Test trên Postman
 *     summary: add post - parameters( userId, content, images[] )
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - userId
 *              - content
 *              - images
 *            properties:
 *              userId:
 *                type: string
 *                default: admin 
 *              content:
 *                type: string
 *                default: 123456 
 *              images:
 *                type: string
 *                default: 123456 
 *     responses:
 *       200:
 *         description:  add post thành công 
 *       400:
 *         description:  lỗi
 *       401:
 *         description:  user không tồn tại 
 */
//add  
//http://localhost:3000/post/addPost
router.post('/addPost', checkToken, async function (req, res, next) {
  try {
    const {
      ID_user,
      caption,
      medias,
      status,
      type,
      ID_post_shared,
      tags
    } = req.body;
    const postId = await postController.addPost(
      ID_user,
      caption,
      medias,
      status,
      type,
      ID_post_shared,
      tags
    );
    if (postId) {
      res.status(200).json({ "status": true, "message": "add post thành công", "ID_post": postId });
    } else {
      res.status(401).json({ "status": false, "message": "user không tồn tại" });
    }

  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// getProfile
//http://localhost:3000/post/allProfile
router.post('/allProfile', checkToken, async function (req, res, next) {
  try {
    const { ID_user, me } = req.body;
    const result = await postController.allProfile(ID_user, me);
    if (result) {
      res.status(200).json({
        "status": true,
        "user": result.rUser,
        "posts": result.rPosts,
        "relationship": result.rRelationship,
        "friends": result.rFriends,
        "stories": result.rStories,
      });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});


// http://localhost:3000/post/getAllPostsInHome
router.get('/getAllPostsInHome', checkToken, async function (req, res, next) {
  try {
    const { me } = req.query;
    const result = await postController.getAllPostsInHome(me);
    if (result) {
      res.status(200).json({
        "status": true,
        "posts": result.rPosts,
        "stories": result.rStories,
      });
    } else {
      res.status(200).json({ "status": false, "posts": [] });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//đổi _destroy
//http://localhost:3000/post/changeDestroyPost
router.post('/changeDestroyPost', checkToken, async function (req, res, next) {
  try {
    const { _id } = req.body;
    const result = await postController.changeDestroyPost(_id);
    if (result) {
      res.status(200).json({
        "status": result,
        "mess": "đổi destroy thành công"
      });
    } else {
      res.status(401).json({
        "status": result,
        "mess": "Không tìm thấy post"
      });
    }

  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//getPostsUserIdDestroyTrue
//http://localhost:3000/post/getPostsUserIdDestroyTrue
router.get('/getPostsUserIdDestroyTrue', checkToken, async function (req, res, next) {
  try {
    const { me } = req.query;
    const rPosts = await postController.getPostsUserIdDestroyTrue(me);
    res.status(200).json({ "status": true, "posts": rPosts });
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//delete vĩnh viễn
//http://localhost:3000/post/delete
router.post('/deletePost', checkToken, async function (req, res, next) {
  try {
    const { _id } = req.body;
    // xóa post trong user 
    const result = await postController.deletePost(_id);
    if (result) {
      res.status(200).json({
        "status": result,
        "mess": "xóa vĩnh viễn thành công"
      });
    } else {
      res.status(402).json({
        "status": result,
        "mess": "Không tìm thấy post "
      });
    }

  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});


module.exports = router;
