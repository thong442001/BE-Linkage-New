const report_user = require("../models/report_user");
const user = require("../models/user");

module.exports = {
    addReport_user,
    getAllReport_user,
    banUser,
    unBanUser,
    getAllBanUser,
}

async function addReport_user(me, ID_user) {
    try {

        const report = await report_user.findOne(
            { ID_user: ID_user, status: false, _destroy: false, } // Chỉ update nếu status = false
        );
        if (!report) {
            // tạo mới report_post
            const newItem = {
                reporters: [me],
                ID_user: ID_user,
                status: false,
                _destroy: false,
            };
            await report_user.create(newItem);
        } else {
            // có rồi thì add me
            report.reporters.addToSet(me);
            await report.save();
        }

        return true; // Thành công
    } catch (error) {
        console.error("Lỗi khi báo cáo bài viết:", error);
        throw error; // Ném lỗi để xử lý phía trên
    }
}

async function getAllReport_user() {
    try {
        // Lấy danh sách report_user và populate dữ liệu cần thiết
        const reports = await report_user.find({ status: false, _destroy: false })
            .populate('reporters', 'first_name last_name avatar')
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
        // Lấy danh sách report_user và populate dữ liệu cần thiết
        const reports = await report_user.find({ status: true, _destroy: false })
            .populate('reporters', 'first_name last_name avatar')
            .populate({
                path: 'ID_user',
                select: '-__v' // Lấy tất cả các thuộc tính trừ __v
            })
            .sort({ "reporters.length": -1 })
            .lean();

        // Lọc bỏ những report mà ID_post không có hoặc không phải "Ban"
        const filtered_report_user_list = reports.filter(report => report.ID_user?.role === 0);

        return filtered_report_user_list; // Trả về danh sách thay vì `true`
    } catch (error) {
        console.error("Lỗi khi lấy danh sách báo cáo:", error);
        throw error;
    }
}

async function banUser(ID_report_user) {
    try {
        if (!ID_report_user) {
            throw new Error("Thiếu ID của report_user cần khóa.");
        }

        const report = await report_user.findById(ID_report_user);
        report.status = true;
        await report.save();

        const rUser = await user.findById(report.ID_user);
        rUser.role = 0; // 0 là tài khoản bị khóa
        await rUser.save();

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
        report._destroy = true;
        await report.save();

        const rUser = await user.findById(report.ID_user);
        rUser.role = 2; // 1 là tài khoản user
        await rUser.save();

        return true;

    } catch (error) {
        console.error("Lỗi khi xóa báo cáo:", error);
        throw error; // Ném lỗi để xử lý phía trên
    }
}