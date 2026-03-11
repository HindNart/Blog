const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema;

const postSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxLength: 200
        },

        content: {
            type: String,
            required: true
        },

        excerpt: {
            type: String,   // Tóm tắt ngắn (auto-generated)
            maxlength: 300
        },

        thumbnail: {
            type: String,
            default: null
        },

        thumbnailPublicId: {
            type: String,
            default: null
        },

        images: [{
            publicId: String,  // Cloudinary public_id
            url: String
        }],

        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category'
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
            enum: ['draft', 'pending', 'approved', 'rejected'],
            default: 'draft'
        },

        rejectionReason: {
            type: String,
            default: null
        },

        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        approvedAt: {
            type: Date,
            default: null
        },

        slug: {
            type: String,
            slug: "title",
            unique: true,
            lowercase: true
        },

        views: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Index để tìm kiếm nhanh
postSchema.index({ title: 'text', content: 'text', tags: 'text' });
postSchema.index({ status: 1, isDeleted: 1 });
postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ views: 1 });

mongoose.plugin(slug);
postSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('Post', postSchema);