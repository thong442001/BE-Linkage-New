const users = require("../models/user");
const bcrypt = require('bcryptjs');
//token
const JWT = require('jsonwebtoken');
const config = require("../config");

const postController = require("../controllers/postController")
const noti_token = require('../models/noti_token');

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
        const result = await users.findById(ID_user);
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
            const ssPassword1 = bcrypt.compareSync(password, check_username.password);
            if (ssPassword1) {
                //token
                const token = JWT.sign({ id: check_username._id, data: "data ne" }, config.SECRETKEY, { expiresIn: '1d' });
                const refreshToken = JWT.sign({ id: check_username._id }, config.SECRETKEY, { expiresIn: '1y' })
                // check noti_token của user
                const check_noti_token = await noti_token.findOne({ "ID_user": check_username._id })
                if (check_noti_token) {
                    check_noti_token.token = fcmToken;
                    await check_noti_token.save();
                } else {
                    const newItem = {
                        ID_user: check_username._id,
                        token: fcmToken,
                    };
                    await noti_token.create(newItem);
                }
                //res.status(200).json({ "status": true, "user": check_username, token: token, refreshToken: refreshToken });
                return { "status": 200, "user": check_username, token: token, refreshToken: refreshToken };
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
                    //res.status(200).json({ "status": true, "user": check_username, token: token, refreshToken: refreshToken });
                    // check noti_token của user
                    const check_noti_token = await noti_token.findOne({ "ID_user": check_username._id })
                    if (check_noti_token) {
                        check_noti_token.token = fcmToken;
                        await check_noti_token.save();
                    } else {
                        const newItem = {
                            ID_user: check_username._id,
                            token: fcmToken,
                        };
                        await noti_token.create(newItem);
                    }
                    return { "status": 200, "user": check_phone, token: token, refreshToken: refreshToken };
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
// async function loginWeb(body) {
//     try {
//         const { email, password } = body;
//         const check_username = await users.findOne({ "email": email });

//         if (check_username) {
//             const ssPassword = bcrypt.compareSync(password, check_username.password);
//             if (ssPassword) {
//                 //check role
//                 if (check_username.role == 1 || check_username.role == 2) {
//                     //token
//                     const token = JWT.sign({ email: email, data: "data ne" }, config.SECRETKEY, { expiresIn: '60s' });
//                     const refreshToken = JWT.sign({ email: email }, config.SECRETKEY, { expiresIn: '1d' })

//                     //res.status(200).json({ "status": true, "user": check_username, token: token, refreshToken: refreshToken });
//                     return { "status": 200, "user": check_username, token: token, refreshToken: refreshToken };
//                 } else {
//                     return { "status": 403, "message": "Tạo khoản không phải admin hoặc manage" };
//                 }
//             } else {
//                 //res.status(401).json({ "status": false, "message": "sai mật khẩu" });
//                 return { "status": 402, "message": "sai mật khẩu" };
//             }
//         } else {
//             //res.status(402).json({ "status": false, "message": "sai tài khoản " });
//             return { "status": 401, "message": "sai tài khoản" };
//         }
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }

// async function deleteUser(body) {
//     try {
//         const { email } = body;
//         const result = await users.findOneAndDelete({ "email": email });
//         return result;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }


// *********** chung *****************

// async function checkUserId(userId) {
//     try {
//         const check_id = await users.findById(userId);
//         if (check_id) {
//             return true;
//         }
//         return false;
//     } catch (error) {
//         console.log(error);
//         return false;
//     }
// }

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

// async function addPostUser(userId, postId) {
//     try {
//         const itemEdit = await users.findById(userId);
//         if (itemEdit) {
//             //add post new vào posts của user
//             //const postsNew = await itemEdit.posts.push() 
//             itemEdit.posts.push(postId)
//             await itemEdit.save();
//         }
//         return itemEdit;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }

// async function addFriendNotificationInUser(to, friendNotificationId) {
//     try {
//         const itemEdit = await users.findById(to);
//         if (itemEdit) {
//             //add friendNotification new vào friendNotifications của user
//             itemEdit.friendNotifications.push(friendNotificationId)
//             await itemEdit.save();
//         }
//         return itemEdit;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }

// async function deletePostUser(userId, id) {
//     try {
//         const itemEdit = await users.findById(userId);
//         if (itemEdit) {
//             // xóa post trong user
//             const postsNew = await itemEdit.posts.filter(post => post.toString() != id);
//             itemEdit.posts = postsNew;
//             await itemEdit.save();
//             //console.log(postsNew);
//             return true;
//         }
//         return false;
//     } catch (error) {
//         console.log(error);
//         return false;
//     }
// }

// async function deleteFriendNotificationInUser(userId, friendNotificationId) {
//     try {
//         const itemEdit = await users.findById(userId);
//         if (itemEdit) {
//             // xóa friendNotification trong user
//             const friendNotificationsNew = await itemEdit.friendNotifications.filter(post => post.toString() != friendNotificationId);
//             itemEdit.friendNotifications = friendNotificationsNew;
//             await itemEdit.save();
//             return true;
//         }
//         return false;
//     } catch (error) {
//         console.log(error);
//         return false;
//     }
// }

// async function getNameAndAvatar(userId) {
//     try {
//         const check_id = await users.findById(userId);
//         if (check_id) {
//             return { "displayName": check_id.displayName, "avatar": check_id.avatar };
//         } else {
//             return null;
//         }
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }

// async function getFriendsInUser(userId) {
//     try {
//         const friends = await users.findById(userId, " friends ");
//         if (friends) {
//             return friends.friends;
//         }
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }

// async function addFriendInUser(userId, friendId) {
//     try {
//         const itemEdit = await users.findById(userId);
//         if (itemEdit) {
//             itemEdit.friends.push(friendId)
//             await itemEdit.save();
//         }
//         return itemEdit;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }

// async function checkFriend(form, to,) {
//     try {
//         const check = await users.find({""});
//         if (check) {
//             return true;
//         }
//         return false;
//     } catch (error) {
//         console.log(error);
//         return false;
//     }
// }