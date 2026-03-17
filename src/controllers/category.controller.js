const Category = require('../models/category.model');
const { catchAsync, AppError } = require('../utils/response.util');

module.exports = {
    // Admin: create category
    create: catchAsync(async (req, res) => {
        const { name, description } = req.body;
        if (!name) throw new AppError('Tên danh mục không được trống', 400);
        await Category.create({ name, description });
        res.redirect('/admin/dashboard?categoryCreated=1');
    }),

    // Admin: delete category
    delete: catchAsync(async (req, res) => {
        await Category.findByIdAndDelete(req.params.id);
        res.redirect('/admin/dashboard');
    }),
};