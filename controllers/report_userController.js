const report_user = require("../models/report_user");
const user = require("../models/user");

module.exports = {
    addReport_user,
    getAllReport_user,
    deleteReport_user,
}

async function addReport_user(me, ID_user) {
    try {

        const report = await report_user.findOne(
            { ID_user: ID_user, status: false } // Chỉ update nếu status = false
        );
        if (!report) {
            // tạo mới report_post
            const newItem = {
                reporters: [me],
                ID_user: ID_user,
                status: false,
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
        const reports = await report_user.find({ status: false })
            .sort({ createdAt: -1 })
            .lean();

        return reports; // Trả về danh sách thay vì `true`
    } catch (error) {
        console.error("Lỗi khi lấy danh sách báo cáo:", error);
        throw error;
    }
}


async function deleteReport_user(_id) {
    try {
        if (!_id) {
            throw new Error("Thiếu ID của report_user cần xóa.");
        }

        const deletedReport = await report_user.findByIdAndDelete(_id);

        if (!deletedReport) {
            console.warn(`Không tìm thấy báo cáo với ID: ${_id}`);
            return false; // Không tìm thấy report
        }

        console.log(`Đã xóa báo cáo với ID: ${_id}`);
        return true;
    } catch (error) {
        console.error("Lỗi khi xóa báo cáo:", error);
        throw error; // Ném lỗi để xử lý phía trên
    }
}

