/* =========================================================
   ポートフォリオ用スクリプト
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupImageFallback();
  setupYouTube();
  setupReveal();
  setupToTop();
  setupCurrentNav();
  setupSakura();

  document.getElementById("year").textContent = new Date().getFullYear();
});

/* ---------- スマホ用メニューの開閉 ---------- */
function setupNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("global-nav");

  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "メニューを開く");
  };

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  });

  // リンクを押したら閉じる
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

/* ---------- 画像が見つからない時の代わり表示 ---------- */
function setupImageFallback() {
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    const replace = () => {
      const box = document.createElement("div");
      box.className = "img-placeholder";
      box.innerHTML = `${img.dataset.fallback}<br><small>${img.getAttribute("src")}</small>`;
      img.replaceWith(box);
    };
    if (img.complete && img.naturalWidth === 0) replace();
    else img.addEventListener("error", replace, { once: true });
  });
}

/* ---------- YouTube 埋め込み ----------
   <div class="work-video" data-youtube="動画ID"></div>
   ・動画IDは https://www.youtube.com/watch?v=XXXXXXXXXXX の XXXXXXXXXXX 部分
   ・URL をそのまま入れても自動でIDを取り出します
   ・最初はサムネイルだけ表示し、クリックで再生（ページが重くならないように）
------------------------------------------ */
function setupYouTube() {
  document.querySelectorAll(".work-video").forEach((box) => {
    const id = extractYouTubeId(box.dataset.youtube || "");

    if (!id) {
      box.innerHTML = '<div class="video-empty">― 動画準備中 ―</div>';
      return;
    }

    const poster = document.createElement("button");
    poster.type = "button";
    poster.className = "video-poster";
    poster.setAttribute("aria-label", "動画を再生");
    poster.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`;

    poster.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = "YouTube video player";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      box.replaceChildren(iframe);
    });

    box.replaceChildren(poster);
  });
}

function extractYouTubeId(value) {
  value = value.trim();
  if (!value) return "";
  if (/^[\w-]{11}$/.test(value)) return value;
  const m = value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : "";
}

/* ---------- スクロールでふわっと表示 ---------- */
function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((el) => io.observe(el));
}

/* ---------- ページ上部へ戻るボタン ---------- */
function setupToTop() {
  const btn = document.querySelector(".to-top");
  const onScroll = () => btn.classList.toggle("is-show", window.scrollY > 500);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- 今いるセクションのメニューを強調 ---------- */
function setupCurrentNav() {
  const links = document.querySelectorAll(".global-nav a");
  const sections = [...links].map((a) => document.querySelector(a.getAttribute("href")));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  sections.forEach((s) => s && io.observe(s));
}

/* ---------- 背景の桜吹雪アニメーション ----------
   花びらがくるくる回りながら、風に揺られて舞い落ちます。
   数や速さは下の CONFIG で調整できます。
------------------------------------------ */
function setupSakura() {
  const canvas = document.getElementById("sakura");
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const CONFIG = {
    count: 45,          // 花びらの数（PC）
    countMobile: 22,    // 花びらの数（スマホ）
    size: [10, 20],     // 花びらの大きさ（最小, 最大）
    fallSpeed: [0.4, 1.1], // 落ちる速さ
    wind: 0.6,          // 横風の強さ（マイナスで左向き）
    alpha: [0.6, 0.95],  // 濃さ
    colors: ["255, 183, 197", "250, 200, 210", "255, 214, 222", "240, 160, 180"], // 桜色（RGB）
  };

  const rand = (min, max) => min + Math.random() * (max - min);

  let w, h, dpr;
  let petals = [];

  function makePetal(initial) {
    return {
      x: rand(-w * 0.2, w),
      y: initial ? rand(-h, h) : rand(-60, -20),
      size: rand(CONFIG.size[0], CONFIG.size[1]),
      vy: rand(CONFIG.fallSpeed[0], CONFIG.fallSpeed[1]),
      sway: rand(0, Math.PI * 2),       // 左右の揺れの位相
      swaySpeed: rand(0.01, 0.03),
      rot: rand(0, Math.PI * 2),        // 回転
      rotSpeed: rand(-0.04, 0.04),
      flip: rand(0, Math.PI * 2),       // くるっと裏返る動き
      flipSpeed: rand(0.02, 0.06),
      alpha: rand(CONFIG.alpha[0], CONFIG.alpha[1]),
      color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = w < 768 ? CONFIG.countMobile : CONFIG.count;
    while (petals.length < target) petals.push(makePetal(true));
    petals.length = target;
  }

  // 先端に切れ込みのある桜の花びら
  function drawPetal(p) {
    const s = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, Math.cos(p.flip) * 0.8 + 0.2 * Math.sign(Math.cos(p.flip) || 1));

    ctx.beginPath();
    ctx.moveTo(0, s * 0.6);
    ctx.bezierCurveTo(-s * 0.6, s * 0.2, -s * 0.5, -s * 0.45, -s * 0.12, -s * 0.6);
    ctx.lineTo(0, -s * 0.42);
    ctx.lineTo(s * 0.12, -s * 0.6);
    ctx.bezierCurveTo(s * 0.5, -s * 0.45, s * 0.6, s * 0.2, 0, s * 0.6);
    ctx.closePath();

    const g = ctx.createLinearGradient(0, s * 0.6, 0, -s * 0.6);
    g.addColorStop(0, `rgba(255, 245, 248, ${p.alpha})`);
    g.addColorStop(1, `rgba(${p.color}, ${p.alpha})`);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  function update(p, k) {
    p.sway += p.swaySpeed * k;
    p.x += (CONFIG.wind + Math.sin(p.sway) * 0.8) * k;
    p.y += p.vy * k;
    p.rot += p.rotSpeed * k;
    p.flip += p.flipSpeed * k;

    if (p.y > h + 30 || p.x > w + 40 || p.x < -w * 0.3) {
      Object.assign(p, makePetal(false));
    }
  }

  let last = 0;
  function loop(t) {
    const k = Math.min(50, t - last || 16) / 16;
    last = t;

    ctx.clearRect(0, 0, w, h);
    petals.forEach((p) => { update(p, k); drawPetal(p); });

    if (!document.hidden) requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", resize);

  if (reduceMotion) {
    // 動きを減らす設定なら止まった花びらを一度だけ描画
    petals.forEach(drawPetal);
    return;
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) { last = performance.now(); requestAnimationFrame(loop); }
  });
  requestAnimationFrame(loop);
}
