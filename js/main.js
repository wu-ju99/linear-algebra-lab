/* =========================================================
 * main.js —— 应用外壳：章节导航 / 画布事件 / 渲染循环
 * ========================================================= */
"use strict";

(function () {
  const canvas = document.getElementById("cv");
  const ctx = canvas.getContext("2d");
  const wrap = document.getElementById("canvas-wrap");
  const panelEl = document.getElementById("panel");
  const chapterList = document.getElementById("chapter-list");
  const sceneTag = document.getElementById("scene-tag");

  const app = {
    now: () => performance.now() / 1000,
    scenes: LA.scenes,
    scene: null,
    refreshPanel() { if (this.scene && this.scene.refreshPanel) this.scene.refreshPanel(); },
    updateBadges() { renderChapters(); },
    /* 按需渲染：任何交互/状态变化后调用，下一帧才重画 */
    markDirty() { needsRender = true; },
    toast(msg) {
      let t = document.getElementById("toast");
      if (!t) {
        t = document.createElement("div");
        t.id = "toast";
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(app._toastTimer);
      app._toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
    },
  };
  LA.app = app;
  let needsRender = true;

  /* ---------- 章节列表（按《高等代数》教材结构分组） ---------- */
  const GROUPS = [
    { name: "〇 直觉起点", ids: ["vectors", "transform", "compose", "three-d"] },
    { name: "一、多项式", ids: ["poly-lab", "gcd"] },
    { name: "二、行列式", ids: ["perm-det", "determinant"] },
    { name: "三、线性方程组", ids: ["systems", "elementary"] },
    { name: "四、矩阵", ids: ["inverse", "blocks"] },
    { name: "五、二次型", ids: ["quadratic"] },
    { name: "六、线性空间", ids: ["subspaces", "span-sum", "isomorphism", "basis-change"] },
    { name: "七、线性变换", ids: ["eigen", "image-kernel", "invariant", "jordan"] },
    { name: "八、λ矩阵与相似", ids: ["lambda-matrix", "similarity", "relations"] },
    { name: "九、欧氏空间与酉空间", ids: ["dot", "cross", "euclid", "gram-schmidt", "orthogonal", "orthocomplement", "spectral", "unitary"] },
    { name: "十、双线性函数与辛空间", ids: ["dual", "bilinear", "symplectic"] },
    { name: "现代视角", ids: ["svd"] },
    { name: "实战", ids: ["puzzles"] },
  ];

  function renderChapters() {
    chapterList.innerHTML = "";
    let num = 0;
    const listed = new Set();
    GROUPS.forEach((g) => {
      const head = document.createElement("li");
      head.className = "group-title";
      head.textContent = g.name;
      chapterList.appendChild(head);
      g.ids.forEach((id) => {
        const sc = app.scenes.find(s => s.id === id);
        if (!sc) return;
        listed.add(id);
        num++;
        const li = document.createElement("li");
        li.dataset.id = sc.id;
        if (app.scene && app.scene.id === sc.id) li.classList.add("active");
        let badge = "";
        if (sc.id === "puzzles") {
          const n = sc.doneCount();
          const tot = sc.totalCount ? sc.totalCount() : 6;
          badge = `<span class="badge ${n === tot ? "full" : ""}">${n}/${tot}</span>`;
        }
        li.innerHTML = `<span class="num">${num}</span><span class="name">${sc.name}</span>${badge}`;
        li.addEventListener("click", () => setScene(id));
        chapterList.appendChild(li);
      });
    });
    // 兜底：未编入任何组的场景
    const rest = app.scenes.filter(s => !listed.has(s.id));
    if (rest.length) {
      const head = document.createElement("li");
      head.className = "group-title";
      head.textContent = "其他";
      chapterList.appendChild(head);
      rest.forEach((sc) => {
        num++;
        const li = document.createElement("li");
        li.dataset.id = sc.id;
        if (app.scene && app.scene.id === sc.id) li.classList.add("active");
        li.innerHTML = `<span class="num">${num}</span><span class="name">${sc.name}</span>`;
        li.addEventListener("click", () => setScene(sc.id));
        chapterList.appendChild(li);
      });
    }
  }

  /* ---------- 场景切换 ---------- */
  function setScene(id) {
    if (app.scene && app.scene.unmount) app.scene.unmount();
    app.scene = app.scenes.find((s) => s.id === id) || app.scenes[0];
    const sc = app.scene;

    if (!sc._cam) sc._cam = sc.newCam();
    if (sc.init && !sc._inited) { sc.init(app); sc._inited = true; }

    sc.mountPanel(panelEl, app);
    sceneTag.textContent = `${sc.name} —— ${sc.tagline}`;
    renderChapters();
    app.markDirty();
  }

  /* ---------- 画布尺寸（DPR，上限 2 避免 4K/高分屏像素量爆炸） ---------- */
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth, h = wrap.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas._cssW = w; canvas._cssH = h; canvas._dpr = dpr;
    app.scenes.forEach((sc) => { if (sc._cam) sc._cam.setSize(w, h); });
    app.markDirty();
  }
  new ResizeObserver(resize).observe(wrap);
  resize();

  /* ---------- 面板控件（输入/开关/按钮）变化 → 触发重绘 ---------- */
  ["input", "change", "click"].forEach((ev) => panelEl.addEventListener(ev, () => app.markDirty()));

  /* ---------- 指针交互 ---------- */
  let drag = null;        // {drag(pWorld)} 或 null（平移模式）
  let panning = false;
  let lastSX = 0, lastSY = 0;

  function evPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  canvas.addEventListener("pointerdown", (e) => {
    const { x, y } = evPos(e);
    const sc = app.scene;
    const cam = sc._cam;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 合成事件无活动指针，忽略 */ }
    lastSX = x; lastSY = y;

    const hit = sc.hitTest ? sc.hitTest(x, y, cam) : null;
    if (hit) {
      sc._dragId = hit.id;
      drag = hit;
      panning = false;
    } else {
      panning = true;
      drag = null;
      canvas.classList.add("grabbing");
    }
    app.markDirty();
  });

  canvas.addEventListener("pointermove", (e) => {
    app.markDirty();
    const { x, y } = evPos(e);
    const sc = app.scene;
    const cam = sc._cam;

    if (drag) {
      const w = cam ? cam.toW(x, y) : null;   // 3D 场景没有 2D 相机，只传屏幕坐标
      drag.drag(w, cam, x, y);
      return;
    }
    if (panning) {
      // 3D 场景：拖动 = 旋转视角
      if (sc.wantsOrbit && sc.wantsOrbit()) {
        const c3 = sc.state.cam3;
        c3.yaw += (x - lastSX) * 0.008;
        c3.pitch = LA.clamp(c3.pitch + (y - lastSY) * 0.006, -1.35, 1.35);
      } else if (cam) {
        cam.pan(x - lastSX, y - lastSY);
      }
      lastSX = x; lastSY = y;
      return;
    }
    // 悬停光标
    const hit = sc.hitTest ? sc.hitTest(x, y, cam) : null;
    sc._hoverId = hit ? hit.id : null;
    canvas.classList.toggle("over-handle", !!hit);
    canvas.style.cursor = hit ? "grab" : (sc.wantsOrbit && sc.wantsOrbit() ? "move" : "crosshair");
  });

  window.addEventListener("pointerup", () => {
    if (app.scene) app.scene._dragId = null;
    drag = null;
    panning = false;
    canvas.classList.remove("grabbing");
    app.markDirty();
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    app.markDirty();
    const { x, y } = evPos(e);
    const sc = app.scene;
    const cam = sc._cam;
    // 3D 场景：滚轮缩放 cam3.zoom
    const c3 = sc.state && sc.state.cam3;
    if (c3 && typeof c3.zoom === "number") {
      c3.zoom = LA.clamp(c3.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 0.3, 3.5);
      return;
    }
    if (!cam) return;
    cam.zoomAt(x, y, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === "r" || e.key === "R") resetView();
  });

  document.getElementById("btn-reset-view").addEventListener("click", resetView);
  function resetView() {
    const sc = app.scene;
    sc._cam = sc.newCam();
    if (sc._cam) sc._cam.setSize(canvas._cssW, canvas._cssH);
    if (sc.id === "three-d") sc.state.cam3 = { yaw: 0.65, pitch: 0.42, zoom: 1 };
    if (sc.id === "cross" || sc.id === "blocks") sc.state.cam3 = new LA.Cam3();
    app.markDirty();
  }

  /* ---------- 渲染循环（按需渲染） ----------
   * 空闲时零绘制：只有交互、状态变化或动画进行中才重画。
   * rAF 为主；rAF 被节流时（窗口遮挡）由 setInterval 兜底，但同样只在
   * 有脏标记 / 动画进行中才真正绘制 —— 后台空闲时 CPU 占用趋近于零。 */
  let lastFrameAt = 0;
  let bgGrad = null, bgW = 0, bgH = 0;

  /* 当前场景是否有随时间变化的视觉（动画/脉冲/轮播） */
  function isAnimating(t) {
    const sc = app.scene;
    if (!sc || !sc.state) return false;
    if (sc.state.playing) return true;            // 播放型动画（SVD/谱定理/eigen…）
    if (sc.alwaysDirty) return true;              // 有持续脉冲元素的场景
    const a = sc.state.anim;
    if (a && a.on && a.t0 >= 0 && t - a.t0 < a.dur) return true;   // 平滑过渡中
    if (typeof sc.state.viewT0 === "number" && sc.state.viewT0 >= 0 && t - sc.state.viewT0 < 0.7) return true; // 视角切换过渡
    if (sc.id === "perm-det" && sc.state.autoplay) return true;   // 排列轮播
    return false;
  }

  function frame() {
    lastFrameAt = performance.now();
    if (document.hidden) return;
    const t = app.now();
    if (!needsRender && !isAnimating(t)) return;
    needsRender = false;

    const sc = app.scene;
    const dpr = canvas._dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = canvas._cssW, h = canvas._cssH;

    // 背景（渐变按尺寸缓存，避免每帧新建）
    if (bgW !== w || bgH !== h || !bgGrad) {
      bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#0e131b");
      bgGrad.addColorStop(1, "#0b0f16");
      bgW = w; bgH = h;
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    if (sc) {
      if (!sc._cam) {
        // 3D 场景（three-d / cross）：自己管理相机，只需画布尺寸
        sc.draw(ctx, { w, h }, app, t);
      } else {
        sc._cam.setSize(w, h);
        sc.draw(ctx, sc._cam, app, t);
      }
    }
  }
  function rafLoop() { frame(); requestAnimationFrame(rafLoop); }
  requestAnimationFrame(rafLoop);
  setInterval(() => {
    if (performance.now() - lastFrameAt > 250) frame();
  }, 120);

  /* ---------- 启动 ---------- */
  setScene("vectors");
  frame();
})();
