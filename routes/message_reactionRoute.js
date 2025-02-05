var express = require('express');
var router = express.Router();

const message_reactionController = require("../controllers/message_reactionController")

//checkToken
const checkToken = require("./checkToken");

//add 
//http://localhost:3000/message_reaction/addMessage_Reaction
router.post('/addMessage_Reaction', checkToken, async function (req, res, next) {
  try {
    const { ID_message, ID_user, ID_reaction } = req.body;
    const result = await message_reactionController.addMessage_Reaction(ID_message, ID_user, ID_reaction);
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
