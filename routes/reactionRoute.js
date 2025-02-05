var express = require('express');
var router = express.Router();

const reactionController = require("../controllers/reactionController")

//add reaction ( khóa )
//http://localhost:3000/reaction/addReaction
// router.post('/addReaction', async function (req, res, next) {
//   try {
//     const { name, icon } = req.body;
//     const result = await reactionController.addReaction(name, icon);
//     if (result) {
//       res.status(200).json({ "status": true, "message": "tạo reaction thành công" });
//     } else {
//       res.status(401).json({ "status": false, "message": "Lỗi khi tạo reaction" });
//     }
//   } catch (e) {
//     return res.status(400).json({ "status": false, "message": "lỗi" });
//   }
// });

// http://localhost:3000/reaction/getAllReaction
router.get('/getAllReaction', async function (req, res, next) {
  try {
    const reactions = await reactionController.getAllReaction();
    if (reactions) {
      res.status(200).json({ "status": true, "reactions": reactions });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});


module.exports = router;
