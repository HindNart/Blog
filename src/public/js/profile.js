/**
 * profile.js — Avatar upload & delete account
 */
'use strict';

document.addEventListener('DOMContentLoaded', function () {

    // ════════════════════════════════════════════════
    // AVATAR
    // ════════════════════════════════════════════════
    var editBtn = document.getElementById('avatarEditBtn');
    var fileInput = document.getElementById('avatarFileInput');
    var avatarMsg = document.getElementById('avatarMsg');
    var removeBtn = document.getElementById('removeAvatarBtn');

    function setAvatarMsg(msg, isError) {
        if (!avatarMsg) return;
        avatarMsg.textContent = msg;
        avatarMsg.className = 'avatar-msg ' + (isError ? 'avatar-msg-error' : 'avatar-msg-success');
        if (msg) setTimeout(function () { avatarMsg.textContent = ''; avatarMsg.className = 'avatar-msg'; }, 4000);
    }

    function updateAvatarUI(url) {
        var wrapper = document.getElementById('avatarWrapper');
        var img = document.getElementById('avatarImg');
        var placeholder = document.getElementById('avatarPlaceholder');

        if (url) {
            if (img) {
                img.src = url;
            } else {
                // Tạo img mới thay thế placeholder
                var newImg = document.createElement('img');
                newImg.src = url;
                newImg.alt = 'Avatar';
                newImg.className = 'profile-avatar';
                newImg.id = 'avatarImg';
                if (placeholder) placeholder.replaceWith(newImg);
            }
            // Hiện nút xóa nếu chưa có
            if (!removeBtn) {
                var btn = document.createElement('button');
                btn.className = 'btn-remove-avatar';
                btn.id = 'removeAvatarBtn';
                btn.textContent = 'Xóa ảnh mặc định';
                btn.addEventListener('click', handleRemoveAvatar);
                avatarMsg.parentNode.insertBefore(btn, avatarMsg);
            }
        } else {
            // Xóa avatar → về placeholder
            var currentImg = document.getElementById('avatarImg');
            if (currentImg) {
                var ph = document.createElement('div');
                ph.className = 'profile-avatar-placeholder';
                ph.id = 'avatarPlaceholder';
                // Lấy chữ cái đầu từ username hiển thị
                var uname = document.querySelector('.profile-username');
                ph.textContent = uname ? uname.textContent.trim().charAt(0).toUpperCase() : '?';
                currentImg.replaceWith(ph);
            }
            var rmBtn = document.getElementById('removeAvatarBtn');
            if (rmBtn) rmBtn.remove();
        }

        // Cập nhật avatar trên navbar ngay lập tức
        var navAvatar = document.querySelector('.nav-avatar');
        var navPlaceholder = document.querySelector('.nav-avatar-placeholder');
        if (url) {
            if (navAvatar) { navAvatar.src = url; }
            else if (navPlaceholder) {
                var navImg = document.createElement('img');
                navImg.src = url;
                navImg.alt = 'avatar';
                navImg.className = 'nav-avatar';
                navPlaceholder.replaceWith(navImg);
            }
        } else {
            var navImg2 = document.querySelector('.nav-avatar');
            if (navImg2) {
                var ph2 = document.createElement('span');
                ph2.className = 'nav-avatar-placeholder';
                var uname2 = document.querySelector('.profile-username');
                ph2.textContent = uname2 ? uname2.textContent.trim().charAt(0).toUpperCase() : '?';
                navImg2.replaceWith(ph2);
            }
        }
    }

    // Click nút edit → mở file picker
    if (editBtn && fileInput) {
        editBtn.addEventListener('click', function () {
            fileInput.click();
        });
    }

    // Khi chọn file
    if (fileInput) {
        fileInput.addEventListener('change', async function () {
            var file = fileInput.files[0];
            if (!file) return;

            // Validate file
            if (!file.type.startsWith('image/')) {
                setAvatarMsg('Chỉ chấp nhận file ảnh', true); return;
            }
            if (file.size > 2 * 1024 * 1024) {
                setAvatarMsg('Ảnh tối đa 2MB', true); return;
            }

            // Preview trước khi upload
            var reader = new FileReader();
            reader.onload = function (e) {
                var previewUrl = e.target.result;
                var img = document.getElementById('avatarImg');
                var ph = document.getElementById('avatarPlaceholder');
                if (img) img.src = previewUrl;
                else if (ph) {
                    var pi = document.createElement('img');
                    pi.src = previewUrl; pi.alt = 'Avatar';
                    pi.className = 'profile-avatar'; pi.id = 'avatarImg';
                    ph.replaceWith(pi);
                }
            };
            reader.readAsDataURL(file);

            // Upload lên server
            setAvatarMsg('⏳ Đang tải lên...', false);
            if (editBtn) editBtn.disabled = true;

            var formData = new FormData();
            formData.append('avatar', file);

            try {
                var res = await fetch('/user/avatar?_method=PUT', { method: 'POST', body: formData });
                var data = await res.json();
                if (data.success) {
                    updateAvatarUI(data.avatarUrl);
                    setAvatarMsg('✅ ' + data.message, false);
                } else {
                    setAvatarMsg('❌ ' + data.message, true);
                }
            } catch {
                setAvatarMsg('❌ Lỗi kết nối, vui lòng thử lại', true);
            } finally {
                if (editBtn) editBtn.disabled = false;
                fileInput.value = '';
            }
        });
    }

    // Xóa avatar
    function handleRemoveAvatar() {
        if (!confirm('Xóa avatar và dùng ảnh mặc định?')) return;
        fetch('/user/avatar?_method=DELETE', { method: 'DELETE' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.success) {
                    updateAvatarUI(null);
                    setAvatarMsg('✅ Đã xóa avatar', false);
                } else {
                    setAvatarMsg('❌ ' + data.message, true);
                }
            })
            .catch(function () { setAvatarMsg('❌ Lỗi kết nối', true); });
    }

    if (removeBtn) removeBtn.addEventListener('click', handleRemoveAvatar);

    // ════════════════════════════════════════════════
    // XÓA TÀI KHOẢN
    // ════════════════════════════════════════════════
    var openBtn = document.getElementById('openDeleteModalBtn');
    var modal = document.getElementById('deleteAccountModal');
    var cancelBtn = document.getElementById('cancelDeleteBtn');
    var confirmBtn = document.getElementById('confirmDeleteBtn');
    var deletePwd = document.getElementById('delete-pwd');
    var deleteMsg = document.getElementById('deleteMsg');
    var errDelPwd = document.getElementById('err-delete-pwd');

    function openModal() {
        if (!modal) return;
        modal.style.display = 'flex';
        if (deletePwd) { deletePwd.value = ''; deletePwd.focus(); }
        if (deleteMsg) deleteMsg.textContent = '';
        if (errDelPwd) errDelPwd.textContent = '';
    }

    function closeModal() {
        if (modal) modal.style.display = 'none';
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

    if (confirmBtn && deletePwd) {
        confirmBtn.addEventListener('click', async function () {
            var pwd = deletePwd.value.trim();
            if (!pwd) {
                if (errDelPwd) { errDelPwd.textContent = 'Vui lòng nhập mật khẩu'; errDelPwd.style.display = 'block'; }
                deletePwd.focus(); return;
            }
            if (errDelPwd) errDelPwd.textContent = '';

            var btnText = confirmBtn.querySelector('.btn-text');
            var btnLoad = confirmBtn.querySelector('.btn-loading');
            if (btnText) btnText.style.display = 'none';
            if (btnLoad) btnLoad.style.display = 'inline';
            confirmBtn.disabled = true;

            try {
                var res = await fetch('/user/delete-account?_method=DELETE', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: pwd }),
                });
                var data = await res.json();

                if (data.success) {
                    if (deleteMsg) {
                        deleteMsg.textContent = '✅ Tài khoản đã xóa. Đang chuyển hướng...';
                        deleteMsg.className = 'form-msg form-msg-success';
                    }
                    setTimeout(function () { window.location.href = '/auth/login'; }, 1500);
                } else {
                    if (deleteMsg) {
                        deleteMsg.textContent = '❌ ' + data.message;
                        deleteMsg.className = 'form-msg form-msg-error';
                    }
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoad) btnLoad.style.display = 'none';
                    confirmBtn.disabled = false;
                    deletePwd.focus();
                }
            } catch {
                if (deleteMsg) { deleteMsg.textContent = '❌ Lỗi kết nối'; }
                if (btnText) btnText.style.display = 'inline';
                if (btnLoad) btnLoad.style.display = 'none';
                confirmBtn.disabled = false;
            }
        });

        // Submit bằng Enter
        deletePwd.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') confirmBtn.click();
        });
    }
});