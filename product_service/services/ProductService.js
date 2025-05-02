const Product = require('../database/models/Product');
const Review = require('../database/models/Review');

class ProductService {
    
    static async getAllProducts() {
        const products = await Product.findAll();
        return products;
    }
}

module.exports = ProductService;