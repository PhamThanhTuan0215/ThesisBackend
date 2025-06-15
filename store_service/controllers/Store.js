const Store = require('../database/models/Store');
const sendMail = require("../configs/sendMail.js")


const { uploadFiles, deleteFile } = require('../utils/manageFilesOnCloudinary.js')

const { Op } = require('sequelize');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const folderPathUpload = 'ecommerce-pharmacy/stores'

// Middleware upload cho avatar
module.exports.uploadAvatar = upload.single('avatar');

// Middleware upload cho banner
module.exports.uploadBanner = upload.single('banner');

// Middleware upload cho license
module.exports.uploadLicense = upload.single('license');

// Middleware upload cho nhiều ảnh
module.exports.uploadMultiple = upload.array('images', 10); // tối đa 10

module.exports.uploadCustom = upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'license', maxCount: 1 }
]);


// Validate dữ liệu cửa hàng
const validateStoreData = (data, isCreate = false) => {
    const errors = [];

    if (isCreate) {
        if (!data.owner_id) errors.push('owner_id là bắt buộc');
    }

    if (isCreate || data.name) {
        if (!data.name || data.name.trim().length < 3) {
            errors.push('Tên cửa hàng phải có ít nhất 3 ký tự');
        }
    }

    if (isCreate || data.phone) {
        if (!data.phone || !/^[0-9]{10}$/.test(data.phone)) {
            errors.push('Số điện thoại không hợp lệ');
        }
    }

    if (isCreate || data.email) {
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Email không hợp lệ');
        }
    }

    if (isCreate) {
        if (!data.address_line) errors.push('Địa chỉ là bắt buộc');
        if (!data.ward) errors.push('Phường/Xã là bắt buộc');
        if (!data.district) errors.push('Quận/Huyện là bắt buộc');
        if (!data.city) errors.push('Tỉnh/Thành phố là bắt buộc');
    }

    return errors;
};

// Tạo cửa hàng mới
module.exports.createStore = async (req, res) => {
    try {
        const storeData = { ...req.body };

        // Validate dữ liệu
        const validationErrors = validateStoreData(storeData, true);
        if (!req.files?.license) {
            validationErrors.push('Giấy phép kinh doanh là bắt buộc');
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                code: 1,
                message: 'Dữ liệu không hợp lệ',
                errors: validationErrors
            });
        }

        // Upload ảnh lên Cloudinary
        let avatar_url = null;
        let banner_url = null;
        let license_url = null;

        if (req.files) {
            if (req.files.avatar) {
                const avatarResult = await uploadFiles([req.files.avatar[0]], `${folderPathUpload}/avatars`);
                avatar_url = avatarResult[0].secure_url;
            }
            if (req.files.banner) {
                const bannerResult = await uploadFiles([req.files.banner[0]], `${folderPathUpload}/banners`);
                banner_url = bannerResult[0].secure_url;
            }
            if (req.files.license) {
                const licenseResult = await uploadFiles([req.files.license[0]], `${folderPathUpload}/licenses`);
                license_url = licenseResult[0].secure_url;
            }
        }

        const store = await Store.create({
            ...storeData,
            avatar_url,
            banner_url,
            license_url,
            status: 'pending'
        });

        return res.status(201).json({
            code: 0,
            message: 'Tạo cửa hàng thành công',
            data: store
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Lấy thông tin một cửa hàng
module.exports.getStore = async (req, res) => {
    try {
        const { id } = req.params;
        const store = await Store.findByPk(id);

        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        return res.status(200).json({
            code: 0,
            message: 'Lấy thông tin cửa hàng thành công',
            data: store
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Lấy danh sách cửa hàng
module.exports.getAllStores = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }

        const stores = await Store.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            code: 0,
            message: 'Lấy danh sách cửa hàng thành công',
            data: {
                stores: stores.rows,
                total: stores.count,
                totalPages: Math.ceil(stores.count / limit),
                currentPage: parseInt(page)
            }
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Lấy danh sách cửa hàng với danh sách store_id
module.exports.getStoresByIds = async (req, res) => {
    try {
        const { store_ids } = req.body;
        
        const stores = await Store.findAll({
            where: {
                id: {
                    [Op.in]: store_ids
                }
            }
        });

        return res.status(200).json({
            code: 0,
            message: 'Lấy danh sách cửa hàng thành công',
            data: stores
        });
    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Cập nhật thông tin cửa hàng (không bao gồm ảnh)
module.exports.updateStore = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Loại bỏ các trường không được phép update qua route này
        delete updateData.status;
        delete updateData.avatar_url;
        delete updateData.banner_url;
        delete updateData.license_url;

        // Validate dữ liệu cập nhật
        const validationErrors = validateStoreData(updateData, false);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                code: 1,
                message: 'Dữ liệu không hợp lệ',
                errors: validationErrors
            });
        }

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        await store.update(updateData);

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật thông tin cửa hàng thành công',
            data: await store.reload()
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Cập nhật trạng thái cửa hàng
module.exports.updateStoreStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'active', 'suspended', 'rejected'].includes(status)) {
            return res.status(400).json({
                code: 1,
                message: 'Trạng thái không hợp lệ'
            });
        }

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        await store.update({ status });

        // Gửi email thông báo khi trạng thái thay đổi
        await sendMail({
            to: store.email,
            subject: 'Thông báo trạng thái cửa hàng',
            html: `
                <h2>Thông báo về trạng thái cửa hàng ${store.name}</h2>
                <p>Trạng thái cửa hàng của bạn đã được cập nhật thành: <strong>${status}</strong></p>
                <p>Vui lòng đăng nhập vào hệ thống để biết thêm chi tiết.</p>
            `
        });

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật trạng thái cửa hàng thành công',
            data: await store.reload()
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Xóa cửa hàng
module.exports.deleteStore = async (req, res) => {
    try {
        const { id } = req.params;

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        // Xóa các ảnh trên Cloudinary
        if (store.avatar_url) {
            const avatarPublicId = store.avatar_url.split('/').pop().split('.')[0];
            await deleteFile(`${folderPathUpload}/avatars/${avatarPublicId}`);
        }
        if (store.banner_url) {
            const bannerPublicId = store.banner_url.split('/').pop().split('.')[0];
            await deleteFile(`${folderPathUpload}/banners/${bannerPublicId}`);
        }
        if (store.license_url) {
            const licensePublicId = store.license_url.split('/').pop().split('.')[0];
            await deleteFile(`${folderPathUpload}/licenses/${licensePublicId}`);
        }

        await store.destroy();

        return res.status(200).json({
            code: 0,
            message: 'Xóa cửa hàng thành công'
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Cập nhật avatar của cửa hàng
module.exports.updateStoreAvatar = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                code: 1,
                message: 'Vui lòng upload ảnh avatar'
            });
        }

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        // Upload ảnh mới
        const avatarResult = await uploadFiles([req.file], `${folderPathUpload}/avatars`);
        const avatar_url = avatarResult[0].secure_url;

        // Xóa ảnh cũ nếu có
        if (store.avatar_url) {
            const oldAvatarPublicId = store.avatar_url.split('/').pop().split('.')[0];
            await deleteFile(`${folderPathUpload}/avatars/${oldAvatarPublicId}`);
        }

        await store.update({ avatar_url });

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật avatar thành công',
            data: await store.reload()
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Cập nhật banner của cửa hàng
module.exports.updateStoreBanner = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                code: 1,
                message: 'Vui lòng upload ảnh banner'
            });
        }

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        // Upload ảnh mới
        const bannerResult = await uploadFiles([req.file], `${folderPathUpload}/banners`);
        const banner_url = bannerResult[0].secure_url;

        // Xóa ảnh cũ nếu có
        if (store.banner_url) {
            const oldBannerPublicId = store.banner_url.split('/').pop().split('.')[0];
            await deleteFile(`${folderPathUpload}/banners/${oldBannerPublicId}`);
        }

        await store.update({ banner_url });

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật banner thành công',
            data: await store.reload()
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Cập nhật giấy phép của cửa hàng
module.exports.updateStoreLicense = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                code: 1,
                message: 'Vui lòng upload ảnh giấy phép'
            });
        }

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        // Upload ảnh mới
        const licenseResult = await uploadFiles([req.file], `${folderPathUpload}/licenses`);
        const license_url = licenseResult[0].secure_url;

        // Xóa ảnh cũ nếu có
        if (store.license_url) {
            const oldLicensePublicId = store.license_url.split('/').pop().split('.')[0];
            await deleteFile(`${folderPathUpload}/licenses/${oldLicensePublicId}`);
        }

        await store.update({ license_url });

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật giấy phép thành công',
            data: await store.reload()
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Cập nhật balance của cửa hàng
module.exports.updateStoreBalance = async (req, res) => {
    try {
        const { id } = req.params;
        const { balance, type } = req.body; // type: 'add' hoặc 'subtract'
        if (typeof balance !== 'number' || balance < 0) {
            return res.status(400).json({
                code: 1,
                message: 'Balance phải là một số dương'
            });
        }

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }
        let newBalance = store.balance;
        if (type === 'add') {
            newBalance += balance;
        } else if (type === 'subtract') {
            if (newBalance < balance) {
                return res.status(400).json({
                    code: 1,
                    message: 'Số dư không đủ để trừ'
                });
            }
            newBalance -= balance;
        } else {
            return res.status(400).json({
                code: 1,
                message: 'Type không hợp lệ, chỉ chấp nhận "add" hoặc "subtract"'
            });
        }
        await store.update({ balance: newBalance });
        return res.status(200).json({
            code: 0,
            message: 'Cập nhật balance thành công',
            data: await store.reload()
        });
    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};