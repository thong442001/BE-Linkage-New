var express = require('express');
var router = express.Router();

const reasonController = require("../controllers/reasonController")

//add reaction ( khóa )
//http://localhost:3000/reason/addReason
// router.post('/addReason', async function (req, res, next) {
//   try {
//     const { reasonText } = req.body;
//     const result = await reasonController.addReason(reasonText);
//     if (result) {
//       res.status(200).json({ "status": true, "message": "tạo reason thành công" });
//     } else {
//       res.status(401).json({ "status": false, "message": "Lỗi khi tạo reason" });
//     }
//   } catch (e) {
//     return res.status(400).json({ "status": false, "message": "lỗi" });
//   }
// });

// http://localhost:3000/reason/getAllReason
router.get('/getAllReason', async function (req, res, next) {
  try {
    const reasons = await reasonController.getAllReason();
    if (reasons) {
      //console.log(reactions)
      res.status(200).json({ "status": true, "reasons": reasons });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});


module.exports = router;
