var express = require('express');
var router = express.Router();

const report_userController = require("../controllers/report_userController")

//checkToken
const checkToken = require("./checkToken");

//http://localhost:3000/report_user/addReport_user
router.post('/addReport_user', checkToken, async function (req, res, next) {
  try {
    const { me, ID_user, ID_reason } = req.body;
    const result = await report_userController.addReport_user(me, ID_user, ID_reason);
    if (result) {
      return res.status(200).json({ "status": true });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// http://localhost:3000/report_user/getAllReport_userPending
router.get('/getAllReport_userPending', async function (req, res, next) {
  try {
    const result = await report_userController.getAllReport_userPending();
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

// http://localhost:3000/report_user/setReportApproved
router.post('/setReportApproved', async function (req, res, next) {
  try {
    const { ID_report_user } = req.body;
    const result = await report_userController.setReportApproved(ID_report_user);
    if (result) {
      return res.status(200).json({ "status": true });
    } else {
      return res.status(401).json({ "status": false, "message": "Không tìm thấy _id" });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

// http://localhost:3000/report_user/setReportRejected
router.post('/setReportRejected', async function (req, res, next) {
  try {
    const { ID_report_user } = req.body;
    const result = await report_userController.setReportRejected(ID_report_user);
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
