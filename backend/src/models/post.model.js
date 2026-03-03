const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema;

const postSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },

        content: {
            type: String,
            required: true,
        },

        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        category: {
            type: String,
            required: true
        },

        tags: {
            type: [String],
            default: []
        },

        readingTime: {
            type: Number,
            min: 1
        },

        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },

        rejectionReason: {
            type: String,
            default: null
        },

        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },

        approvedAt: {
            type: Date
        },

        slug: {
            type: String,
            slug: "title",
            unique: true
        }
    },
    {
        timestamps: true
    }
);

mongoose.plugin(slug);
postSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Post', postSchema);