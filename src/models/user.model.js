const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minLength: 3,
            maxLength: 30
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minLength: 6,
        },

        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user'
        },

        avatar: {
            type: String,
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        },

        resetPasswordToken: String,

        resetPasswordExpires: Date,
    },
    {
        timestamps: true
    }
);

userSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('User', userSchema);