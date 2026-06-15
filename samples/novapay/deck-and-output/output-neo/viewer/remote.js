/* Presenter shared runtime — remote-side logic.
   Opened by presenter.js via window.open; talks to the deck over postMessage.
   Pings 'hello' until the deck answers, so it reconnects by itself when either
   window reloads (the opener browsing context survives deck navigation). */
(function () {
  'use strict';

  var counterEl = document.getElementById('counter');
  var statusEl = document.getElementById('status');
  var titleEl = document.getElementById('slide-title');
  var notesEl = document.getElementById('notes');
  var upNextEl = document.getElementById('up-next');
  var listEl = document.getElementById('slide-list');
  var fsBtn = document.getElementById('fullscreen');

  var slides = [];
  var slidesJson = '';
  var current = 0;
  var fullscreen = false;
  var lastSeen = 0;

  function send(msg) {
    if (!window.opener || window.opener.closed) return;
    try { window.opener.postMessage(msg, '*'); } catch (err) { /* deck gone */ }
  }

  function sendFullscreen() {
    if (!window.opener || window.opener.closed) return;
    try {
      /* Capability delegation lets the deck use this click's user activation
         to enter fullscreen (Chromium). Elsewhere the deck falls back to a
         toast telling the speaker to press F there. */
      window.opener.postMessage({ type: 'fullscreen' }, { targetOrigin: '*', delegate: 'fullscreen' });
    } catch (err) {
      send({ type: 'fullscreen' });
    }
  }

  function setConnected(ok) {
    statusEl.textContent = ok ? 'connected' : 'disconnected';
    statusEl.classList.toggle('off', !ok);
  }

  function renderList() {
    listEl.innerHTML = '';
    slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      var n = document.createElement('span'); n.className = 'n'; n.textContent = i + 1;
      var t = document.createElement('span'); t.className = 't'; t.textContent = s.title;
      b.appendChild(n); b.appendChild(t);
      b.addEventListener('click', function () { send({ type: 'goto', index: i }); });
      listEl.appendChild(b);
    });
  }

  function update() {
    if (!slides.length) return;
    counterEl.textContent = (current + 1) + ' / ' + slides.length;
    titleEl.textContent = slides[current].title;
    notesEl.innerHTML = slides[current].notes || '<em>No notes for this slide.</em>';
    upNextEl.textContent = slides[current + 1] ? 'Up next — ' + slides[current + 1].title : 'Last slide';
    Array.prototype.forEach.call(listEl.children, function (b, k) {
      b.classList.toggle('active', k === current);
    });
    if (listEl.children[current]) listEl.children[current].scrollIntoView({ block: 'nearest' });
    fsBtn.textContent = fullscreen ? '⛶ Exit fullscreen' : '⛶ Fullscreen';
  }

  window.addEventListener('message', function (e) {
    var m = e.data;
    if (!m || typeof m.type !== 'string') return;
    lastSeen = Date.now();
    if (m.type === 'init') {
      var json = JSON.stringify(m.slides || []);
      if (json !== slidesJson) { slidesJson = json; slides = m.slides || []; renderList(); }
      if (m.title) document.title = 'Remote · ' + m.title;
    }
    if (m.type === 'init' || m.type === 'state') {
      current = m.current || 0;
      fullscreen = !!m.fullscreen;
      setConnected(true);
      update();
    }
  });

  document.getElementById('prev').addEventListener('click', function () { send({ type: 'prev' }); });
  document.getElementById('next').addEventListener('click', function () { send({ type: 'next' }); });
  fsBtn.addEventListener('click', sendFullscreen);

  /* blur clicked buttons so space keeps navigating instead of re-clicking them */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (b) b.blur();
  });

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].indexOf(e.key) !== -1) { e.preventDefault(); send({ type: 'next' }); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].indexOf(e.key) !== -1) { e.preventDefault(); send({ type: 'prev' }); }
  });

  send({ type: 'hello' });
  setInterval(function () {
    var age = Date.now() - lastSeen;
    if (age > 3000) send({ type: 'hello' });
    if (age > 7000) setConnected(false);
  }, 1500);
})();
