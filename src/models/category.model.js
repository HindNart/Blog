const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    slug: {
        type: String,
        slug: "name",
        unique: true,
        lowercase: true
    },

    description: {
        type: String,
        default: ''
    },

    postCount: {
        type: Number,
        default: 0
    },

}, { timestamps: true });

categorySchema.plugin(slug);

module.exports = mongoose.model('Category', categorySchema);