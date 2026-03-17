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
            maxLength: 30,
            match: /^[a-zA-Z0-9_]+$/
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: /^\S+@\S+\.\S+$/
        },

        password: {
            type: String,
            required: true,
            minLength: 6,
            select: false
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

        avatarPublicId: {
            type: String,
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        },

        emailVerifyToken: {
            type: String,
            select: false
        },

        emailVerifyExpires: {
            type: Date,
            select: false
        },

        resetPasswordToken: String,

        resetPasswordExpires: Date,
    },
    {
        timestamps: true
    }
);

userSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

userSchema.methods.toJSON = () => {
    const obj = this.toObject();
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    delete obj.emailVerifyToken;
    delete obj.emailVerifyExpires;
    return obj;
};

module.exports = mongoose.model('User', userSchema);