const adminService = require('../services/admin.service');

class AdminController {
    async getPendingPosts(req, res) {
        res.send('Get pending posts');
    }

    async getApprovedPosts(req, res) {
        res.send('Get approved posts');
    }

    async getDeletedPosts(req, res) {
    }

    async approvePost(req, res) {
    }

    async rejectPost(req, res) {
    }

    async restorePost(req, res) {
    }

    async hardDeletePost(req, res) {
    }
}

module.exports = new AdminController();