var express = require('express');
var router = express.Router();

const relationshipController = require("../controllers/relationshipController")

//checkToken
const checkToken = require("./checkToken");

// ********* Lỗi ở đây nha Tài ngu **************
// http://localhost:3000/relationship/getRelationshipAvsB
router.post('/getRelationshipAvsB', async function (req, res, next) {
  try {
    console.log('📥 Request body:', req.body); // Kiểm tra dữ liệu nhận được
    const { ID_user, me } = req.body;
    console.log('*****123');
    const relationship = await relationshipController.getRelationshipAvsB(ID_user, me);
    if (relationship) {
      console.log('****123');
      res.status(200).json({ "status": true, "relationship": relationship });
    }
  } catch (e) {
    console.log('*****123');
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// http://localhost:3000/relationship/getAllLoiMoiKetBan
router.get('/getAllLoiMoiKetBan', checkToken, async function (req, res, next) {
  try {
    const { me } = req.query;
    const relationships = await relationshipController.getAllLoiMoiKetBan(me);
    if (relationships) {
      //console.log(reactions)
      res.status(200).json({ "status": true, "relationships": result });
    } else {
      res.status(401).json({ "status": false, "message": "lỗi ID_user" });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

// http://localhost:3000/relationship/guiLoiMoiKetBan
router.post('/guiLoiMoiKetBan', checkToken, async function (req, res, next) {
  try {
    const { ID_relationship, me } = req.body;
    const result = await relationshipController.guiLoiMoiKetBan(ID_relationship, me);
    if (result) {
      res.status(200).json({ "status": result, "message": "Gửi lời mời thành công" });
    } else {
      res.status(401).json({ "status": result, "message": "Gửi lời mời thất bại" });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// http://localhost:3000/relationship/chapNhanLoiMoiKetBan
router.post('/chapNhanLoiMoiKetBan', checkToken, async function (req, res, next) {
  try {
    const { ID_relationship } = req.body;
    const result = await relationshipController.chapNhanLoiMoiKetBan(ID_relationship);
    if (result) {
      res.status(200).json({ "status": result, "message": "Chấp nhận lời mời kết bạn thành công" });
    } else {
      res.status(401).json({ "status": result, "message": "Chấp nhận lời mời kết bạn thất bại!" });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// http://localhost:3000/relationship/huyLoiMoiKetBan
router.post('/huyLoiMoiKetBan', checkToken, async function (req, res, next) {
  try {
    const { ID_relationship } = req.body;
    const result = await relationshipController.huyLoiMoiKetBan(ID_relationship);
    if (result) {
      res.status(200).json({ "status": result, "message": "Hủy lời mời kết bạn thành công" });
    } else {
      res.status(401).json({ "status": result, "message": "Hủy lời mời kết bạn thất bại!" });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

module.exports = router;
