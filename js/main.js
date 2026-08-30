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
  }

  /* ---------- 画布尺寸（DPR） ---------- */
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas._cssW = w; canvas._cssH = h; canvas._dpr = dpr;
    app.scenes.forEach((sc) => { if (sc._cam) sc._cam.setSize(w, h); });
  }
  new ResizeObserver(resize).observe(wrap);
  resize();

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
  });

  canvas.addEventListener("pointermove", (e) => {
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
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
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
  }

  /* ---------- 渲染循环 ----------
   * rAF 为主；窗口被遮挡/节流时（rAF 停摆）用 setInterval 兜底，
   * 保证切回页面或特殊环境下画布状态与相机尺寸始终一致。 */
  let lastFrameAt = 0;
  function frame() {
    lastFrameAt = performance.now();
    const t = app.now();
    const sc = app.scene;
    const dpr = canvas._dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = canvas._cssW, h = canvas._cssH;

    // 背景
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#0e131b");
    g.addColorStop(1, "#0b0f16");
    ctx.fillStyle = g;
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
