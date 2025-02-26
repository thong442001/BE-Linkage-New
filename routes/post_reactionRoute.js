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
      res.status(200).json({ "status": result.status, "message": result.message });
    } else {
      res.status(401).json({ "status": result.status, "message": result.message });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});


module.exports = router;
