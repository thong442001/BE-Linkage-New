var express = require('express');
var router = express.Router();

const report_postController = require("../controllers/report_postController")

//checkToken
const checkToken = require("./checkToken");

//http://localhost:3000/report_post/addReport_post
router.post('/addReport_post', checkToken, async function (req, res, next) {
  try {
    const { me, ID_post, ID_reason } = req.body;
    const result = await report_postController.addReport_post(me, ID_post, ID_reason);
    if (result) {
      return res.status(200).json({ "status": true });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// http://localhost:3000/report_post/getAllReport_postPending
router.get('/getAllReport_postPending', async function (req, res, next) {
  try {
    const result = await report_postController.getAllReport_postPending();
    if (result) {
      res.status(200).json({ "status": true, "reports": result });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

// http://localhost:3000/report_post/getAllBanPost
router.get('/getAllBanPost', async function (req, res, next) {
  try {
    const result = await report_postController.getAllBanPost();
    if (result) {
      res.status(200).json({ "status": true, "reports": result });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

// http://localhost:3000/report_post/setReportApproved
router.post('/setReportApproved', async function (req, res, next) {
  try {
    const { ID_report_post } = req.body;
    const result = await report_postController.setReportApproved(ID_report_post);
    if (result) {
      return res.status(200).json({ "status": true });
    } else {
      return res.status(401).json({ "status": false, "message": "Không tìm thấy _id" });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

// http://localhost:3000/report_post/setReportRejected
router.post('/setReportRejected', async function (req, res, next) {
  try {
    const { ID_report_post } = req.body;
    const result = await report_postController.setReportRejected(ID_report_post);
    if (result) {
      return res.status(200).json({ "status": true });
    } else {
      return res.status(401).json({ "status": false, "message": "Không tìm thấy _id" });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

// http://localhost:3000/report_post/unBanPost
router.post('/unBanPost', async function (req, res, next) {
  try {
    const { ID_report_post } = req.body;
    const result = await report_postController.unBanPost(ID_report_post);
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
