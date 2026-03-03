const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const redis = require('../config/redis');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

async function register(data) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = new User({ ...data, password: hashedPassword });
    await user.save();
    return user;
};

async function login(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in Redis
    await redis.setex(`refresh_token:${user._id}`, 7 * 24 * 60 * 60, refreshToken);

    return { accessToken, refreshToken };
};

module.exports = {
    register,
    login
};