const gmail_otp = require("../models/gmail_otp");
const user = require("../models/user");
const config = require("../config");
const path = require('path');
const nodemailer = require('nodemailer');

const EMAIL_USER = config.EMAIL_USER;
const EMAIL_PASS = config.EMAIL_PASS;

// Hàm tạo OTP ngẫu nhiên 4 chữ số
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

module.exports = {
    sendOTPByEmail,
    checkOtpDangKi,
    sendOTP_quenMatKhau
};

// Hàm gửi OTP qua email
async function sendOTPByEmail(gmail) {
    try {
        // Kiểm tra tham số gmail
        if (!gmail) {
            console.error("Tham số gmail là bắt buộc nhưng không được cung cấp");
            return {
                status: false,
                message: "Email là bắt buộc",
            };
        }

        // Kiểm tra định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(gmail)) {
            console.error(`Email không hợp lệ: ${gmail}`);
            return {
                status: false,
                message: "Email không hợp lệ",
            };
        }

        // Log thông tin đăng nhập (ẩn mật khẩu để bảo mật)
        console.log(`Sử dụng email: ${EMAIL_USER} để gửi OTP`);

        // Tạo OTP ngẫu nhiên 4 chữ số
        const otp = generateOTP();
        console.log(`Tạo OTP: ${otp} cho email: ${gmail}`);

        // Kiểm tra và lưu OTP vào database
        let checkEmail = await gmail_otp.findOne({ gmail: gmail });

        if (checkEmail) {
            checkEmail.otp = otp;
            checkEmail.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút
            await checkEmail.save();
            console.log(`Cập nhật OTP cho email: ${gmail}`);
        } else {
            const newItem = {
                gmail: gmail,
                otp: otp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            };
            console.log("Dữ liệu lưu vào database:", newItem);
            await gmail_otp.create(newItem);
            console.log(`Tạo mới bản ghi OTP cho email: ${gmail}`);
        }

        // Khởi tạo transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            },
        });//xlgmwbtldnwdkvkl

        // Import nodemailer-express-handlebars bằng dynamic import
        const { default: hbs } = await import('nodemailer-express-handlebars');

        // Cấu hình Handlebars
        const handlebarOptions = {
            viewEngine: {
                extName: ".hbs",
                partialsDir: path.resolve('./views'),
                defaultLayout: false,
            },
            viewPath: path.resolve('./views'),
            extName: ".hbs",
        };

        // Sử dụng Handlebars với transporter
        transporter.use('compile', hbs(handlebarOptions));

        // Tạo URL deep link
        //const deepLinkUrl = `https://yourdomain.com/deeplink?url=linkage://reset-password?otp=${otp}&email=${encodeURIComponent(gmail)}`;
        //const deepLinkUrl = `https://linkage.id.vn/deeplink?url=linkage`;

        // Cấu hình email
        const mailOptions = {
            from: "Linkage <thong442001@gmail.com>",
            to: gmail,
            subject: `${otp} là mã xác minh đăng ký`,
            template: 'email2',
            context: {
                title: 'Mã OTP xác minh đăng ký Linkage',
                text: `Mã OTP của bạn sẽ hết hạn sau 5 phút.`,
                otp: otp, // Truyền OTP vào template
                deepLink: deepLinkUrl, // Truyền deep link vào template
            },
            // attachments: [
            //     {
            //         // filename: 'Logo_app.png',
            //         // path: path.resolve('./images/Logo_app.png'), // Đường dẫn đến logo
            //         // cid: 'logo' // Content-ID để sử dụng trong template (src="cid:logo")
            //     }
            // ]
        };

        // Gửi email
        await transporter.sendMail(mailOptions);
        console.log("Gửi OTP qua email thành công");

        return {
            status: true,
            message: "Gửi OTP thành công",
            otp: otp,
        };
    } catch (error) {
        console.error("Lỗi gửi OTP qua email:", {
            message: error.message,
            stack: error.stack,
        });

        // Kiểm tra lỗi cụ thể liên quan đến đăng nhập Gmail
        if (error.message.includes("Invalid login")) {
            return {
                status: false,
                message: "Không thể đăng nhập vào Gmail. Vui lòng kiểm tra EMAIL_USER và EMAIL_PASS (có thể cần App Password).",
                error: error.message,
            };
        }

        return {
            status: false,
            message: "Gửi OTP thất bại",
            error: error.message,
        };
    }
};

// Hàm kiểm tra OTP
async function checkOtpDangKi(gmail, otp) {
    try {
        // Tìm số điện thoại trong DB
        const checkGmail = await gmail_otp.findOne({ gmail: gmail })

        if (!checkGmail) {
            return {
                status: false,
                message: "Không tìm thấy gmail",
            };
        }

        // Kiểm tra xem OTP có hết hạn không
        if (checkGmail.expiresAt < new Date()) {
            return {
                status: false,
                message: "OTP đã hết hạn",
            };
        }

        // Kiểm tra OTP
        if (checkGmail.otp !== otp) {
            return {
                status: false,
                message: "OTP không đúng",
            };
        }

        // Xác thực thành công, xóa OTP và thời gian hết hạn
        checkGmail.otp = null;
        checkGmail.expiresAt = null;
        await checkGmail.save();

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


async function sendOTP_quenMatKhau(gmail) {
    try {
        // Kiểm tra tham số gmail
        if (!gmail) {
            console.error("Tham số gmail là bắt buộc nhưng không được cung cấp");
            return {
                status: false,
                message: "Email là bắt buộc",
            };
        }

        // Kiểm tra định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(gmail)) {
            console.error(`Email không hợp lệ: ${gmail}`);
            return {
                status: false,
                message: "Email không hợp lệ",
            };
        }

        // Log thông tin đăng nhập (ẩn mật khẩu để bảo mật)
        console.log(`Sử dụng email: ${EMAIL_USER} để gửi OTP`);

        // Kiểm tra xem email đã tồn tại đăng kí chưa
        const checkUser = await user.findOne({ email: gmail })
        if (!checkUser) {
            // Nếu chưa tồn tại
            return {
                status: false,
                message: "Phone chưa đăng kí",
            };
        }

        // Tạo OTP ngẫu nhiên 4 chữ số
        const otp = generateOTP();
        console.log(`Tạo OTP: ${otp} cho email: ${gmail}`);

        // Kiểm tra và lưu OTP vào database
        let checkEmail = await gmail_otp.findOne({ gmail: gmail });

        if (checkEmail) {
            checkEmail.otp = otp;
            checkEmail.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút
            await checkEmail.save();
            console.log(`Cập nhật OTP cho email: ${gmail}`);
        } else {
            const newItem = {
                gmail: gmail,
                otp: otp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            };
            console.log("Dữ liệu lưu vào database:", newItem);
            await gmail_otp.create(newItem);
            console.log(`Tạo mới bản ghi OTP cho email: ${gmail}`);
        }

        // Khởi tạo transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            },
        });

        // Import nodemailer-express-handlebars bằng dynamic import
        const { default: hbs } = await import('nodemailer-express-handlebars');

        // Cấu hình Handlebars
        const handlebarOptions = {
            viewEngine: {
                extName: ".hbs",
                partialsDir: path.resolve('./views'),
                defaultLayout: false,
            },
            viewPath: path.resolve('./views'),
            extName: ".hbs",
        };

        // Sử dụng Handlebars với transporter
        transporter.use('compile', hbs(handlebarOptions));

        // Cấu hình email
        const mailOptions = {
            from: "Linkage <thong442001@gmail.com>",
            to: gmail,
            subject: `${otp} là mã xác minh đăng ký`,
            template: 'email2',
            context: {
                title: 'Mã OTP xác minh quên mật khẩu Linkage',
                text: `Mã OTP của bạn sẽ hết hạn sau 5 phút.`,
                otp: otp, // Truyền OTP vào template
            },
            // attachments: [
            //     {
            //         // filename: 'Logo_app.png',
            //         // path: path.resolve('./images/Logo_app.png'), // Đường dẫn đến logo
            //         // cid: 'logo' // Content-ID để sử dụng trong template (src="cid:logo")
            //     }
            // ]
        };

        // Gửi email
        await transporter.sendMail(mailOptions);
        console.log("Gửi OTP qua email thành công");

        return {
            status: true,
            message: "Gửi OTP thành công",
            otp: otp,
        };
    } catch (error) {
        console.error("Lỗi gửi OTP qua email:", {
            message: error.message,
            stack: error.stack,
        });

        // Kiểm tra lỗi cụ thể liên quan đến đăng nhập Gmail
        if (error.message.includes("Invalid login")) {
            return {
                status: false,
                message: "Không thể đăng nhập vào Gmail. Vui lòng kiểm tra EMAIL_USER và EMAIL_PASS (có thể cần App Password).",
                error: error.message,
            };
        }

        return {
            status: false,
            message: "Gửi OTP thất bại",
            error: error.message,
        };
    }
};