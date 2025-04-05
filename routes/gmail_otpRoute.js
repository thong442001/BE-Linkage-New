var express = require('express');
var router = express.Router();

const gmail_otpController = require("../controllers/gmail_otpController")

//http://localhost:3000/gmail_otp/sendOTPByEmail
router.post('/sendOTP_dangKi_gmail', async function (req, res, next) {
  try {
    const { gmail } = req.body;
    const result = await gmail_otpController.sendOTPByEmail(gmail);
    if (result.status) {
      return res.status(200).json({
        status: true,
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

//http://localhost:3000/gmail_otp/checkOtpDangKi
router.post('/checkOTP_gmail', async function (req, res, next) {
  try {
    const { gmail, otp } = req.body;
    const result = await gmail_otpController.checkOtpDangKi(gmail, otp);

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

//http://localhost:3000/gmail_otp/sendOTP_quenMatKhau
router.post('/sendOTP_quenMatKhau_gmail', async function (req, res, next) {
  try {
    const { gmail } = req.body;
    const result = await gmail_otpController.sendOTP_quenMatKhau(gmail);
    if (result.status) {
      return res.status(200).json({
        status: true,
        message: result.message,
      });
    } else {
      return res.status(401).json({
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
