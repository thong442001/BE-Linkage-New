var express = require('express');
var router = express.Router();

const phone_otpController = require("../controllers/phone_otpController")

//checkToken
const checkToken = require("./checkToken");

//http://localhost:3000/phone_otp/OTP_dangKi
router.post('/OTP_dangKi', checkToken, async function (req, res, next) {
  try {
    const { phone } = req.body;
    const result = await phone_otpController.OTP_dangKi(phone);
    if (result.status) {
      return res.status(200).json({
        status: true,
        message: result.message,
      });
    } else {
      return res.status(500).json({
        status: false,
        message: result.message,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Lỗi gửi OTP:", error.message);
    return res.status(500).json({
      status: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

//http://localhost:3000/phone_otp/checkOtpDangKi
router.post('/checkOtpDangKi', checkToken, async function (req, res, next) {
  try {
    const { phone, otp } = req.body;
    const result = await phone_otpController.checkOtpDangKi(phone, otp);

    if (result.status) {
      return res.status(200).json({
        status: true,
        message: result.message,
      });
    } else {
      return res.status(400).json({
        status: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Lỗi xác thực OTP:", error.message);
    return res.status(500).json({
      status: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

module.exports = router;
