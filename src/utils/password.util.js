const crypto = require('crypto');

const generateResetToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return { token, hashed, expires };
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { generateResetToken, hashToken };