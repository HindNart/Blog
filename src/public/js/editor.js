/**
 * editor.js — contenteditable rich text editor
 * Fix: sync content vào textarea TRƯỚC KHI form validation chạy
 */
'use strict';

document.addEventListener('DOMContentLoaded', function () {
    var editorEl = document.getElementById('editor');
    var titleEl = document.getElementById('post-title');
    var contentInput = document.getElementById('contentInput');

    if (!editorEl || !contentInput) return;

    // Set contenteditable
    editorEl.setAttribute('contenteditable', 'true');
    editorEl.setAttribute('spellcheck', 'true');

    // Load initial content khi edit — đọc từ textarea (an toàn, không bị parse lỗi)
    var existingContent = contentInput.value.trim();
    if (existingContent) {
        editorEl.innerHTML = existingContent;
    }

    // ── Sync liên tục khi user gõ ──────────────────────────
    // Quan trọng: sync trước khi browser validate 'required'
    function syncContent() {
        var html = editorEl.innerHTML.trim();
        // Nếu chỉ có <br> hoặc empty tag thì coi như rỗng
        var isEmpty = !html || html === '<br>' || html === '<div><br></div>';
        contentInput.value = isEmpty ? '' : html;
    }

    editorEl.addEventListener('input', syncContent);
    editorEl.addEventListener('keyup', syncContent);
    editorEl.addEventListener('paste', function () { setTimeout(syncContent, 10); });
    editorEl.addEventListener('blur', syncContent);

    // ── Submit: sync lần cuối trước khi gửi form ──────────
    var form = document.getElementById('postForm');
    if (form) {
        // Bắt tất cả submit buttons
        form.querySelectorAll('button[type="submit"]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                // Validate tiêu đề
                clearEditorError(titleEl);
                clearEditorError(editorEl);

                if (titleEl && !titleEl.value.trim()) {
                    e.preventDefault();
                    showEditorError('Tiêu đề không được để trống', titleEl);
                    titleEl.focus();
                    return false;
                }
                if (titleEl && (titleEl.value.trim().length < 10 || titleEl.value.trim().length > 200)) {
                    e.preventDefault();
                    showEditorError('Tiêu đề tối thiểu 10 ký tự, tối đa 200 ký tự', titleEl);
                    titleEl.focus();
                    return false;
                }

                // Sync content ngay khi click
                syncContent();

                // Validate thủ công nếu content rỗng
                var isEmpty = !contentInput.value || !contentInput.value.trim();
                if (isEmpty) {
                    e.preventDefault();
                    showEditorError('Nội dung không được để trống', editorEl);
                    editorEl.focus();
                    return false;
                }

                if (!isEmpty && contentInput.value.trim().length < 50) {
                    e.preventDefault();
                    showEditorError('Nội dung tối thiểu 50 ký tự', editorEl);
                    editorEl.focus();
                    return false;
                }

                // Lưu action vào hidden field để không bị mất
                var actionInput = document.getElementById('actionInput');
                if (!actionInput) {
                    actionInput = document.createElement('input');
                    actionInput.type = 'hidden';
                    actionInput.id = 'actionInput';
                    actionInput.name = 'action';
                    form.appendChild(actionInput);
                }
                actionInput.value = btn.value;
            });
        });
    }

    // ── Editor error display ───────────────────────────────
    function showEditorError(msg, element) {
        var err;
        err = document.createElement('p');
        err.id = 'editor-error';
        err.className = 'field-error';
        err.style.cssText = 'display:block;color:#ef4444;font-size:.82rem;margin-top:.35rem';
        element.parentNode.insertBefore(err, element.nextSibling);

        err.textContent = msg;
        err.style.display = 'block';
        element.style.borderColor = '#ef4444';
    }

    function clearEditorError(element) {
        var err = document.getElementById('editor-error');
        if (err) err.remove();
        element.style.borderColor = '';
    }

    titleEl.addEventListener('input', function () {
        if (titleEl.value.trim()) {
            clearEditorError(titleEl);
        }
    });

    editorEl.addEventListener('input', function () {
        if (editorEl.innerHTML.trim() && editorEl.innerHTML !== '<br>') {
            clearEditorError(editorEl);
        }
    });

    // ── Toolbar buttons ────────────────────────────────────
    document.querySelectorAll('[data-cmd]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var cmd = btn.getAttribute('data-cmd');
            var val = btn.getAttribute('data-val') || null;
            try { document.execCommand(cmd, false, val); } catch (ex) { }
            editorEl.focus();
            syncContent();
        });
    });

    // Insert image URL
    var insertImgBtn = document.getElementById('insertImgBtn');
    if (insertImgBtn) {
        insertImgBtn.addEventListener('click', function (e) {
            e.preventDefault();
            var url = prompt('Nhập URL hình ảnh:');
            if (url) {
                try { document.execCommand('insertImage', false, url); } catch (ex) { }
                syncContent();
            }
            editorEl.focus();
        });
    }

    // Placeholder
    function updatePlaceholder() {
        var isEmpty = !editorEl.textContent.trim();
        editorEl.setAttribute('data-empty', isEmpty ? 'true' : 'false');
    }
    editorEl.addEventListener('input', updatePlaceholder);
    updatePlaceholder();
});