/* toc.js — Table of Contents */
'use strict';

document.addEventListener('DOMContentLoaded', function () {
    var postContent = document.getElementById('postContent');
    var tocNav = document.getElementById('tocNav');
    var tocMobileContent = document.getElementById('tocMobileContent');
    var tocWidget = document.getElementById('tocWidget');
    var tocMobile = document.getElementById('tocMobile');

    if (!postContent) return;

    var headings = postContent.querySelectorAll('h1, h2, h3, h4');
    if (headings.length < 2) {
        if (tocWidget) tocWidget.style.display = 'none';
        if (tocMobile) tocMobile.style.display = 'none';
        return;
    }

    // Gán ID cho headings
    var items = [];
    headings.forEach(function (h, i) {
        if (!h.id) {
            var slug = h.textContent.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 40);
            h.id = 'h-' + i + '-' + slug;
        }
        items.push({ id: h.id, text: h.textContent.trim(), level: parseInt(h.tagName[1]) });
    });

    // Build TOC list
    function buildTOC(container) {
        if (!container) return;
        var ul = document.createElement('ul');
        ul.className = 'toc-list';
        items.forEach(function (item) {
            var li = document.createElement('li');
            li.className = 'toc-item toc-level-' + item.level;
            var a = document.createElement('a');
            a.href = '#' + item.id;
            a.className = 'toc-link';
            a.textContent = item.text;
            a.setAttribute('data-target', item.id);
            a.addEventListener('click', function (e) {
                e.preventDefault();
                var target = document.getElementById(item.id);
                if (target) {
                    var offset = 80;
                    var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                }
                // Đóng mobile TOC
                if (tocMobileContent) tocMobileContent.classList.remove('toc-mobile-open');
                var toggle = document.getElementById('tocMobileToggle');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            });
            li.appendChild(a);
            ul.appendChild(li);
        });
        container.appendChild(ul);
    }

    buildTOC(tocNav);
    buildTOC(tocMobileContent);

    // Mobile toggle
    var mobileToggle = document.getElementById('tocMobileToggle');
    if (mobileToggle && tocMobileContent) {
        mobileToggle.addEventListener('click', function () {
            var isOpen = tocMobileContent.classList.toggle('toc-mobile-open');
            mobileToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    // Active highlight khi scroll (IntersectionObserver)
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    document.querySelectorAll('.toc-link').forEach(function (l) {
                        l.classList.remove('toc-active');
                    });
                    document.querySelectorAll('[data-target="' + entry.target.id + '"]').forEach(function (l) {
                        l.classList.add('toc-active');
                    });
                }
            });
        }, { rootMargin: '-64px 0px -70% 0px', threshold: 0 });

        items.forEach(function (item) {
            var el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });
    }
});