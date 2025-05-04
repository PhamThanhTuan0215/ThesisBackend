const ProductType = require('../database/models/ProductType')
const DetailAttribute = require('../database/models/DetailAttribute')
const Category = require('../database/models/Category')

module.exports.getAllProductTypes = async (req, res) => {
    try {
        const productTypes = await ProductType.findAll();

        return res.status(200).json({ code: 0, message: 'Get all product types successfully', data: productTypes });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: error.message });
    }
}

module.exports.addProductType = async (req, res) => {

    try {
        const {product_type_name} = req.body;

        const errors = [];
    
        if (!product_type_name || product_type_name === '') errors.push('product_type_name is required');
    
        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Validation failed', errors });
        }

        const productType = await ProductType.create({
            product_type_name
        });

        return res.status(201).json({ code: 0, message: 'Add product types successfully', data: productType });
    }
    catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError' && error.errors[0].message) {
            return res.status(400).json({ code: 2, error: error.errors[0].message });
        }

        return res.status(500).json({ code: 2, error: error.message });
    }
}

module.exports.deleteProductType = async (req, res) => {

    try {
        const {id} = req.params;

        const productType = await ProductType.findByPk(id);

        if (!productType) {
            return res.status(404).json({ code: 1, message: 'Product type not found' });
        }

        await productType.destroy();

        return res.status(200).json({ code: 0, message: 'Delete product type successfully', delete_id: id });
        
    }
    catch (error) {
        return res.status(500).json({ code: 2, error: error.message });
    }
}

module.exports.updateProductType = async (req, res) => {
    try {
        const {id} = req.params;

        const {product_type_name} = req.body;

        const errors = [];
    
        if (!product_type_name || product_type_name === '') errors.push('product_type_name is required');
    
        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Validation failed', errors });
        }

        const [affectedRows, updatedRows] = await ProductType.update(
            { product_type_name },
            { where: { id }, returning: true }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ code: 1, message: 'Product type not found or no changes made' });
        }

        return res.status(200).json({ code: 0, message: 'Update product type successfully', data: updatedRows[0] });
        
    }
    catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError' && error.errors[0].message) {
            return res.status(400).json({ code: 2, error: error.errors[0].message });
        }

        return res.status(500).json({ code: 2, error: error.message });
    }
}

module.exports.getDetailAttributes = async (req, res) => {
    try {
        const {product_type_id} = req.params;

        const productType = await ProductType.findByPk(product_type_id);

        if (!productType) {
            return res.status(404).json({ code: 1, message: 'Product Type not found' });
        }

        const detailAttributes = await DetailAttribute.findAll({
            where: {product_type_id}
        });

        return res.status(200).json({ code: 0, message: 'Get all detail attributes successfully', data: detailAttributes });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: error.message });
    }
}

module.exports.addDetailAttributes = async (req, res) => {

    try {
        const {product_type_id} = req.params;
        const {detail_attributes} = req.body;
    
        const errors = [];
    
        if (!detail_attributes || !(Array.isArray(detail_attributes) && detail_attributes.length > 0)) {
            errors.push('detail_attributes is required');
        }
    
        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Validation failed', errors });
        }

        const productType = await ProductType.findByPk(product_type_id);
        if (!productType) {
            return res.status(404).json({ code: 1, message: 'Product Type not found' });
        }

        const detailAttributesData = detail_attributes.map(attribute_name => ({
            product_type_id,
            attribute_name
        }));

        const detailAttributesCreated = await DetailAttribute.bulkCreate(detailAttributesData);

        return res.status(201).json({ code: 0, message: 'Add detail attributes successfully', data: detailAttributesCreated });
    }
    catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError' && error.errors[0].message) {
            return res.status(400).json({ code: 2, error: error.errors[0].message });
        }

        return res.status(500).json({ code: 2, error: error.message });
    }
}

module.exports.deleteDetailAttribute = async (req, res) => {

    try {
        const {id} = req.params;

        const detailAttribute = await DetailAttribute.findByPk(id);

        if (!detailAttribute) {
            return res.status(404).json({ code: 1, message: 'Detail attribute not found' });
        }

        await detailAttribute.destroy();

        return res.status(200).json({ code: 0, message: 'Delete detail attribute successfully', delete_id: id });
        
    }
    catch (error) {
        return res.status(500).json({ code: 2, error: error.message });
    }
}

module.exports.updateDetailAttribute = async (req, res) => {
    try {
        const {id} = req.params;

        const {attribute_name} = req.body;

        const errors = [];
    
        if (!attribute_name || attribute_name === '') errors.push('attribute_name is required');
    
        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Validation failed', errors });
        }

        const [affectedRows, updatedRows] = await DetailAttribute.update(
            { attribute_name },
            { where: { id }, returning: true }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ code: 1, message: 'Detail attribute not found or no changes made' });
        }

        return res.status(200).json({ code: 0, message: 'Update detail attribute successfully', data: updatedRows[0] });
        
    }
    catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError' && error.errors[0].message) {
            return res.status(400).json({ code: 2, error: error.errors[0].message });
        }

        return res.status(500).json({ code: 2, error: error.message });
    }
}

module.exports.getCategories = async (req, res) => {
    try {
        const {product_type_id} = req.params;

        const productType = await ProductType.findByPk(product_type_id);
        if (!productType) {
            return res.status(404).json({ code: 1, message: 'Product Type not found' });
        }

        const categories = await Category.findAll({
            where: {product_type_id}
        });

        return res.status(200).json({ code: 0, message: 'Get all categories successfully', data: categories });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: error.message });
    }
}

module.exports.getDistinctCategoryNames = async (req, res) => {
    try {

        const categories = await Category.findAll({
            attributes: ['category_name'],
            group: ['category_name'],
        });

        const categoryNameList = categories.map(category => category.category_name);

        return res.status(200).json({ code: 0, message: 'Get all brands successfully', data: categoryNameList });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: error.message });
    }
}

module.exports.addCategories = async (req, res) => {

    try {
        
        const {product_type_id} = req.params;
        const {categories} = req.body;
    
        const errors = [];
    
        if (!categories || !(Array.isArray(categories) && categories.length > 0)) {
            errors.push('categories is required');
        }
    
        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Validation failed', errors });
        }

        const productType = await ProductType.findByPk(product_type_id);
        if (!productType) {
            return res.status(404).json({ code: 1, message: 'Product Type not found' });
        }

        const categoriesData = categories.map(category_name => ({
            product_type_id: productType.id,
            category_name
        }));

        const categoriesCreated = await Category.bulkCreate(categoriesData);

        return res.status(201).json({ code: 0, message: 'Add categories successfully', data: categoriesCreated });
    }
    catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError' && error.errors[0].message) {
            return res.status(400).json({ code: 2, error: error.errors[0].message });
        }

        return res.status(500).json({ code: 2, error: error.message });
    }
}

module.exports.deleteCategory = async (req, res) => {
    try {
        const {id} = req.params;

        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({ code: 1, message: 'Category not found' });
        }

        await category.destroy();

        return res.status(200).json({ code: 0, message: 'Delete category successfully', delete_id: id });
        
    }
    catch (error) {
        return res.status(500).json({ code: 2, error: error.message });
    }
}

module.exports.updateCategory = async (req, res) => {
    try {
        const {id} = req.params;

        const {category_name} = req.body;

        const errors = [];
    
        if (!category_name || category_name === '') errors.push('category_name is required');
    
        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Validation failed', errors });
        }

        const [affectedRows, updatedRows] = await Category.update(
            { category_name },
            { where: { id }, returning: true }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ code: 1, message: 'Category not found or no changes made' });
        }

        return res.status(200).json({ code: 0, message: 'Update category successfully', data: updatedRows[0] });
        
    }
    catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError' && error.errors[0].message) {
            return res.status(400).json({ code: 2, error: error.errors[0].message });
        }

        return res.status(500).json({ code: 2, error: error.message });
    }
}