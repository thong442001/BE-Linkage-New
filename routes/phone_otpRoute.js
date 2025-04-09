var express = require('express');
var router = express.Router();

const phone_otpController = require("../controllers/phone_otpController")

//http://localhost:3000/phone_otp/sendOTP_dangKi_phone
router.post('/sendOTP_dangKi_phone', async function (req, res, next) {
  try {
    const { phone } = req.body;
    const result = await phone_otpController.sendOTP_dangKi(phone);
    if (result.status) {
      return res.status(200).json({
        status: true,
        message: result.message,
      });
    } else {
      return res.status(501).json({
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
router.post('/checkOTP_phone', async function (req, res, next) {
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

//http://localhost:3000/phone_otp/sendOTP_quenMatKhau
router.post('/sendOTP_quenMatKhau_phone', async function (req, res, next) {
  try {
    const { phone } = req.body;
    const result = await phone_otpController.sendOTP_quenMatKhau(phone);
    if (result.status) {
      return res.status(200).json({
        status: true,
        message: result.message,
      });
    } else {
      return res.status(500).json({
        status: false,
        message: result.message,
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

module.exports = router;
