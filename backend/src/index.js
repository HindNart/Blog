const dotenv = require('dotenv');
const db = require('./config/db');
const app = require('./app');

dotenv.config({
    path: './.env',
});


const startServer = async () => {
    try {
        await db.connect();
        app.on('error', (error) => {
            console.error('Error starting server:', error);
            throw error;
        });
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on port: ${process.env.PORT}`);
        });
    } catch (error) {
        console.error('MongoDB connection failed:', error);
    }
};

startServer();
