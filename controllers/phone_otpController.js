const phone_otp = require("../models/phone_otp");
const user = require("../models/user");
const axios = require("axios");
const config = require("../config");

// Hàm tạo OTP ngẫu nhiên 4 chữ số
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

const SMS_APIKEY = config.SMS_APIKEY;
const SMS_SECRETKEY = config.SMS_SECRETKEY;

async function sendOTP(phone, messageContent) {
    try {
        console.log("Bắt đầu sendOTP với phone:", phone);

        const otp = generateOTP();
        console.log("OTP đã tạo:", otp);

        console.log("Kiểm tra số điện thoại trong DB...");
        let checkPhone = await phone_otp.findOne({ phone: phone });
        console.log("Kết quả checkPhone:", checkPhone);

        if (checkPhone) {
            console.log("Số điện thoại đã tồn tại, cập nhật OTP...");
            checkPhone.otp = otp;
            checkPhone.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            await checkPhone.save();
            console.log("Cập nhật OTP thành công:", checkPhone);
        } else {
            console.log("Số điện thoại mới, tạo bản ghi mới...");
            const newItem = {
                phone: phone,
                otp: otp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            };
            checkPhone = await phone_otp.create(newItem);
            console.log("Tạo bản ghi mới thành công:", checkPhone);
        }

        console.log("Gửi SMS OTP...");
        const smsResponse = await axios.post(
            `https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/`,
            {
                ApiKey: SMS_APIKEY,
                Content: messageContent.replace("{{otp}}", otp),
                Phone: phone,
                SecretKey: SMS_SECRETKEY,
                Brandname: "Baotrixemay",
                SmsType: "2",
            }
        );
        console.log("Kết quả gửi SMS:", smsResponse.data);

        if (smsResponse.data.CodeResult !== "100") {
            throw new Error("Gửi SMS thất bại: " + smsResponse.data.ErrorMessage);
        }

        return {
            status: true,
            message: "Gửi OTP thành công",
        };
    } catch (error) {
        console.error("Lỗi sendOTP:", error.message);
        return {
            status: false,
            message: "Gửi OTP thất bại",
            error: error.message,
        };
    }
}

async function sendOTP_dangKi(phone) {
    const phoneRegex = /^(?:\+84|0)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
        return {
            status: false,
            message: "Số điện thoại không hợp lệ",
        };
    }

    const messageContent = `{{otp}} la ma xac minh dang ky Baotrixemay cua ban`;
    return await sendOTP(phone, messageContent);
}

async function sendOTP_quenMatKhau(phone) {
    try {
        const phoneRegex = /^(?:\+84|0)(3|5|7|8|9)[0-9]{8}$/;
        if (!phoneRegex.test(phone)) {
            return {
                status: false,
                message: "Số điện thoại không hợp lệ",
            };
        }

        const checkUser = await user.findOne({ phone: phone });
        if (!checkUser) {
            return {
                status: false,
                message: "Số điện thoại chưa đăng ký",
            };
        }

        const messageContent = `{{otp}} la ma xac minh dang ky Baotrixemay cua ban`;
        return await sendOTP(phone, messageContent);
    } catch (error) {
        console.error("Lỗi sendOTP_quenMatKhau:", error.message);
        return {
            status: false,
            message: "Gửi OTP thất bại",
            error: error.message,
        };
    }
}

async function checkOtpDangKi(phone, otp) {
    try {
        console.log("Kiểm tra OTP cho phone:", phone, "với OTP:", otp);

        const phoneRegex = /^(?:\+84|0)(3|5|7|8|9)[0-9]{8}$/;
        if (!phoneRegex.test(phone)) {
            return {
                status: false,
                message: "Số điện thoại không hợp lệ",
            };
        }

        const checkPhone = await phone_otp.findOne({ phone: phone });
        console.log("Kết quả checkPhone:", checkPhone);

        if (!checkPhone) {
            return {
                status: false,
                message: "Không tìm thấy số điện thoại",
            };
        }

        if (checkPhone.expiresAt < new Date()) {
            return {
                status: false,
                message: "OTP đã hết hạn",
            };
        }

        if (checkPhone.otp !== otp) {
            return {
                status: false,
                message: "OTP không đúng",
            };
        }

        checkPhone.otp = null;
        checkPhone.expiresAt = null;
        await checkPhone.save();
        console.log("Xác thực OTP thành công, đã xóa OTP");

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

module.exports = {
    sendOTP_dangKi,
    checkOtpDangKi,
    sendOTP_quenMatKhau,
};