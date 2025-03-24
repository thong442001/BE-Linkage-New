const report_user = require("../models/report_user");
const user = require("../models/user");
const axios = require("axios");
const noti_token = require("../models/noti_token");
const notification = require("../models/notification");

module.exports = {
    addReport_user,
    getAllReport_userPending,
    setReportApproved,
    setReportRejected,
    unBanUser,
    getAllBanUser,
}

async function addReport_user(me, ID_user, ID_reason) {
    try {
        const report = await report_user.findOne(
            { ID_user: ID_user, status: 'pending' } // Chỉ update nếu status = 'pending'
        );
        if (!report) {
            // tạo mới report_post
            const newItem = {
                reports: [{
                    ID_reason: ID_reason,
                    reporters: [me],
                }],
                ID_post: ID_post,
                status: 'pending',
            };
            await report_user.create(newItem);
        } else {
            // Có rồi thì add me
            const existingReason = report.reports.find(
                r => r.ID_reason.toString() === ID_reason.toString()
            );

            if (existingReason) {
                // Nếu ID_reason đã tồn tại, thêm me vào reporters (nếu chưa có)
                if (!existingReason.reporters.includes(me)) {
                    existingReason.reporters.push(me);
                }
            } else {
                // Nếu ID_reason chưa tồn tại, thêm mới vào mảng reports
                report.reports.push({
                    ID_reason: ID_reason,
                    reporters: [me]
                });
            }

            await report.save();
        }

        return true; // Thành công
    } catch (error) {
        console.error("Lỗi khi báo cáo bài viết:", error);
        throw error; // Ném lỗi để xử lý phía trên
    }
}

async function getAllReport_userPending() {
    try {
        // Lấy danh sách report_user và populate dữ liệu cần thiết
        const reports = await report_user.find({ status: 'pending' })
            .populate({
                path: 'reports.ID_reason', // Populate ID_reason trong mảng reports
                select: 'reason_text'
            })
            .populate({
                path: 'reports.reporters', // Populate reporters trong mảng reports
                select: 'first_name last_name avatar'
            })
            .populate({
                path: 'ID_user',
                select: '-__v' // Lấy tất cả các thuộc tính trừ __v
            })
            .sort({ "reporters.length": -1 })
            .lean();

        return reports; // Trả về danh sách thay vì `true`
    } catch (error) {
        console.error("Lỗi khi lấy danh sách báo cáo:", error);
        throw error;
    }
}

async function getAllBanUser() {
    try {
        // Aggregation để lấy bản ghi mới nhất theo updatedAt cho mỗi ID_user
        const report_user_list = await report_user.aggregate([
            // Lọc các report có status là 'approved'
            { $match: { status: 'approved' } },
            // Sắp xếp theo updatedAt giảm dần (mới nhất trước)
            { $sort: { updatedAt: -1 } },
            // Nhóm theo ID_user, giữ bản ghi đầu tiên (mới nhất)
            {
                $group: {
                    _id: '$ID_user',
                    report: { $first: '$$ROOT' } // Lấy toàn bộ document mới nhất
                }
            },
            // Chuyển report thành document chính
            { $replaceRoot: { newRoot: '$report' } }
        ]);

        // Populate dữ liệu cần thiết
        const populated_report_user_list = await report_user.populate(report_user_list, [
            { path: 'reports.ID_reason', select: 'reason_text' },
            { path: 'reports.reporters', select: 'first_name last_name avatar' },
            {
                path: 'ID_user', select: '-__v' // Lấy tất cả các thuộc tính trừ __v
            },
        ]);
        // Lọc bỏ những report mà role user = 0
        const filtered_report_user_list = populated_report_user_list.filter(
            report => report.ID_user?.role === 0
        );

        return filtered_report_user_list; // Trả về danh sách thay vì `true`
    } catch (error) {
        console.error("Lỗi khi lấy danh sách báo cáo:", error);
        throw error;
    }
}

async function setReportApproved(ID_report_user) {
    try {
        if (!ID_report_user) {
            throw new Error("Thiếu ID của report_user cần khóa.");
        }

        const report = await report_user.findById(ID_report_user);
        report.status = 'approved';
        await report.save();

        const rUser = await user.findById(report.ID_user);
        rUser.role = 0; // 0 là tài khoản bị khóa
        await rUser.save();

        // Tạo notification
        const notificationItem = new notification({
            ID_user: rUser._id,
            type: 'Tài khoản bị khóa',
        });

        await notificationItem.save();

        // Gửi thông báo cho người nhận lời mời
        await guiThongBao(rUser._id, notificationItem._id);

        return true;

    } catch (error) {
        console.error("Lỗi khi xóa báo cáo:", error);
        throw error; // Ném lỗi để xử lý phía trên
    }
}

async function setReportRejected(ID_report_user) {
    try {
        if (!ID_report_user) {
            throw new Error("Thiếu ID của report_user cần khóa.");
        }

        const report = await report_user.findById(ID_report_user);
        report.status = 'rejected';
        await report.save();

        return true;

    } catch (error) {
        console.error("Lỗi khi xóa báo cáo:", error);
        throw error; // Ném lỗi để xử lý phía trên
    }
}

async function unBanUser(ID_report_user) {
    try {
        if (!ID_report_user) {
            throw new Error("Thiếu ID của report_user cần mở khóa.");
        }

        const report = await report_user.findById(ID_report_user);

        const rUser = await user.findById(report.ID_user);
        rUser.role = 2; // 1 là tài khoản user
        await rUser.save();

        return true;

    } catch (error) {
        console.error("Lỗi khi xóa báo cáo:", error);
        throw error; // Ném lỗi để xử lý phía trên
    }
}

// 🛠 Hàm gửi thông báo kết bạn
async function guiThongBao(ID_user, ID_noti) {
    try {

        const check_noti_token = await noti_token.findOne({ "ID_user": ID_user });
        if (!check_noti_token || !check_noti_token.tokens) return;

        await axios.post(
            //`http://localhost:3001/gg/send-notification`,
            `https://linkage.id.vn/gg/send-notification`,
            {
                fcmTokens: check_noti_token.tokens,
                title: "Thông báo",
                body: null,
                ID_noties: [ID_noti],
            },
        );
        return;
    } catch (error) {
        console.error("⚠️ Lỗi khi gửi thông báo FCM:", error.response?.data || error.message);
    }
}