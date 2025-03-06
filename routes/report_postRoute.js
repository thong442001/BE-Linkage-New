var express = require('express');
var router = express.Router();

const report_postController = require("../controllers/report_postController")

//checkToken
const checkToken = require("./checkToken");

//http://localhost:3000/report_post/addReport_post
router.post('/addReport_post', checkToken, async function (req, res, next) {
  try {
    const { me, ID_post } = req.body;
    const result = await report_postController.addReport_post(me, ID_post);
    if (result) {
      return res.status(200).json({ "status": true });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// http://localhost:3000/report_post/getAllReport_post
router.get('/getAllReport_post', async function (req, res, next) {
  try {
    const result = await report_postController.getAllReport_post();
    if (result) {
      res.status(200).json({ "status": true, "reports": result });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

// http://localhost:3000/report_post/deleteReport_post
router.post('/deleteReport_post', checkToken, async function (req, res, next) {
  try {
    const { _id } = req.body;
    const result = await report_postController.deleteReport_post(_id);
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
