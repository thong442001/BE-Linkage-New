const phone_otp = require("../models/phone_otp");
const axios = require("axios");
const config = require("../config");
//const twilio = require("twilio");

// Khởi tạo client Twilio
// const accountSid = config.TWILIO_ACCOUNT_SID;
// const authToken = config.TWILIO_AUTH_TOKEN;
// const twilioPhoneNumber = config.TWILIO_PHONE_NUMBER;
// const client = new twilio(accountSid, authToken);

const SMS_APIKEY = config.SMS_APIKEY;
const SMS_SECRETKEY = config.SMS_SECRETKEY;

// Hàm tạo OTP ngẫu nhiên 4 chữ số
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Tạo số ngẫu nhiên từ 1000 đến 9999
};

module.exports = {
    //sendOTP_dangKi,
    checkOtpDangKi,
}

// Hàm kiểm tra OTP
async function checkOtpDangKi(phone, otp) {
    try {
        // Tìm số điện thoại trong DB
        const checkPhone = await phone_otp.findOne({ phone: phone })

        if (!checkPhone) {
            return {
                status: false,
                message: "Không tìm thấy số điện thoại",
            };
        }

        // Kiểm tra xem OTP có hết hạn không
        if (checkPhone.expiresAt < new Date()) {
            return {
                status: false,
                message: "OTP đã hết hạn",
            };
        }

        // Kiểm tra OTP
        if (checkPhone.otp !== otp) {
            return {
                status: false,
                message: "OTP không đúng",
            };
        }

        // Xác thực thành công, xóa OTP và thời gian hết hạn
        checkPhone.otp = null;
        checkPhone.expiresAt = null;
        await checkPhone.save();

        return {
            status: true,
            message: "Xác thực thành công",
        };
    } catch (error) {
        console.error("Lỗi checkOtpDangKi:", error.message);
        return {
            status: false,
            message: "Lỗi API",
            error: error.message,
        };
    }
}