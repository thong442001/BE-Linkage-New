var express = require('express');
var router = express.Router();

const commentController = require("../controllers/commentController")

//checkToken
const checkToken = require("./checkToken");

//add  
//http://localhost:3000/comment/addComment
router.post('/addComment', checkToken, async function (req, res, next) {
  try {
    const {
      ID_user,
      ID_post,
      content,
      type,
      ID_comment_reply
    } = req.body;
    const result = await commentController.addComment(
      ID_user,
      ID_post,
      content,
      type,
      ID_comment_reply
    );
    if (!result) {
      res.status(401).json({
        "status": false,
        "message": "Lỗi khi tạo comment"
      });
    } else {
      res.status(200).json({
        "status": true,
        "comment": result,
        "message": "tạo comment thành công"
      });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//edit  
//http://localhost:3000/comment/setComment_destroyTrue
router.post('/setComment_destroyTrue', checkToken, async function (req, res, next) {
  try {
    const { ID_comment } = req.body;
    const result = await commentController.setComment_destroyTrue(ID_comment);
    if (result) {
      res.status(200).json({
        "status": true,
        "comment": result.newComment,
        "message": "Thu hồi tin nhắn thành công"
      });
    } else {
      res.status(401).json({
        "status": false,
        "message": "Thu hồi tin nhắn thất bại"
      });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/comment/editComment
router.post('/editComment', checkToken, async function (req, res, next) {
  try {
    const { ID_comment, newContent } = req.body;
    const result = await commentController.editComment(ID_comment, newContent);
    if (result) {
      res.status(200).json({
        "status": true,
        "message": "Chỉnh sửa comment thành công"
      });
    } else {
      res.status(401).json({
        "status": false,
        "message": "Chỉnh sửa comment thất bại"
      });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/comment/deleteComment
router.post('/deleteComment', checkToken, async function (req, res, next) {
  try {
    const { ID_comment } = req.body;
    const result = await commentController.deleteComment(ID_comment);
    if (result) {
      res.status(200).json({
        "status": true,
        "message": "Xóa comment thành công"
      });
    } else {
      res.status(401).json({
        "status": false,
        "message": "Xóa comment thất bại"
      });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

module.exports = router;
