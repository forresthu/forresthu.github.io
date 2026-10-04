(function () {
  var root = document.documentElement;

  /* 深色 / 浅色模式切换 */
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* 回到顶部 */
  var toTop = document.getElementById('to-top');
  if (toTop) {
    var onScroll = function () {
      toTop.classList.toggle('is-visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0 }); });
  }

  var content = document.getElementById('content');
  if (!content) return;

  /* 文章目录 */
  var headings = content.querySelectorAll(':scope > h2, :scope > h3');
  if (headings.length >= 3) {
    var lists = document.querySelectorAll('.toc__list');
    var linksByHeading = new Map();

    headings.forEach(function (h, i) {
      if (!h.id) h.id = 'section-' + i;
      lists.forEach(function (list) {
        var a = document.createElement('a');
        a.href = '#' + encodeURIComponent(h.id);
        a.textContent = h.textContent;
        a.className = 'toc-' + h.tagName.toLowerCase();
        list.appendChild(a);
        if (!linksByHeading.has(h)) linksByHeading.set(h, []);
        linksByHeading.get(h).push(a);
      });
    });
    document.querySelectorAll('.toc').forEach(function (el) { el.hidden = false; });

    /* 高亮当前阅读的章节 */
    if ('IntersectionObserver' in window) {
      var visible = new Set();
      var active = null;
      var setActive = function (h) {
        if (h === active) return;
        if (active) linksByHeading.get(active).forEach(function (a) { a.classList.remove('is-active'); });
        active = h;
        if (h) linksByHeading.get(h).forEach(function (a) { a.classList.add('is-active'); });
      };
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
        });
        var first = null;
        headings.forEach(function (h) { if (!first && visible.has(h)) first = h; });
        if (first) { setActive(first); return; }
        /* 没有标题在视口内时，取视口上方最近的一个 */
        var last = null;
        headings.forEach(function (h) { if (h.getBoundingClientRect().top < 100) last = h; });
        setActive(last);
      }, { rootMargin: '-60px 0px -65% 0px' });
      headings.forEach(function (h) { observer.observe(h); });
    }
  }

  /* 代码块顶栏：语言标签 + 复制按钮 */
  var LANGS = {
    go: ['Go', '#00add8'], java: ['Java', '#e76f00'], python: ['Python', '#5a9fd4'], py: ['Python', '#5a9fd4'],
    c: ['C', '#a8b9cc'], 'c++': ['C++', '#f34b7d'], cpp: ['C++', '#f34b7d'], scala: ['Scala', '#dc3d4f'],
    yaml: ['YAML', '#e5534b'], yml: ['YAML', '#e5534b'], json: ['JSON', '#f1e05a'], xml: ['XML', '#e37933'],
    sh: ['Shell', '#89e051'], shell: ['Shell', '#89e051'], bash: ['Bash', '#89e051'], console: ['Shell', '#89e051'],
    js: ['JavaScript', '#f1e05a'], javascript: ['JavaScript', '#f1e05a'], ts: ['TypeScript', '#3178c6'],
    typescript: ['TypeScript', '#3178c6'], rust: ['Rust', '#dea584'], proto: ['Protobuf', '#8fb4d9'],
    sql: ['SQL', '#e38c00'], dockerfile: ['Dockerfile', '#5fb3c8'], markdown: ['Markdown', '#9aa5b1'],
    html: ['HTML', '#e34c26'], css: ['CSS', '#8f6bd8'], text: ['Text', null], plaintext: ['Text', null]
  };

  content.querySelectorAll('div.highlighter-rouge, figure.highlight').forEach(function (block) {
    var pre = block.querySelector('pre');
    if (!pre) return;

    var lang = 'plaintext';
    var m = (block.className + ' ' + (block.querySelector('code') || {}).className).match(/language-(\S+)/);
    if (m) lang = m[1].toLowerCase();
    var info = LANGS[lang] || [lang, null];

    var header = document.createElement('div');
    header.className = 'code-header';
    var label = document.createElement('span');
    label.className = 'code-header__lang';
    label.textContent = info[0];
    if (info[1]) label.style.setProperty('--lang-color', info[1]);
    header.appendChild(label);

    if (navigator.clipboard) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = '复制';
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(pre.innerText.replace(/\n$/, '')).then(function () {
          btn.textContent = '已复制';
          btn.classList.add('is-copied');
          setTimeout(function () { btn.textContent = '复制'; btn.classList.remove('is-copied'); }, 1500);
        });
      });
      header.appendChild(btn);
    }

    block.insertBefore(header, block.firstChild);
  });

  /* 只有正文里确实有公式时才加载 MathJax */
  if (content.hasAttribute('data-mathjax')) {
    var text = content.textContent;
    if (/\\\(|\\\[|\$\$|\\begin\{/.test(text)) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
      document.head.appendChild(s);
    }
  }
})();
