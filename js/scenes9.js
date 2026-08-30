/* =========================================================
 * scenes9.js —— 第28~30章：线性函数与对偶空间 / 双线性函数 / 辛空间
 * ========================================================= */
"use strict";

/* 画线性函数 f(x) = a·x 的水平线族（c ∈ levels） */
function drawLevelLinesOf(ctx, cam, a, levels, highlightC, opts = {}) {
  const a2 = LA.v.dot(a, a);
  if (a2 < 1e-9) return;
  const perp = { x: -a.y, y: a.x };
  const R = Math.max(cam.w, cam.h) / cam.ppu * 1.6;
  levels.forEach((c) => {
    const base = LA.v.scale(a, c / a2);
    const p1 = LA.v.add(base, LA.v.scale(perp, -R));
    const p2 = LA.v.add(base, LA.v.scale(perp, R));
    const isHL = highlightC !== null && Math.abs(c - highlightC) < 1e-6;
    const isKer = Math.abs(c) < 1e-6;
    LA.draw.line(ctx, cam, p1, p2,
      isKer ? "rgba(86,212,221,.85)" : (isHL ? "rgba(255,215,94,.95)" : "rgba(139,152,169,.35)"),
      { width: isKer || isHL ? 2.4 : 1.1 });
    if (!isKer && !isHL) LA.draw.label(ctx, cam, LA.v.add(base, LA.v.scale(LA.v.norm(perp), 0.12)), `f=${LA.fmt(c)}`, "#5b6675", { fontSize: 10 });
  });
}

/* ============================================================
 * 第 28 章 线性函数与对偶空间
 * ============================================================ */
LA.scenes.push({
  id: "dual", icon: "＊", name: "线性函数与对偶空间",
  tagline: "f(v) = ⟨a,v⟩：每个线性函数背后都站着一个向量",
  newCam: () => null,

  state: {
    a: { x: 1.2, y: 0.9 },    // 对偶向量（右半，代表线性函数）
    v: { x: 2, y: 1.5 },      // 原空间向量（左半）
    camL: new LA.Cam2D(54),
    camR: new LA.Cam2D(54),
  },

  draw(ctx, cam, app, t) {
    const w = cam.w, h = cam.h;
    const S = this.state;
    S.camL.setSize(w / 2, h);
    S.camR.setSize(w / 2, h);

    ctx.save();
    ctx.strokeStyle = "#263042"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    ctx.restore();
    LA.draw.label(ctx, S.camL, { x: 0, y: 0 }, "原空间 V：向量与函数的水平线", "#8b98a9", { screen: { x: 14, y: 14 }, fontSize: 13, bold: true });
    LA.draw.label(ctx, S.camR, { x: 0, y: 0 }, "对偶空间 V*：函数 ↔ 向量 a", "#f0b429", { screen: { x: w / 2 + 14, y: 14 }, fontSize: 13, bold: true });

    const fv = LA.v.dot(S.a, S.v);

    /* 左：V 里的水平线族 */
    ctx.save();
    LA.draw.grid(ctx, S.camL, { color: "#1d2634" });
    LA.draw.axes(ctx, S.camL, { color: "#2c3849" });
    drawLevelLinesOf(ctx, S.camL, S.a, [-3, -2, -1, 0, 1, 2, 3, 4], fv);
    LA.draw.arrow(ctx, S.camL, { x: 0, y: 0 }, S.v, C.v, { width: 3.4, head: 12 });
    LA.draw.handle(ctx, S.camL, S.v, C.v, { hover: this._dragId === "v" || this._hoverId === "v" });
    LA.draw.label(ctx, S.camL, S.v, `f(v) = ${LA.fmt(fv)}`, C.v, { bold: true, dy: -30, dx: 8 });
    LA.draw.label(ctx, S.camL, { x: 0, y: 0 }, "青线 = 核（f=0，⟂ a）；黄线 = v 所在的水平线",
      "#5b6675", { screen: { x: 14, y: h - 18 }, fontSize: 12 });
    ctx.restore();

    /* 右：V* 里的对偶向量 */
    ctx.save();
    ctx.translate(w / 2, 0);
    LA.draw.grid(ctx, S.camR, { color: "#1d2634" });
    LA.draw.axes(ctx, S.camR, { color: "#2c3849" });
    LA.draw.arrow(ctx, S.camR, { x: 0, y: 0 }, S.a, "#f0b429", { width: 3.4, head: 12 });
    LA.draw.handle(ctx, S.camR, S.a, "#f0b429", { hover: this._dragId === "a" || this._hoverId === "a" });
    LA.draw.label(ctx, S.camR, S.a, `a = (${LA.fmt(S.a.x)}, ${LA.fmt(S.a.y)})`, "#f0b429", { bold: true, dy: -28, dx: 8 });
    // a 的垂线示意：核方向
    const perpA = { x: -S.a.y, y: S.a.x };
    LA.draw.arrow(ctx, S.camR, { x: 0, y: 0 }, LA.v.scale(LA.v.norm(perpA), 1.4), "rgba(86,212,221,.6)", { width: 2, head: 8, dash: [4, 4] });
    LA.draw.label(ctx, S.camR, { x: 0, y: 0 }, "拖金色 a：左边水平线族立刻跟着转、变密变疏",
      "#5b6675", { screen: { x: 14, y: h - 18 }, fontSize: 12 });
    ctx.restore();
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const cv = document.getElementById("cv");
    const w = cv._cssW;
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p, cam2, dsx, dsy) => {
        const half = id === "v" ? S.camL : S.camR;
        const lcx = id === "v" ? dsx : dsx - w / 2;
        S[id] = clampCol(half.toW(lcx, dsy));
        this.refreshPanel();
      },
    });
    if (sx < w / 2) {
      if (LA.hitHandle(sx, sy, S.camL, S.v, 20)) return mk("v");
    } else {
      if (LA.hitHandle(sx - w / 2, sy, S.camR, S.a, 20)) return mk("a");
    }
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">线性函数 f(v) = ⟨a, v⟩</div>
        <div class="kv"><span class="k" style="color:${C.v}">f(v)（拖左 v）</span><span class="v" id="s28fv"></span></div>
        <div class="kv"><span class="k" style="color:#f0b429">a（函数的向量化身）</span><span class="v" id="s28a"></span></div>
        <div class="kv"><span class="k">核方向（f=0，⟂ a）</span><span class="v" id="s28ker"></span></div>
        <div class="kv"><span class="k">水平线间距 = 1/|a|</span><span class="v" id="s28gap"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>线性函数（线性泛函）</b>：f: V → ℝ，保线性 ——
          f(αu + βw) = αf(u) + βf(w)。它"吃"进一个向量，"吐"出一个数。<br><br>
          几何形象：一组<b>等距平行线</b>（水平线族）。
          f(v) 就是 v 踩在哪条线上；f=0 的那条线是核 ——
          它永远<span class="hl-y">垂直于向量 a</span>。<br><br>
          <b>对偶空间 V*</b> = 全体线性函数组成的空间。
          用内积说话：每个 f 都唯一对应一个向量 a（f(v) = ⟨a,v⟩），
          所以 V* 也是个 ℝ² —— 函数可以相加、数乘，像向量一样。<br><br>
          拖右边的 a：左边整个水平线族绕原点旋转、变密变疏 ——
          <b>a 就是这族线的"灵魂"</b>（方向 = 法向，长度 = 密度）。<br><br>
          💡 有限维时 dim V* = dim V，所以 V ≅ V*；
          但这个同构要挑内积，<b>自然</b>的同构是 V ≅ V**（二次对偶）——
          "函数的函数"转一圈又回到向量自己。
        </div>
      </div>`;
    this._panel = el;
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    el.querySelector("#s28fv").textContent = LA.fmt(LA.v.dot(S.a, S.v));
    el.querySelector("#s28a").textContent = `(${LA.fmt(S.a.x)}, ${LA.fmt(S.a.y)})`;
    const la = LA.v.len(S.a);
    const ker = la > 1e-6 ? LA.v.norm({ x: -S.a.y, y: S.a.x }) : null;
    el.querySelector("#s28ker").textContent = ker ? `(${LA.fmt(ker.x)}, ${LA.fmt(ker.y)})` : "a=0";
    el.querySelector("#s28gap").textContent = la > 1e-6 ? LA.fmt(1 / la) : "∞";
  },
});

/* ============================================================
 * 第 29 章 双线性函数
 * ============================================================ */
const BILINEAR_PRESETS = {
  sym: { name: "对称（内积候选）", A: { a: 2, b: 0.6, c: 0.6, d: 1 } },
  skew: { name: "反对称（有向面积）", A: { a: 0, b: 1, c: -1, d: 0 } },
  general: { name: "一般", A: { a: 1, b: 0.5, c: -0.3, d: 1.2 } },
};

LA.scenes.push({
  id: "bilinear", icon: "β", name: "双线性函数：两个槽的机器",
  tagline: "B(u,v) = uᵀAv：分别对每个变量线性",
  newCam: () => new LA.Cam2D(58),

  state: {
    u: { x: 1.5, y: 0.8 },
    v: { x: 2, y: 1.4 },
    preset: "sym",
    anim: makeAnim(true),
  },

  Amat() { return BILINEAR_PRESETS[this.state.preset].A; },
  Buv() {
    const A = this.Amat(), u = this.state.u, v = this.state.v;
    const Au = LA.apply2(A, u);
    return LA.v.dot(Au, v);
  },

  changed(now) { matrixChanged(this.state.anim, this.Amat(), now); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const A = this.Amat();
    const M = effM(S.anim, A, t);
    const Buv = this.Buv();
    const Bvu = LA.v.dot(LA.apply2(A, S.v), S.u);

    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a" });

    // 双线性函数的"几何体"：u,v 张成的平行四边形按 A 变换后的面积/形状
    const Au = LA.apply2(M, S.u), Av = LA.apply2(M, S.v);
    LA.draw.poly(ctx, cam, [{ x: 0, y: 0 }, Au, LA.v.add(Au, Av), Av],
      Buv >= 0 ? "rgba(255,166,87,.16)" : "rgba(255,123,114,.16)",
      Buv >= 0 ? "rgba(255,166,87,.5)" : "rgba(255,123,114,.5)", { width: 1.6 });

    // 固定 u：w ↦ B(u,w) 是一个线性函数，其向量 = Aᵀu
    const At = { a: A.a, b: A.c, c: A.b, d: A.d };
    const funcVec = LA.apply2(At, S.u);
    if (LA.v.len(funcVec) > 1e-6) {
      drawLevelLinesOf(ctx, cam, funcVec, [-6, -4, -2, 0, 2, 4, 6], Buv);
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, LA.v.scale(LA.v.norm(funcVec), 1.2), "rgba(86,212,221,.55)", { width: 1.8, head: 8, dash: [4, 4] });
      LA.draw.label(ctx, cam, LA.v.scale(LA.v.norm(funcVec), 1.45), "固定 u 后，B(u,·) 的水平线", "#56d4dd", { fontSize: 11 });
    }

    // u, v
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.u, C.i, { width: 3.4, head: 12 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.v, C.j, { width: 3.4, head: 12 });
    LA.draw.handle(ctx, cam, S.u, C.i, { hover: this._dragId === "u" || this._hoverId === "u" });
    LA.draw.handle(ctx, cam, S.v, C.j, { hover: this._dragId === "v" || this._hoverId === "v" });

    LA.draw.label(ctx, cam, { x: 0, y: 0 },
      `B(u,v) = ${LA.fmt(Buv)}    B(v,u) = ${LA.fmt(Bvu)}${Math.abs(Buv + Bvu) < 1e-6 ? "   （反对称!）" : (Math.abs(Buv - Bvu) < 1e-6 ? "   （对称!）" : "")}`,
      "#e6edf3", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13.5, bold: true });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p) => { S[id] = clampCol(p); this.refreshPanel(); },
    });
    if (LA.hitHandle(sx, sy, cam, S.u, 20)) return mk("u");
    if (LA.hitHandle(sx, sy, cam, S.v, 20)) return mk("v");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">双线性函数类型</div>
        <div class="btn-row">
          ${Object.entries(BILINEAR_PRESETS).map(([k, p]) => `<button class="btn" data-p="${k}">${p.name}</button>`).join("")}
        </div>
        <div class="kv"><span class="k">矩阵 A</span></div>
        <div id="s29m"></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">读数（拖 u、v）</div>
        <div class="kv"><span class="k">B(u,v)</span><span class="v" id="s29uv"></span></div>
        <div class="kv"><span class="k">B(v,u)</span><span class="v" id="s29vu"></span></div>
        <div class="kv"><span class="k">B(v,v)（二次型）</span><span class="v" id="s29vv"></span></div>
        <div class="kv"><span class="k">对称性</span><span class="v" id="s29sym"></span></div>
        <div class="kv"><span class="k">非退化检查</span><span class="v" id="s29nd"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>双线性函数</b>：B(u,v) 吃两个向量、吐一个数，
          且<b>分别对每个变量</b>都是线性的 —— 两槽机器。<br><br>
          矩阵表示：<span class="hl-y">B(u,v) = uᵀAv</span>。
          固定第一个槽 u，剩下的 w ↦ B(u,w) 就是一个线性函数
          （第 28 章）—— 画面上那族水平线，法向 = Aᵀu。<br><br>
          三种性格：<br>
          · <span class="hl-g">对称</span> B(u,v)=B(v,u)：等价于二次型 q(x)=B(x,x)（第 13 章）；
            再加正定性 = <b>内积</b>（第 23 章欧氏空间的源头）<br>
          · <span class="hl-r">反对称</span> B(u,v)=−B(v,u)：必然 B(v,v)=0；
            2D 时 B(u,v) = 有向面积 —— 下一段（辛空间）的主角<br>
          · 一般：两者混合<br><br>
          换基时矩阵变成 <span class="hl-y">PᵀAP（合同）</span>——
          注意与相似 P⁻¹AP 区别：双线性函数的坐标变换是合同，
          二次型标准化（主轴定理）就是找合同把 A 化成对角。<br><br>
          💡 拖 u：注意水平线族（固定 u 的线性函数）跟着转 ——
          双线性 = "每个变量都是一台对偶机"。
        </div>
      </div>`;
    this._panel = el;

    el.querySelectorAll("[data-p]").forEach((btn) => btn.addEventListener("click", () => {
      S.preset = btn.dataset.p;
      this.changed(LA.app.now());
      this.refreshPanel();
    }));
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const A = this.Amat();
    const mEl = el.querySelector("#s29m");
    if (!mEl.dataset.built) { mEl.innerHTML = LA.ui.mat2HTML("s29A", A, { readonly: true, cls: "readonly" }); mEl.dataset.built = "1"; }
    LA.ui.setMat2(el, "s29A", A);
    const Buv = this.Buv();
    const Bvu = LA.v.dot(LA.apply2(A, S.v), S.u);
    const Bvv = LA.v.dot(LA.apply2(A, S.v), S.v);
    el.querySelector("#s29uv").textContent = LA.fmt(Buv);
    el.querySelector("#s29vu").textContent = LA.fmt(Bvu);
    el.querySelector("#s29vv").textContent = LA.fmt(Bvv);
    const symEl = el.querySelector("#s29sym");
    const isSymP = Math.abs(A.b - A.c) < 1e-9;
    const isSkew = Math.abs(A.a) < 1e-9 && Math.abs(A.d) < 1e-9 && Math.abs(A.b + A.c) < 1e-9;
    symEl.textContent = isSkew ? "反对称" : (isSymP ? "对称" : "不对称");
    symEl.style.color = isSkew ? "#ff9ec1" : (isSymP ? "#7ee787" : "#8b98a9");
    el.querySelector("#s29nd").textContent = Math.abs(LA.det2(A)) > 1e-9 ? "非退化 ✓（A 可逆）" : "退化 ✗";
    el.querySelector("#s29nd").style.color = Math.abs(LA.det2(A)) > 1e-9 ? "#7ee787" : "#ff7b72";
  },
});

/* ============================================================
 * 第 30 章 辛空间
 * ============================================================ */
const SYMPLECTIC_PRESETS = {
  identity: { name: "恒等", M: null },
  rot: { name: "↻ 旋转（辛✓）", M: () => LA.rot2(Math.PI / 6) },
  shear: { name: "剪切（辛✓）", M: () => ({ a: 1, b: 1, c: 0, d: 1 }) },
  stretch: { name: "拉伸（非辛✗）", M: () => ({ a: 1.5, b: 0, c: 0, d: 1 }) },
};

LA.scenes.push({
  id: "symplectic", icon: "ω", name: "辛空间：面积守护者",
  tagline: "ω(u,v) = 有向面积；辛变换 = 永不改面积的变换",
  newCam: () => new LA.Cam2D(52),

  state: {
    u: { x: 2, y: 0.6 },
    v: { x: 0.8, y: 1.6 },
    preset: "identity",
    anim: makeAnim(true),
  },

  M() {
    const p = SYMPLECTIC_PRESETS[this.state.preset];
    return p.M ? p.M() : LA.ident2();
  },
  omega(a, b) { return a.x * b.y - a.y * b.x; },

  changed(now) { matrixChanged(this.state.anim, this.M(), now); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const M = effM(S.anim, this.M(), t);
    const Mu = LA.apply2(M, S.u), Mv = LA.apply2(M, S.v);
    const wBefore = this.omega(S.u, S.v);
    const wAfter = this.omega(Mu, Mv);
    const preserved = Math.abs(wBefore - wAfter) < 1e-6;
    const detM = LA.det2(M);

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    LA.draw.grid(ctx, cam, { matrix: M, color: "#2c4470", width: 1.2, emphasis: "#4a6ba6" });
    LA.draw.axes(ctx, cam, { matrix: M, color: "#4f6fa5", width: 1.7 });

    // 原平行四边形（虚影）
    LA.draw.poly(ctx, cam, [{ x: 0, y: 0 }, S.u, LA.v.add(S.u, S.v), S.v],
      "rgba(230,237,243,.04)", "rgba(230,237,243,.4)", { dash: [5, 5], width: 1.2 });
    // 变换后（实）
    const col = Math.abs(detM - 1) < 1e-6 ? "rgba(126,231,135," : (wAfter * wBefore < 0 || Math.abs(wAfter) < 1e-9 ? "rgba(255,123,114," : "rgba(255,166,87,");
    LA.draw.poly(ctx, cam, [{ x: 0, y: 0 }, Mu, LA.v.add(Mu, Mv), Mv],
      col + ".18)", col + ".6)", { width: 2 });

    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.u, "rgba(126,231,135,.5)", { width: 2, dash: [4, 4], head: 8 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.v, "rgba(255,123,114,.5)", { width: 2, dash: [4, 4], head: 8 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, Mu, C.i, { width: 3.4, head: 12 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, Mv, C.j, { width: 3.4, head: 12 });
    LA.draw.handle(ctx, cam, S.u, C.i, { hover: this._dragId === "u" || this._hoverId === "u" });
    LA.draw.handle(ctx, cam, S.v, C.j, { hover: this._dragId === "v" || this._hoverId === "v" });

    LA.draw.label(ctx, cam, LA.v.scale(LA.v.add(S.u, S.v), 0.5), `ω=${LA.fmt(wBefore)}`, "#8b98a9", { fontSize: 11, center: true });
    LA.draw.label(ctx, cam, LA.v.scale(LA.v.add(Mu, Mv), 0.5), `ω=${LA.fmt(wAfter)}`,
      preserved ? "#7ee787" : "#ff7b72", { fontSize: 12.5, bold: true, center: true });

    LA.draw.label(ctx, cam, { x: 0, y: 0 },
      preserved ? `辛变换 ✓：det = ${LA.fmt2(detM)}，有向面积守恒` : `非辛 ✗：det = ${LA.fmt2(detM)} ≠ 1，面积被改了`,
      preserved ? "#7ee787" : "#ff7b72",
      { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13.5, bold: true });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const app2 = LA.app;
    const M = effM(S.anim, this.M(), app2.now());
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p) => { S[id] = clampCol(p); },
    });
    if (LA.hitHandle(sx, sy, cam, LA.apply2(M, S.u), 20)) return mk("u");
    if (LA.hitHandle(sx, sy, cam, LA.apply2(M, S.v), 20)) return mk("v");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">施加一个变换</div>
        <div class="btn-row">
          ${Object.entries(SYMPLECTIC_PRESETS).map(([k, p]) => `<button class="btn" data-p="${k}">${p.name}</button>`).join("")}
        </div>
        <div class="kv" style="margin-top:4px"><span class="k">ω(u,v) 变换前</span><span class="v" id="s30wb"></span></div>
        <div class="kv"><span class="k">ω(Mu, Mv) 变换后</span><span class="v" id="s30wa"></span></div>
        <div class="kv"><span class="k">det M（2D 辛 ⟺ det=1）</span><span class="v" id="s30det"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>辛空间</b> = 装了<span class="hl-y">非退化反对称双线性函数 ω</span> 的空间
          （反对称那条线来自第 29 章）。<br><br>
          在 2D 里辛形式就是<b>有向面积</b>：
          ω(u,v) = det[u v] = u、v 张成平行四边形的（带符号）面积 ——
          拖动 u、v，橙色平行四边形和 ω 读数实时变。<br><br>
          <b>辛变换</b> = 保住 ω 的线性变换：不管形状怎么歪，
          <b>有向面积永远不变</b>。旋转保面积（显然），<b>剪切也保面积</b>（点它！
          网格歪了面积读数却纹丝不动），拉伸则当场破坏。<br><br>
          几个关键事实：<br>
          · ω 反对称 ⟹ ω(v,v) = 0（"自己对自己的面积"是零）<br>
          · 非退化 + 反对称 ⟹ <b>维数必为偶数</b>（奇数维装不下）<br>
          · 2D 辛变换群 = SL(2)（det=1 的矩阵）<br><br>
          💡 辛几何是 Hamilton 力学的语言：行星轨道、粒子系统的演化
          都在保面积（保辛）地进行 —— 这也是数值模拟要"辛算法"的原因。
        </div>
      </div>`;
    this._panel = el;

    el.querySelectorAll("[data-p]").forEach((btn) => btn.addEventListener("click", () => {
      S.preset = btn.dataset.p;
      this.changed(LA.app.now());
      this.refreshPanel();
    }));
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const M = this.M();
    const wb = this.omega(S.u, S.v);
    const wa = this.omega(LA.apply2(M, S.u), LA.apply2(M, S.v));
    el.querySelector("#s30wb").textContent = LA.fmt(wb);
    const waEl = el.querySelector("#s30wa");
    waEl.textContent = LA.fmt(wa);
    waEl.style.color = Math.abs(wb - wa) < 1e-6 ? "#7ee787" : "#ff7b72";
    const detEl = el.querySelector("#s30det");
    detEl.textContent = LA.fmt2(LA.det2(M));
    detEl.style.color = Math.abs(LA.det2(M) - 1) < 1e-6 ? "#7ee787" : "#ff7b72";
  },
});
