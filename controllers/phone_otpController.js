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

// async function sendOTP_dangKi(phone) {
//     try {
//         // Tạo OTP ngẫu nhiên 4 chữ số
//         const otp = generateOTP();

//         // Kiểm tra xem số điện thoại đã tồn tại trong DB chưa
//         const checkPhone = await phone_otp.findOne({ phone: phone })

//         if (checkPhone) {
//             // Nếu đã tồn tại, cập nhật OTP mới và thời gian hết hạn
//             checkPhone.otp = otp;
//             checkPhone.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP hết hạn sau 5 phút
//             await checkPhone.save();
//         } else {
//             // Nếu chưa tồn tại, tạo mới
//             const newItem = {
//                 phone: phone,
//                 otp: otp,
//                 expiresAt: new Date(Date.now() + 5 * 60 * 1000), // OTP hết hạn sau 5 phút
//             };
//             checkPhone = await phone_otp.create(newItem);
//         }

//         const smsResponse = await axios.post(
//             `https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/`,
//             {
//                 ApiKey: SMS_APIKEY,
//                 Content: `${otp} la ma xac minh dang ky Baotrixemay cua ban`,
//                 Phone: phone,
//                 SecretKey: SMS_SECRETKEY,
//                 Brandname: "Baotrixemay",
//                 SmsType: "2"
//             },
//         );

//         if (smsResponse.data.CodeResult !== "100") {
//             throw new Error("Gửi SMS thất bại: " + smsResponse.data.ErrorMessage);
//         }

//         // const formattedPhone = phone.startsWith("+84") ? phone : `+84${phone.slice(1)}`;
//         // // Gửi OTP qua SMS bằng Twilio
//         // const message = await client.messages.create({
//         //     body: `[thong] Ma xac minh cua ban la ${otp}, hieu luc trong 5 phut.`,
//         //     from: twilioPhoneNumber,
//         //     to: formattedPhone, // Số điện thoại người nhận (định dạng quốc tế, ví dụ: +84987654321)
//         // });

//         // console.log("Gửi SMS qua Twilio thành công:", message.sid);

//         return {
//             status: true,
//             message: "Gửi OTP thành công",
//         };

//     } catch (error) {
//         console.error("Lỗi OTP_dangKi:", error.message);
//         return {
//             status: false,
//             message: "Gửi OTP thất bại",
//             error: error.message,
//         };
//     }
// }

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