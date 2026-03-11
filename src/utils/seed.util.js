/**
 * Seed script: tạo admin account và categories mặc định
 * Chạy lệnh: npm run seed (cấu hình trong script của package.json: "seed": "node src/utils/seed.util.js")
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Category = require('../models/category.model');

const CATEGORIES = [
    { name: 'Công nghệ', description: 'Tin tức công nghệ, lập trình, AI' },
    { name: 'Khoa học', description: 'Nghiên cứu khoa học, khám phá mới' },
    { name: 'Sức khỏe', description: 'Sức khỏe, dinh dưỡng, thể dục' },
    { name: 'Du lịch', description: 'Kinh nghiệm du lịch, địa điểm nổi tiếng' },
    { name: 'Ẩm thực', description: 'Công thức nấu ăn, nhà hàng, món ngon' },
    { name: 'Kinh doanh', description: 'Khởi nghiệp, quản lý, tài chính' }
];

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Tạo admin user nếu chưa tồn tại
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
        await User.create({
            username: 'admin',
            email: 'admin@blog.com',
            password: 'Admin@123456',
            role: 'admin'
        });
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }

    // Tạo categories nếu chưa tồn tại
    for (const category of CATEGORIES) {
        const exists = await Category.findOne({ name: category.name });
        if (!exists) {
            await Category.create(category);
            console.log(`Category "${category.name}" created`);
        } else {
            console.log(`Category "${category.name}" already exists`);
        }
    }
    console.log('Seed completed');
    process.exit(0);
};