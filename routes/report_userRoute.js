var express = require('express');
var router = express.Router();

const report_userController = require("../controllers/report_userController")

//checkToken
const checkToken = require("./checkToken");

//http://localhost:3000/report_user/addReport_user
router.post('/addReport_user', checkToken, async function (req, res, next) {
  try {
    const { me, ID_user } = req.body;
    const result = await report_userController.addReport_user(me, ID_user);
    if (result) {
      return res.status(200).json({ "status": true });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// http://localhost:3000/report_user/getAllReport_user
router.get('/getAllReport_user', async function (req, res, next) {
  try {
    const result = await report_userController.getAllReport_user();
    if (result) {
      res.status(200).json({ "status": true, "reports": result });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

// http://localhost:3000/report_user/getAllBanUser
router.get('/getAllBanUser', async function (req, res, next) {
  try {
    const result = await report_userController.getAllBanUser();
    if (result) {
      res.status(200).json({ "status": true, "reports": result });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

// http://localhost:3000/report_user/deleteReport_user
router.post('/deleteReport_user', checkToken, async function (req, res, next) {
  try {
    const { _id } = req.body;
    const result = await report_userController.deleteReport_user(_id);
    if (result) {
      return res.status(200).json({ "status": true });
    } else {
      return res.status(4001).json({ "status": false, "message": "Không tìm thấy _id" });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

// http://localhost:3000/report_user/banUser
router.post('/banUser', async function (req, res, next) {
  try {
    const { ID_report_user } = req.body;
    const result = await report_userController.banUser(ID_report_user);
    if (result) {
      return res.status(200).json({ "status": true });
    } else {
      return res.status(401).json({ "status": false, "message": "Không tìm thấy _id" });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

// http://localhost:3000/report_user/unBanUser
router.post('/unBanUser', async function (req, res, next) {
  try {
    const { ID_report_user } = req.body;
    const result = await report_userController.unBanUser(ID_report_user);
    if (result) {
      return res.status(200).json({ "status": true });
    } else {
      return res.status(401).json({ "status": false, "message": "Không tìm thấy _id" });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

module.exports = router;
