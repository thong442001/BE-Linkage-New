const users = require("../models/user");
const noti_token = require('../models/noti_token');
const bcrypt = require('bcryptjs');
//token
const JWT = require('jsonwebtoken');
const config = require("../config");

module.exports = {
    getAllUsers,//user
    getUser,
    addUser,
    login,
    checkEmail,
    checkPhone,
    editNameOfUser,// edit
    editAvatarOfUser,// editAvatars
    editBackgroundOfUser,// editBackground
    editPasswordOfUser,// editPassword
    setNoti_token,
    loginAdmin,// login admin
    checkBanUser,
    editBioOfUser,// edit bio
    quenMatKhau_phone,// quên mật khẩu
    quenMatKhau_gmail,
    loginWeb,// login web
}
async function checkBanUser(ID_user) {
    try {
        const user = await users.findById(ID_user);
        if (user.role == 0) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function getAllUsers() {
    try {
        const result = await users.find();
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function getUser(ID_user) {
    try {
        const result = await users.findById(ID_user, "avatar first_name last_name");
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function addUser(first_name, last_name, dateOfBirth, sex, email, phone, password) {
    try {
        // Kiểm tra nếu cả email và phone đều trống hoặc null
        if ((!email || email.trim() === '') && (!phone || phone.trim() === '')) {
            return false;  // Trả về false nếu cả hai đều trống
        }

        // Mã hóa mật khẩu
        var hashPass = bcrypt.hashSync(password, 10);

        // Tạo đối tượng người dùng mới
        const newItem = {
            first_name,
            last_name,
            dateOfBirth,
            sex,
            email: email || null,  // Nếu email trống, set là null
            phone: phone || null,  // Nếu phone trống, set là null
            password: hashPass,
            role: 2,
        };

        // Lưu người dùng vào cơ sở dữ liệu
        await users.create(newItem);
        return true;  // Đăng ký thành công
    } catch (error) {
        console.log(error);
        return false;  // Xử lý lỗi
    }
}

async function login(email, phone, password, fcmToken) {
    try {
        //check email
        const check_username = await users.findOne({ "email": email });

        if (check_username) {
            if (check_username.role == 2) {
                const ssPassword1 = bcrypt.compareSync(password, check_username.password);
                if (ssPassword1) {
                    //token
                    const token = JWT.sign({ id: check_username._id, data: "data ne" }, config.SECRETKEY, { expiresIn: '1d' });
                    const refreshToken = JWT.sign({ id: check_username._id }, config.SECRETKEY, { expiresIn: '1y' })
                    // check noti_token của user
                    const check_noti_token = await noti_token.findOne({ "ID_user": check_username._id })
                    if (check_noti_token) {
                        // check fcmToken đã có chưa 
                        // chưa có thì add thêm vào
                        if (!check_noti_token.tokens.includes(fcmToken)) {
                            // Đảm bảo tokens luôn là một mảng
                            if (!Array.isArray(check_noti_token.tokens)) {
                                check_noti_token.tokens = [];
                            }
                            check_noti_token.tokens.push(fcmToken);
                            await check_noti_token.save();
                        }
                    } else {
                        // chưa có thì tạo mới
                        const newItem = {
                            ID_user: check_username._id,
                            tokens: [fcmToken],
                        };
                        await noti_token.create(newItem);
                    }
                    //res.status(200).json({ "status": true, "user": check_username, token: token, refreshToken: refreshToken });
                    return { "status": 200, "user": check_username, token: token, refreshToken: refreshToken };
                } else {
                    //res.status(401).json({ "status": false, "message": "sai mật khẩu" });
                    return { "status": 402, "message": "sai mật khẩu" };
                }
            } else if (check_username.role == 1) {
                return { "status": 403, "message": "Tài khoản admin không thể vào app" };
            } else if (check_username.role == 0) {
                return { "status": 404, "message": "Tài khoản này đã bị khóa" };
            }
        } else {
            //check phone
            const check_phone = await users.findOne({ "phone": phone });
            if (check_phone) {
                if (check_phone.role == 2) {
                    const ssPassword2 = bcrypt.compareSync(password, check_phone.password);
                    if (ssPassword2) {
                        //token
                        const token = JWT.sign({ id: check_phone._id, data: "data ne" }, config.SECRETKEY, { expiresIn: '1d' });
                        const refreshToken = JWT.sign({ id: check_phone._id }, config.SECRETKEY, { expiresIn: '1y' })
                        //res.status(200).json({ "status": true, "user": check_username, token: token, refreshToken: refreshToken });
                        // check noti_token của user
                        const check_noti_token = await noti_token.findOne({ "ID_user": check_phone._id })
                        if (check_noti_token) {
                            // check fcmToken đã có chưa 
                            // chưa có thì add thêm vào
                            if (!check_noti_token.tokens.includes(fcmToken)) {
                                // Đảm bảo tokens luôn là một mảng
                                if (!Array.isArray(check_noti_token.tokens)) {
                                    check_noti_token.tokens = [];
                                }
                                check_noti_token.tokens.push(fcmToken);
                                await check_noti_token.save();
                            }
                        } else {
                            const newItem = {
                                ID_user: check_phone._id,
                                tokens: [fcmToken],
                            };
                            await noti_token.create(newItem);
                        }
                        return { "status": 200, "user": check_phone, token: token, refreshToken: refreshToken };
                    } else {
                        //res.status(401).json({ "status": false, "message": "sai mật khẩu" });
                        return { "status": 402, "message": "sai mật khẩu" };
                    }
                } else if (check_phone.role == 1) {
                    return { "status": 403, "message": "Tài khoản admin không thể vào app" };
                } else if (check_phone.role == 0) {
                    return { "status": 404, "message": "Tài khoản này đã bị khóa" };
                }
            }
            // phone và email ko có
            return { "status": 401, "message": "sai email hoặc phone" };
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// login admin
async function loginAdmin(email, phone, password) {
    try {
        //check email
        const check_username = await users.findOne({ "email": email });

        if (check_username) {
            const ssPassword1 = bcrypt.compareSync(password, check_username.password);
            if (ssPassword1) {
                //token
                const token = JWT.sign({ id: check_username._id, data: "data ne" }, config.SECRETKEY, { expiresIn: '1d' });
                const refreshToken = JWT.sign({ id: check_username._id }, config.SECRETKEY, { expiresIn: '1y' })
                if (check_username.role == 1) {
                    //res.status(200).json({ "status": true, "user": check_username, token: token, refreshToken: refreshToken });
                    return { "status": 200, "user": check_username, token: token, refreshToken: refreshToken };
                } else {
                    //res.status(200).json({ "status": true, "user": check_username, token: token, refreshToken: refreshToken });
                    return { "status": 402, "message": "Không phải tài khoản Admin" };
                }
            } else {
                //res.status(401).json({ "status": false, "message": "sai mật khẩu" });
                return { "status": 402, "message": "sai mật khẩu" };
            }
        } else {
            //check phone
            const check_phone = await users.findOne({ "phone": phone });
            if (check_phone) {
                const ssPassword2 = bcrypt.compareSync(password, check_phone.password);
                if (ssPassword2) {
                    //token
                    const token = JWT.sign({ id: check_phone._id, data: "data ne" }, config.SECRETKEY, { expiresIn: '1d' });
                    const refreshToken = JWT.sign({ id: check_phone._id }, config.SECRETKEY, { expiresIn: '1y' })
                    if (check_phone.role == 1) {
                        //res.status(200).json({ "status": true, "user": check_username, token: token, refreshToken: refreshToken });
                        return { "status": 200, "user": check_phone, token: token, refreshToken: refreshToken };
                    } else {
                        //res.status(200).json({ "status": true, "user": check_username, token: token, refreshToken: refreshToken });
                        return { "status": 402, "message": "Không phải tài khoản Admin" };
                    }
                } else {
                    //res.status(401).json({ "status": false, "message": "sai mật khẩu" });
                    return { "status": 402, "message": "sai mật khẩu" };
                }
            }
            // phone và email ko có
            return { "status": 401, "message": "sai email hoặc phone" };
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function editNameOfUser(ID_user, first_name, last_name) {
    try {
        const editUser = await users.findById(ID_user);
        // null là ko tìm thấy
        if (editUser) {
            editUser.first_name = first_name
                ? first_name
                : editUser.first_name;
            editUser.last_name = last_name
                ? last_name
                : editUser.last_name;
            await editUser.save();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function editAvatarOfUser(ID_user, avatar) {
    try {
        const editUser = await users.findById(ID_user);
        // null là ko tìm thấy
        if (editUser) {
            editUser.avatar = avatar
                ? avatar
                : editUser.avatar;
            await editUser.save();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function editBackgroundOfUser(ID_user, background) {
    try {
        const editUser = await users.findById(ID_user);
        // null là ko tìm thấy
        if (editUser) {
            editUser.background = background
                ? background
                : editUser.background;
            await editUser.save();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function editPasswordOfUser(ID_user, passwordOLd, passwordNew) {
    try {
        const editUser = await users.findById(ID_user);
        // null là ko tìm thấy
        if (editUser) {
            const checkPasswordOld = bcrypt.compareSync(passwordOLd, editUser.password);
            if (checkPasswordOld) {
                // Mã hóa mật khẩu
                var hashPass = bcrypt.hashSync(passwordNew, 10);
                editUser.password = hashPass
                await editUser.save();
                return true;
            } else {
                return false;
            }

        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function checkEmail(email) {
    try {
        const check_email = await users.findOne({ "email": email });
        if (check_email) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function checkPhone(phone) {
    try {
        const check_phone = await users.findOne({ "phone": phone });
        if (check_phone) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function setNoti_token(ID_user, fcmToken) {
    try {
        const result = await noti_token.findOne({ "ID_user": ID_user });
        if (result) {
            // result.token = null;
            // await result.save();

            // Xóa token cụ thể nếu nó tồn tại
            result.tokens = result.tokens.filter(token => token !== fcmToken);
            // Đảm bảo `tokens` luôn là một mảng
            if (!Array.isArray(result.tokens)) {
                result.tokens = [];
            }
            // Lưu lại mảng mới (dù rỗng)
            await result.save();
            console.log("✅ Token đã được xóa:", result);
        }
        return true;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function editBioOfUser(ID_user, bio) {
    try {
        const editUser = await users.findById(ID_user);
        // null là ko tìm thấy
        if (editUser) {
            editUser.bio = bio
                ? bio
                : editUser.bio;
            await editUser.save();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}


async function quenMatKhau_phone(phone, passwordNew) {
    try {
        const editUser = await users.findOne({ phone: phone });
        // null là ko tìm thấy
        if (editUser) {
            var hashPass = bcrypt.hashSync(passwordNew, 10);
            editUser.password = hashPass
            await editUser.save();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function quenMatKhau_gmail(gmail, passwordNew) {
    try {
        const editUser = await users.findOne({ email: gmail });
        // null là ko tìm thấy
        if (editUser) {
            var hashPass = bcrypt.hashSync(passwordNew, 10);
            editUser.password = hashPass
            await editUser.save();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function loginWeb(email, phone, password) {
    try {
        //check email
        const check_username = await users.findOne({ "email": email });

        if (check_username) {
            if (check_username.role == 2) {
                const ssPassword1 = bcrypt.compareSync(password, check_username.password);
                if (ssPassword1) {
                    //token
                    const token = JWT.sign({ id: check_username._id, data: "data ne" }, config.SECRETKEY, { expiresIn: '1d' });
                    const refreshToken = JWT.sign({ id: check_username._id }, config.SECRETKEY, { expiresIn: '1y' })
                    // check noti_token của user
                    // const check_noti_token = await noti_token.findOne({ "ID_user": check_username._id })
                    // if (check_noti_token) {
                    //     // check fcmToken đã có chưa 
                    //     // chưa có thì add thêm vào
                    //     if (!check_noti_token.tokens.includes(fcmToken)) {
                    //         // Đảm bảo tokens luôn là một mảng
                    //         if (!Array.isArray(check_noti_token.tokens)) {
                    //             check_noti_token.tokens = [];
                    //         }
                    //         check_noti_token.tokens.push(fcmToken);
                    //         await check_noti_token.save();
                    //     }
                    // } else {
                    //     // chưa có thì tạo mới
                    //     const newItem = {
                    //         ID_user: check_username._id,
                    //         tokens: [fcmToken],
                    //     };
                    //     await noti_token.create(newItem);
                    // }
                    //res.status(200).json({ "status": true, "user": check_username, token: token, refreshToken: refreshToken });
                    return { "status": 200, "user": check_username, token: token, refreshToken: refreshToken };
                } else {
                    //res.status(401).json({ "status": false, "message": "sai mật khẩu" });
                    return { "status": 402, "message": "sai mật khẩu" };
                }
            } else if (check_username.role == 1) {
                return { "status": 403, "message": "Tài khoản admin không thể vào app" };
            } else if (check_username.role == 0) {
                return { "status": 404, "message": "Tài khoản này đã bị khóa" };
            }
        } else {
            //check phone
            const check_phone = await users.findOne({ "phone": phone });
            if (check_phone) {
                if (check_phone.role == 2) {
                    const ssPassword2 = bcrypt.compareSync(password, check_phone.password);
                    if (ssPassword2) {
                        //token
                        const token = JWT.sign({ id: check_phone._id, data: "data ne" }, config.SECRETKEY, { expiresIn: '1d' });
                        const refreshToken = JWT.sign({ id: check_phone._id }, config.SECRETKEY, { expiresIn: '1y' })
                        //res.status(200).json({ "status": true, "user": check_username, token: token, refreshToken: refreshToken });
                        // check noti_token của user
                        // const check_noti_token = await noti_token.findOne({ "ID_user": check_phone._id })
                        // if (check_noti_token) {
                        //     // check fcmToken đã có chưa 
                        //     // chưa có thì add thêm vào
                        //     if (!check_noti_token.tokens.includes(fcmToken)) {
                        //         // Đảm bảo tokens luôn là một mảng
                        //         if (!Array.isArray(check_noti_token.tokens)) {
                        //             check_noti_token.tokens = [];
                        //         }
                        //         check_noti_token.tokens.push(fcmToken);
                        //         await check_noti_token.save();
                        //     }
                        // } else {
                        //     const newItem = {
                        //         ID_user: check_phone._id,
                        //         tokens: [fcmToken],
                        //     };
                        //     await noti_token.create(newItem);
                        // }
                        return { "status": 200, "user": check_phone, token: token, refreshToken: refreshToken };
                    } else {
                        //res.status(401).json({ "status": false, "message": "sai mật khẩu" });
                        return { "status": 402, "message": "sai mật khẩu" };
                    }
                } else if (check_phone.role == 1) {
                    return { "status": 403, "message": "Tài khoản admin không thể vào app" };
                } else if (check_phone.role == 0) {
                    return { "status": 404, "message": "Tài khoản này đã bị khóa" };
                }
            }
            // phone và email ko có
            return { "status": 401, "message": "sai email hoặc phone" };
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}