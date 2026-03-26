const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.GMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

transporter.verify((err) => {
    if (err) console.error('Mailer config error:', err);
    else console.log('Mailer ready');
});

module.exports = transporter;