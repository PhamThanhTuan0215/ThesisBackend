const Store_payment_info = require('../database/models/Store_payment_info');
const { uploadFiles, deleteFile } = require('../utils/manageFilesOnCloudinary.js');
const { Op } = require('sequelize');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const folderPathUpload = 'ecommerce-pharmacy/payment-qr';

// Middleware upload cho QR code
module.exports.uploadQRCode = upload.single('qr_code');

// Validate dữ liệu thanh toán
const validatePaymentData = (data, isCreate = false) => {
    const errors = [];

    if (isCreate) {
        if (!data.store_id) errors.push('store_id là bắt buộc');
        if (!data.method_type) errors.push('Loại phương thức thanh toán là bắt buộc');
        if (!data.account_number) errors.push('Số tài khoản/Số điện thoại là bắt buộc');
        if (!data.account_name) errors.push('Tên chủ tài khoản là bắt buộc');
    }

    if (data.method_type && !['bank_transfer', 'momo', 'zalopay'].includes(data.method_type)) {
        errors.push('Loại phương thức thanh toán không hợp lệ');
    }

    if (data.method_type === 'bank_transfer' && !data.bank_name) {
        errors.push('Tên ngân hàng là bắt buộc đối với phương thức chuyển khoản');
    }

    return errors;
};

// Tạo phương thức thanh toán mới
module.exports.createPaymentInfo = async (req, res) => {
    try {
        const paymentData = { ...req.body };

        // Validate dữ liệu
        const validationErrors = validatePaymentData(paymentData, true);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                code: 1,
                message: 'Dữ liệu không hợp lệ',
                errors: validationErrors
            });
        }

        // Upload QR code nếu có
        if (req.file) {
            const qrResult = await uploadFiles([req.file], folderPathUpload);
            paymentData.qr_code_url = qrResult[0].secure_url;
        }

        // Nếu là phương thức mặc định, cập nhật các phương thức khác thành không mặc định
        if (paymentData.is_default) {
            await Store_payment_info.update(
                { is_default: false },
                { where: { store_id: paymentData.store_id } }
            );
        }

        const paymentInfo = await Store_payment_info.create(paymentData);

        return res.status(201).json({
            code: 0,
            message: 'Tạo phương thức thanh toán thành công',
            data: paymentInfo
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Lấy thông tin một phương thức thanh toán
module.exports.getPaymentInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentInfo = await Store_payment_info.findByPk(id);

        if (!paymentInfo) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy phương thức thanh toán'
            });
        }

        return res.status(200).json({
            code: 0,
            message: 'Lấy thông tin phương thức thanh toán thành công',
            data: paymentInfo
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Lấy danh sách phương thức thanh toán của một cửa hàng
module.exports.getStorePaymentInfos = async (req, res) => {
    try {
        const { store_id } = req.params;
        const { method_type } = req.query;

        const whereClause = { store_id };
        if (method_type) {
            whereClause.method_type = method_type;
        }

        const paymentInfos = await Store_payment_info.findAll({
            where: whereClause,
            order: [
                ['is_default', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        return res.status(200).json({
            code: 0,
            message: 'Lấy danh sách phương thức thanh toán thành công',
            data: paymentInfos
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Cập nhật thông tin thanh toán
module.exports.updatePaymentInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Validate dữ liệu cập nhật
        const validationErrors = validatePaymentData(updateData, false);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                code: 1,
                message: 'Dữ liệu không hợp lệ',
                errors: validationErrors
            });
        }

        const paymentInfo = await Store_payment_info.findByPk(id);
        if (!paymentInfo) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy phương thức thanh toán'
            });
        }

        // Upload QR code mới nếu có
        if (req.file) {
            const qrResult = await uploadFiles([req.file], folderPathUpload);
            updateData.qr_code_url = qrResult[0].secure_url;

            // Xóa QR code cũ nếu có
            if (paymentInfo.qr_code_url) {
                const oldQRPublicId = paymentInfo.qr_code_url.split('/').pop().split('.')[0];
                await deleteFile(`${folderPathUpload}/${oldQRPublicId}`);
            }
        }

        // Nếu đang set làm mặc định
        if (updateData.is_default && !paymentInfo.is_default) {
            await Store_payment_info.update(
                { is_default: false },
                { where: { store_id: paymentInfo.store_id } }
            );
        }

        await paymentInfo.update(updateData);

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật thông tin thanh toán thành công',
            data: await paymentInfo.reload()
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Xóa phương thức thanh toán
module.exports.deletePaymentInfo = async (req, res) => {
    try {
        const { id } = req.params;

        const paymentInfo = await Store_payment_info.findByPk(id);
        if (!paymentInfo) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy phương thức thanh toán'
            });
        }

        // Không cho phép xóa nếu là phương thức mặc định và là phương thức duy nhất
        const countPaymentMethods = await Store_payment_info.count({
            where: { store_id: paymentInfo.store_id }
        });

        if (paymentInfo.is_default && countPaymentMethods === 1) {
            return res.status(400).json({
                code: 1,
                message: 'Không thể xóa phương thức thanh toán mặc định duy nhất'
            });
        }

        // Xóa QR code nếu có
        if (paymentInfo.qr_code_url) {
            const qrPublicId = paymentInfo.qr_code_url.split('/').pop().split('.')[0];
            await deleteFile(`${folderPathUpload}/${qrPublicId}`);
        }

        // Nếu xóa phương thức mặc định, set phương thức khác làm mặc định
        if (paymentInfo.is_default) {
            const anotherPayment = await Store_payment_info.findOne({
                where: {
                    store_id: paymentInfo.store_id,
                    id: { [Op.ne]: id }
                }
            });
            if (anotherPayment) {
                await anotherPayment.update({ is_default: true });
            }
        }

        await paymentInfo.destroy();

        return res.status(200).json({
            code: 0,
            message: 'Xóa phương thức thanh toán thành công'
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};
