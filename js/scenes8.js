/* =========================================================
 * scenes8.js —— 第23~27章：欧氏空间 / 正交变换 / 正交补 / 谱定理 / 酉空间
 * ========================================================= */
"use strict";

/* 直角小方块标记（在 originWorld 处，沿 d1、d2 两个方向） */
function rightAngleMark(ctx, cam, originWorld, d1, d2, size = 0.2, color = "rgba(230,237,243,.75)") {
  const n1 = LA.v.norm(d1), n2 = LA.v.norm(d2);
  if (LA.v.len(n1) < 1e-6 || LA.v.len(n2) < 1e-6) return;
  const a = LA.v.add(originWorld, LA.v.scale(n1, size));
  const b = LA.v.add(a, LA.v.scale(n2, size));
  const c = LA.v.add(originWorld, LA.v.scale(n2, size));
  LA.draw.poly(ctx, cam, [originWorld, a, b, c], null, color, { width: 1.2 });
}

/* 采样折线画圆（世界坐标，可再经 M 变换） */
function strokeCircle(ctx, cam, M, r, color, width, alpha, dash) {
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const th = (i / 80) * Math.PI * 2;
    let p = { x: r * Math.cos(th), y: r * Math.sin(th) };
    if (M) p = LA.apply2(M, p);
    pts.push(p);
  }
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha ?? 1;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  pts.forEach((p, i) => { const s = cam.toS(p); if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y); });
  ctx.stroke();
  ctx.restore();
}

/* ============================================================
 * 第 23 章 欧几里得空间 vs 线性空间
 * ============================================================ */
LA.scenes.push({
  id: "euclid", icon: "∠", name: "欧氏空间：线性空间 + 内积",
  tagline: "同两个向量：左边问不出角度，右边全都有答案",
  newCam: () => null,

  state: {
    u: { x: 2, y: 1 },
    w: { x: -0.5, y: 1.5 },
    camL: new LA.Cam2D(56),
    camR: new LA.Cam2D(56),
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
    LA.draw.label(ctx, S.camL, { x: 0, y: 0 }, "线性空间：只有加法、数乘", "#8b98a9", { screen: { x: 14, y: 14 }, fontSize: 13, bold: true });
    LA.draw.label(ctx, S.camR, { x: 0, y: 0 }, "欧氏空间：还装了内积 ⟨u,v⟩", "#f0b429", { screen: { x: w / 2 + 14, y: 14 }, fontSize: 13, bold: true });

    /* 左：线性世界 */
    ctx.save();
    LA.draw.grid(ctx, S.camL, { color: "#1d2634" });
    LA.draw.axes(ctx, S.camL, { color: "#2c3849" });
    const sumL = LA.v.add(S.u, S.w);
    LA.draw.arrow(ctx, S.camL, { x: 0, y: 0 }, sumL, C.sum, { width: 2.2, head: 9, alpha: .7 });
    LA.draw.label(ctx, S.camL, sumL, "u+w ✓", C.sum, { fontSize: 11 });
    LA.draw.arrow(ctx, S.camL, { x: 0, y: 0 }, S.u, C.i, { width: 3.2, head: 11 });
    LA.draw.arrow(ctx, S.camL, { x: 0, y: 0 }, S.w, C.j, { width: 3.2, head: 11 });
    ctx.restore();

    /* 右：欧氏世界 */
    ctx.save();
    ctx.translate(w / 2, 0);
    LA.draw.grid(ctx, S.camR, { color: "#1d2634" });
    LA.draw.axes(ctx, S.camR, { color: "#2c3849" });
    strokeCircle(ctx, S.camR, null, 1, "rgba(230,237,243,.3)", 1.2, 1, [4, 5]);
    LA.draw.label(ctx, S.camR, { x: 0.15, y: 1.1 }, "|z|=1", "#8b98a9", { fontSize: 10.5 });

    const dotv = LA.v.dot(S.u, S.w);
    const lu = LA.v.len(S.u), lw = LA.v.len(S.w);
    const angU = Math.atan2(S.u.y, S.u.x), angW = Math.atan2(S.w.y, S.w.x);
    let dA = angW - angU;
    while (dA > Math.PI) dA -= 2 * Math.PI;
    while (dA < -Math.PI) dA += 2 * Math.PI;
    // 夹角弧
    const R = 0.62;
    ctx.save();
    ctx.strokeStyle = Math.abs(dotv) < 1e-6 ? "#7ee787" : "#ffd75e"; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a2 = angU + dA * i / 24;
      const s = S.camR.toS({ x: Math.cos(a2) * R, y: Math.sin(a2) * R });
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    }
    ctx.stroke();
    ctx.restore();
    const mid = angU + dA / 2;
    LA.draw.label(ctx, S.camR, { x: Math.cos(mid) * (R + 0.25), y: Math.sin(mid) * (R + 0.25) },
      `θ=${LA.fmt(Math.acos(LA.clamp(dotv / (lu * lw || 1), -1, 1)) * 180 / Math.PI)}°`, "#ffd75e", { center: true, fontSize: 11 });
    if (Math.abs(dotv) < 1e-6) rightAngleMark(ctx, S.camR, { x: 0, y: 0 }, S.u, S.w, 0.22, "rgba(126,231,135,.9)");

    const sum = LA.v.add(S.u, S.w);
    LA.draw.arrow(ctx, S.camR, { x: 0, y: 0 }, S.u, C.i, { width: 3.2, head: 11 });
    LA.draw.arrow(ctx, S.camR, { x: 0, y: 0 }, S.w, C.j, { width: 3.2, head: 11 });
    LA.draw.label(ctx, S.camR, S.u, `|u|=${LA.fmt(lu)}`, C.i, { fontSize: 11, dx: 8, dy: -14 });
    LA.draw.label(ctx, S.camR, S.w, `|w|=${LA.fmt(lw)}`, C.j, { fontSize: 11, dx: 8, dy: -14 });
    LA.draw.label(ctx, S.camR, { x: 0, y: 0 }, `⟨u,w⟩ = ${LA.fmt(dotv)}${Math.abs(dotv) < 1e-6 ? "（正交!）" : ""}`,
      Math.abs(dotv) < 1e-6 ? "#7ee787" : "#e6edf3",
      { screen: S.camR.toS({ x: 0, y: 0 }), dx: 14, dy: h - 40, fontSize: 13, bold: true });
    ctx.restore();

    // 左世界的"问不出"
    LA.draw.label(ctx, S.camL, { x: 0, y: 0 }, "u 和 w 的夹角？长度？—— 这里没有这种概念",
      "#8b98a9", { screen: { x: 14, y: h - 40 }, fontSize: 12 });
    // 拖拽提示
    LA.draw.label(ctx, S.camL, { x: 0, y: 0 }, "两边是同一对向量（拖任一侧，两边同步）", "#5b6675",
      { screen: { x: 14, y: h - 18 }, fontSize: 12 });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const cv = document.getElementById("cv");
    const w = cv._cssW;
    const local = sx < w / 2 ? { cam: S.camL, sx } : { cam: S.camR, sx: sx - w / 2 };
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p, cam2, dsx, dsy) => {
        const lcx = sx < w / 2 ? dsx : dsx - w / 2;
        S[id] = clampCol(local.cam.toW(lcx, dsy));
      },
    });
    if (LA.hitHandle(local.sx, sy, local.cam, S.u, 20)) return mk("u");
    if (LA.hitHandle(local.sx, sy, local.cam, S.w, 20)) return mk("w");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">差在哪？一张表看清</div>
        <table style="width:100%; font-size:12px; border-collapse:collapse">
          <tr style="color:var(--muted)"><td style="padding:3px 0"></td><td>线性空间</td><td>欧氏空间</td></tr>
          <tr><td style="padding:3px 0; color:var(--muted)">装备</td><td>加法、数乘</td><td>+ 内积 ⟨u,v⟩</td></tr>
          <tr><td style="padding:3px 0; color:var(--muted)">能问</td><td>线性组合、张成、坐标</td><td>+ 长度、夹角、距离</td></tr>
          <tr><td style="padding:3px 0; color:var(--muted)">正交</td><td>无此概念</td><td>⟨u,v⟩=0</td></tr>
          <tr><td style="padding:3px 0; color:var(--muted)">同构</td><td>保线性结构</td><td>保内积(=正交变换)</td></tr>
        </table>
        <div class="kv" style="margin-top:6px"><span class="k">⟨u,w⟩</span><span class="v" id="s23dot"></span></div>
        <div class="kv"><span class="k">柯西–施瓦茨 |⟨u,w⟩| ≤ |u||w|</span><span class="v" id="s23cs"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>欧氏空间 = 线性空间 + 内积。</b><br>
          左右两边是<b>同一对向量</b>：左边只有线性结构，
          "夹角多大"这个问题根本无法定义；
          右边装上内积后，<b>长度、角度、距离、正交</b>全都有了几何意义。<br><br>
          内积是"额外的装备"：同一个 ℝ²，
          换一种内积（加权 ⟨u,v⟩ = 2u₁v₁ + u₂v₂），
          所有的"长度""正交"都会换一套答案 ——
          <b>线性结构不变，度量结构变了</b>。<br><br>
          由此长出整套新故事：<br>
          · <b>正交变换</b>（第 24 章）：保内积的变换 = 欧氏空间的同构<br>
          · <b>正交补与投影</b>（第 25 章）：子空间有了"垂直的另一面"<br>
          · <b>谱定理</b>（第 26 章）：对称矩阵可正交对角化<br>
          · <b>酉空间</b>（第 27 章）：搬到复数域上再来一遍
        </div>
      </div>`;
    this._panel = el;
    // 拖拽时实时刷新（draw 每帧自动重画，这里只更新面板）
    this._panelTimer = setInterval(() => this.refreshPanel(), 300);
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el || !document.contains(el)) { clearInterval(this._panelTimer); return; }
    const d = LA.v.dot(S.u, S.w);
    el.querySelector("#s23dot").textContent = LA.fmt(d) + (Math.abs(d) < 1e-6 ? "（正交）" : "");
    const bound = LA.v.len(S.u) * LA.v.len(S.w);
    el.querySelector("#s23cs").textContent = `${LA.fmt(Math.abs(d))} ≤ ${LA.fmt(bound)} ${Math.abs(d) <= bound + 1e-9 ? "✓" : "✗"}`;
    el.querySelector("#s23cs").style.color = "#7ee787";
  },

  unmount() { clearInterval(this._panelTimer); },
});

/* ============================================================
 * 第 24 章 正交变换与正交矩阵
 * ============================================================ */
LA.scenes.push({
  id: "orthogonal", icon: "↻", name: "正交变换：欧氏世界的同构",
  tagline: "保内积 ⟹ 保长度、角度、距离；单位圆纹丝不动",
  newCam: () => new LA.Cam2D(60),

  state: {
    mode: "rot",        // rot | ref | stretch
    theta: 35,          // 角度（度）
    anim: makeAnim(true),
  },

  Q() {
    const th = this.state.theta * Math.PI / 180;
    if (this.state.mode === "rot") return LA.rot2(th);
    if (this.state.mode === "ref") {
      const c = Math.cos(2 * th), s = Math.sin(2 * th);
      return { a: c, b: s, c: s, d: -c };
    }
    // 非正交对照：沿 θ 方向拉伸 1.6 / 垂直方向压缩 0.7
    const R = LA.rot2(th), D = { a: 1.6, b: 0, c: 0, d: 0.7 };
    const Rt = { a: R.a, b: R.c, c: R.b, d: R.d };
    return LA.mul2(LA.mul2(R, D), Rt);
  },

  M_eff(now) { return effM(this.state.anim, this.Q(), now); },
  changed(now) { matrixChanged(this.state.anim, this.Q(), now); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const M = this.M_eff(t);
    const ortho = S.mode !== "stretch";
    const c1 = LA.col1(M), c2 = LA.col2(M);

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    // 单位圆：正交下不变（像与原圆重合），非正交变椭圆
    strokeCircle(ctx, cam, null, 1, "rgba(230,237,243,.45)", 1.4, 1, [5, 5]);
    strokeCircle(ctx, cam, M, 1, ortho ? "#7ee787" : "#ff7b72", 2.6, 1);
    LA.draw.grid(ctx, cam, { matrix: M, color: ortho ? "#2c4a3a" : "#2c4470", width: 1.2, emphasis: ortho ? "#5f9e6f" : "#4a6ba6" });

    // 变换后的基：正交 ⟹ 仍为单位长、互相垂直
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3.2, head: 11 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3.2, head: 11 });
    LA.draw.dot(ctx, cam, c1, "rgba(230,237,243,.9)", 2.5);
    LA.draw.dot(ctx, cam, c2, "rgba(230,237,243,.9)", 2.5);
    if (ortho) {
      strokeCircle(ctx, cam, null, 1.02, "rgba(126,231,135,.25)", 5, 1);
      rightAngleMark(ctx, cam, { x: 0, y: 0 }, c1, c2, 0.22, "rgba(126,231,135,.9)");
    }
    LA.draw.label(ctx, cam, c1, `|${"î′"}|=1`, ortho ? "#7ee787" : "#ff9e9e", { fontSize: 10.5, dx: 6, dy: 14 });
    LA.draw.label(ctx, cam, { x: 0, y: 0 },
      ortho
        ? (S.mode === "rot" ? "旋转：det = +1，单位圆纹丝不动 ✓" : "反射：det = −1，单位圆纹丝不动 ✓")
        : "拉伸：单位圆变成椭圆 ✗（不是正交变换）",
      ortho ? "#7ee787" : "#ff7b72",
      { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13.5, bold: true });
  },

  hitTest() { return null; },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">变换类型</div>
        <div class="btn-row">
          <button class="btn" data-m="rot">↻ 旋转</button>
          <button class="btn" data-m="ref">⇄ 反射</button>
          <button class="btn" data-m="stretch">⤡ 拉伸(非正交)</button>
        </div>
        <div style="margin-top:6px">
          <div class="kv"><span class="k">角度 θ</span><span class="v" id="s24tv">${S.theta}°</span></div>
          <input type="range" id="s24t" min="0" max="180" step="1" value="${S.theta}">
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">正交矩阵体检</div>
        <div class="kv"><span class="k">Q</span></div>
        <div id="s24q"></div>
        <div class="kv" style="margin-top:4px"><span class="k">QᵀQ（应 = I）</span><span class="v" id="s24check"></span></div>
        <div class="kv"><span class="k">det Q</span><span class="v" id="s24det"></span></div>
        <div class="kv"><span class="k">两列长度 / 夹角</span><span class="v" id="s24cols" style="font-size:12px"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          欧氏空间的"同构"不再是任意可逆矩阵，而是
          <b>保内积</b>的变换：<span class="hl-y">⟨Qu, Qv⟩ = ⟨u, v⟩</span>，
          等价于矩阵满足 <span class="hl-y">QᵀQ = I</span>（列 = 标准正交基）。<br><br>
          保内积 ⟹ 长度、角度、距离全都不变：
          所以<b>单位圆纹丝不动</b>、网格转完还是方格网。<br><br>
          2D 正交变换只有两种：<br>
          · det = <span class="hl-g">+1</span>：旋转（保持定向）<br>
          · det = <span class="hl-r">−1</span>：反射（翻转定向，第 3 章的负行列式！）<br><br>
          切到"拉伸"对照：单位圆被拉成椭圆，夹角变了 ——
          它是可逆线性变换但<b>不是</b>欧氏同构。<br><br>
          💡 全体正交矩阵构成群 O(n)；det=+1 的构成 SO(n)（旋转群）。
        </div>
      </div>`;
    this._panel = el;

    el.querySelectorAll("[data-m]").forEach((btn) => btn.addEventListener("click", () => {
      S.mode = btn.dataset.m;
      this.changed(LA.app.now());
      this.refreshPanel();
    }));
    el.querySelector("#s24t").addEventListener("input", (e) => {
      S.theta = parseFloat(e.target.value);
      el.querySelector("#s24tv").textContent = S.theta + "°";
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const Q = this.Q();
    const qEl = el.querySelector("#s24q");
    if (!qEl.dataset.built) { qEl.innerHTML = LA.ui.mat2HTML("s24qq", Q, { readonly: true, cls: "readonly" }); qEl.dataset.built = "1"; }
    LA.ui.setMat2(el, "s24qq", Q);
    const Qt = { a: Q.a, b: Q.c, c: Q.b, d: Q.d };
    const P = LA.mul2(Qt, Q);
    const ok = Math.abs(P.a - 1) < 1e-6 && Math.abs(P.d - 1) < 1e-6 && Math.abs(P.b) < 1e-6 && Math.abs(P.c) < 1e-6;
    el.querySelector("#s24check").innerHTML = ok ? '<span style="color:#7ee787">= I ✓ 正交</span>' : `<span style="color:#ff7b72">≠ I（非正交）</span>`;
    const detEl = el.querySelector("#s24det");
    const det = LA.det2(Q);
    detEl.textContent = LA.fmt2(det) + (det > 0 ? "（旋转型）" : det < 0 ? "（反射型）" : "");
    detEl.style.color = det > 0 ? "#7ee787" : det < 0 ? "#ff7b72" : "#8b98a9";
    const c1 = LA.col1(Q), c2 = LA.col2(Q);
    el.querySelector("#s24cols").textContent =
      `${LA.fmt(LA.v.len(c1))}, ${LA.fmt(LA.v.len(c2))} / ${LA.fmt(Math.acos(LA.clamp(LA.v.dot(c1, c2), -1, 1)) * 180 / Math.PI)}°`;
  },
});

/* ============================================================
 * 第 25 章 正交补与投影
 * ============================================================ */
LA.scenes.push({
  id: "orthocomplement", icon: "⊥", name: "正交补与投影",
  tagline: "ℝ² = W ⊕ W⊥：每个向量都有最整齐的拆法",
  newCam: () => new LA.Cam2D(62),

  state: {
    u: { x: 1.5, y: 0.6 },   // W = span(u)
    x: { x: 2.2, y: 1.9 },
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const perpU = { x: -S.u.y, y: S.u.x };

    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a" });

    // W 与 W⊥
    LA.draw.spanLine(ctx, cam, S.u, "rgba(126,231,135,.6)", { width: 2.2 });
    LA.draw.spanLine(ctx, cam, perpU, "rgba(86,212,221,.5)", { width: 1.6, dash: [6, 5] });
    LA.draw.label(ctx, cam, LA.v.scale(LA.v.norm(S.u), 4.6), "W = span(u)", "#7ee787", { fontSize: 12.5, bold: true });
    LA.draw.label(ctx, cam, LA.v.scale(LA.v.norm(perpU), 4.6), "W⊥（一切与 W 垂直的向量）", "#56d4dd", { fontSize: 12, bold: true });

    // 正交分解 x = proj + x⊥
    const un = LA.v.norm(S.u);
    const proj = LA.v.scale(un, LA.v.dot(S.x, un));
    const perpPart = LA.v.sub(S.x, proj);
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, proj, "#ffa657", { width: 3.4, head: 11 });
    LA.draw.arrow(ctx, cam, proj, S.x, "#d2a8ff", { width: 3, head: 11 });
    LA.draw.dot(ctx, cam, proj, "#ffa657", 4);
    rightAngleMark(ctx, cam, proj, un, perpPart, 0.2, "rgba(210,168,255,.85)");
    LA.draw.label(ctx, cam, LA.v.scale(proj, 0.55), `proj_W(x)`, "#ffa657", { fontSize: 11.5, bold: true });
    LA.draw.label(ctx, cam, LA.v.add(proj, LA.v.scale(perpPart, 0.5)), `x⊥（在 W⊥ 里）`, "#d2a8ff", { fontSize: 11.5, dx: 8 });
    LA.draw.label(ctx, cam, LA.v.add(proj, LA.v.scale(perpPart, 0.5)), `距离 = ${LA.fmt(LA.v.len(perpPart))}`, "#d2a8ff", { fontSize: 11, dy: 16, dx: 8 });

    // x
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.x, C.v, { width: 3.4, head: 12 });
    LA.draw.handle(ctx, cam, S.x, C.v, { hover: this._dragId === "x" || this._hoverId === "x" });
    // u 手柄
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.u, C.i, { width: 3.2, head: 11 });
    LA.draw.handle(ctx, cam, S.u, C.i, { hover: this._dragId === "u" || this._hoverId === "u" });

    LA.draw.label(ctx, cam, { x: 0, y: 0 }, "x = proj_W(x) + x⊥ ，两块互相垂直（正交直和）",
      "#8b98a9", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 13, bold: true });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p) => { S[id] = clampCol(p); this.refreshPanel(); },
    });
    if (LA.hitHandle(sx, sy, cam, S.x, 20)) return mk("x");
    if (LA.hitHandle(sx, sy, cam, S.u, 20)) return mk("u");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">正交分解（拖 u、x）</div>
        <div class="kv"><span class="k" style="color:#ffa657">proj_W(x)</span><span class="v" id="s25pj"></span></div>
        <div class="kv"><span class="k" style="color:#d2a8ff">x⊥ = x − proj</span><span class="v" id="s25pp"></span></div>
        <div class="kv"><span class="k">x 到 W 的距离</span><span class="v" id="s25dist"></span></div>
        <div class="kv"><span class="k">验证 x⊥ ⊥ W</span><span class="v" id="s25chk"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          欧氏空间里，子空间 W 多了一个"影子世界"：<br>
          <span class="hl-y">W⊥ = { v : v 与 W 里一切向量垂直 }</span><br><br>
          它们拼得干干净净：<b>ℝ² = W ⊕ W⊥（正交直和）</b>——
          比第 16 章的直和更整齐：拆分的两个部件还<b>互相垂直</b>，
          而且拆法由几何直接决定（垂足在哪，proj 就在哪）。<br><br>
          <b>proj_W(x)</b> 有一个最优化身份：
          它是 W 上<b>离 x 最近的点</b>（紫色 x⊥ 的长度就是最短距离）
          —— 最小二乘法、数据拟合的全部几何原理就在这一句话里。<br><br>
          好性质一箩筐：W⊥⊥ = W；dim W + dim W⊥ = n；
          标准正交基 = 每个坐标都是"投影系数"。<br><br>
          💡 拖 x：垂足跟着走，两块始终垂直；
          拖 u 换 W：W⊥ 同步旋转（永远差 90°）。
        </div>
      </div>`;
    this._panel = el;
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const un = LA.v.norm(S.u);
    const proj = LA.v.scale(un, LA.v.dot(S.x, un));
    const perpPart = LA.v.sub(S.x, proj);
    el.querySelector("#s25pj").textContent = `(${LA.fmt(proj.x)}, ${LA.fmt(proj.y)})`;
    el.querySelector("#s25pp").textContent = `(${LA.fmt(perpPart.x)}, ${LA.fmt(perpPart.y)})`;
    el.querySelector("#s25dist").textContent = LA.fmt(LA.v.len(perpPart));
    const dotchk = LA.v.dot(perpPart, S.u);
    const chk = el.querySelector("#s25chk");
    chk.textContent = Math.abs(dotchk) < 1e-6 ? "⟨x⊥, u⟩ = 0 ✓" : LA.fmt(dotchk);
    chk.style.color = "#7ee787";
  },
});

/* ============================================================
 * 第 26 章 实对称矩阵的标准型（谱定理）
 * ============================================================ */
LA.scenes.push({
  id: "spectral", icon: "Λ", name: "实对称矩阵：正交对角化",
  tagline: "Aᵀ = A ⟹ 必有 A = QΛQᵀ，特征方向互相垂直",
  newCam: () => new LA.Cam2D(58),

  state: {
    a: 2, b: 0.6, c: 1,        // A = [[a,b],[b,c]] 对称
    NS: null,                   // 非对称对照矩阵（预设时使用）
    playing: false, playT0: 0,
  },

  A() { return this.state.NS || { a: this.state.a, b: this.state.b, c: this.state.b, d: this.state.c }; },
  isSym() { return !this.state.NS; },

  eigData() {
    const A = this.A();
    const eig = LA.eigen2(A);
    let v1 = eig.v1, v2 = eig.v2;
    if (eig.allVectors) { v1 = { x: 1, y: 0 }; v2 = { x: 0, y: 1 }; }
    else if (eig.real && !v2) v2 = { x: -v1.y, y: v1.x };
    return { eig, v1, v2, l1: eig.allVectors ? A.a : eig.l1, l2: eig.allVectors ? A.a : eig.l2 };
  },

  M_eff(now) {
    const S = this.state;
    const A = this.A();
    if (S.playing && this.isSym()) {
      const { v1, v2, l1, l2 } = this.eigData();
      if (!v1) { S.playing = false; return A; }
      const Q = LA.fromCols(v1, v2);
      const Qt = { a: Q.a, b: Q.c, c: Q.b, d: Q.d };
      const LQ = LA.mul2({ a: l1, b: 0, c: 0, d: l2 }, Qt);
      const tt = LA.clamp((now - S.playT0) / 3.6, 0, 1);
      if (tt >= 1) S.playing = false;
      if (tt < 1 / 3) return LA.lerp2(LA.ident2(), Qt, LA.ease(tt * 3));
      if (tt < 2 / 3) return LA.lerp2(Qt, LQ, LA.ease(tt * 3 - 1));
      return LA.lerp2(LQ, A, LA.ease(tt * 3 - 2));
    }
    return A;
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const M = this.M_eff(t);
    const sym = this.isSym();
    const { eig, v1, v2, l1, l2 } = this.eigData();

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    LA.draw.grid(ctx, cam, { matrix: M, color: "#2c4470", width: 1.2, emphasis: "#4a6ba6" });
    LA.draw.axes(ctx, cam, { matrix: M, color: "#4f6fa5", width: 1.7 });

    // 特征方向
    if (eig.real && v1) {
      LA.draw.spanLine(ctx, cam, v1, "rgba(210,168,255,.55)", { width: 1.6 });
      if (v2) LA.draw.spanLine(ctx, cam, v2, "rgba(86,212,221,.55)", { width: 1.6 });
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, LA.v.scale(v1, 2), "#d2a8ff", { width: 2.8, head: 10 });
      if (v2) LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, LA.v.scale(v2, 2), "#56d4dd", { width: 2.8, head: 10 });
      if (v2 && sym) {
        rightAngleMark(ctx, cam, { x: 0, y: 0 }, v1, v2, 0.26, "rgba(240,180,41,.95)");
        LA.draw.label(ctx, cam, LA.v.scale(v1, 2.35), `λ₁=${LA.fmt(l1)}`, "#d2a8ff", { fontSize: 12, bold: true });
        LA.draw.label(ctx, cam, LA.v.scale(v2, 2.35), `λ₂=${LA.fmt(l2)}`, "#56d4dd", { fontSize: 12, bold: true });
        if (!S.playing) LA.draw.label(ctx, cam, { x: 0, y: 0 }, "两个特征方向互相垂直 ✓（对称矩阵的特权）",
          "#f0b429", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13, bold: true });
      }
      if (!sym && !S.playing) {
        LA.draw.label(ctx, cam, { x: 0, y: 0 }, "非对称对照：特征方向不垂直 → 无法正交对角化", "#ff7b72",
          { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13, bold: true });
      }
    }

    // A 的列（对称约束拖拽）
    const A = this.A();
    const col1 = { x: A.a, y: A.b }, col2 = { x: A.b, y: A.c };
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, col1, C.i, { width: 2.8, head: 10, alpha: .85 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, col2, C.j, { width: 2.8, head: 10, alpha: .85 });
    LA.draw.handle(ctx, cam, col1, C.i, { hover: this._dragId === "c1" || this._hoverId === "c1" });
    LA.draw.handle(ctx, cam, col2, C.j, { hover: this._dragId === "c2" || this._hoverId === "c2" });

    if (S.playing) {
      const tt = LA.clamp((t - S.playT0) / 3.6, 0, 1);
      const phase = tt < 1 / 3 ? "① Qᵀ：转到主轴坐标系" : tt < 2 / 3 ? "② Λ：沿主轴纯伸缩（变成轴对齐）" : "③ Q：再转回来（A = QΛQᵀ）";
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, phase, "#f0b429",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 14, bold: true });
    }
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const A = this.A();
    const col1 = { x: A.a, y: A.b }, col2 = { x: A.b, y: A.c };
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p) => {
        const q = clampCol(p);
        S.NS = null; // 拖动即回到对称世界
        if (id === "c1") { S.a = q.x; S.b = q.y; }
        else { S.b = q.x; S.c = q.y; }
        this.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, cam, col1, 20)) return mk("c1");
    if (LA.hitHandle(sx, sy, cam, col2, 20)) return mk("c2");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">对称矩阵 A = [[a,b],[b,c]]</div>
        <div style="display:flex; gap:6px; align-items:center">
          <label style="font-size:12px;color:var(--muted)">a=</label><input type="number" step="0.1" id="s26a" style="width:60px">
          <label style="font-size:12px;color:var(--muted)">b=</label><input type="number" step="0.1" id="s26b" style="width:60px">
          <label style="font-size:12px;color:var(--muted)">c=</label><input type="number" step="0.1" id="s26c" style="width:60px">
        </div>
        <div class="btn-row">
          <button class="btn primary" id="s26play">▶ 播放主轴分解动画</button>
          <button class="btn" id="s26ns">非对称对照</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">标准型 A = QΛQᵀ</div>
        <div class="kv"><span class="k">Λ（标准型）</span></div>
        <div id="s26lam"></div>
        <div class="kv" style="margin-top:4px"><span class="k">Q（正交矩阵）</span></div>
        <div id="s26q"></div>
        <div class="kv" style="margin-top:4px"><span class="k">QᵀQ</span><span class="v" id="s26chk"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>谱定理</b>：实对称矩阵必可<span class="hl-y">正交对角化</span>——
          存在正交矩阵 Q（QᵀQ = I）使 <b>A = QΛQᵀ</b>，Λ 是实对角阵。<br><br>
          播放动画看清结构：A 的作用 =
          <b>转到主轴坐标（Qᵀ）→ 沿主轴纯伸缩（Λ）→ 转回来（Q）</b>。
          和 SVD（第 14 章）几乎一样，但对称矩阵更强：<b>两头的旋转互为逆转</b>（U = V）。<br><br>
          对称的两大特权：<br>
          · 特征值<b>全是实数</b>（不会有复数逃逸）<br>
          · 特征方向<b>互相垂直</b>（画面里的金色直角）——
            所以能当"标准正交基"，坐标轴一转就齐了。<br><br>
          这正是第 13 章主轴定理的矩阵版本：
          二次型 q = xᵀAx 在主轴坐标下只剩平方项 λ₁y₁² + λ₂y₂²。<br><br>
          ⚠️ 点"非对称对照"：特征方向不再垂直，正交对角化当场失败
          —— 对称性不是装饰，是定理的前提。
        </div>
      </div>`;
    this._panel = el;

    ["a", "b", "c"].forEach((k) => {
      el.querySelector(`#s26${k}`).addEventListener("input", (e) => {
        const v = parseFloat(e.target.value);
        if (isFinite(v)) { S.NS = null; S[k] = LA.clamp(v, -5, 5); this.refreshPanel(); }
      });
    });
    el.querySelector("#s26play").addEventListener("click", () => {
      if (!this.isSym()) { LA.app.toast("先回到对称矩阵（拖动任意端点即可）"); return; }
      S.playing = true; S.playT0 = LA.app.now();
    });
    el.querySelector("#s26ns").addEventListener("click", () => {
      S.NS = { a: 2, b: 1, c: 0, d: 3 };
      S.playing = false;
      this.refreshPanel();
      LA.app.toast("非对称对照：观察特征方向还垂直吗？");
    });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    ["a", "b", "c"].forEach((k) => { const inp = el.querySelector(`#s26${k}`); if (document.activeElement !== inp) inp.value = LA.fmt2(S[k]); });
    const sym = this.isSym();
    const { l1, l2, v1, v2 } = this.eigData();
    const lamEl = el.querySelector("#s26lam");
    if (!lamEl.dataset.built) { lamEl.innerHTML = LA.ui.mat2HTML("s26L", LA.ident2(), { readonly: true, cls: "readonly" }); lamEl.dataset.built = "1"; }
    LA.ui.setMat2(el, "s26L", { a: l1, b: 0, c: 0, d: l2 });
    const qEl = el.querySelector("#s26q");
    if (!qEl.dataset.built) { qEl.innerHTML = LA.ui.mat2HTML("s26QQ", LA.ident2(), { readonly: true, cls: "readonly" }); qEl.dataset.built = "1"; }
    if (v1) {
      const Q = LA.fromCols(v1, v2 || { x: -v1.y, y: v1.x });
      LA.ui.setMat2(el, "s26QQ", Q);
      const Qt = { a: Q.a, b: Q.c, c: Q.b, d: Q.d };
      const P = LA.mul2(Qt, Q);
      const ok = sym && Math.abs(P.a - 1) < 1e-6 && Math.abs(P.d - 1) < 1e-6 && Math.abs(P.b) < 1e-6;
      const chk = el.querySelector("#s26chk");
      chk.innerHTML = ok ? "= I ✓" : (sym ? "≈ I" : "—（非对称）");
      chk.style.color = ok ? "#7ee787" : "#ff7b72";
    }
  },
});

/* ============================================================
 * 第 27 章 酉空间（复内积空间）
 * ============================================================ */
LA.scenes.push({
  id: "unitary", icon: "ℂ", name: "酉空间：复数版的内积",
  tagline: "⟨u,v⟩ = u·v̄：带共轭的内积，多出一个虚部",
  newCam: () => new LA.Cam2D(62),

  state: {
    u: { x: 1.2, y: 0.6 },
    v: { x: -0.4, y: 1.1 },
    theta: 0,          // 酉变换：旋转 e^{iθ}
  },

  /* 复内积 ⟨u,v⟩ = u · conj(v) = re + i·im */
  inner(u, v) {
    return {
      re: u.x * v.x + u.y * v.y,
      im: u.y * v.x - u.x * v.y,
    };
  },
  rotZ(p, th) { return { x: p.x * Math.cos(th) - p.y * Math.sin(th), y: p.x * Math.sin(th) + p.y * Math.cos(th) }; },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const th = S.theta * Math.PI / 180;
    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a" });
    strokeCircle(ctx, cam, null, 1, "rgba(230,237,243,.35)", 1.3, 1, [4, 5]);

    // 原始 u, v
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.u, C.i, { width: 3.2, head: 11 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.v, C.j, { width: 3.2, head: 11 });
    LA.draw.handle(ctx, cam, S.u, C.i, { hover: this._dragId === "u" || this._hoverId === "u" });
    LA.draw.handle(ctx, cam, S.v, C.j, { hover: this._dragId === "v" || this._hoverId === "v" });
    LA.draw.label(ctx, cam, S.u, "u", C.i, { dy: -24 });
    LA.draw.label(ctx, cam, S.v, "v", C.j, { dy: -24 });

    // 酉变换（旋转）后的 u′, v′
    if (Math.abs(th) > 1e-6) {
      const u2 = this.rotZ(S.u, th), v2 = this.rotZ(S.v, th);
      strokeCircle(ctx, cam, null, LA.v.len(S.u), "rgba(126,231,135,.3)", 1.4, 1);
      strokeCircle(ctx, cam, null, LA.v.len(S.v), "rgba(255,123,114,.25)", 1.4, 1);
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, u2, "rgba(126,231,135,.85)", { width: 2.6, head: 10 });
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, v2, "rgba(255,157,193,.85)", { width: 2.6, head: 10 });
      LA.draw.label(ctx, cam, u2, "u′", "#7ee787", { fontSize: 12, bold: true, dy: -20 });
      LA.draw.label(ctx, cam, v2, "v′", "#ff9ec1", { fontSize: 12, bold: true, dy: -20 });
    }

    const ip = this.inner(S.u, S.v);
    const lu = LA.v.len(S.u), lv = LA.v.len(S.v);
    LA.draw.label(ctx, cam, { x: 0, y: 0 },
      `⟨u,v⟩ = ${LA.fmt(ip.re)} ${ip.im >= 0 ? "+" : "−"} ${LA.fmt(Math.abs(ip.im))}i   |u|=${LA.fmt(lu)} |v|=${LA.fmt(lv)}`,
      "#e6edf3", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 13.5, bold: true });
    LA.draw.label(ctx, cam, { x: 0, y: 0 },
      Math.abs(th) > 1e-6
        ? `⟨u′,v′⟩ = ⟨u,v⟩ ✓（酉变换保内积，两段彩圈 = 长度没变）`
        : "复内积 = 实点积 + 一个虚部（转过 90° 的成分）",
      "#8b98a9", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -40, fontSize: 12.5 });
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
        <div class="panel-title">复内积（拖 u、v）</div>
        <div class="kv"><span class="k">⟨u,v⟩ = u·v̄</span><span class="v" id="s27ip"></span></div>
        <div class="kv"><span class="k">⟨v,u⟩ = 共轭翻转</span><span class="v" id="s27ipc"></span></div>
        <div class="kv"><span class="k">|⟨u,v⟩| ≤ |u||v|</span><span class="v" id="s27cs"></span></div>
        <div style="margin-top:6px">
          <div class="kv"><span class="k">酉变换 e^{iθ}（旋转）</span><span class="v" id="s27tv">${S.theta}°</span></div>
          <input type="range" id="s27t" min="0" max="360" step="1" value="${S.theta}">
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          把欧氏空间搬到复数域 = <b>酉空间</b>。
          内积多一条规矩：<span class="hl-y">⟨u,v⟩ = conj(⟨v,u⟩)</span>
          （共轭对称），实现上是 <b>⟨u,v⟩ = u·v̄</b>（v 要取共轭）。<br><br>
          于是内积变成复数：<b>实部 = 欧氏点积（投影成分），
          虚部 = 旋转成分</b>（两向量差 90° 时全在虚部）。⟨v,v⟩ 永远是实数 = |v|²。<br><br>
          <b>酉变换</b>：保复内积的线性变换，矩阵满足 <span class="hl-y">UᴴU = I</span>
          （Uᴴ = 共轭转置）。ℂ¹ 上就是旋转 e^{iθ}——
          拖滑杆：两段彩圈显示 |u′|=|u|，内积一字不差。<br><br>
          谱定理照样成立（还更好）：Hermitian 阵（Aᴴ=A）
          特征值全实 + 标准正交特征基；酉矩阵可对角化任意正规矩阵。<br><br>
          💡 实数世界的一切（正交、投影、谱定理）在复数世界都有镜像，
          只是"转置"全部换成"共轭转置"。
        </div>
      </div>`;
    this._panel = el;

    el.querySelector("#s27t").addEventListener("input", (e) => {
      S.theta = parseFloat(e.target.value);
      el.querySelector("#s27tv").textContent = S.theta + "°";
      this.refreshPanel();
    });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const ip = this.inner(S.u, S.v);
    const ipr = this.inner(S.v, S.u);
    el.querySelector("#s27ip").textContent = `${LA.fmt(ip.re)} ${ip.im >= 0 ? "+" : "−"} ${LA.fmt(Math.abs(ip.im))}i`;
    el.querySelector("#s27ipc").textContent = `${LA.fmt(ipr.re)} ${ipr.im >= 0 ? "+" : "−"} ${LA.fmt(Math.abs(ipr.im))}i`;
    const bound = LA.v.len(S.u) * LA.v.len(S.v);
    const mod = Math.hypot(ip.re, ip.im);
    const cs = el.querySelector("#s27cs");
    cs.textContent = `${LA.fmt(mod)} ≤ ${LA.fmt(bound)} ${mod <= bound + 1e-9 ? "✓" : "✗"}`;
    cs.style.color = "#7ee787";
  },
});
