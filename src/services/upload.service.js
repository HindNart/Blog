const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const createStorage = (folder, transformations = []) =>
    new CloudinaryStorage({
        cloudinary,
        params: async (req) => ({
            folder: `blog/${folder}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            transformation: [
                ...transformations,
                { quality: 'auto', fetch_format: 'auto' },
            ],
        }),
    });

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)!'), false);
    }
    cb(null, true);
};

// Post images uploader
const postUpload = multer({
    storage: createStorage('posts', [{ width: 1200, height: 800, crop: 'limit' }]),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
});

// Avatar uploader
const avatarUpload = multer({
    storage: createStorage('avatars', [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }]),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter,
});

const uploadService = {
    postImages: postUpload.fields([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'contentImages', maxCount: 10 },
    ]),
    avatar: avatarUpload.single('avatar'),

    async deleteImage(pulicId) {
        if (!pulicId) return;
        try {
            await cloudinary.uploader.destroy(pulicId);
        } catch (e) {
            console.warn('Cloudinary delete error: ', e);
        }
    },

    async deleteMultiple(publicIds = []) {
        await Promise.allSettled(publicIds.map((id) => this.deleteImage(id)));
    },
};

module.exports = uploadService;