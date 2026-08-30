/* =========================================================
 * core.js —— 数学工具 / 相机 / 绘图原语 / UI 组件
 * 全局命名空间 LA，普通 script 加载（支持 file:// 直接打开）
 * ========================================================= */
"use strict";
window.LA = {};

/* ---------- 数值 ---------- */
LA.fmt = function (x, d = 2) {
  if (!isFinite(x)) return "∞";
  const v = Math.abs(x) < 1e-10 ? 0 : x;
  const s = v.toFixed(d);
  return s.replace(/\.?0+$/, (m) => (m.includes(".") ? "" : m)); // 去尾零但保留 "1.00"→"1"
};
LA.fmt2 = function (x, d = 2) { // 固定小数位（用于 det 等需要对齐的场合）
  if (!isFinite(x)) return "∞";
  const v = Math.abs(x) < 1e-10 ? 0 : x;
  return v.toFixed(d);
};
LA.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
LA.snap = (x, step = 0.1) => Math.round(x / step) * step;
LA.ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic

/* ---------- 二维向量 ---------- */
LA.v = {
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  scale: (a, k) => ({ x: a.x * k, y: a.y * k }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  len: (a) => Math.hypot(a.x, a.y),
  dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  rot: (p, ang) => ({ x: p.x * Math.cos(ang) - p.y * Math.sin(ang), y: p.x * Math.sin(ang) + p.y * Math.cos(ang) }),
  lerp: (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),
  norm: (a) => { const L = Math.hypot(a.x, a.y) || 1; return { x: a.x / L, y: a.y / L }; },
};

/* ---------- 2×2 矩阵：{a,b,c,d} 表示 [[a,b],[c,d]]，列1=(a,c)=î 的落点，列2=(b,d)=ĵ 的落点 ---------- */
LA.ident2 = () => ({ a: 1, b: 0, c: 0, d: 1 });
LA.apply2 = (M, p) => ({ x: M.a * p.x + M.b * p.y, y: M.c * p.x + M.d * p.y });
LA.det2 = (M) => M.a * M.d - M.b * M.c;
LA.trace2 = (M) => M.a + M.d;
LA.mul2 = (M, N) => ({
  a: M.a * N.a + M.b * N.c, b: M.a * N.b + M.b * N.d,
  c: M.c * N.a + M.d * N.c, d: M.c * N.b + M.d * N.d,
});
LA.lerp2 = (A, B, t) => ({
  a: A.a + (B.a - A.a) * t, b: A.b + (B.b - A.b) * t,
  c: A.c + (B.c - A.c) * t, d: A.d + (B.d - A.d) * t,
});
LA.col1 = (M) => ({ x: M.a, y: M.c });
LA.col2 = (M) => ({ x: M.b, y: M.d });
LA.fromCols = (c1, c2) => ({ a: c1.x, b: c2.x, c: c1.y, d: c2.y });
LA.rot2 = (ang) => ({ a: Math.cos(ang), b: -Math.sin(ang), c: Math.sin(ang), d: Math.cos(ang) });

/* ---------- 3×3 矩阵：[[a11,a12,a13],[a21,a22,a23],[a31,a32,a33]] 行优先二维数组 ---------- */
LA.ident3 = () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
LA.apply3 = (M, p) => ({
  x: M[0][0] * p.x + M[0][1] * p.y + M[0][2] * p.z,
  y: M[1][0] * p.x + M[1][1] * p.y + M[1][2] * p.z,
  z: M[2][0] * p.x + M[2][1] * p.y + M[2][2] * p.z,
});
LA.det3 = (M) =>
  M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
  M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
  M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
LA.lerp3 = (A, B, t) => A.map((row, i) => row.map((x, j) => x + (B[i][j] - x) * t));
LA.rot3z = (ang) => [[Math.cos(ang), -Math.sin(ang), 0], [Math.sin(ang), Math.cos(ang), 0], [0, 0, 1]];
LA.rot3x = (ang) => [[1, 0, 0], [0, Math.cos(ang), -Math.sin(ang)], [0, Math.sin(ang), Math.cos(ang)]];
LA.rot3y = (ang) => [[Math.cos(ang), 0, Math.sin(ang)], [0, 1, 0], [-Math.sin(ang), 0, Math.cos(ang)]];

/* ---------- 特征值（2×2） ---------- */
LA.eigen2 = function (M) {
  const tr = LA.trace2(M), det = LA.det2(M);
  const disc = tr * tr / 4 - det;
  if (disc < -1e-9) return { real: false, re: tr / 2, im: Math.sqrt(-disc) };
  const s = Math.sqrt(Math.max(disc, 0));
  const l1 = tr / 2 + s, l2 = tr / 2 - s;
  const eigvec = (l) => {
    if (Math.abs(M.b) > 1e-6) return LA.v.norm({ x: M.b, y: l - M.a });
    if (Math.abs(M.c) > 1e-6) return LA.v.norm({ x: l - M.d, y: M.c });
    return null; // 对角阵情形由 allVectors / 单位向量处理
  };
  const isAll = Math.abs(M.b) < 1e-6 && Math.abs(M.c) < 1e-6 && Math.abs(M.a - M.d) < 1e-6;
  if (isAll) return { real: true, allVectors: true, l1: M.a, l2: M.d, v1: null, v2: null };
  if (Math.abs(s) < 1e-9) { // 重根
    const v = eigvec(l1);
    return { real: true, l1, l2, v1: v, v2: null, repeated: true };
  }
  // 对角阵：特征向量取单位坐标轴
  if (Math.abs(M.b) < 1e-6 && Math.abs(M.c) < 1e-6) {
    return { real: true, l1, l2, v1: { x: 1, y: 0 }, v2: { x: 0, y: 1 }, repeated: false };
  }
  return { real: true, l1, l2, v1: eigvec(l1), v2: eigvec(l2), repeated: false };
};

/* =========================================================
 * Cam2D —— 世界坐标 ↔ 屏幕坐标
 * ========================================================= */
LA.Cam2D = class {
  constructor(ppu = 70) { this.ppu = ppu; this.cx = 0; this.cy = 0; this.w = 800; this.h = 600; }
  setSize(w, h) { this.w = w; this.h = h; }
  toS(p) { return { x: this.w / 2 + (p.x - this.cx) * this.ppu, y: this.h / 2 - (p.y - this.cy) * this.ppu }; }
  toW(sx, sy) { return { x: this.cx + (sx - this.w / 2) / this.ppu, y: this.cy - (sy - this.h / 2) / this.ppu }; }
  pan(dxScreen, dyScreen) { this.cx -= dxScreen / this.ppu; this.cy += dyScreen / this.ppu; }
  zoomAt(sx, sy, factor) {
    const before = this.toW(sx, sy);
    this.ppu = LA.clamp(this.ppu * factor, 8, 400);
    const after = this.toW(sx, sy);
    this.cx += before.x - after.x; this.cy += before.y - after.y;
  }
};

/* =========================================================
 * 绘图原语（ctx + cam）
 * ========================================================= */
LA.draw = {};

LA.draw.grid = function (ctx, cam, opts = {}) {
  const { matrix = null, color = "#1c2532", width = 1, alpha = 1, emphasis = null } = opts;
  const st0 = 34; // 目标最小像素间距
  let st = 1;
  while (st * cam.ppu < st0) st *= 2;
  while (st > 0.25 && st * cam.ppu > st0 * 3) st /= 2;
  const halfW = cam.w / 2 / cam.ppu, halfH = cam.h / 2 / cam.ppu;
  // 变换后的网格（斜网格）需要更大的覆盖半径才能铺满屏幕角落
  let R = Math.ceil(Math.max(halfW, halfH) * (matrix ? 2.2 : 1.4) / st) * st;
  R = Math.min(R, 800);
  const T = (p) => (matrix ? LA.apply2(matrix, p) : p);
  const S = (p) => cam.toS(p);
  ctx.save();
  ctx.lineWidth = width;
  // 裁剪掉完全在屏幕外的线段
  const m = 60, W = cam.w + m, H = cam.h + m;
  const seg = (p1, p2, bold) => {
    const a = S(T(p1)), b = S(T(p2));
    if ((a.x < -m && b.x < -m) || (a.x > W && b.x > W) || (a.y < -m && b.y < -m) || (a.y > H && b.y > H)) return;
    ctx.globalAlpha = alpha * (bold ? 1 : 0.55);
    ctx.strokeStyle = bold ? (emphasis || color) : color;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  };
  for (let k = -R; k <= R + 1e-9; k += st) {
    const bold = Math.abs(Math.abs(k) / st - Math.round(Math.abs(k) / st)) < 1e-9 &&
      Math.abs(Math.round(k / st)) % 5 === 0 && Math.abs(k) > 1e-9;
    seg({ x: k, y: -R }, { x: k, y: R }, bold);   // 竖线
    seg({ x: -R, y: k }, { x: R, y: k }, bold);   // 横线
  }
  ctx.restore();
};

LA.draw.axes = function (ctx, cam, opts = {}) {
  const { color = "#3a4657", width = 1.4, matrix = null, arrowed = false } = opts;
  const R = Math.max(cam.w, cam.h) / cam.ppu;
  const T = (p) => (matrix ? LA.apply2(matrix, p) : p);
  const o = cam.toS(T({ x: 0, y: 0 }));
  const ax = cam.toS(T({ x: R, y: 0 })), ax2 = cam.toS(T({ x: -R, y: 0 }));
  const ay = cam.toS(T({ x: 0, y: R })), ay2 = cam.toS(T({ x: 0, y: -R }));
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(ax2.x, ax2.y); ctx.lineTo(ax.x, ax.y);
  ctx.moveTo(ay2.x, ay2.y); ctx.lineTo(ay.x, ay.y);
  ctx.stroke();
  ctx.restore();
  void o;
};

/* 箭头：from/to 世界坐标；head 大小为屏幕像素（不随缩放变化） */
LA.draw.arrow = function (ctx, cam, from, to, color, opts = {}) {
  const a = cam.toS(from), b = cam.toS(to);
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy);
  if (L < 0.8) return;
  const headW = opts.head ?? 11;
  const head = Math.min(headW, L * 0.5);
  const ux = dx / L, uy = dy / L;
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = opts.width ?? 3;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (opts.dash) ctx.setLineDash(opts.dash);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x - ux * head * 0.72, b.y - uy * head * 0.72); ctx.stroke();
  ctx.setLineDash([]);
  if (!opts.noHead) {
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - ux * head - uy * head * 0.42, b.y - uy * head + ux * head * 0.42);
    ctx.lineTo(b.x - ux * head + uy * head * 0.42, b.y - uy * head - ux * head * 0.42);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if (opts.label) LA.draw.label(ctx, cam, to, opts.label, color, { ...opts, offsetDir: { x: ux, y: uy } });
};

/* 文字标签（带半透明底）
 * 常规：p 为世界坐标；opts.screen = true 表示 p 已是屏幕坐标；
 * 或 opts.screen = {x,y} 直接给屏幕坐标（忽略 p）。 */
LA.draw.label = function (ctx, cam, p, text, color, opts = {}) {
  let s;
  if (opts.screen && typeof opts.screen === "object") s = opts.screen;
  else if (opts.screen) s = p;
  else s = cam.toS(p);
  const fs = opts.fontSize ?? 12.5;
  ctx.save();
  ctx.font = `${opts.bold ? "700 " : ""}${fs}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  const tw = ctx.measureText(text).width;
  let ox = opts.dx ?? 0, oy = opts.dy ?? 0;
  if (!opts.dx && opts.offsetDir) { ox = opts.offsetDir.x * 20; oy = opts.offsetDir.y * 20; }
  let x = s.x + ox, y = s.y + oy;
  const padX = 6, padY = 4, w = tw + padX * 2, h = fs + padY * 2;
  if (opts.center) x -= w / 2, y -= h / 2;
  else {
    if (ox === 0 && opts.center !== false) x -= 0; // 默认放右下
  }
  y -= opts.center ? 0 : 0;
  if (opts.bg !== false) {
    ctx.fillStyle = opts.bgColor || "rgba(10, 14, 20, .78)";
    LA.draw._roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    if (opts.borderColor) { ctx.strokeStyle = opts.borderColor; ctx.lineWidth = 1; LA.draw._roundRect(ctx, x, y, w, h, 6); ctx.stroke(); }
  }
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + 0.5);
  ctx.restore();
};

LA.draw._roundRect = function (ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

LA.draw.dot = function (ctx, cam, p, color, r = 4.5, opts = {}) {
  const s = cam.toS(p);
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
  if (opts.stroke) { ctx.strokeStyle = opts.stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.restore();
};

/* 可拖拽的金色端点（带光环） */
LA.draw.handle = function (ctx, cam, p, color = "#f0b429", opts = {}) {
  const s = cam.toS(p);
  const r = opts.hover ? 8 : 6.5;
  ctx.save();
  ctx.globalAlpha = 1;
  // 外圈光环
  ctx.strokeStyle = color; ctx.globalAlpha = opts.hover ? 0.85 : 0.45;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(s.x, s.y, r + 4, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(10,14,20,.8)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
};

LA.draw.poly = function (ctx, cam, pts, fill, stroke, opts = {}) {
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => {
    const s = cam.toS(p);
    if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
  });
  ctx.closePath();
  if (fill) { ctx.globalAlpha = opts.fillAlpha ?? 1; ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.globalAlpha = opts.strokeAlpha ?? 1;
    ctx.strokeStyle = stroke; ctx.lineWidth = opts.width ?? 2;
    if (opts.dash) ctx.setLineDash(opts.dash);
    ctx.stroke();
  }
  ctx.restore();
};

LA.draw.line = function (ctx, cam, p1, p2, color, opts = {}) {
  const a = cam.toS(p1), b = cam.toS(p2);
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.strokeStyle = color; ctx.lineWidth = opts.width ?? 1.5;
  if (opts.dash) ctx.setLineDash(opts.dash);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.restore();
};

/* 虚线延长整条过原点的直线（方向为 dir） */
LA.draw.spanLine = function (ctx, cam, dir, color, opts = {}) {
  const n = LA.v.norm(dir);
  const R = (Math.max(cam.w, cam.h) / cam.ppu) * 1.5 / Math.max(0.35, Math.min(Math.abs(n.x), Math.abs(n.y)));
  LA.draw.line(ctx, cam, LA.v.scale(n, -R), LA.v.scale(n, R), color, { ...opts, dash: opts.dash || [7, 6] });
};

/* =========================================================
 * UI 组件：矩阵输入、面板刷新
 * ========================================================= */
/* 生成 2×2 矩阵输入 HTML。cls 额外类名；M 当前值 */
LA.ui = {};
LA.ui.mat2HTML = function (id, M, opts = {}) {
  const ro = opts.readonly ? " readonly" : "";
  return `<div class="mx ${opts.cls || ""}${ro ? " readonly" : ""}" data-mx="${id}">
    <div class="mx-grid">
      <input type="number" step="0.1" id="${id}-a" value="${LA.fmt2(M.a)}"${ro}>
      <input type="number" step="0.1" id="${id}-b" value="${LA.fmt2(M.b)}"${ro}>
      <input type="number" step="0.1" id="${id}-c" value="${LA.fmt2(M.c)}"${ro}>
      <input type="number" step="0.1" id="${id}-d" value="${LA.fmt2(M.d)}"${ro}>
    </div>
  </div>`;
};

LA.ui.mat2Bind = function (root, id, onChange) {
  const wrap = root.querySelector(`[data-mx="${id}"]`);
  if (!wrap) return;
  ["a", "b", "c", "d"].forEach((k) => {
    const inp = wrap.querySelector(`#${id}-${k}`);
    inp.addEventListener("input", () => {
      const val = parseFloat(inp.value);
      if (!isFinite(val)) return;
      const M = LA.ui._readMat2(wrap, id);
      onChange(M, k, val);
    });
  });
};
LA.ui._readMat2 = function (wrap, id) {
  const g = (k) => { const v = parseFloat(wrap.querySelector(`#${id}-${k}`).value); return isFinite(v) ? v : 0; };
  return { a: g("a"), b: g("b"), c: g("c"), d: g("d") };
};
/* 回写输入框的值，但跳过当前获得焦点的输入框 ——
   否则用户每敲一个键都会被格式化值覆盖（"0"→"0.00"、光标跳动、续输异常） */
function setNumSafe(inp, v) {
  if (inp && document.activeElement !== inp) inp.value = LA.fmt2(v);
}

LA.ui.setMat2 = function (root, id, M) {
  const wrap = root.querySelector(`[data-mx="${id}"]`);
  if (!wrap) return;
  setNumSafe(wrap.querySelector(`#${id}-a`), M.a);
  setNumSafe(wrap.querySelector(`#${id}-b`), M.b);
  setNumSafe(wrap.querySelector(`#${id}-c`), M.c);
  setNumSafe(wrap.querySelector(`#${id}-d`), M.d);
};

LA.ui.mat3HTML = function (id, M, opts = {}) {
  const ro = opts.readonly ? " readonly" : "";
  let cells = "";
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
    cells += `<input type="number" step="0.1" id="${id}-${i}${j}" value="${LA.fmt2(M[i][j])}"${ro}>`;
  return `<div class="mx mx3" data-mx="${id}"><div class="mx-grid" style="--cols:3">${cells}</div></div>`;
};
LA.ui.mat3Bind = function (root, id, onChange) {
  const wrap = root.querySelector(`[data-mx="${id}"]`);
  if (!wrap) return;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    wrap.querySelector(`#${id}-${i}${j}`).addEventListener("input", () => {
      const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const v = parseFloat(wrap.querySelector(`#${id}-${r}${c}`).value);
        M[r][c] = isFinite(v) ? v : 0;
      }
      onChange(M);
    });
  }
};
LA.ui.setMat3 = function (root, id, M) {
  const wrap = root.querySelector(`[data-mx="${id}"]`);
  if (!wrap) return;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
    setNumSafe(wrap.querySelector(`#${id}-${i}${j}`), M[i][j]);
};

/* 矩阵值的小徽章显示（只读，画在面板里） */
LA.ui.mat2Chip = function (M, color = "#79b8ff") {
  const f = (x) => LA.fmt2(x);
  return `<span class="mono" style="color:${color}">[${f(M.a)}, ${f(M.b)}; ${f(M.c)}, ${f(M.d)}]</span>`;
};

/* =========================================================
 * 变换场景公共绘制：原网格 + 变换后网格 + 基向量 + 拖拽点
 * ========================================================= */
LA.draw.transformWorld = function (ctx, cam, M, opts = {}) {
  const showOriginal = opts.showOriginal !== false;
  if (showOriginal) {
    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#2c3849" });
  }
  // 变换后的网格
  LA.draw.grid(ctx, cam, { matrix: M, color: opts.gridColor || "#2c4470", width: 1.2, emphasis: "#4a6ba6" });
  LA.draw.axes(ctx, cam, { matrix: M, color: "#4f6fa5", width: 1.8 });

  const c1 = LA.col1(M), c2 = LA.col2(M);
  // 列向量 = 基向量的落点
  LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, "#7ee787", { width: 3.5, label: "î′", head: 12 });
  LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, "#ff7b72", { width: 3.5, label: "ĵ′", head: 12 });
  return { c1, c2 };
};

/* 把多个候选拖拽点做命中测试（屏幕距离） */
LA.hitHandle = function (sx, sy, cam, worldP, radius = 18) {
  const s = cam.toS(worldP);
  return Math.hypot(sx - s.x, sy - s.y) <= radius;
};

/* =========================================================
 * Cam3 —— 轻量 3D 相机：偏航/俯仰轨道视角 + 透视投影
 * 供叉积等 3D 场景复用（three-d 场景保留自带的实现）
 * ========================================================= */
LA.Cam3 = class {
  constructor() { this.yaw = 0.6; this.pitch = 0.4; this.zoom = 1; this.FOCAL = 9; }
  basis() {
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const eye = { x: 10 * cp * Math.cos(this.yaw), y: 10 * cp * Math.sin(this.yaw), z: 10 * sp };
    const L = Math.hypot(eye.x, eye.y, eye.z) || 1;
    const f = { x: -eye.x / L, y: -eye.y / L, z: -eye.z / L };   // forward
    let rx = f.y, ry = -f.x;                                     // f × (0,0,1)
    const rl = Math.hypot(rx, ry) || 1;
    const r = { x: rx / rl, y: ry / rl, z: 0 };
    const u = { x: r.y * f.z, y: -r.x * f.z, z: r.x * f.y - r.y * f.x }; // r × f
    return { eye, f, r, u };
  }
  scaleFor(w, h) { return (Math.min(w, h) / 8.2) * this.zoom; }
  proj(p, w, h) {
    const { eye, f, r, u } = this.basis();
    const rel = { x: p.x - eye.x, y: p.y - eye.y, z: p.z - eye.z };
    const depth = Math.max(rel.x * f.x + rel.y * f.y + rel.z * f.z, 0.6);
    const px = rel.x * r.x + rel.y * r.y + rel.z * r.z;
    const py = rel.x * u.x + rel.y * u.y + rel.z * u.z;
    const pf = (this.FOCAL / depth) * this.scaleFor(w, h);
    return { x: w / 2 + px * pf, y: h / 2 - py * pf, depth };
  }
  /* 屏幕点 → 拾取射线与水平面 z=z0 的交点（用于在 3D 里拖拽向量） */
  unprojectToPlane(sx, sy, w, h, z0) {
    const { eye, f, r, u } = this.basis();
    const s = this.scaleFor(w, h);
    const dx = (sx - w / 2) / s, dy = -(sy - h / 2) / s;
    const d = {
      x: dx * r.x + dy * u.x + this.FOCAL * f.x,
      y: dx * r.y + dy * u.y + this.FOCAL * f.y,
      z: dx * r.z + dy * u.z + this.FOCAL * f.z,
    };
    if (Math.abs(d.z) < 1e-6) return null;
    const t = (z0 - eye.z) / d.z;
    if (t <= 0) return null;
    return { x: eye.x + t * d.x, y: eye.y + t * d.y, z: z0 };
  }
  line(ctx, w, h, a, b, color, width = 1, alpha = 1, dash = null) {
    const A = this.proj(a, w, h), B = this.proj(b, w, h);
    ctx.save();
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    ctx.restore();
  }
  /* 3D 箭头：线身 + 屏幕空间箭头头部 */
  arrow(ctx, w, h, from, to, color, opts = {}) {
    const o = this.proj(from, w, h), tv = this.proj(to, w, h);
    const dx = tv.x - o.x, dy = tv.y - o.y, L = Math.hypot(dx, dy);
    if (L < 2) return;
    const head = opts.head ?? 11, ux = dx / L, uy = dy / L;
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = opts.width ?? 3.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(tv.x - ux * head * .7, tv.y - uy * head * .7); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tv.x, tv.y);
    ctx.lineTo(tv.x - ux * head - uy * head * .42, tv.y - uy * head + ux * head * .42);
    ctx.lineTo(tv.x - ux * head + uy * head * .42, tv.y - uy * head - ux * head * .42);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
};
