/* =====================================================
   main.js — Blog App
   ===================================================== */
'use strict';

// ── Helpers ─────────────────────────────────────────────
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(String(v).trim());
const isStrong = (v) => v && v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v);

function showErr(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg || '';
    el.style.display = msg ? 'block' : 'none';
}
function clearErr(id) { showErr(id, ''); }

// ── Run after DOM ready ──────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // ════════════════════════════════════════════════
    // 1. MOBILE NAV HAMBURGER
    // ════════════════════════════════════════════════
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = navLinks.classList.toggle('open');
            navToggle.classList.toggle('is-open', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', function (e) {
            if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
                navLinks.classList.remove('open');
                navToggle.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ════════════════════════════════════════════════
    // 2. USER DROPDOWN
    // ════════════════════════════════════════════════
    const userDropBtn = document.getElementById('userDropBtn');
    const userDropMenu = document.getElementById('userDropMenu');

    if (userDropBtn && userDropMenu) {
        userDropBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = userDropMenu.classList.toggle('show');
            userDropBtn.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', function (e) {
            if (!userDropBtn.contains(e.target) && !userDropMenu.contains(e.target)) {
                userDropMenu.classList.remove('show');
                userDropBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Đóng dropdown khi nhấn Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                userDropMenu.classList.remove('show');
                userDropBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ════════════════════════════════════════════════
    // 3. PASSWORD SHOW / HIDE TOGGLE
    // ════════════════════════════════════════════════
    document.querySelectorAll('.pwd-toggle').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var targetId = btn.getAttribute('data-target');
            var input = document.getElementById(targetId);
            if (!input) return;

            if (input.type === 'password') {
                input.type = 'text';
                btn.setAttribute('aria-label', 'Ẩn mật khẩu');
                btn.classList.add('pwd-visible');
            } else {
                input.type = 'password';
                btn.setAttribute('aria-label', 'Hiện mật khẩu');
                btn.classList.remove('pwd-visible');
            }
        });
    });

    // ════════════════════════════════════════════════
    // 4. PASSWORD STRENGTH METER
    // ════════════════════════════════════════════════
    function getStrength(pwd) {
        if (!pwd) return { label: '', cls: '', pct: 0 };
        var score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        if (score <= 2) return { label: '⚠️ Yếu', cls: 'strength-weak', pct: 25 };
        if (score <= 3) return { label: '🟡 Trung bình', cls: 'strength-medium', pct: 55 };
        if (score <= 4) return { label: '🟢 Mạnh', cls: 'strength-strong', pct: 80 };
        return { label: '💪 Rất mạnh', cls: 'strength-very-strong', pct: 100 };
    }

    ['reg-password', 'new-pwd', 'reset-pwd'].forEach(function (id) {
        var inp = document.getElementById(id);
        var fill = document.getElementById('pwdStrengthFill');
        var lbl = document.getElementById('pwdStrengthLabel');
        if (!inp || !fill || !lbl) return;

        inp.addEventListener('input', function () {
            var r = getStrength(inp.value);
            fill.style.width = r.pct + '%';
            fill.className = 'pwd-strength-fill ' + r.cls;
            lbl.textContent = r.label;
        });
    });

    // ════════════════════════════════════════════════
    // 5. REGISTER FORM VALIDATION
    // ════════════════════════════════════════════════
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        var uInp = document.getElementById('reg-username');
        var eInp = document.getElementById('reg-email');
        var pInp = document.getElementById('reg-password');
        var cInp = document.getElementById('reg-confirm');

        function valUsername() {
            var v = (uInp.value || '').trim();
            if (!v) { showErr('err-username', 'Username không được để trống'); return false; }
            if (!/^[a-zA-Z0-9_]{3,30}$/.test(v)) { showErr('err-username', 'Username: 3-30 ký tự, chỉ chữ cái, số, gạch dưới'); return false; }
            clearErr('err-username'); return true;
        }
        function valEmail() {
            var v = (eInp.value || '').trim();
            if (!v) { showErr('err-email', 'Email không được để trống'); return false; }
            if (!isEmail(v)) { showErr('err-email', 'Email không hợp lệ'); return false; }
            clearErr('err-email'); return true;
        }
        function valPassword() {
            var v = pInp.value || '';
            if (!isStrong(v)) { showErr('err-password', 'Mật khẩu ≥8 ký tự, gồm chữ hoa, thường và số'); return false; }
            clearErr('err-password'); return true;
        }
        function valConfirm() {
            if (cInp.value !== pInp.value) { showErr('err-confirm', 'Mật khẩu xác nhận không khớp'); return false; }
            clearErr('err-confirm'); return true;
        }

        if (uInp) { uInp.addEventListener('blur', valUsername); uInp.addEventListener('input', function () { clearErr('err-username'); }); }
        if (eInp) { eInp.addEventListener('blur', valEmail); eInp.addEventListener('input', function () { clearErr('err-email'); }); }
        if (pInp) { pInp.addEventListener('blur', valPassword); pInp.addEventListener('input', function () { clearErr('err-password'); }); }
        if (cInp) { cInp.addEventListener('blur', valConfirm); cInp.addEventListener('input', function () { clearErr('err-confirm'); }); }

        registerForm.addEventListener('submit', function (e) {
            var ok = [valUsername(), valEmail(), valPassword(), valConfirm()].every(Boolean);
            if (!ok) { e.preventDefault(); return; }
            var btn = document.getElementById('registerBtn');
            if (btn) {
                var txt = btn.querySelector('.btn-text');
                var load = btn.querySelector('.btn-loading');
                if (txt) txt.style.display = 'none';
                if (load) load.style.display = 'inline';
                btn.disabled = true;
            }
        });
    }

    // ════════════════════════════════════════════════
    // 6. LOGIN FORM VALIDATION
    // ════════════════════════════════════════════════
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            var ok = true;
            var em = document.getElementById('login-email');
            var pw = document.getElementById('login-password');
            if (em && !isEmail(em.value)) { showErr('err-email', 'Email không hợp lệ'); ok = false; }
            if (pw && !pw.value.trim()) { showErr('err-password', 'Vui lòng nhập mật khẩu'); ok = false; }
            if (!ok) e.preventDefault();
        });
        var em2 = document.getElementById('login-email');
        var pw2 = document.getElementById('login-password');
        if (em2) em2.addEventListener('input', function () { clearErr('err-email'); });
        if (pw2) pw2.addEventListener('input', function () { clearErr('err-password'); });
    }

    // ════════════════════════════════════════════════
    // 7. CHANGE PASSWORD VALIDATION
    // ════════════════════════════════════════════════
    var changePwdForm = document.getElementById('changePwdForm');
    if (changePwdForm) {
        changePwdForm.addEventListener('submit', function (e) {
            var ok = true;
            var np = document.getElementById('new-pwd');
            var cp = document.getElementById('confirm-pwd');
            if (np && !isStrong(np.value)) { showErr('err-newpwd', 'Mật khẩu ≥8 ký tự, gồm chữ hoa, thường và số'); ok = false; }
            if (cp && np && cp.value !== np.value) { showErr('err-confirm', 'Mật khẩu xác nhận không khớp'); ok = false; }
            if (!ok) e.preventDefault();
        });
        var np2 = document.getElementById('new-pwd');
        var cp2 = document.getElementById('confirm-pwd');
        if (np2) np2.addEventListener('input', function () { clearErr('err-newpwd'); });
        if (cp2) cp2.addEventListener('input', function () { clearErr('err-confirm'); });
    }

    // ════════════════════════════════════════════════
    // 8. RESET PASSWORD VALIDATION
    // ════════════════════════════════════════════════
    var resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', function (e) {
            var ok = true;
            var rp = document.getElementById('reset-pwd');
            var rc = document.getElementById('reset-confirm');
            if (rp && !isStrong(rp.value)) { showErr('err-password', 'Mật khẩu ≥8 ký tự, gồm chữ hoa, thường và số'); ok = false; }
            if (rc && rp && rc.value !== rp.value) { showErr('err-confirm', 'Mật khẩu xác nhận không khớp'); ok = false; }
            if (!ok) e.preventDefault();
        });
    }

    // ════════════════════════════════════════════════
    // 9. SUBSCRIBE FORM
    // ════════════════════════════════════════════════
    var subscribeForm = document.getElementById('subscribeForm');
    var subscribeEmail = document.getElementById('subscribeEmail');
    var subscribeMsg = document.getElementById('subscribeMsg');

    if (subscribeForm && subscribeEmail && subscribeMsg) {
        subscribeForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var email = subscribeEmail.value.trim();
            if (!isEmail(email)) {
                subscribeMsg.textContent = 'Email không hợp lệ';
                subscribeMsg.style.color = '#ef4444';
                return;
            }
            subscribeMsg.textContent = '⏳ Đang xử lý...';
            subscribeMsg.style.color = '#94a3b8';
            try {
                var res = await fetch('/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                var data = await res.json();
                subscribeMsg.textContent = data.message;
                subscribeMsg.style.color = data.success ? '#22c55e' : '#ef4444';
                if (data.success) subscribeForm.reset();
            } catch {
                subscribeMsg.textContent = 'Có lỗi xảy ra, vui lòng thử lại.';
                subscribeMsg.style.color = '#ef4444';
            }
        });
    }

    // ════════════════════════════════════════════════
    // 10. MARK NOTIFICATIONS READ
    // ════════════════════════════════════════════════
    var markAllRead = document.getElementById('markAllRead');
    if (markAllRead) {
        markAllRead.addEventListener('click', async function () {
            try {
                await fetch('/posts/notifications/read-all', { method: 'POST' });
                document.querySelectorAll('.notif-unread').forEach(function (el) {
                    el.classList.remove('notif-unread');
                });
                var badge = document.querySelector('.badge-count');
                if (badge) badge.remove();
                markAllRead.remove();
            } catch (err) {
                console.error('Mark read failed:', err);
            }
        });
    }

    // ════════════════════════════════════════════════
    // 11. THUMBNAIL PREVIEW
    // ════════════════════════════════════════════════
    var thumbnailInput = document.getElementById('thumbnailInput');
    var thumbnailPreview = document.getElementById('thumbnailPreview');
    if (thumbnailInput && thumbnailPreview) {
        thumbnailInput.addEventListener('change', function () {
            var file = thumbnailInput.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (ev) {
                thumbnailPreview.innerHTML =
                    '<img src="' + ev.target.result + '" alt="Preview" style="max-width:200px;border-radius:8px;margin-top:.5rem">';
            };
            reader.readAsDataURL(file);
        });
    }

    // ════════════════════════════════════════════════
    // 12. AUTO-DISMISS SUCCESS ALERTS
    // ════════════════════════════════════════════════
    document.querySelectorAll('.alert.alert-success').forEach(function (alert) {
        setTimeout(function () {
            alert.style.transition = 'opacity .5s ease';
            alert.style.opacity = '0';
            setTimeout(function () { alert.remove(); }, 500);
        }, 5000);
    });

}); // end DOMContentLoaded