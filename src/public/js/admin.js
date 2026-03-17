/* admin.js */
'use strict';

document.addEventListener('DOMContentLoaded', function () {

    // ── Active sidebar link ──────────────────────────────
    var currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-link[href]').forEach(function (link) {
        var href = link.getAttribute('href');
        // exact match or starts-with for sub-paths
        if (href === currentPath) {
            link.classList.add('active');
        }
    });

    // ── Mobile sidebar toggle ────────────────────────────
    var sidebarToggle = document.getElementById('sidebarToggle');
    var adminSidebar = document.getElementById('adminSidebar');
    var sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle && adminSidebar) {
        function openSidebar() { adminSidebar.classList.add('open'); if (sidebarOverlay) sidebarOverlay.classList.add('show'); }
        function closeSidebar() { adminSidebar.classList.remove('open'); if (sidebarOverlay) sidebarOverlay.classList.remove('show'); }

        sidebarToggle.addEventListener('click', function () {
            adminSidebar.classList.contains('open') ? closeSidebar() : openSidebar();
        });
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSidebar(); });
    }

    // ── Reject Modal ─────────────────────────────────────
    var rejectModal = document.getElementById('rejectModal');

    window.showRejectModal = function (postId, postTitle) {
        var form = document.getElementById('rejectForm');
        var titleEl = document.getElementById('rejectPostTitle');
        if (!rejectModal || !form) return;
        if (titleEl) titleEl.textContent = '"' + postTitle + '"';
        form.setAttribute('action', '/admin/posts/' + postId + '/reject?_method=PUT');
        rejectModal.style.display = 'flex';
        var textarea = form.querySelector('textarea');
        if (textarea) { textarea.value = ''; setTimeout(function () { textarea.focus(); }, 50); }
    };

    window.closeRejectModal = function () {
        if (rejectModal) rejectModal.style.display = 'none';
    };

    if (rejectModal) {
        rejectModal.addEventListener('click', function (e) {
            if (e.target === rejectModal) window.closeRejectModal();
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') window.closeRejectModal();
    });

});