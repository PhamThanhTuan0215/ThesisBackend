const { Op } = require('sequelize');
const ShippingProvider = require('../database/models/ShippingProvider');
const Joi = require('joi');

const shippingProviderSchema = Joi.object({
    name: Joi.string().required(),
    tracking_url: Joi.string().uri().allow(null, ''),
    status: Joi.string().valid('active', 'inactive').required()
});

// Lấy danh sách shipping provider
module.exports.getShippingProviders = async (req, res) => {
    try {
        const providers = await ShippingProvider.findAll();
        res.json({ code: 0, success: true, data: providers });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Lấy shipping provider theo ID
module.exports.getShippingProviderById = async (req, res) => {
    try {
        const provider = await ShippingProvider.findByPk(req.params.id);
        if (!provider) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipping provider not found' });
        }
        res.json({ code: 0, success: true, data: provider });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Tạo shipping provider mới
module.exports.createShippingProvider = async (req, res) => {
    const { error } = shippingProviderSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: 1, success: false, message: error.details[0].message });
    }
    try {
        const provider = await ShippingProvider.create(req.body);
        res.status(201).json({ code: 0, success: true, data: provider });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Cập nhật shipping provider
module.exports.updateShippingProvider = async (req, res) => {
    const { error } = shippingProviderSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: 1, success: false, message: error.details[0].message });
    }
    try {
        const provider = await ShippingProvider.findByPk(req.params.id);
        if (!provider) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipping provider not found' });
        }
        await provider.update(req.body);
        res.json({ code: 0, success: true, data: provider });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Xóa shipping provider
module.exports.deleteShippingProvider = async (req, res) => {
    try {
        const provider = await ShippingProvider.findByPk(req.params.id);
        if (!provider) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipping provider not found' });
        }
        await provider.destroy();
        res.json({ code: 0, success: true, message: 'Shipping provider deleted successfully' });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
}; 