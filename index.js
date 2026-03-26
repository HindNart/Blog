require('dotenv').config();
require("dns").setDefaultResultOrder("ipv4first");
const { connectDB } = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');
const app = require('./app');

const startServer = async () => {
    try {
        await connectDB();
        await connectRedis();
        app.on('error', (error) => {
            console.error('Error starting server:', error);
            throw error;
        });
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on http://localhost:${process.env.PORT}`);
            console.log('Environment:', process.env.NODE_ENV || 'development');
            console.log('Connected to MongoDB and Redis successfully');
        });
    } catch (error) {
        console.error('MongoDB or Redis connection failed:', error);
    }
};

startServer();
