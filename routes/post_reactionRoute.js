var express = require('express');
var router = express.Router();

const post_reactionController = require("../controllers/post_reactionController")

//checkToken
const checkToken = require("./checkToken");

//add 
//http://localhost:3000/post_reaction/addPost_Reaction
router.post('/addPost_Reaction', checkToken, async function (req, res, next) {
  try {
    const { ID_post, ID_user, ID_reaction } = req.body;
    const result = await post_reactionController.addPost_Reaction(ID_post, ID_user, ID_reaction);
    if (result.status) {
      res.status(200).json({
        "status": result.status,
        "message": result.message,
        "post_reaction": result.post_reaction
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
//http://localhost:3000/post_reaction/deletePost_reaction
router.post('/deletePost_reaction', checkToken, async function (req, res, next) {
  try {
    const { _id } = req.body;
    // xóa post_reaction 
    const result = await post_reactionController.deletePost_reaction(_id);
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
