const Store = require('../database/models/Store');
const StoreLicense = require('../database/models/StoreLicense');
const StorePhoto = require('../database/models/StorePhoto');
const UserSellerAccess = require('../database/models/user_seller_access');
const sendMail = require("../configs/sendMail.js")

const { uploadFiles, deleteFile } = require('../utils/manageFilesOnCloudinary.js')

const { Op } = require('sequelize');
const sequelize = require('../database/sequelize');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });

const folderPathUpload = 'ecommerce-pharmacy/stores'

// Middleware upload cho avatar
module.exports.uploadAvatar = upload.single('avatar');

// Middleware upload cho banner
module.exports.uploadBanner = upload.single('banner');

// Middleware upload cho license
module.exports.uploadLicense = upload.single('license');

// Middleware upload cho nhiều ảnh
module.exports.uploadMultiple = upload.array('images', 10); // tối đa 10

// Middleware upload cho từng loại giấy phép riêng biệt và nhiều ảnh cửa hàng
module.exports.uploadCustom = upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'business_registration_license', maxCount: 1 },
    { name: 'pharmacist_certificate_license', maxCount: 1 },
    { name: 'pharmacy_operation_certificate_license', maxCount: 1 },
    { name: 'gpp_certificate_license', maxCount: 1 },
    { name: 'store_photos', maxCount: 10 },
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
        if (!data.address_detail) errors.push('Địa chỉ chi tiết là bắt buộc');
        if (!data.ward_code || !data.ward_name) errors.push('Phường/Xã là bắt buộc');
        if (!data.district_id || !data.district_name) errors.push('Quận/Huyện là bắt buộc');
        if (!data.province_id || !data.province_name) errors.push('Tỉnh/Thành phố là bắt buộc');
    }

    return errors;
};

// Tạo cửa hàng mới
module.exports.createStore = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const storeData = { ...req.body };

        // Validate dữ liệu
        const validationErrors = validateStoreData(storeData, true);
        // Kiểm tra đủ 4 loại giấy phép
        const licenseFields = [
            'business_registration_license',
            'pharmacist_certificate_license',
            'pharmacy_operation_certificate_license',
            'gpp_certificate_license'
        ];
        for (const field of licenseFields) {
            if (!req.files?.[field] || req.files[field].length === 0) {
                validationErrors.push(`Cần upload giấy phép: ${field}`);
            }
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

        if (req.files) {
            if (req.files.avatar) {
                const avatarResult = await uploadFiles([req.files.avatar[0]], `${folderPathUpload}/avatars`);
                avatar_url = avatarResult[0].secure_url;
            }
            if (req.files.banner) {
                const bannerResult = await uploadFiles([req.files.banner[0]], `${folderPathUpload}/banners`);
                banner_url = bannerResult[0].secure_url;
            }
        }

        // Tạo cửa hàng
        const store = await Store.create({
            ...storeData,
            avatar_url,
            banner_url,
            status: 'pending'
        }, { transaction });

        // Tạo quyền truy cập cho user_id
        await UserSellerAccess.create({
            store_id: store.id,
            user_id: storeData.owner_id,
            status: 'active'
        }, { transaction });

        // Tạo 4 bản ghi StoreLicense tương ứng
        const licenseTypeMap = {
            business_registration_license: 'BUSINESS_REGISTRATION',
            pharmacist_certificate_license: 'PHARMACIST_CERTIFICATE',
            pharmacy_operation_certificate_license: 'PHARMACY_OPERATION_CERTIFICATE',
            gpp_certificate_license: 'GPP_CERTIFICATE'
        };
        for (const field of licenseFields) {
            const file = req.files[field][0];
            const licenseResult = await uploadFiles([file], `${folderPathUpload}/licenses`);
            const license_url = licenseResult[0].secure_url;
            // Lấy metadata nếu có
            const license_number = req.body[`${field}_number`] || null;
            const issued_date = req.body[`${field}_issued_date`] || null;
            const expired_date = req.body[`${field}_expired_date`] || null;
            await StoreLicense.create({
                store_id: store.id,
                license_type: licenseTypeMap[field],
                license_number,
                license_url,
                issued_date,
                expired_date,
                status: 'pending'
            }, { transaction });
        }

        // Xử lý ảnh cửa hàng
        if (req.files?.store_photos && req.files.store_photos.length > 0) {
            const photos = req.files.store_photos;
            const photosResult = await uploadFiles(photos, `${folderPathUpload}/photos`);
            let descriptions = req.body.photo_descriptions;
            if (!Array.isArray(descriptions)) descriptions = [descriptions];
            const storePhotos = photosResult.map((photo, idx) => ({
                store_id: store.id,
                photo_url: photo.secure_url,
                description: descriptions[idx] || ''
            }));
            await StorePhoto.bulkCreate(storePhotos, { transaction });
        }

        await transaction.commit();

        // Lấy thông tin đầy đủ của cửa hàng
        const storeWithDetails = await getStoreWithDetails(store.id);

        return res.status(201).json({
            code: 0,
            message: 'Tạo cửa hàng thành công',
            data: storeWithDetails
        });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Hàm lấy thông tin đầy đủ của cửa hàng
const getStoreWithDetails = async (storeId) => {
    const store = await Store.findByPk(storeId);
    if (!store) return null;

    const licenses = await StoreLicense.findAll({
        where: { store_id: storeId }
    });

    const photos = await StorePhoto.findAll({
        where: { store_id: storeId }
    });

    return {
        ...store.toJSON(),
        licenses,
        photos
    };
};

// Lấy thông tin một cửa hàng
module.exports.getStore = async (req, res) => {
    try {
        const { id } = req.params;
        const storeWithDetails = await getStoreWithDetails(id);

        if (!storeWithDetails) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        return res.status(200).json({
            code: 0,
            message: 'Lấy thông tin cửa hàng thành công',
            data: storeWithDetails
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
        delete updateData.balance;
        delete updateData.owner_id;

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
        const storeWithDetails = await getStoreWithDetails(id);

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật thông tin cửa hàng thành công',
            data: storeWithDetails
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
            subject: 'Thông báo về trạng thái cửa hàng',
            html: `
                <h2>Thông báo về trạng thái cửa hàng ${store.name}</h2>
                <p>Trạng thái cửa hàng của bạn đã được cập nhật thành: <strong>${status}</strong></p>
                <p>Vui lòng đăng nhập vào hệ thống để biết thêm chi tiết.</p>
            `
        });

        const storeWithDetails = await getStoreWithDetails(id);

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật trạng thái cửa hàng thành công',
            data: storeWithDetails
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
    const transaction = await sequelize.transaction();
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

        // Xóa tất cả giấy phép
        const licenses = await StoreLicense.findAll({
            where: { store_id: id }
        });

        for (const license of licenses) {
            if (license.license_url) {
                const licensePublicId = license.license_url.split('/').pop().split('.')[0];
                await deleteFile(`${folderPathUpload}/licenses/${licensePublicId}`);
            }
            await license.destroy({ transaction });
        }

        // Xóa tất cả ảnh cửa hàng
        const photos = await StorePhoto.findAll({
            where: { store_id: id }
        });

        for (const photo of photos) {
            if (photo.photo_url) {
                const photoPublicId = photo.photo_url.split('/').pop().split('.')[0];
                await deleteFile(`${folderPathUpload}/photos/${photoPublicId}`);
            }
            await photo.destroy({ transaction });
        }

        await store.destroy({ transaction });
        await transaction.commit();

        return res.status(200).json({
            code: 0,
            message: 'Xóa cửa hàng thành công'
        });

    } catch (error) {
        await transaction.rollback();
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
        const storeWithDetails = await getStoreWithDetails(id);

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật avatar thành công',
            data: storeWithDetails
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
        const storeWithDetails = await getStoreWithDetails(id);

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật banner thành công',
            data: storeWithDetails
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Thêm giấy phép mới
module.exports.addLicense = async (req, res) => {
    try {
        const { id } = req.params;
        const { license_type, license_number, issued_date, expired_date } = req.body;

        if (!req.file) {
            return res.status(400).json({
                code: 1,
                message: 'Vui lòng upload ảnh giấy phép'
            });
        }

        if (!license_type || !['BUSINESS_REGISTRATION', 'PHARMACIST_CERTIFICATE', 'PHARMACY_OPERATION_CERTIFICATE', 'GPP_CERTIFICATE'].includes(license_type)) {
            return res.status(400).json({
                code: 1,
                message: 'Loại giấy phép không hợp lệ'
            });
        }

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        // Upload ảnh giấy phép
        const licenseResult = await uploadFiles([req.file], `${folderPathUpload}/licenses`);
        const license_url = licenseResult[0].secure_url;

        const license = await StoreLicense.create({
            store_id: id,
            license_type,
            license_number: license_number || null,
            license_url,
            issued_date: issued_date || null,
            expired_date: expired_date || null,
            status: 'pending'
        });

        const storeWithDetails = await getStoreWithDetails(id);

        return res.status(201).json({
            code: 0,
            message: 'Thêm giấy phép thành công',
            data: storeWithDetails
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Cập nhật giấy phép
module.exports.updateLicense = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id, licenseId } = req.params;
        const { license_type, license_number, issued_date, expired_date, status } = req.body;
        const isAdmin = req.user?.role === 'admin'; // Giả sử middleware auth đã thêm thông tin user vào req

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        const license = await StoreLicense.findOne({
            where: {
                id: licenseId,
                store_id: id
            }
        });

        if (!license) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy giấy phép'
            });
        }

        // Xử lý trường hợp đặc biệt: Giấy phép đang approved và người dùng (không phải admin) cập nhật
        if (license.status === 'approved' && !isAdmin && (req.file || license_number !== undefined || issued_date !== undefined || expired_date !== undefined)) {
            // Tạo bản ghi mới với trạng thái pending
            const newLicenseData = {
                store_id: id,
                license_type: license_type || license.license_type,
                license_number: license_number !== undefined ? license_number : license.license_number,
                issued_date: issued_date !== undefined ? issued_date : license.issued_date,
                expired_date: expired_date !== undefined ? expired_date : license.expired_date,
                status: 'pending'
            };

            // Nếu có file mới
            if (req.file) {
                const licenseResult = await uploadFiles([req.file], `${folderPathUpload}/licenses`);
                newLicenseData.license_url = licenseResult[0].secure_url;
            } else {
                newLicenseData.license_url = license.license_url;
            }

            // Tạo bản ghi mới
            const newLicense = await StoreLicense.create(newLicenseData, { transaction });

            await transaction.commit();

            const storeWithDetails = await getStoreWithDetails(id);

            return res.status(200).json({
                code: 0,
                message: 'Đã tạo yêu cầu cập nhật giấy phép mới, chờ admin phê duyệt',
                data: storeWithDetails
            });
        }

        // Trường hợp admin cập nhật status hoặc giấy phép không ở trạng thái approved
        const updateData = {};

        if (license_type && ['BUSINESS_REGISTRATION', 'PHARMACIST_CERTIFICATE', 'PHARMACY_OPERATION_CERTIFICATE', 'GPP_CERTIFICATE'].includes(license_type)) {
            updateData.license_type = license_type;
        }

        if (license_number !== undefined) updateData.license_number = license_number;
        if (issued_date !== undefined) updateData.issued_date = issued_date;
        if (expired_date !== undefined) updateData.expired_date = expired_date;

        // Nếu là admin và có cập nhật status
        if (isAdmin && status && ['pending', 'approved', 'rejected', 'expired'].includes(status)) {
            updateData.status = status;

            // Nếu admin approved một giấy phép mới
            if (status === 'approved') {
                // Tìm tất cả giấy phép cùng loại của cửa hàng này (trừ giấy phép hiện tại)
                const existingLicenses = await StoreLicense.findAll({
                    where: {
                        store_id: id,
                        license_type: license.license_type,
                        id: {
                            [Op.ne]: licenseId
                        },
                        status: 'approved'
                    },
                    transaction
                });

                // Cập nhật trạng thái của các giấy phép cũ thành expired
                for (const oldLicense of existingLicenses) {
                    // Xóa ảnh cũ trên Cloudinary nếu URL khác với giấy phép mới
                    if (oldLicense.license_url && oldLicense.license_url !== license.license_url) {
                        const oldLicensePublicId = oldLicense.license_url.split('/').pop().split('.')[0];
                        await deleteFile(`${folderPathUpload}/licenses/${oldLicensePublicId}`);
                    }

                    await oldLicense.update({ status: 'expired' }, { transaction });
                }
            }
        } else if (!isAdmin) {
            // Nếu không phải admin và cập nhật, luôn set về pending
            updateData.status = 'pending';
        }

        // Nếu có file mới và không phải trường hợp đặc biệt đã xử lý ở trên
        if (req.file) {
            const licenseResult = await uploadFiles([req.file], `${folderPathUpload}/licenses`);
            updateData.license_url = licenseResult[0].secure_url;

            // Xóa ảnh cũ nếu có
            if (license.license_url) {
                const oldLicensePublicId = license.license_url.split('/').pop().split('.')[0];
                await deleteFile(`${folderPathUpload}/licenses/${oldLicensePublicId}`);
            }
        }

        await license.update(updateData, { transaction });
        await transaction.commit();

        const storeWithDetails = await getStoreWithDetails(id);

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật giấy phép thành công',
            data: storeWithDetails
        });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Xóa giấy phép
module.exports.deleteLicense = async (req, res) => {
    try {
        const { id, licenseId } = req.params;

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        const license = await StoreLicense.findOne({
            where: {
                id: licenseId,
                store_id: id
            }
        });

        if (!license) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy giấy phép'
            });
        }

        // Xóa ảnh trên Cloudinary
        if (license.license_url) {
            const licensePublicId = license.license_url.split('/').pop().split('.')[0];
            await deleteFile(`${folderPathUpload}/licenses/${licensePublicId}`);
        }

        await license.destroy();
        const storeWithDetails = await getStoreWithDetails(id);

        return res.status(200).json({
            code: 0,
            message: 'Xóa giấy phép thành công',
            data: storeWithDetails
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Thêm ảnh cửa hàng
module.exports.addStorePhoto = async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;

        if (!req.file) {
            return res.status(400).json({
                code: 1,
                message: 'Vui lòng upload ảnh cửa hàng'
            });
        }

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        // Upload ảnh
        const photoResult = await uploadFiles([req.file], `${folderPathUpload}/photos`);
        const photo_url = photoResult[0].secure_url;

        const photo = await StorePhoto.create({
            store_id: id,
            photo_url,
            description: description || null
        });

        const storeWithDetails = await getStoreWithDetails(id);

        return res.status(201).json({
            code: 0,
            message: 'Thêm ảnh cửa hàng thành công',
            data: storeWithDetails
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Cập nhật ảnh cửa hàng
module.exports.updateStorePhoto = async (req, res) => {
    try {
        const { id, photoId } = req.params;
        const { description } = req.body;

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        const photo = await StorePhoto.findOne({
            where: {
                id: photoId,
                store_id: id
            }
        });

        if (!photo) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy ảnh cửa hàng'
            });
        }

        // Dữ liệu cập nhật
        const updateData = {};
        if (description !== undefined) updateData.description = description;

        // Nếu có file mới
        if (req.file) {
            const photoResult = await uploadFiles([req.file], `${folderPathUpload}/photos`);
            updateData.photo_url = photoResult[0].secure_url;

            // Xóa ảnh cũ
            if (photo.photo_url) {
                const oldPhotoPublicId = photo.photo_url.split('/').pop().split('.')[0];
                await deleteFile(`${folderPathUpload}/photos/${oldPhotoPublicId}`);
            }
        }

        await photo.update(updateData);
        const storeWithDetails = await getStoreWithDetails(id);

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật ảnh cửa hàng thành công',
            data: storeWithDetails
        });

    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Xóa ảnh cửa hàng
module.exports.deleteStorePhoto = async (req, res) => {
    try {
        const { id, photoId } = req.params;

        const store = await Store.findByPk(id);
        if (!store) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy cửa hàng'
            });
        }

        const photo = await StorePhoto.findOne({
            where: {
                id: photoId,
                store_id: id
            }
        });

        if (!photo) {
            return res.status(404).json({
                code: 1,
                message: 'Không tìm thấy ảnh cửa hàng'
            });
        }

        // Xóa ảnh trên Cloudinary
        if (photo.photo_url) {
            const photoPublicId = photo.photo_url.split('/').pop().split('.')[0];
            await deleteFile(`${folderPathUpload}/photos/${photoPublicId}`);
        }

        await photo.destroy();
        const storeWithDetails = await getStoreWithDetails(id);

        return res.status(200).json({
            code: 0,
            message: 'Xóa ảnh cửa hàng thành công',
            data: storeWithDetails
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
        const storeWithDetails = await getStoreWithDetails(id);

        return res.status(200).json({
            code: 0,
            message: 'Cập nhật balance thành công',
            data: storeWithDetails
        });
    } catch (error) {
        return res.status(500).json({
            code: 2,
            message: 'Lỗi server',
            error: error.message
        });
    }
};