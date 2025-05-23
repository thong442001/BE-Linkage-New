var express = require('express');
var router = express.Router();

const groupController = require("../controllers/groupController")

//checkToken
const checkToken = require("./checkToken");

//add  
//http://localhost:3000/group/joinGroupPrivate
router.post('/joinGroupPrivate', checkToken, async function (req, res, next) {
  try {
    const { user1, user2 } = req.body;
    //console.log("....T...");
    if (!user1 || !user2) {
      //console.log("....1...");
      return res.status(401).json({ "status": false, message: "Thiếu thông tin user" });
    }
    //check group đã tồn tại chưa
    const groupOld = await groupController.findGroupPrivate(user1, user2);
    if (groupOld != false) {
      //console.log("....2...");
      return res.status(200).json({ "status": true, message: "Nhóm đã tồn tại", ID_group: groupOld._id });
    } else {
      //console.log("....3...");
      const newGroupPrivate = await groupController.addGroupPrivate(user1, user2);
      return res.status(201).json({ "status": true, message: "tạo groupPrivate mới thành công", ID_group: newGroupPrivate._id });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});
//http://localhost:3000/group/joinGroupPrivate
router.post('/addGroup', checkToken, async function (req, res, next) {
  try {
    const { name, members } = req.body;
    const group = await groupController.addGroup(name, members);
    if (group) {
      res.status(200).json({ "status": true, "message": "tạo nhóm thành công", "group": group });
    } else {
      res.status(401).json({ "status": false, "message": "tạo nhóm không thành công" });
    }

  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// http://localhost:3000/group/getGroupID
router.get('/getGroupID', checkToken, async function (req, res, next) {
  try {
    const { ID_group } = req.query;
    const group = await groupController.getGroupID(ID_group);
    if (group != null) {
      res.status(200).json({ "status": true, "group": group });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

// http://localhost:3000/group/getAllGroupOfUser
router.get('/getAllGroupOfUser', checkToken, async function (req, res, next) {
  try {
    const { ID_user } = req.query;
    const groups = await groupController.getAllGroupOfUser(ID_user);
    res.status(200).json({ "status": true, "groups": groups });
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});

//http://localhost:3000/group/addMembers
router.post('/addMembers', checkToken, async function (req, res, next) {
  try {
    const { ID_group, new_members } = req.body;
    const result = await groupController.addMembers(ID_group, new_members);
    if (result) {
      res.status(200).json({
        "status": true,
        message: "Thêm thành viên thành công!"
      });
    } else {
      res.status(401).json({
        "status": false,
        message: "Người dùng đã có trong nhóm hoặc nhóm không tồn tại."
      });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/group/deleteMember
router.post('/deleteMember', checkToken, async function (req, res, next) {
  try {
    const { ID_group, ID_user } = req.body;
    const result = await groupController.deleteMember(ID_group, ID_user);
    if (result) {
      return res.status(200).json({ "status": result, message: "thành công" });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/group/passKey
router.post('/passKey', checkToken, async function (req, res, next) {
  try {
    const { ID_group, oldAdmin, newAdmin } = req.body;
    const result = await groupController.passKey(ID_group, oldAdmin, newAdmin);
    if (result) {
      return res.status(200).json({ "status": result, message: "thành công" });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/group/deleteGroup
router.post('/deleteGroup', checkToken, async function (req, res, next) {
  try {
    const { ID_group } = req.body;
    const result = await groupController.deleteGroup(ID_group);
    if (result) {
      return res.status(200).json({ "status": result, message: "thành công" });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/group/editAvtNameGroup
router.post('/editAvtNameGroup', checkToken, async function (req, res, next) {
  try {
    const { ID_group, avatar, name } = req.body;
    const result = await groupController.editAvtNameGroup(ID_group, avatar, name);
    if (result) {
      return res.status(200).json({ "status": result, message: "thành công" });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/group/notiCallVideo
router.post('/notiCallVideo', checkToken, async function (req, res, next) {
  try {
    const { ID_group, ID_user, isCallVideo } = req.body;
    const result = await groupController.notiCallVideo(ID_group, ID_user, isCallVideo);
    if (result) {
      //console.log("....2...");
      return res.status(200).json({ "status": true, message: "Thông báo thành công" });
    } else {
      return res.status(4001).json({ "status": false, message: "Không tìm thấy ID_group hoặc không tìm thấy các members khác" });
    }
  } catch (e) {
    return res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

module.exports = router;
