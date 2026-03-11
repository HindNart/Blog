const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Đã xảy ra lỗi, vui lòng thử lại sau.';

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map((e) => e.message).join(', ');
    }
    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.ketValue)[0];
        message = `${field === 'email' ? 'Email' : 'Username'} đã tồn tại.`;
    }
    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'File ảnh quá lớn. Tối đa 5MB.';
    }

    console.error(`[${new Date().toISOString()}] ${statusCode} - ${message}`);
    if (statusCode === 500 && process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    // API request
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(statusCode).json({ success: false, message });
    }

    res.status(statusCode).render('error', { title: 'Lỗi', message, statusCode });
};

module.exports = errorMiddleware;