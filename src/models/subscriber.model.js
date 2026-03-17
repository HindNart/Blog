const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const subscriberSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    isActive: {
        type: Boolean,
        default: true
    },

    unsubscribeToken: {  // Token để unsubscribe qua link email
        type: String,
        default: () => crypto.randomBytes(20).toString('hex') // Tạo token ngẫu nhiên
    }

}, { timestamps: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);