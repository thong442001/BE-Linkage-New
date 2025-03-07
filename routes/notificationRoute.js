var express = require('express');
var router = express.Router();

const notificationController = require("../controllers/notificationController")

//checkToken
const checkToken = require("./checkToken");

//http://localhost:3000/notification/getAllNotificationOfUser
router.get('/getAllNotificationOfUser', checkToken, async function (req, res, next) {
  try {
    const { me } = req.query;
    const result = await notificationController.getAllNotificationOfUser(me);
    if (result) {
      return res.status(200).json({
        "status": true,
        "notifications": result
      });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// http://localhost:3000/notification/setStatusSeen
router.post('/setStatusSeen', checkToken, async function (req, res, next) {
  try {
    const { _id } = req.body;
    const result = await notificationController.setStatusSeen(_id);
    if (result) {
      return res.status(200).json({ "status": true });
    } else {
      return res.status(4001).json({ "status": false, "message": "Không tìm thấy _id" });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});


module.exports = router;
