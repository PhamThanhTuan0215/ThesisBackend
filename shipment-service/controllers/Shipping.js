const { Op } = require('sequelize');
const Shipment = require('../database/models/Shipment');
const Joi = require('joi');

const shipmentSchema = Joi.object({
    order_id: Joi.number().required(),
    shipping_provider_id: Joi.number().required(),
    shipping_address_from_id: Joi.number().required(),
    shipping_address_to_id: Joi.number().required(),
    status: Joi.string().valid('pending', 'shipped', 'delivered', 'cancelled').required(),
    estimated_delivery: Joi.date().required()
});

// Lấy danh sách shipment
module.exports.getShipments = async (req, res) => {
    try {
        const shipments = await Shipment.findAll();
        res.json({ code: 0, success: true, data: shipments });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Lấy shipment theo ID
module.exports.getShipmentById = async (req, res) => {
    try {
        const shipment = await Shipment.findByPk(req.params.id);
        if (!shipment) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipment not found' });
        }
        res.json({ code: 0, success: true, data: shipment });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Tạo shipment mới
module.exports.createShipment = async (req, res) => {
    const { error } = shipmentSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: 1, success: false, message: error.details[0].message });
    }
    try {
        const shipment = await Shipment.create(req.body);
        res.status(201).json({ code: 0, success: true, data: shipment });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Cập nhật shipment
module.exports.updateShipment = async (req, res) => {
    const { error } = shipmentSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: 1, success: false, message: error.details[0].message });
    }
    try {
        const shipment = await Shipment.findByPk(req.params.id);
        if (!shipment) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipment not found' });
        }
        await shipment.update(req.body);
        res.json({ code: 0, success: true, data: shipment });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Xóa shipment
module.exports.deleteShipment = async (req, res) => {
    try {
        const shipment = await Shipment.findByPk(req.params.id);
        if (!shipment) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipment not found' });
        }
        await shipment.destroy();
        res.json({ code: 0, success: true, message: 'Shipment deleted successfully' });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
}; 