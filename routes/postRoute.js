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
      ID_post_shared,
      tags
    } = req.body;
    const postId = await postController.addPost(
      ID_user,
      caption,
      medias,
      status,
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
      });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});


//getPostsUserIdDestroyFalse
//http://localhost:3000/post/getPostsUserIdDestroyFalse
// router.get('/getPostsUserIdDestroyFalse', checkToken, async function (req, res, next) {
//   try {
//     const { userId } = req.body;
//     const list = await postController.getPostsUserIdDestroyFalse(userId);
//     res.status(200).json({ "status": true, "posts": list });
//   } catch (e) {
//     res.status(400).json({ "status": false, "message": "lỗi" });
//   }
// });


//getPostsUserIdDestroyTrue
//http://localhost:3000/post/getPostsUserIdDestroyTrue
// router.get('/getPostsUserIdDestroyTrue', checkToken, async function (req, res, next) {
//   try {
//     const { userId } = req.body;
//     const list = await postController.getPostsUserIdDestroyTrue(userId);
//     res.status(200).json({ "status": true, "posts": list });
//   } catch (e) {
//     res.status(400).json({ "status": false, "message": "lỗi" });
//   }
// });



//delete vĩnh viễn
//http://localhost:3000/post/delete
// router.post('/delete', checkToken, async function (req, res, next) {
//   try {
//     const { userId, id } = req.body;
//     // xóa post trong user 
//     const remotePostInUser = await userController.deletePostUser(userId, id);
//     if (remotePostInUser) {
//       // xóa post trong posts 
//       const result = await postController.deletePost(id);
//       if (result) {
//         res.status(200).json({ "status": true, "mess": "delete vĩnh viễn thành công" });
//       } else {
//         res.status(401).json({ "status": false, "mess": "Không tìm thấy postId" });
//       }
//     } else {
//       res.status(402).json({ "status": false, "mess": "Không tìm thấy postId trong user" });
//     }

//   } catch (e) {
//     res.status(400).json({ "status": false, "message": "lỗi" });
//   }
// });


//đổi destroy thành true
//http://localhost:3000/post/destroyPost
// router.post('/destroyPost', checkToken, async function (req, res, next) {
//   try {
//     const body = req.body;
//     const result = await postController.destroyPost(body);
//     if (result) {
//       res.status(200).json({ "status": true, "mess": "đổi destroy thành true thành công" });
//     } else {
//       res.status(401).json({ "status": false, "mess": "Không tìm thấy post" });
//     }

//   } catch (e) {
//     res.status(400).json({ "status": false, "message": "lỗi" });
//   }
// });

//Home ( posts of user and user's friends )
//http://localhost:3000/post/getHome
// router.get('/getHome', checkToken, async function (req, res, next) {
//   try {
//     const { userId } = req.body;
//     // get friends in user
//     const listUsers = await userController.getFriendsInUser(userId);
//     listUsers.push(userId);
//     //console.log(listUsers);
//     // get posts of listUsers
//     var posts = new Array();
//     // async/await ko dùng đc trong foEach 
//     // nên phải dùng for ... of
//     for (const item of listUsers) {
//       let postsOfe = await postController.getPostsUserIdDestroyFalse(item);
//       // nối arr lại vs nhau
//       posts = posts.concat(postsOfe);
//     }
//     // xếp sắp giảm dần theo Date
//     posts.sort((a, b) => {
//       return new Date(b.createdAt) - new Date(a.createdAt);
//     });
//     // result
//     res.status(200).json({ "status": true, "posts": posts });
//   } catch (e) {
//     res.status(400).json({ "status": false, "message": "lỗi API" });
//   }
// });


module.exports = router;
