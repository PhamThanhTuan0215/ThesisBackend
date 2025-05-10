const User = require('../database/models/User');
const Token = require('../database/models/Token');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendMail = require("../configs/sendMail.js")


const { uploadFiles, deleteFile } = require('../utils/manageFilesOnCloudinary')

const { Op } = require('sequelize');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const folderPathUpload = 'ecommerce-pharmacy/users'

// Middleware upload cho một ảnh duy nhất
module.exports.uploadSingle = upload.single('image');

module.exports.uploadCustom = upload.fields([
    { name: 'avatar', maxCount: 1 }
]);

module.exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                role: {
                    [Op.ne]: 'admin'
                }
            }
        });
        return res.status(200).json({code: 0, message: 'Lấy danh sách người dùng thành công', data: users});
    } catch (error) {
        return res.status(500).json({code: 2, message: 'Lỗi server', error: error.message});
    }
}

module.exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findOne({
            where: {
                id: id
            }
        });
        if (!user) {
            return res.status(404).json({code: 1, message: 'Không tìm thấy người dùng'});
        }
        return res.status(200).json({code: 0, message: 'Lấy thông tin người dùng thành công', data: user});
    } catch (error) {
        return res.status(500).json({code: 2, message: 'Lỗi server', error: error.message});
    }
}

module.exports.register = async (req, res) => {
    try {
        const { email, fullname, phone, password } = req.body;
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ code: 1, message: 'Email đã tồn tại' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            email,
            password: hashedPassword,
            fullname,
            phone
        });
        return res.status(201).json({ code: 0, message: 'Đăng ký thành công', data: newUser });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
}

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ code: 1, message: 'Email không tồn tại' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ code: 1, message: 'Tài khoản của bạn đã bị khóa' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ code: 1, message: 'Mật khẩu không đúng' });
        }

        const accessToken = jwt.sign(
            { id: user.id, type: 'access', role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { id: user.id, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            code: 0,
            message: 'Đăng nhập thành công',
            data: {
                user,
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
}

module.exports.updateUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, fullname, phone } = req.body;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy người dùng' });
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ code: 1, message: 'Email đã tồn tại' });
            }
        }

        await user.update({
            email: email || user.email,
            fullname: fullname || user.fullname,
            phone: phone || user.phone
        });

        return res.status(200).json({ code: 0, message: 'Cập nhật thông tin người dùng thành công', data: user });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
}

module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findOne({ where: { id } });
        if (!user) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy người dùng' });
        }

        await user.destroy();

        return res.status(200).json({ code: 0, message: 'Xóa người dùng thành công' });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
}

module.exports.activateUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ code: 1, message: 'Bạn không có quyền kích hoạt tài khoản' });
        }

        const user = await User.findOne({ where: { id } });
        if (!user) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy người dùng' });
        }

        if (user.status === 'active') {
            return res.status(400).json({ code: 1, message: 'Tài khoản đã được kích hoạt' });
        }

        await user.update({ status: 'active' });

        await sendMail({
            to: user.email,
            subject: 'Tài khoản của bạn đã được kích hoạt',
            text: `Xin chào ${user.fullname},\n\nTài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập và sử dụng dịch vụ ngay bây giờ.\n\nTrân trọng,\nĐội ngũ Ecommerce Pharmacy`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #4CAF50;">Tài khoản đã được kích hoạt</h2>
                    <p>Xin chào ${user.fullname},</p>
                    <p>Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập và sử dụng dịch vụ ngay bây giờ.</p>
                    <p>Trân trọng,<br>Đội ngũ Ecommerce Pharmacy</p>
                </div>
            `
        });

        return res.status(200).json({ code: 0, message: 'Kích hoạt tài khoản thành công', data: user });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
}

module.exports.deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ code: 1, message: 'Bạn không có quyền vô hiệu hóa tài khoản' });
        }

        const user = await User.findOne({ where: { id } });
        if (!user) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy người dùng' });
        }

        if (user.status === 'inactive') {
            return res.status(400).json({ code: 1, message: 'Tài khoản đã bị vô hiệu hóa' });
        }

        await user.update({ status: 'inactive' });

        await sendMail({
            to: user.email,
            subject: 'Tài khoản của bạn đã bị vô hiệu hóa',
            text: `Xin chào ${user.fullname},\n\nTài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ nếu bạn có thắc mắc.\n\nTrân trọng,\nĐội ngũ Ecommerce Pharmacy`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #4CAF50;">Tài khoản đã bị vô hiệu hóa</h2>
                    <p>Xin chào ${user.fullname},</p>
                    <p>Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ nếu bạn có thắc mắc.</p>
                    <p>Trân trọng,<br>Đội ngũ Ecommerce Pharmacy</p>
                </div>
            `
        });

        return res.status(200).json({ code: 0, message: 'Vô hiệu hóa tài khoản thành công', data: user });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
}

module.exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ code: 1, message: 'Không tìm thấy người dùng' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ code: 1, message: 'Mật khẩu cũ không đúng' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedNewPassword });

        await sendMail({
            to: user.email,
            subject: 'Mật khẩu của bạn đã được thay đổi',
            text: `Xin chào ${user.fullname},\n\nMật khẩu của bạn đã được thay đổi thành công. Nếu bạn không thực hiện thao tác này, vui lòng liên hệ hỗ trợ ngay.\n\nTrân trọng,\nĐội ngũ Ecommerce Pharmacy`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #4CAF50;">Mật khẩu đã được thay đổi</h2>
                    <p>Xin chào ${user.fullname},</p>
                    <p>Mật khẩu của bạn đã được thay đổi thành công. Nếu bạn không thực hiện thao tác này, vui lòng liên hệ hỗ trợ ngay.</p>
                    <p>Trân trọng,<br>Đội ngũ Ecommerce Pharmacy</p>
                </div>
            `
        });

        return res.status(200).json({ code: 0, message: 'Thay đổi mật khẩu thành công' });
    } catch (error) {
        return res.status(500).json({ code: 2, message: 'Lỗi server', error: error.message });
    }
}