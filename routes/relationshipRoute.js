var express = require('express');
var router = express.Router();

const relationshipController = require("../controllers/relationshipController")

//checkToken
const checkToken = require("./checkToken");

// http://localhost:3000/relationship/getRelationshipAvsB
router.post('/getRelationshipAvsB', checkToken, async function (req, res, next) {
  try {
    const { ID_user, me } = req.body;
    const relationship = await relationshipController.getRelationshipAvsB(ID_user, me);
    if (relationship) {
      res.status(200).json({ "status": true, "relationship": relationship });
    }
  } catch (e) {
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
      res.status(200).json({ "status": true, "relationships": relationships });
    } else {
      res.status(201).json({ "status": true, "relationships": [] });
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
      res.status(200).json({
        "status": true,
        "message": "Gửi lời mời thành công",
        "relationship": result,
      });
    } else {
      res.status(401).json({
        "status": false,
        "message": "Gửi lời mời thất bại",
      });
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
      res.status(200).json({
        "status": true,
        "message": "Chấp nhận lời mời kết bạn thành công",
        "relationship": result,
      });
    } else {
      res.status(401).json({
        "status": false,
        "message": "Chấp nhận lời mời kết bạn thất bại!",
      });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// http://localhost:3000/relationship/setRelationNguoiLa
router.post('/setRelationNguoiLa', checkToken, async function (req, res, next) {
  try {
    const { ID_relationship } = req.body;
    const result = await relationshipController.setRelationNguoiLa(ID_relationship);
    if (result) {
      res.status(200).json({
        "status": true,
        "message": "Set relationship thành người lạ thành công",
        "relationship": result,
      });
    } else {
      res.status(401).json({
        "status": false,
        "message": "Set relationship thành người lạ thất bại!",
      });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// http://localhost:3000/relationship/getAllFriendOfID_user
router.get('/getAllFriendOfID_user', checkToken, async function (req, res, next) {
  try {
    const { me } = req.query;
    const relationships = await relationshipController.getAllFriendOfID_user(me);
    if (relationships) {
      //console.log(reactions)
      res.status(200).json({ "status": true, "relationships": relationships });
    } else {
      res.status(201).json({ "status": true, "relationships": [] });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

module.exports = router;
