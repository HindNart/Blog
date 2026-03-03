const authService = require('../services/auth.service');

class AuthController {
    async register(req, res) {
        try {
            const user = await authService.register(req.body);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    };

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const { accessToken, refreshToken } = await authService.login(email, password);
            res.json({ accessToken, refreshToken });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    };

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            // Implementation for refreshing token
            res.json({ refreshToken });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    };

    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            // Implementation for logging out
            await redis.del(`refresh_token:${req.user._id}`);
            res.json({ message: "Logged out successfully" });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    };
}

module.exports = new AuthController();