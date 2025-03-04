var express = require('express');
var router = express.Router();

const comment_reactionController = require("../controllers/comment_reactionController")

//checkToken
const checkToken = require("./checkToken");

//add 
//http://localhost:3000/comment_reactionController/addComment_Reaction
router.post('/addComment_Reaction', checkToken, async function (req, res, next) {
  try {
    const { ID_comment, ID_user, ID_reaction } = req.body;
    const result = await comment_reactionController.addComment_Reaction(ID_comment, ID_user, ID_reaction);
    if (result.status) {
      res.status(200).json({
        "status": result.status,
        "message": result.message,
        "comment_reaction": result.comment_reaction
      });
    } else {
      res.status(401).json({
        "status": result.status,
        "message": result.message
      });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});


//delete vĩnh viễn
//http://localhost:3000/comment_reactionController/deleteComment_reaction
router.post('/deleteComment_reaction', checkToken, async function (req, res, next) {
  try {
    const { _id } = req.body;
    // xóa post_reaction 
    const result = await comment_reactionController.deleteComment_reaction(_id);
    if (result) {
      res.status(200).json({
        "status": result,
        "mess": "xóa vĩnh viễn thành công"
      });
    } else {
      res.status(402).json({
        "status": false,
        "mess": "Không tìm thấy post "
      });
    }

  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

module.exports = router;
