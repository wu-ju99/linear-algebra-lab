/* =========================================================
 * scenes11.js —— 多项式实验室 / 整除与最大公因式 / 排列与行列式 / 初等矩阵消元 / Gram-Schmidt
 * ========================================================= */
"use strict";

/* ---------- 多项式工具（系数数组，index = 次数） ---------- */
function polyTrim(a) { const r = a.slice(); while (r.length > 1 && Math.abs(r[r.length - 1]) < 1e-9) r.pop(); return r; }
function polyDeg(a) { return polyTrim(a).length - 1; }
function polyEval(a, x) { let s = 0; for (let i = a.length - 1; i >= 0; i--) s = s * x + a[i]; return s; }
function polyMul(a, b) { const r = new Array(a.length + b.length - 1).fill(0); for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) r[i + j] += a[i] * b[j]; return polyTrim(r); }
function polyStr(a) {
  const t = polyTrim(a);
  if (t.length === 1 && Math.abs(t[0]) < 1e-9) return "0";
  const parts = [];
  for (let i = t.length - 1; i >= 0; i--) {
    const c = t[i];
    if (Math.abs(c) < 1e-9) continue;
    const sign = c > 0 ? (parts.length ? " + " : "") : (parts.length ? " − " : "−");
    const abs = Math.abs(c);
    if (i === 0) parts.push(sign + LA.fmt(abs));
    else {
      const coef = Math.abs(abs - 1) < 1e-9 ? "" : LA.fmt(abs);
      parts.push(sign + coef + (i === 1 ? "x" : `x^${i}`));
    }
  }
  return parts.join("") || "0";
}
function polyDivRem(f, g) {
  f = polyTrim(f); g = polyTrim(g);
  let r = f.slice();
  const dg = g.length - 1;
  if (dg === 0 && Math.abs(g[0]) < 1e-9) return { q: [0], r: f.slice() };
  const q = new Array(Math.max(1, r.length - dg)).fill(0);
  let guard = 0;
  while (guard++ < 200) {
    r = polyTrim(r);
    if (r.length - 1 < dg) break;
    if (r.length === 1 && Math.abs(r[0]) < 1e-9) break;  // 余式为零：除法结束
    const coef = r[r.length - 1] / g[g.length - 1];
    const shift = r.length - 1 - dg;
    q[shift] += coef;
    for (let i = 0; i <= dg; i++) r[shift + i] -= coef * g[i];
  }
  return { q: polyTrim(q), r: polyTrim(r) };
}
/* 辗转相除求最大公因式（首一化） */
function polyGCDSteps(f, g) {
  let a = polyTrim(f), b = polyTrim(g);
  const steps = [];
  let guard = 0;
  while (guard++ < 20) {
    const { q, r } = polyDivRem(a, b);
    steps.push({ a: a.slice(), b: b.slice(), q: q.slice(), r: r.slice() });
    if (polyDeg(r) < 0 || (r.length === 1 && Math.abs(r[0]) < 1e-9)) break;
    a = b; b = r;
  }
  // 最后的非零余式（首一化）= 最大公因式
  let last = b;
  for (const st of steps) {
    const rt = polyTrim(st.r);
    const isZero = rt.length === 1 && Math.abs(rt[0]) < 1e-9;
    if (!isZero) last = rt;   // 取最后一个"非零"余式
  }
  last = polyTrim(last);
  const lead = last[last.length - 1] || 1;
  return { steps, gcd: last.map(c => c / lead) };
}

/* ============================================================
 * 多项式实验室：拖根看图像（因式分解 / 重根 / 共轭成对）
 * ============================================================ */
LA.scenes.push({
  id: "poly-lab", icon: "ƒ", name: "多项式实验室：根与图像",
  tagline: "拖动复平面上的根，左边函数图像立刻变形",
  newCam: () => null,

  state: {
    r1: -1.5, r2: 1,          // 实根（只能在实轴上拖）
    c: { x: 0.5, y: 1.2 },    // 复根（共轭自动镜像）
    camC: new LA.Cam2D(56),
    plot: { c: 0, z: 1, cy: 0 }, // 图像区：x 视窗中心 / 缩放 / 纵向平移偏移
  },

  /* 有效根列表（含共轭）与重数聚类 */
  effRoots() {
    const S = this.state;
    const list = [{ x: S.r1, y: 0 }, { x: S.r2, y: 0 }, { x: S.c.x, y: S.c.y }, { x: S.c.x, y: -S.c.y }];
    const grouped = [];
    list.forEach((r) => {
      const found = grouped.find((g) => Math.hypot(g.re - r.x, g.im - r.y) < 0.06);
      if (found) found.m++;
      else grouped.push({ re: r.x, im: r.y, m: 1 });
    });
    return grouped;
  },

  /* 展开系数（实系数，index=次数，最高 4） */
  coeffs() {
    const rs = this.effRoots();
    let poly = [1];
    rs.forEach((r) => {
      if (Math.abs(r.im) < 1e-9) {
        poly = polyMul(poly, [-r.re, 1]);
      } else if (r.im > 1e-9) {
        // 复根对只贡献一个实二次因式；im<0 的是镜像，跳过
        poly = polyMul(poly, [r.re * r.re + r.im * r.im, -2 * r.re, 1]);
      }
    });
    return poly;
  },

  /* y = p(x)：实数求值（r1、r2 实根 + 复根对 (x−c)(x−c̄)） */
  P(x) {
    const S = this.state;
    let p = (x - S.r1) * (x - S.r2);
    p *= (x - S.c.x) * (x - S.c.x) + S.c.y * S.c.y;
    return p;
  },

  dP(x) { const e = 1e-4; return (this.P(x + e) - this.P(x - e)) / (2 * e); },

  draw(ctx, cam, app, t) {
    const w = cam.w, h = cam.h;
    const S = this.state;
    const plotW = w * 0.58, cpW = w - plotW;
    S.camC.setSize(cpW, h);

    /* 左：实函数图像 y = P(x)（Y 自适应 + 滚轮缩放 + 拖动平移） */
    const halfX = 4.5 / S.plot.z;
    const X0 = S.plot.c - halfX, X1 = S.plot.c + halfX;
    const N = 300, xs = [];
    for (let i = 0; i <= N; i++) xs.push(X0 + (i / N) * (X1 - X0));
    // Y 范围自适应：以可见窗口内 p 值的中位为中心、92 分位绝对值定跨度
    // （防个别爆炸点把视野撑爆，尾巴被裁剪，可用滚轮缩放细看）
    const fin = xs.map(x => this.P(x)).filter(v => isFinite(v));
    const sortedAbs = fin.map(Math.abs).sort((a, b) => a - b);
    const yReach = sortedAbs.length ? sortedAbs[Math.floor(sortedAbs.length * 0.92)] : 1;
    const sortedY = fin.slice().sort((a, b) => a - b);
    const midY = sortedY.length ? sortedY[Math.floor(sortedY.length / 2)] : 0;
    const span = yReach * 1.35 + 0.6;
    this._ySpan = span;           // 供纵向拖动换算 像素→世界坐标
    let YLo = midY + S.plot.cy - span, YHi = midY + S.plot.cy + span;
    if (YHi - YLo > 400) { const m2 = (YHi + YLo) / 2; YLo = m2 - 200; YHi = m2 + 200; }
    const rs = this.effRoots();   // 左右两块（图像/复平面）共用
    const toPX = (x) => (x - X0) / (X1 - X0) * plotW;
    const toPY = (y) => h - (y - YLo) / (YHi - YLo) * h;
    // 网格（自适应步长）
    const niceStep = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
    const sxStep = niceStep((X1 - X0) / 9), syStep = niceStep((YHi - YLo) / 8);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, plotW, h); ctx.clip();
    ctx.strokeStyle = "#1d2634"; ctx.lineWidth = 1;
    for (let gx = Math.ceil(X0 / sxStep) * sxStep; gx <= X1; gx += sxStep) { ctx.beginPath(); ctx.moveTo(toPX(gx), 0); ctx.lineTo(toPX(gx), h); ctx.stroke(); }
    for (let gy = Math.ceil(YLo / syStep) * syStep; gy <= YHi; gy += syStep) { ctx.beginPath(); ctx.moveTo(0, toPY(gy)); ctx.lineTo(plotW, toPY(gy)); ctx.stroke(); }
    ctx.strokeStyle = "#39455a"; ctx.lineWidth = 1.5;
    if (YLo <= 0 && YHi >= 0) { ctx.beginPath(); ctx.moveTo(0, toPY(0)); ctx.lineTo(plotW, toPY(0)); ctx.stroke(); }
    if (X0 <= 0 && X1 >= 0) { ctx.beginPath(); ctx.moveTo(toPX(0), 0); ctx.lineTo(toPX(0), h); ctx.stroke(); }
    // p(x) 曲线（裁剪在视窗内）
    ctx.strokeStyle = "#ffa657"; ctx.lineWidth = 2.6;
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i <= N; i++) {
      const y = this.P(xs[i]);
      if (!isFinite(y)) { pen = false; continue; }
      const sx = toPX(xs[i]), sy = toPY(y);
      if (!pen) { ctx.moveTo(sx, sy); pen = true; } else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    // 导数 p'(x) 虚线
    ctx.strokeStyle = "rgba(121,184,255,.6)"; ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    pen = false;
    for (let i = 0; i <= N; i++) {
      const y = this.dP(xs[i]);
      if (!isFinite(y)) { pen = false; continue; }
      const sx = toPX(xs[i]), sy = toPY(y);
      if (!pen) { ctx.moveTo(sx, sy); pen = true; } else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // 实轴上的根（含重数）：仅当 x 轴在视野内
    if (YLo <= 0 && YHi >= 0) {
      rs.filter(r => Math.abs(r.im) < 1e-9).forEach((r) => {
        ctx.fillStyle = r.m >= 2 ? "#ff7b72" : "#7ee787";
        ctx.beginPath(); ctx.arc(toPX(r.re), toPY(0), 5.5, 0, Math.PI * 2); ctx.fill();
        if (r.m >= 2) LA.draw.label(ctx, { w: plotW, h, toS: (p) => p }, { x: toPX(r.re), y: toPY(0) },
          `${LA.fmt(r.re)}（${r.m}重根：与 x 轴相切）`, "#ff7b72", { fontSize: 11, dy: -14, center: true });
      });
    }
    ctx.restore();
    LA.draw.label(ctx, null, { x: 0, y: 0 }, "y = p(x)（橙）；虚线 = p′(x)。图像区：滚轮缩放，拖动平移（上下左右均可）", "#8b98a9",
      { screen: { x: 14, y: 14 }, fontSize: 12 });
    LA.draw.label(ctx, null, { x: 0, y: 0 }, `视野 x ∈ [${LA.fmt(X0)}, ${LA.fmt(X1)}]`, "#5b6675",
      { screen: { x: 14, y: h - 18 }, fontSize: 11 });

    /* 右：复平面（根的分布） */
    ctx.save();
    ctx.translate(plotW, 0);
    ctx.beginPath(); ctx.rect(0, 0, cpW, h); ctx.clip();
    const camC = S.camC;
    LA.draw.grid(ctx, camC, { color: "#1d2634" });
    LA.draw.axes(ctx, camC, { color: "#2c3849" });
    // 实轴上的根
    rs.filter(r => Math.abs(r.im) < 1e-9).forEach((r) => {
      LA.draw.dot(ctx, camC, { x: r.re, y: 0 }, r.m >= 2 ? "#ff7b72" : "#7ee787", 6);
    });
    // 复根对
    const c = S.c;
    if (c.y > 1e-9) {
      LA.draw.dot(ctx, camC, { x: c.x, y: c.y }, "#d2a8ff", 6);
      LA.draw.dot(ctx, camC, { x: c.x, y: -c.y }, "rgba(210,168,255,.5)", 6);
      LA.draw.line(ctx, camC, { x: c.x, y: c.y }, { x: c.x, y: -c.y }, "rgba(210,168,255,.5)", { width: 1.2, dash: [4, 4] });
      LA.draw.label(ctx, camC, { x: c.x, y: c.y }, `${LA.fmt(c.x)}+${LA.fmt(c.y)}i`, "#d2a8ff", { fontSize: 11, dx: 10 });
      LA.draw.label(ctx, camC, { x: c.x, y: -c.y }, `共轭 ${LA.fmt(c.x)}−${LA.fmt(c.y)}i`, "#d2a8ff", { fontSize: 11, dx: 10, dy: 14 });
    } else {
      LA.draw.handle(ctx, camC, { x: c.x, y: 0 }, "#ffd75e", { hover: this._dragId === "c" || this._hoverId === "c" });
    }
    // 拖动导轨：实根只能沿实轴滑动
    if (this._dragId === "r1" || this._dragId === "r2") {
      const xr = this._dragId === "r1" ? S.r1 : S.r2;
      LA.draw.line(ctx, camC, { x: -5, y: 0 }, { x: 5, y: 0 }, "rgba(240,180,41,.45)", { width: 3 });
      if (this._cursorC) LA.draw.line(ctx, camC, this._cursorC, { x: xr, y: 0 }, "rgba(240,180,41,.6)", { width: 1.4, dash: [3, 3] });
    }
    if (this._dragId === "c") {
      LA.draw.line(ctx, camC, { x: S.c.x, y: -5 }, { x: S.c.x, y: 5 }, "rgba(240,180,41,.45)", { width: 1.5, dash: [4, 4] });
    }
    // 实根手柄（附数值标签，r₁ 在上、r₂ 在下避免重叠）
    LA.draw.handle(ctx, camC, { x: S.r1, y: 0 }, "#f0b429", { hover: this._dragId === "r1" || this._hoverId === "r1" });
    LA.draw.handle(ctx, camC, { x: S.r2, y: 0 }, "#f0b429", { hover: this._dragId === "r2" || this._hoverId === "r2" });
    LA.draw.label(ctx, camC, { x: S.r1, y: 0 }, `r₁ = ${LA.fmt(S.r1)}`, "#ffd75e", { fontSize: 11, dy: -18, center: true });
    LA.draw.label(ctx, camC, { x: S.r2, y: 0 }, `r₂ = ${LA.fmt(S.r2)}`, "#ffd75e", { fontSize: 11, dy: 20, center: true });
    if (c.y > 1e-9) LA.draw.handle(ctx, camC, { x: c.x, y: c.y }, "#f0b429", { hover: this._dragId === "c" || this._hoverId === "c" });
    ctx.restore();
    LA.draw.label(ctx, null, { x: 0, y: 0 }, "复平面：实系数 ⟹ 复根必共轭成对（镜像）；金色端点可拖", "#8b98a9",
      { screen: { x: plotW + 14, y: 14 }, fontSize: 12 });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const cv = document.getElementById("cv");
    const plotW = cv._cssW * 0.58;
    // 图像区：拖动 = 平移（滚轮缩放见 onWheel）
    if (sx < plotW) {
      this._lastPX = sx; this._lastPY = sy;   // 新一次拖动清掉上次残留，避免第一帧跳变
      return {
        id: "plot-pan", cursor: "grab",
        drag: (p, c2, dsx, dsy) => {
          const span = 9 / S.plot.z;
          S.plot.c = LA.clamp(S.plot.c - (dsx - (this._lastPX ?? dsx)) * span / plotW, -30, 30);
          const ySpan = (this._ySpan ?? 1) * 2;
          S.plot.cy = LA.clamp(S.plot.cy + (dsy - (this._lastPY ?? dsy)) * ySpan / cv._cssH, -600, 600);
          this._lastPX = dsx; this._lastPY = dsy;
        },
      };
    }
    const lcx = sx - plotW;
    const near = (r, rr = 18) => Math.hypot(lcx - S.camC.toS({ x: r.x, y: r.y }).x, sy - S.camC.toS({ x: r.x, y: r.y }).y) <= rr;
    // 注意：拖动中必须用"当前"鼠标横坐标（dsx），不能用按下时捕获的 lcx，
    // 否则实根完全不会跟随鼠标（曾因此"拖不动"）
    if (near({ x: S.r1, y: 0 })) return {
      id: "r1", cursor: "grab",
      drag: (p, c2, dsx, dsy) => {
        S.r1 = LA.clamp(LA.snap(S.camC.toW(dsx - plotW, dsy).x), -4, 4);
        this._cursorC = S.camC.toW(dsx - plotW, dsy);
      },
    };
    if (near({ x: S.r2, y: 0 })) return {
      id: "r2", cursor: "grab",
      drag: (p, c2, dsx, dsy) => {
        S.r2 = LA.clamp(LA.snap(S.camC.toW(dsx - plotW, dsy).x), -4, 4);
        this._cursorC = S.camC.toW(dsx - plotW, dsy);
      },
    };
    if (S.c.y > 1e-9 && near({ x: S.c.x, y: S.c.y })) return {
      id: "c", cursor: "grab",
      drag: (p, c2, dsx, dsy) => {
        const wp = S.camC.toW(dsx - plotW, dsy);
        S.c.x = LA.clamp(LA.snap(wp.x), -4, 4);
        S.c.y = Math.max(0, LA.snap(wp.y));
        this._cursorC = null;
      },
    };
    return null;
  },

  /* 图像区滚轮缩放（以光标为中心；Y 始终自适应无需缩放） */
  onWheel(x, y, deltaY) {
    const cv = document.getElementById("cv");
    const plotW = cv._cssW * 0.58;
    if (x >= plotW) return false;
    const S = this.state;
    const wx = S.plot.c + (x / plotW - 0.5) * (9 / S.plot.z);
    S.plot.z = LA.clamp(S.plot.z * (deltaY < 0 ? 1 / 1.15 : 1.15), 0.15, 12);
    S.plot.c = LA.clamp(wx - (x / plotW - 0.5) * (9 / S.plot.z), -30, 30);
    return true;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">因式分解（拖根实时生成）</div>
        <div class="panel-note" style="font-family:Consolas,monospace; font-size:12.5px; line-height:1.8" id="s32fac"></div>
        <div class="kv" style="margin-top:4px"><span class="k">展开式 p(x)</span></div>
        <div class="panel-note" style="font-family:Consolas,monospace; font-size:12.5px" id="s32expand"></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">诊断</div>
        <div class="kv"><span class="k">根的分布</span><span class="v" id="s32roots" style="font-size:12px"></span></div>
        <div class="kv"><span class="k">重根（与 x 轴相切）</span><span class="v" id="s32mult"></span></div>
        <div class="kv"><span class="k">有理根检验提示</span><span class="v" id="s32rat" style="font-size:11.5px"></span></div>
        <button class="btn" id="s32reset" style="margin-top:8px">视野复位</button>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>因式分解定理</b>：每个 n 次复系数多项式恰有 n 个根（计重数），
          于是 p(x) = (x−r₁)(x−r₂)…(x−rₙ) —— 拖根就是在"装配"多项式。<br><br>
          <b>实系数的特权与代价</b>：复根必须<span class="hl-y">共轭成对</span>出现
          （拖紫色的复根，镜子里的分身自动跟随）；
          所以实系数多项式 = 实一次因式 × 实二次因式的乘积。<br><br>
          <b>重根</b>：把两个根拖到一起 —— 图像与 x 轴<span class="hl-r">相切而不穿过</span>，
          同时虚线的导数 p′ 也在这里归零（重根 ⟺ p 与 p′ 有公共根，
          这就是"重因式可用导数判别"的全部原理）。<br><br>
          <b>数域</b>：ℚ、ℝ、ℂ 对四则运算的封闭性逐步升级；
          ℂ 是代数封闭的 —— 任何多项式在 ℂ 里根都齐了，
          这就是根要在复平面上看的原因。<br><br>
          💡 有理系数时整系数化后，有理根 p/q 必满足 p｜常数项、q｜首项系数
          —— 试根有了方向。
        </div>
      </div>`;
    this._panel = el;
    el.querySelector("#s32reset").onclick = () => {
      S.plot.c = 0; S.plot.z = 1; S.plot.cy = 0;
      app.markDirty();
    };
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el || !document.contains(el)) return;
    const rs = this.effRoots();
    const facStr = rs.map((r) => {
      if (Math.abs(r.im) < 1e-9) return r.m === 1 ? `(x ${r.re >= 0 ? "−" : "+"} ${LA.fmt(Math.abs(r.re))})` : `(x ${r.re >= 0 ? "−" : "+"} ${LA.fmt(Math.abs(r.re))})^${r.m}`;
      return `(x² ${-2 * r.re >= 0 ? "+" : "−"} ${LA.fmt(Math.abs(2 * r.re))}x + ${LA.fmt(r.re * r.re + r.im * r.im)})^${r.m}`;
    }).join("");
    el.querySelector("#s32fac").textContent = "p(x) = " + facStr;
    el.querySelector("#s32expand").textContent = "p(x) = " + polyStr(this.coeffs());
    const real = rs.filter(r => Math.abs(r.im) < 1e-9).length;
    const cx = rs.filter(r => Math.abs(r.im) >= 1e-9).length;
    el.querySelector("#s32roots").textContent = `实根 ${real} 个 · 复根对 ${cx} 对`;
    const mult = rs.filter(r => r.m >= 2);
    el.querySelector("#s32mult").textContent = mult.length ? mult.map(r => LA.fmt(r.re)).join("、") + "（相切）" : "无（全部单根，都穿过 x 轴）";
    const c0 = this.coeffs()[0], cn = this.coeffs()[this.coeffs().length - 1];
    el.querySelector("#s32rat").textContent =
      `有理根 p/q：p 整除 ${LA.fmt(Math.round(c0 * 100) / 100)}，q 整除 ${LA.fmt(Math.round(cn * 100) / 100)}`;
  },
});

/* ============================================================
 * 整除与最大公因式（辗转相除）
 * ============================================================ */
LA.scenes.push({
  id: "gcd", icon: "∤", name: "整除与最大公因式",
  tagline: "带余除法 → 辗转相除 → 最大公因式（首一）",
  newCam: () => new LA.Cam2D(40),

  state: {
    f: [2, -1, -1, 1],   // x³ − x² − x + 2? 实际 = 2 − x − x² + x³
    g: [0, -1, 1],       // −x + x² = x² − x
    mode: "div",
  },

  steps() { return polyGCDSteps(this.state.f, this.state.g); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a" });
    const plotCurve = (poly, color, width) => {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.beginPath();
      let pen = false;
      const R = Math.max(cam.w, cam.h) / cam.ppu;
      for (let i = 0; i <= 300; i++) {
        const x = -R + (i / 300) * 2 * R;
        const y = polyEval(poly, x);
        if (!isFinite(y) || Math.abs(y) > R * 1.5) { pen = false; continue; }
        const s = cam.toS({ x, y });
        if (!pen) { ctx.moveTo(s.x, s.y); pen = true; } else ctx.lineTo(s.x, s.y);
      }
      ctx.stroke();
      ctx.restore();
    };
    const { gcd } = this.steps();
    plotCurve(S.f, "#79b8ff", 2.4);
    plotCurve(S.g, "#ff7b72", 2.4);
    plotCurve(gcd, "#f0b429", 3);
    // gcd 的根 = 公共根
    const dg = polyDeg(gcd);
    if (dg >= 1) {
      for (let x = -8; x <= 8; x += 0.02) {
        if (Math.abs(polyEval(gcd, x)) < 0.02) {
          const neighbors = [x - 0.03, x + 0.03].every(xx => Math.abs(polyEval(gcd, xx)) < 0.02);
          if (!neighbors) { LA.draw.dot(ctx, cam, { x, y: 0 }, "#f0b429", 5); x += 0.08; }
        }
      }
    }
    LA.draw.label(ctx, cam, { x: 0, y: 0 },
      `蓝 = f，红 = g，金 = 最大公因式（金点 = 公共根）`,
      "#8b98a9", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13, bold: true });
  },

  hitTest() { return null; },

  mountPanel(el, app) {
    const S = this.state;
    const coefInputs = (id, arr, n) => {
      let h = `<div style="display:flex; gap:4px; flex-wrap:wrap; margin:4px 0">`;
      for (let i = n; i >= 0; i--) {
        h += `<input type="number" step="0.5" id="${id}${i}" value="${LA.fmt(arr[i] || 0)}" style="width:52px" title="x^${i} 系数">`;
      }
      return h + `</div><div style="font-size:10.5px; color:var(--muted)">从左到右：常数项 → 最高次项</div>`;
    };
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">f(x)（≤3 次）与 g(x)（≤2 次）</div>
        <div class="mx-caption"><b style="color:#79b8ff">f</b> 的系数</div>
        ${coefInputs("s33f", S.f, 3)}
        <div class="mx-caption"><b style="color:#ff7b72">g</b> 的系数</div>
        ${coefInputs("s33g", S.g, 2)}
        <div class="btn-row">
          <button class="btn" data-p="divisible">g 整除 f</button>
          <button class="btn" data-p="common">有公因式</button>
          <button class="btn" data-p="coprime">互素</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">辗转相除（欧几里得算法）</div>
        <div class="panel-note" style="font-family:Consolas,monospace; font-size:12px; line-height:2" id="s33steps"></div>
        <div class="kv"><span class="k">最大公因式（首一）</span><span class="v" id="s33gcd" style="color:#f0b429"></span></div>
        <div class="kv"><span class="k">互素？</span><span class="v" id="s33coprime"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>整除</b>：f(x) = g(x)·h(x) 时称 g 整除 f。带余除法保证
          f = q·g + r（r = 0 或 deg r &lt; deg g），且 q、r <b>唯一</b>；
          g | f ⟺ r = 0。<br><br>
          <b>辗转相除</b>：f = q₁g + r₁，g = q₂r₁ + r₂，……
          最后一个非零余式（首一化）就是<b>最大公因式</b> ——
          和整数的欧几里得算法一模一样，且结果唯一。<br><br>
          <b>互素</b>：(f,g) = 1 ⟺ 存在 u(x)、v(x) 使 u·f + v·g = 1
          （裴蜀定理的多项式版）。<br><br>
          金色曲线的零点 = f 与 g 的<b>公共根</b>：
          最大公因式把"公共的东西"整个提取出来 ——
          g | f 时金色曲线与蓝色曲线的根完全重合。<br><br>
          📌 <b>数域</b>：ℚ、ℝ、ℂ 对加减乘封闭，除法逐级补齐
          （ℚ 除 3 不封闭 → ℝ 开方不封闭 → ℂ 全封闭 = 代数封闭，
          多项式根永远在 ℂ 里）。多项式的整除、因式分解都在一个取定的数域内谈。
        </div>
      </div>`;
    this._panel = el;

    [0, 1, 2, 3].forEach((i) => {
      const inp = el.querySelector(`#s33f${i}`);
      inp && inp.addEventListener("input", (e) => {
        const v = parseFloat(e.target.value);
        S.f[i] = isFinite(v) ? v : 0;
        this.refreshPanel();
      });
    });
    [0, 1, 2].forEach((i) => {
      const inp = el.querySelector(`#s33g${i}`);
      inp && inp.addEventListener("input", (e) => {
        const v = parseFloat(e.target.value);
        S.g[i] = isFinite(v) ? v : 0;
        this.refreshPanel();
      });
    });
    const presets = {
      divisible: { f: [0, -2, 1, 1], g: [-1, 1] },            // f = (x-1)²(x+2), g = x-1
      common: { f: [0, -1, 0, 1], g: [-1, 0, 1] },            // 公共 (x-1)
      coprime: { f: [0, 0, 1], g: [1, 1] },
    };
    el.querySelectorAll("[data-p]").forEach((btn) => btn.addEventListener("click", () => {
      const p = presets[btn.dataset.p];
      S.f = p.f.slice(); while (S.f.length < 4) S.f.push(0);
      S.g = p.g.slice(); while (S.g.length < 3) S.g.push(0);
      [0, 1, 2, 3].forEach((i) => { setNumSafe(el.querySelector(`#s33f${i}`), S.f[i] || 0); });
      [0, 1, 2].forEach((i) => { setNumSafe(el.querySelector(`#s33g${i}`), S.g[i] || 0); });
      this.refreshPanel();
    }));
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el || !document.contains(el)) return;
    const { steps, gcd } = this.steps();
    const rows = steps.map((st, i) =>
      `<div>${polyStr(st.a)} = (${polyStr(st.q)}) · (${polyStr(st.b)}) + ${polyStr(st.r)}</div>`).join("");
    el.querySelector("#s33steps").innerHTML = rows || "—";
    el.querySelector("#s33gcd").textContent = polyStr(gcd);
    const cop = polyDeg(gcd) === 0;
    const cp = el.querySelector("#s33coprime");
    cp.textContent = cop ? "互素 ✓（gcd = 1）" : "不互素";
    cp.style.color = cop ? "#7ee787" : "#ff9ec1";
  },
});

/* ============================================================
 * 排列与 n 阶行列式（3×3 展开）
 * ============================================================ */
LA.scenes.push({
  id: "perm-det", icon: "σ", name: "排列与行列式的定义",
  tagline: "det = Σ sign(σ)·a₁σ(1)a₂σ(2)a₃σ(3)：六项的来历",
  newCam: () => null,

  state: {
    M3: [[1, 2, 3], [0, 1, 4], [5, 6, 0]],
    sel: 0,           // 选中排列 0..5
    autoplay: false, t0: 0,
  },

  perms() {
    const P = [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]];
    return P.map((p) => {
      let inv = 0;
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (p[i] > p[j]) inv++;
      return { p, inv, sign: inv % 2 === 0 ? 1 : -1 };
    });
  },

  det3() {
    const M = this.state.M3;
    return this.perms().reduce((s, { p, sign }) => s + sign * M[0][p[0] - 1] * M[1][p[1] - 1] * M[2][p[2] - 1], 0);
  },

  draw(ctx, cam, app, t) {
    const w = cam.w, h = cam.h;
    const S = this.state;
    const perms = this.perms();
    if (S.autoplay && t - S.t0 > 1.2) { S.sel = (S.sel + 1) % 6; S.t0 = t; }
    const cur = perms[S.sel];
    const det = this.det3();

    /* 左：排列连线图 */
    const diagW = w * 0.42;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, diagW, h); ctx.clip();
    const cx = diagW / 2, top = 130, bot = h - 130, gap = 90;
    const dotX = (i) => cx + (i - 1) * gap;
    // 逆序连线（红）
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      if (cur.p[i] > cur.p[j]) {
        LA.draw.line(ctx, { w: diagW, h, toS: (p) => p }, { x: dotX(i), y: top }, { x: dotX(j), y: bot }, "rgba(255,123,114,.75)", { width: 2.4 });
      }
    }
    for (let i = 0; i < 3; i++) {
      LA.draw.line(ctx, { w: diagW, h, toS: (p) => p }, { x: dotX(i), y: top }, { x: dotX(cur.p[i] - 1), y: bot },
        cur.sign > 0 ? "rgba(126,231,135,.8)" : "rgba(255,123,114,.8)", { width: 2.2 });
      LA.draw.dot(ctx, { w: diagW, h, toS: (p) => p }, { x: dotX(i), y: top }, "#e6edf3", 5);
      LA.draw.dot(ctx, { w: diagW, h, toS: (p) => p }, { x: dotX(cur.p[i] - 1), y: bot }, "#e6edf3", 5);
      LA.draw.label(ctx, { w: diagW, h, toS: (p) => p }, { x: dotX(i), y: top - 22 }, `${i + 1}`, "#8b98a9", { fontSize: 12, center: true });
      LA.draw.label(ctx, { w: diagW, h, toS: (p) => p }, { x: dotX(cur.p[i] - 1), y: bot + 22 }, `σ(${i + 1})=${cur.p[i]}`, "#f0b429", { fontSize: 12, center: true });
    }
    LA.draw.label(ctx, { w: diagW, h, toS: (p) => p }, { x: cx, y: 50 },
      `σ = (${cur.p.join(", ")})   逆序数 τ = ${cur.inv}`, cur.sign > 0 ? "#7ee787" : "#ff7b72", { fontSize: 14, bold: true, center: true });
    LA.draw.label(ctx, { w: diagW, h, toS: (p) => p }, { x: cx, y: 80 },
      `sign(σ) = (−1)^τ = ${cur.sign > 0 ? "+1（偶排列）" : "−1（奇排列）"}`, cur.sign > 0 ? "#7ee787" : "#ff7b72", { fontSize: 13, center: true });
    LA.draw.label(ctx, { w: diagW, h, toS: (p) => p }, { x: cx, y: 110 },
      "红线 = 逆序对（上方交叉处）", "#8b98a9", { fontSize: 11, center: true });
    ctx.restore();

    /* 右：3×3 矩阵网格 + 选中项 + 各项累加 */
    const gx = diagW + 30, gy = h / 2 - 150, cell = 84;
    ctx.save();
    ctx.beginPath(); ctx.rect(diagW, 0, w - diagW, h); ctx.clip();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const x = gx + j * cell, y = gy + i * cell;
      const picked = cur.p[i] - 1 === j;
      ctx.fillStyle = picked ? "rgba(240,180,41,.22)" : "rgba(21,28,38,.9)";
      ctx.strokeStyle = picked ? "#f0b429" : "#263042";
      ctx.lineWidth = picked ? 2 : 1;
      ctx.beginPath(); ctx.rect(x, y, cell - 6, cell - 6); ctx.fill(); ctx.stroke();
      LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: x + (cell - 6) / 2, y: y + (cell - 6) / 2 },
        LA.fmt(S.M3[i][j]), picked ? "#f0b429" : "#8b98a9", { fontSize: 16, bold: picked, center: true, bg: false });
    }
    // 项的算式
    const term = cur.sign * S.M3[0][cur.p[0] - 1] * S.M3[1][cur.p[1] - 1] * S.M3[2][cur.p[2] - 1];
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: gx + 20, y: gy + 3 * cell + 30 },
      `本项 = ${cur.sign > 0 ? "+" : "−"} a₁${cur.p[0]}·a₂${cur.p[1]}·a₃${cur.p[2]} = ${LA.fmt(term)}`,
      cur.sign > 0 ? "#7ee787" : "#ff7b72", { fontSize: 14, bold: true });
    ctx.restore();

    // 六项求和
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: diagW + 30, y: 40 },
      "det 的六项（3! = 6 个排列）：", "#8b98a9", { fontSize: 12.5 });
    perms.forEach((pm, i) => {
      const v = pm.sign * S.M3[0][pm.p[0] - 1] * S.M3[1][pm.p[1] - 1] * S.M3[2][pm.p[2] - 1];
      LA.draw.label(ctx, { w, h, toS: (p) => p },
        { x: diagW + 40 + (i % 3) * 175, y: 70 + Math.floor(i / 3) * 30 },
        `${pm.sign > 0 ? "+" : "−"}${LA.fmt(Math.abs(v))}`,
        i === S.sel ? "#f0b429" : (pm.sign > 0 ? "rgba(126,231,135,.7)" : "rgba(255,123,114,.7)"),
        { fontSize: 13, bold: i === S.sel });
    });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: diagW + 30, y: 140 },
      `Σ = det = ${LA.fmt(det)}`, "#7ee787", { fontSize: 16, bold: true });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: diagW + 30, y: h - 20 },
      "上一/下一项：点击面板的排列按钮，或打开自动轮播", "#5b6675", { fontSize: 11.5 });
  },

  hitTest() { return null; },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">矩阵（3×3，可改）</div>
        <div style="display:grid; grid-template-columns:repeat(3,60px); gap:4px" id="s34grid"></div>
        <div class="btn-row">
          <button class="btn" id="s34prev">‹ 上一排列</button>
          <button class="btn" id="s34next">下一排列 ›</button>
          <button class="btn" id="s34auto">▶ 自动轮播</button>
        </div>
        <div class="btn-row" id="s34permBtns"></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">det = <span id="s34det"></span></div>
        <div class="panel-note" style="font-family:Consolas,monospace; font-size:11.5px; line-height:1.9" id="s34terms"></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          n 阶行列式定义里每一样东西都能看见：<br><br>
          · <b>排列 σ</b>：把 1,2,3 重新排队，共 3! = 6 种 —— 每种给出行列式的一项<br>
          · <b>逆序数 τ</b>：连线图的<b>交叉次数</b>（红线）—— 大数排在小数前面记一次<br>
          · <span class="hl-y">sign(σ) = (−1)^τ</span>：偶排列带 + 号，奇排列带 − 号<br>
          · 一项 = <b>取遍每行每列各一个</b>的三个元素相乘，再乘 sign<br><br>
          行列式就是这 6 项的代数和 —— "所有对角线方案的正负加权总和"。
          奇偶性解释了所有性质：换两行 = 每项变号 → det 变号；
          两行相同 → 项两两抵消 → det = 0。<br><br>
          按行展开：det = Σⱼ aᵢⱼAᵢⱼ，其中代数余子式
          Aᵢⱼ = (−1)^(i+j)·Mᵢⱼ（划掉第 i 行第 j 列的 2×2 行列式）。
          这就是"降维计算"的通道（3×3 → 2×2）。<br><br>
          💡 Cramer 法则（第 9 章方程组）就是用行列式比值得出解 ——
          几何上 = 面积/体积的比值。
        </div>
      </div>`;
    this._panel = el;

    const grid = el.querySelector("#s34grid");
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const inp = document.createElement("input");
      inp.type = "number"; inp.step = "0.5"; inp.value = LA.fmt(S.M3[i][j]);
      inp.addEventListener("input", () => {
        const v = parseFloat(inp.value);
        if (isFinite(v)) S.M3[i][j] = v;
      });
      grid.appendChild(inp);
    }
    el.querySelector("#s34prev").addEventListener("click", () => { S.autoplay = false; S.sel = (S.sel + 5) % 6; this.refreshPanel(); });
    el.querySelector("#s34next").addEventListener("click", () => { S.autoplay = false; S.sel = (S.sel + 1) % 6; this.refreshPanel(); });
    el.querySelector("#s34auto").addEventListener("click", (e) => {
      S.autoplay = !S.autoplay; S.t0 = LA.app.now();
      e.target.textContent = S.autoplay ? "⏸ 停止轮播" : "▶ 自动轮播";
    });
    const pb = el.querySelector("#s34permBtns");
    this.perms().forEach((pm, i) => {
      const b = document.createElement("button");
      b.className = "btn";
      b.style.cssText = "flex:0 0 auto; padding:4px 8px; font-size:11px";
      b.textContent = `(${pm.p.join(",")}) ${pm.sign > 0 ? "+" : "−"}`;
      b.style.color = pm.sign > 0 ? "#7ee787" : "#ff7b72";
      b.addEventListener("click", () => { S.autoplay = false; S.sel = i; this.refreshPanel(); });
      pb.appendChild(b);
    });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el || !document.contains(el)) return;
    el.querySelector("#s34det").textContent = LA.fmt(this.det3());
    const terms = this.perms().map(({ p, sign }) => {
      const v = sign * S.M3[0][p[0] - 1] * S.M3[1][p[1] - 1] * S.M3[2][p[2] - 1];
      return `${sign > 0 ? "+" : "−"}(${LA.fmt(S.M3[0][p[0] - 1])}·${LA.fmt(S.M3[1][p[1] - 1])}·${LA.fmt(S.M3[2][p[2] - 1])}) = ${LA.fmt(v)}`;
    }).join("<br>");
    el.querySelector("#s34terms").innerHTML = terms;
  },
});

/* ============================================================
 * 初等矩阵与高斯消元（行变换不改变解）
 * ============================================================ */
LA.scenes.push({
  id: "elementary", icon: "Ξ", name: "初等矩阵与消元",
  tagline: "行变换 = 左乘初等矩阵；解（交点）从不移动",
  newCam: () => new LA.Cam2D(56),

  state: {
    rows: [[2, 1, 5], [1, -1, 1]],   // 增广 [A | b]
    k: 1,
    lastE: null,
    cumulative: null,                 // 累计 P
  },

  reset() {
    this.state.rows = [[2, 1, 5], [1, -1, 1]];
    this.state.lastE = null; this.state.cumulative = null;
  },

  apply(op) {
    const S = this.state, r = S.rows, k = S.k;
    let E = null;
    if (op === "swap") { const t = r[0]; r[0] = r[1]; r[1] = t; E = { a: 0, b: 1, c: 1, d: 0 }; }
    else if (op === "scale1") { r[0] = r[0].map(v => v * k); E = { a: k, b: 0, c: 0, d: 1 }; }
    else if (op === "scale2") { r[1] = r[1].map(v => v * k); E = { a: 1, b: 0, c: 0, d: k }; }
    else if (op === "add12") { r[0] = r[0].map((v, i) => v + k * r[1][i]); E = { a: 1, b: k, c: 0, d: 1 }; }
    else if (op === "add21") { r[1] = r[1].map((v, i) => v + k * r[0][i]); E = { a: 1, b: 0, c: k, d: 1 }; }
    S.lastE = E;
    const C = S.cumulative ? LA.mul2(E, S.cumulative) : E;
    S.cumulative = C;
    this.refreshPanel();
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a" });

    // 两条直线（方程）
    const drawLine = (row, color, name) => {
      const [a, b, c] = row;
      const R = 30;
      if (Math.abs(b) > 1e-9) {
        LA.draw.line(ctx, cam, { x: -R, y: (c - a * -R) / b }, { x: R, y: (c - a * R) / b }, color, { width: 2.6 });
      } else if (Math.abs(a) > 1e-9) {
        LA.draw.line(ctx, cam, { x: c / a, y: -R }, { x: c / a, y: R }, color, { width: 2.6 });
      }
    };
    drawLine(S.rows[0], C.i, "方程1");
    drawLine(S.rows[1], C.j, "方程2");

    // 交点（解）——从不移动
    const [p, q, r2] = S.rows[0], [p2, q2, r22] = S.rows[1];
    const det = p * q2 - q * p2;
    if (Math.abs(det) > 1e-9) {
      const sol = { x: (r2 * q2 - q * r22) / det, y: (p * r22 - r2 * p2) / det };
      const s = cam.toS(sol);
      const pulse = 12 + Math.sin(t * 3) * 3;
      ctx.save();
      ctx.strokeStyle = "rgba(240,180,41,.6)"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(s.x, s.y, pulse + 6, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      LA.draw.dot(ctx, cam, sol, "#f0b429", 6, { stroke: "#10141b" });
      LA.draw.label(ctx, cam, sol, `解 (${LA.fmt(sol.x)}, ${LA.fmt(sol.y)}) 恒定不动`, "#f0b429",
        { bold: true, dy: -34, dx: 10, fontSize: 13 });
    }

    LA.draw.label(ctx, cam, { x: 0, y: 0 }, "行变换随意做：直线怎么变都行，交点一动不动",
      "#8b98a9", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13.5, bold: true });
    if (S.lastE) {
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, `最后一步左乘的初等矩阵 E = [${LA.fmt(S.lastE.a)}, ${LA.fmt(S.lastE.b)}; ${LA.fmt(S.lastE.c)}, ${LA.fmt(S.lastE.d)}]`,
        "#79b8ff", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 12.5 });
    }
  },

  hitTest() { return null; },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">初等行变换（k 作用于下一步）</div>
        <div class="kv"><span class="k">倍数 k</span><span class="v" id="s35kv">1</span></div>
        <input type="range" id="s35k" min="-3" max="3" step="0.5" value="1">
        <div class="btn-row">
          <button class="btn" data-op="swap">⇅ r₁↔r₂</button>
          <button class="btn" data-op="scale1">×k r₁</button>
          <button class="btn" data-op="scale2">×k r₂</button>
        </div>
        <div class="btn-row">
          <button class="btn" data-op="add12">r₁ += k·r₂</button>
          <button class="btn" data-op="add21">r₂ += k·r₁</button>
          <button class="btn" id="s35reset">↺ 复位</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">当前增广矩阵与累计乘积</div>
        <div class="kv"><span class="k">[A | b] 现状</span><span class="v" id="s35aug" style="font-size:12px"></span></div>
        <div class="kv"><span class="k">累计 P = Eₖ…E₁</span><span class="v" id="s35cum" style="font-size:12px"></span></div>
        <div class="kv"><span class="k">验证 P·A(原始)</span><span class="v" id="s35verify" style="font-size:12px"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          三类<b>初等行变换</b>（交换 / 倍乘 / 倍加）各对应一个
          <b>初等矩阵 E</b>：对增广矩阵做行变换 ⟺ <b>左乘 E</b>。<br><br>
          行变换只是"把方程组改写成同解的等价形式" ——
          画布上两条直线怎么变形，<b>交点（解）一动不动</b>。
          这就是消元法合法性的全部几何依据。<br><br>
          消元 = 按顺序左乘一串初等矩阵 P = Eₖ…E₁，
          把 A 打成上三角/阶梯形（还能继续化成对角，甚至 I）。<br><br>
          求逆也是它：<b>[A | I] → 行变换 → [I | A⁻¹]</b>，
          因为 Eₖ…E₁·A = I 时，同样的 Eₖ…E₁ 作用在 I 上恰好给出 A⁻¹。<br><br>
          💡 初等矩阵都可逆，且逆还是同类初等矩阵 ——
          可逆阵 = 初等矩阵的乘积（这就是"秩相同的等价"能互相到达的原因）。
        </div>
      </div>`;
    this._panel = el;

    el.querySelector("#s35k").addEventListener("input", (e) => {
      S.k = parseFloat(e.target.value);
      el.querySelector("#s35kv").textContent = LA.fmt(S.k);
    });
    el.querySelectorAll("[data-op]").forEach((btn) => btn.addEventListener("click", () => this.apply(btn.dataset.op)));
    el.querySelector("#s35reset").addEventListener("click", () => { this.reset(); this.refreshPanel(); });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el || !document.contains(el)) return;
    const fR = (row) => `[${row.map(v => LA.fmt(v)).join(", ")}]`;
    el.querySelector("#s35aug").textContent = `${fR(S.rows[0])} ${fR(S.rows[1])}`;
    el.querySelector("#s35cum").textContent = S.cumulative
      ? `[${LA.fmt(S.cumulative.a)}, ${LA.fmt(S.cumulative.b)}; ${LA.fmt(S.cumulative.c)}, ${LA.fmt(S.cumulative.d)}]`
      : "（尚未变换）";
    const origA = { a: 2, b: 1, c: 1, d: -1 };
    if (S.cumulative) {
      const PAb = LA.mul2(S.cumulative, { a: origA.a, b: origA.b, c: origA.c, d: origA.d });
      el.querySelector("#s35verify").textContent =
        `[${LA.fmt(PAb.a)}, ${LA.fmt(PAb.b)}; ${LA.fmt(PAb.c)}, ${LA.fmt(PAb.d)}] 应等于当前 A 的行`;
    } else el.querySelector("#s35verify").textContent = "—";
  },
});

/* ============================================================
 * Gram-Schmidt 标准正交化
 * ============================================================ */
LA.scenes.push({
  id: "gram-schmidt", icon: "⊤", name: "Gram-Schmidt：造标准正交基",
  tagline: "逐步减掉投影：任何基都能炼成标准正交基",
  newCam: () => new LA.Cam2D(56),

  state: {
    u: { x: 2, y: 0.8 },
    v: { x: 1.2, y: 1.8 },
    step: 0,     // 0 原始 → 1 e1 → 2 减投影 → 3 e2
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a" });
    strokeCircle(ctx, cam, null, 1, "rgba(230,237,243,.35)", 1.3, 1, [4, 5]);

    const e1 = LA.v.norm(S.u);
    const vProj = LA.v.scale(e1, LA.v.dot(S.v, e1));
    const vPerp = LA.v.sub(S.v, vProj);
    const e2 = LA.v.norm(vPerp);

    // 原始向量（浅）
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.u, "rgba(126,231,135,.55)", { width: 2.4, head: 10 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.v, "rgba(255,123,114,.55)", { width: 2.4, head: 10 });
    LA.draw.label(ctx, cam, S.u, "u", "rgba(126,231,135,.9)", { fontSize: 12, dy: -20 });
    LA.draw.label(ctx, cam, S.v, "v", "rgba(255,123,114,.9)", { fontSize: 12, dy: -20 });

    if (S.step >= 1) {
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, e1, "#7ee787", { width: 3.4, head: 12 });
      LA.draw.label(ctx, cam, e1, "e₁ = u/|u|", "#7ee787", { fontSize: 12, bold: true, dy: 16 });
    }
    if (S.step >= 2) {
      // 被减掉的投影
      LA.draw.arrow(ctx, cam, vProj, S.v, "rgba(255,166,87,.9)", { width: 2.2, head: 9, dash: [4, 4] });
      LA.draw.line(ctx, cam, S.v, vProj, "rgba(255,166,87,.5)", { width: 1.2, dash: [3, 3] });
      LA.draw.label(ctx, cam, LA.v.scale(LA.v.add(vProj, S.v), 0.5), "减掉平行分量", "#ffa657", { fontSize: 11 });
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, vPerp, "#d2a8ff", { width: 3, head: 11 });
      LA.draw.label(ctx, cam, vPerp, "v′ = v − (v·e₁)e₁", "#d2a8ff", { fontSize: 12, bold: true, dx: 8, dy: -8 });
      rightAngleMark(ctx, cam, { x: 0, y: 0 }, e1, vPerp, 0.2, "rgba(210,168,255,.9)");
    }
    if (S.step >= 3 && LA.v.len(vPerp) > 1e-6) {
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, e2, "#d2a8ff", { width: 3.4, head: 12 });
      LA.draw.label(ctx, cam, e2, "e₂ = v′/|v′|", "#d2a8ff", { fontSize: 12, bold: true, dx: 8, dy: -14 });
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "标准正交基 {e₁, e₂} 完成：单位长 + 互相垂直",
        "#f0b429", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13.5, bold: true });
    }

    LA.draw.handle(ctx, cam, S.u, C.i, { hover: this._dragId === "u" || this._hoverId === "u" });
    LA.draw.handle(ctx, cam, S.v, C.j, { hover: this._dragId === "v" || this._hoverId === "v" });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p) => { S[id] = clampCol(p); },
    });
    if (LA.hitHandle(sx, sy, cam, S.u, 20)) return mk("u");
    if (LA.hitHandle(sx, sy, cam, S.v, 20)) return mk("v");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">逐步正交化（拖 u、v）</div>
        <div class="btn-row">
          <button class="btn" id="s36s0">0 原始</button>
          <button class="btn" id="s36s1">① 单位化 u</button>
          <button class="btn" id="s36s2">② 减投影</button>
          <button class="btn" id="s36s3">③ 单位化 v′</button>
        </div>
        <div class="kv"><span class="k">e₁</span><span class="v" id="s36e1"></span></div>
        <div class="kv"><span class="k">v′ = v − (v·e₁)e₁</span><span class="v" id="s36vp"></span></div>
        <div class="kv"><span class="k">e₂</span><span class="v" id="s36e2"></span></div>
        <div class="kv"><span class="k">验证 ⟨e₁,e₂⟩</span><span class="v" id="s36chk"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          欧氏空间里最好的坐标系是<b>标准正交基</b>：
          每个都是单位长、彼此垂直。
          在它之下坐标 = 投影、内积 = 分量乘积和、勾股定理成立 —— 一切最简单。<br><br>
          <b>Gram–Schmidt</b> 把任意基炼成标准正交基：<br>
          ① u 先归一化 → e₁<br>
          ② v 减掉它在 e₁ 上的<span class="hl-y">投影</span>（橙色被减掉的分量）
          → 剩下的 v′ 天然与 e₁ 垂直<br>
          ③ v′ 归一化 → e₂<br><br>
          每一步只用了"投影 + 减法"，却把"斜基"炼成了"直基"。
          n 维同理逐个正交化。<br><br>
          这台机器就是 QR 分解（A = QR，Q 正交 R 上三角）、
          最小二乘求解、以及数值稳定性的基石；
          SVD（第 14 章）与对称矩阵谱定理（第 26 章）
          输出的也正是标准正交的特征基。
        </div>
      </div>`;
    this._panel = el;

    [0, 1, 2, 3].forEach((k) => {
      el.querySelector(`#s36s${k}`).addEventListener("click", () => { S.step = k; this.refreshPanel(); });
    });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el || !document.contains(el)) return;
    const e1 = LA.v.norm(S.u);
    const vProj = LA.v.scale(e1, LA.v.dot(S.v, e1));
    const vPerp = LA.v.sub(S.v, vProj);
    const e2 = LA.v.len(vPerp) > 1e-9 ? LA.v.norm(vPerp) : null;
    el.querySelector("#s36e1").textContent = `(${LA.fmt(e1.x)}, ${LA.fmt(e1.y)})`;
    el.querySelector("#s36vp").textContent = `(${LA.fmt(vPerp.x)}, ${LA.fmt(vPerp.y)})`;
    el.querySelector("#s36e2").textContent = e2 ? `(${LA.fmt(e2.x)}, ${LA.fmt(e2.y)})` : "v 与 u 共线了！换一个方向";
    const chk = el.querySelector("#s36chk");
    if (e2) {
      const d = LA.v.dot(e1, e2);
      chk.textContent = `${LA.fmt(d)} ≈ 0 ✓；|e₁|=|e₂|=1`;
      chk.style.color = "#7ee787";
    } else chk.textContent = "—";
  },
});
