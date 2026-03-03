const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
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
            maxLength: 50
        },

        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user'
        },

        isActive: {
            type: Boolean,
            default: true
        },

        isSubscribed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

userSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('User', userSchema);