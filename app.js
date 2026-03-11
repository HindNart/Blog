const express = require('express');
const handlebars = require('express-handlebars');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const routes = require('./src/routes');
const errorMiddleware = require('./src/middlewares/error.middleware');

const app = express();

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));
// Trust proxy
app.set('trust proxy', 1);
// Compression
app.use(compression());

// Rate limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(globalLimiter);
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
});
app.use('/auth/login', authLimiter);
app.use('/auth/forgot-password', authLimiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '30d' : 0,
}));

app.use(errorMiddleware);

// HTTP request logger
app.use(morgan('combined'));

// Method override
app.use(methodOverride('_method'));

// Template engine
app.engine('hbs', handlebars.engine({
    extname: '.hbs',
    helpers: {
        eq: (a, b) => a === b,
        neq: (a, b) => a !== b,
        gt: (a, b) => a > b,
        lt: (a, b) => a < b,
        gte: (a, b) => a >= b,
        or: (a, b) => a || b,
        and: (a, b) => a && b,
        not: (a) => !a,
        includes: (arr, val) => Array.isArray(arr) && arr.includes(val),
        formatDate: (date) => {
            if (!date) return '';
            return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        },
        formatDateTime: (date) => {
            if (!date) return '';
            return new Date(date).toLocaleString('vi-VN');
        },
        timeAgo: (date) => {
            if (!date) return '';
            const s = Math.floor((new Date() - new Date(date)) / 1000);
            if (s < 60) return 'vừa xong';
            if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
            if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
            return `${Math.floor(s / 86400)} ngày trước`;
        },
        truncate: (str, len) => !str ? '' : str.length > len ? str.substring(0, len) + '...' : str,
        json: (obj) => JSON.stringify(obj),
        add: (a, b) => a + b,
        subtract: (a, b) => a - b,
        statusLabel: (s) => ({ draft: 'Nháp', pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' })[s] || s,
        statusClass: (s) => ({ draft: 'secondary', pending: 'warning', approved: 'success', rejected: 'danger' })[s] || 'secondary',
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src/views'));

// Routes
routes(app);

module.exports = app;