/* =========================================================
 * scenes6.js —— 第18~20章：值域与核 / 不变子空间 / Jordan 标准型
 * ========================================================= */
"use strict";

/* ============================================================
 * 第 18 章 值域与核（像与核）
 * ============================================================ */
LA.scenes.push({
  id: "image-kernel", icon: "∅", name: "值域与核：谁被送达，谁消失",
  tagline: "值域 = 能到的地方；核 = 被压到 0 的所有向量",
  newCam: () => new LA.Cam2D(62),

  state: {
    A: { a: 1, b: 2, c: 2, d: 4 },   // 秩 1：列共线
    x: { x: 2, y: 1 },
    anim: makeAnim(true),
  },

  rank() {
    const S = this.state.A;
    if (Math.abs(S.a) + Math.abs(S.b) + Math.abs(S.c) + Math.abs(S.d) < 1e-9) return 0;
    return Math.abs(LA.det2(S)) > 1e-9 ? 2 : 1;
  },

  kernelDir() {
    const S = this.state.A;
    if (Math.abs(S.a) + Math.abs(S.b) > 1e-9) return LA.v.norm({ x: S.b, y: -S.a });
    if (Math.abs(S.c) + Math.abs(S.d) > 1e-9) return LA.v.norm({ x: S.d, y: -S.c });
    return null; // 零矩阵：核 = 全平面
  },

  M_eff(now) { return effM(this.state.anim, this.state.A, now); },
  changed(now) { matrixChanged(this.state.anim, this.state.A, now); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const M = this.M_eff(t);
    const r = this.rank();
    const kdir = this.kernelDir();
    const c1 = LA.col1(S.A), c2 = LA.col2(S.A);

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    LA.draw.grid(ctx, cam, { matrix: M, color: "#2c4470", width: 1.2, emphasis: "#4a6ba6" });
    LA.draw.axes(ctx, cam, { matrix: M, color: "#4f6fa5", width: 1.7 });

    // 值域（列空间）
    if (r === 2) {
      ctx.save(); ctx.fillStyle = "rgba(121,184,255,.05)"; ctx.fillRect(0, 0, cam.w, cam.h); ctx.restore();
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "值域 = ℝ²（满射：哪里都能到）", "#79b8ff",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13, bold: true });
    } else if (r === 1) {
      const dir = (LA.v.len(c1) > 1e-9) ? c1 : c2;
      LA.draw.spanLine(ctx, cam, dir, "rgba(121,184,255,.8)", { width: 3.5 });
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "值域 = 这条线（所有输出挤在列空间上）", "#79b8ff",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13, bold: true });
    } else {
      LA.draw.dot(ctx, cam, { x: 0, y: 0 }, "#79b8ff", 6);
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "值域 = {0}（零矩阵）", "#79b8ff",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13, bold: true });
    }

    // 核
    if (kdir) {
      LA.draw.spanLine(ctx, cam, kdir, "rgba(86,212,221,.75)", { width: 2.4 });
      const kl = LA.v.scale(kdir, 3.2);
      LA.draw.label(ctx, cam, kl, "核 ker A：这条线上的向量全部 → 0", "#56d4dd", { fontSize: 12, bold: true, dx: 10 });
    } else {
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "核 = 整个平面（全都 → 0）", "#56d4dd",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 13, bold: true });
    }

    // 采样向量 x → Ax
    const Ax = LA.apply2(S.A, S.x);
    const inKernel = LA.v.len(Ax) < 0.12;
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.x, C.v, { width: 3.2, head: 11 });
    LA.draw.label(ctx, cam, S.x, "x", C.v, { dy: -26 });
    LA.draw.handle(ctx, cam, S.x, C.v, { hover: this._dragId === "x" || this._hoverId === "x" });
    if (!inKernel) {
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, Ax, C.sum, { width: 3.2, head: 11 });
      LA.draw.label(ctx, cam, Ax, `Ax = (${LA.fmt(Ax.x)}, ${LA.fmt(Ax.y)})`, C.sum, { bold: true, dy: -26, dx: 8 });
    } else {
      const s = cam.toS({ x: 0, y: 0 });
      const pulse = 8 + Math.sin(t * 6) * 3;
      ctx.save();
      ctx.strokeStyle = "rgba(86,212,221,.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, pulse + 4, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "x 在核里 → Ax = 0，消失了!", "#56d4dd",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -40, fontSize: 13, bold: true });
    }

    // A 的列可拖
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3, head: 10, alpha: .85 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3, head: 10, alpha: .85 });
    LA.draw.handle(ctx, cam, c1, C.i, { hover: this._dragId === "c1" || this._hoverId === "c1" });
    LA.draw.handle(ctx, cam, c2, C.j, { hover: this._dragId === "c2" || this._hoverId === "c2" });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const app2 = LA.app;
    const M = this.M_eff(app2.now());
    const c1 = LA.col1(M), c2 = LA.col2(M);
    const mk = (id, keys) => ({
      id, cursor: "grab",
      drag: (p) => {
        const q = clampCol(p);
        if (id === "x") { S.x = q; }
        else { S.A[keys[0]] = q.x; S.A[keys[1]] = q.y; this.changed(app2.now()); }
        this.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, cam, S.x, 18)) return mk("x");
    if (LA.hitHandle(sx, sy, cam, c1, 20)) return mk("c1", ["a", "c"]);
    if (LA.hitHandle(sx, sy, cam, c2, 20)) return mk("c2", ["b", "d"]);
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">矩阵 A（拖 î′、ĵ′ 或金色 x）</div>
        ${LA.ui.mat2HTML("s18m", S.A)}
        <div class="btn-row">
          <button class="btn" data-p="inv">可逆(核={0})</button>
          <button class="btn" data-p="rank1">秩1(核=线)</button>
          <button class="btn" data-p="zero">零矩阵(核=ℝ²)</button>
        </div>
        <label class="chk" style="margin-top:4px"><input type="checkbox" id="s18anim" ${S.anim.on ? "checked" : ""}> 平滑动画</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">诊断</div>
        <div class="kv"><span class="k">秩 rank A（值域维数）</span><span class="v" id="s18rank"></span></div>
        <div class="kv"><span class="k">零化度 dim ker A</span><span class="v" id="s18null"></span></div>
        <div class="kv"><span class="k">秩-零化度定理</span><span class="v" id="s18rn"></span></div>
        <div class="kv"><span class="k">Ax（拖 x 观察）</span><span class="v" id="s18ax"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          一个变换有两个"签名"：<br><br>
          <b>值域（像）Ran A</b>：所有输出组成的集合 =
          列空间（î′、ĵ′ 能拼出的一切）。
          它回答"<b>能到哪</b>"。<br><br>
          <b>核 Ker A</b>：被压到原点的所有输入。
          它回答"<b>谁消失了</b>"。<br><br>
          两边此消彼长 ——
          <span class="hl-y">rank + 零化度 = 2</span>（秩-零化度定理）：
          输入的维数，一部分用来"到达的广度"（秩），
          剩下的全部"压扁丢失"（核）。<br><br>
          · 核 = {0}：没有信息丢失 → 可逆（第 10 章）<br>
          · 核 = 一条线：整整一个方向的信息被压没了（秩1）<br>
          · 核 = ℝ²：全军覆没（零矩阵）<br><br>
          💡 拖着金色 x 转到青色核线上，看 Ax 当场蒸发。
        </div>
      </div>`;
    this._panel = el;

    LA.ui.mat2Bind(el, "s18m", (M) => {
      Object.assign(S.A, M);
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    el.querySelector("#s18anim").addEventListener("change", (e) => { S.anim.on = e.target.checked; });
    const presets = {
      inv: { a: 1.5, b: 0.4, c: 0.3, d: 1.2 },
      rank1: { a: 1, b: 2, c: 2, d: 4 },
      zero: { a: 0, b: 0, c: 0, d: 0 },
    };
    el.querySelectorAll("[data-p]").forEach((btn) => btn.addEventListener("click", () => {
      Object.assign(S.A, presets[btn.dataset.p]);
      this.changed(LA.app.now());
      this.refreshPanel();
    }));
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const r = this.rank();
    el.querySelector("#s18rank").textContent = r === 0 ? "0" : `${r}（${r === 2 ? "ℝ²" : "一条线"}）`;
    el.querySelector("#s18null").textContent = 2 - r === 0 ? "0（{0}）" : `${2 - r}（${r === 0 ? "ℝ²" : "一条线"}）`;
    el.querySelector("#s18rn").textContent = `${r} + ${2 - r} = 2 ✓`;
    el.querySelector("#s18rn").style.color = "#7ee787";
    const Ax = LA.apply2(S.A, S.x);
    el.querySelector("#s18ax").textContent = LA.v.len(Ax) < 0.12 ? "(0, 0) 消失!" : `(${LA.fmt(Ax.x)}, ${LA.fmt(Ax.y)})`;
    el.querySelector("#s18ax").style.color = LA.v.len(Ax) < 0.12 ? "#56d4dd" : "#ffa657";
    LA.ui.setMat2(el, "s18m", S.A);
  },
});

/* ============================================================
 * 第 19 章 不变子空间
 * ============================================================ */
LA.scenes.push({
  id: "invariant", icon: "⟲", name: "不变子空间：出不去的国境",
  tagline: "A(W) ⊆ W：线上的向量转一圈还在自己的线上",
  newCam: () => new LA.Cam2D(62),

  state: {
    A: { a: 2, b: 1, c: 1, d: 2 },
    probeAng: 0.9,            // 探针方向（弧度）
    anim: makeAnim(true),
  },

  M_eff(now) { return effM(this.state.anim, this.state.A, now); },
  changed(now) { matrixChanged(this.state.anim, this.state.A, now); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const M = this.M_eff(t);
    const eig = LA.eigen2(S.A);
    const u = { x: Math.cos(S.probeAng), y: Math.sin(S.probeAng) };
    const Au = LA.apply2(S.A, u);
    const cross = u.x * Au.y - u.y * Au.x;
    const parallel = LA.v.len(Au) > 1e-6 && Math.abs(cross) < 0.05 * LA.v.len(Au);

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    LA.draw.grid(ctx, cam, { matrix: M, color: "#223350", width: 1.1 });

    // 特征方向（真实的 1D 不变子空间）
    if (eig.real && !eig.allVectors) {
      if (eig.v1) LA.draw.spanLine(ctx, cam, eig.v1, "rgba(210,168,255,.4)", { width: 1.4 });
      if (eig.v2) LA.draw.spanLine(ctx, cam, eig.v2, "rgba(86,212,221,.4)", { width: 1.4 });
    }

    // 探针线 span(u)
    LA.draw.spanLine(ctx, cam, u, parallel ? "rgba(126,231,135,.8)" : "rgba(230,237,243,.35)", { width: parallel ? 2.8 : 1.4 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, LA.v.scale(u, 1.6), parallel ? "#7ee787" : "#e6edf3", { width: 2.6, head: 10 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, Au, C.sum, { width: 3, head: 11 });
    LA.draw.label(ctx, cam, Au, "Au", C.sum, { fontSize: 12, bold: true, dx: 8, dy: -8 });

    // 探针手柄
    const probeTip = LA.v.scale(u, 2.4);
    LA.draw.handle(ctx, cam, probeTip, "#f0b429", { hover: this._dragId === "probe" || this._hoverId === "probe" });
    LA.draw.dot(ctx, cam, probeTip, "rgba(240,180,41,.5)", 2.5);

    // 结论标签
    let msg;
    if (eig.allVectors) msg = "A = λI：所有直线都是不变子空间！";
    else if (!eig.real) msg = "纯旋转：没有任何直线能守住 —— 1D 不变子空间不存在";
    else if (parallel) msg = `✓ u 沿特征方向：Au 还在线上 → span(u) 是不变子空间`;
    else msg = "✗ Au 跑到线外了 → span(u) 不是不变子空间";
    LA.draw.label(ctx, cam, { x: 0, y: 0 }, msg,
      parallel ? "#7ee787" : (eig.real ? "#8b98a9" : "#79b8ff"),
      { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13.5, bold: true });

    // A 的列
    const c1 = LA.col1(S.A), c2 = LA.col2(S.A);
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 2.8, head: 10, alpha: .8 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 2.8, head: 10, alpha: .8 });
    LA.draw.handle(ctx, cam, c1, C.i, { hover: this._dragId === "c1" || this._hoverId === "c1" });
    LA.draw.handle(ctx, cam, c2, C.j, { hover: this._dragId === "c2" || this._hoverId === "c2" });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const app2 = LA.app;
    const M = this.M_eff(app2.now());
    const c1 = LA.col1(M), c2 = LA.col2(M);
    const probeTip = LA.v.scale({ x: Math.cos(S.probeAng), y: Math.sin(S.probeAng) }, 2.4);
    if (LA.hitHandle(sx, sy, cam, probeTip, 22)) return {
      id: "probe", cursor: "grab",
      drag: (p) => { S.probeAng = Math.atan2(p.y, p.x); this.refreshPanel(); },
    };
    const mk = (id, keys) => ({
      id, cursor: "grab",
      drag: (p) => {
        const q = clampCol(p);
        S.A[keys[0]] = q.x; S.A[keys[1]] = q.y;
        this.changed(app2.now());
        this.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, cam, c1, 20)) return mk("c1", ["a", "c"]);
    if (LA.hitHandle(sx, sy, cam, c2, 20)) return mk("c2", ["b", "d"]);
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">探针（拖金色手柄绕原点转）</div>
        <div class="kv"><span class="k">u 方向</span><span class="v" id="s19u"></span></div>
        <div class="kv"><span class="k">Au 与 u 的关系</span><span class="v" id="s19rel"></span></div>
        <div class="kv"><span class="k">span(u) 不变？</span><span class="v" id="s19inv"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">矩阵 A（拖端点改）</div>
        ${LA.ui.mat2HTML("s19m", S.A)}
        <div class="btn-row">
          <button class="btn" data-p="diag">对角(坐标轴不变)</button>
          <button class="btn" data-p="eig">对称(斜特征线)</button>
          <button class="btn" data-p="rot">旋转(全线失守)</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          W 是<b>不变子空间</b> = 把 W 里的任何向量丢进 A，
          结果仍然落在 W 里：<span class="hl-y">A(W) ⊆ W</span>。<br><br>
          拖着探针绕原点转：大多数方向上，橙色 Au 都会拐出白色直线；
          只有转到<span class="hl-y">特征方向</span>上，Au 恰好躺回线上 ——
          <b>一维不变子空间 = 特征方向</b>（第 5 章的另一副面孔）。<br><br>
          每个空间都有两个"躺平"的不变子空间：<span class="hl-y">{0}</span> 和
          <span class="hl-y">全空间</span>；旋转矩阵连一条直线都守不住
          （这就是它没有实特征向量的原因）。<br><br>
          💡 不变子空间是"分解矩阵"的通用语言：
          找到一串不变子空间，就能把矩阵拆成块（第 12 章分块），
          拆到最碎就是特征分解；拆不动的残余，
          就是下一章的 <b>Jordan 块</b>。
        </div>
      </div>`;
    this._panel = el;

    LA.ui.mat2Bind(el, "s19m", (M) => {
      Object.assign(S.A, M);
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    const presets = {
      diag: { a: 2, b: 0, c: 0, d: 1 },
      eig: { a: 2, b: 1, c: 1, d: 2 },
      rot: { a: 0, b: -1, c: 1, d: 0 },
    };
    el.querySelectorAll("[data-p]").forEach((btn) => btn.addEventListener("click", () => {
      Object.assign(S.A, presets[btn.dataset.p]);
      this.changed(LA.app.now());
      this.refreshPanel();
    }));
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const u = { x: Math.cos(S.probeAng), y: Math.sin(S.probeAng) };
    const Au = LA.apply2(S.A, u);
    const cross = u.x * Au.y - u.y * Au.x;
    const parallel = LA.v.len(Au) > 1e-6 && Math.abs(cross) < 0.05 * LA.v.len(Au);
    el.querySelector("#s19u").textContent = `(${LA.fmt(u.x)}, ${LA.fmt(u.y)})`;
    const ratio = LA.v.len(Au) > 1e-6 ? cross / LA.v.len(Au) : 0;
    el.querySelector("#s19rel").textContent = parallel ? "共线（偏移 ≈ 0）" : `偏移 ${LA.fmt2(Math.abs(ratio))}`;
    const inv = el.querySelector("#s19inv");
    inv.textContent = parallel ? "✓ 是不变子空间" : "✗ 不是";
    inv.style.color = parallel ? "#7ee787" : "#ff7b72";
    LA.ui.setMat2(el, "s19m", S.A);
  },
});

/* ============================================================
 * 第 20 章 Jordan 标准型
 * ============================================================ */
LA.scenes.push({
  id: "jordan", icon: "⊟", name: "Jordan 标准型：差一点的整齐",
  tagline: "对角化失败时的最后形式：沿特征线的剪切",
  newCam: () => new LA.Cam2D(58),

  state: {
    lam: 2,        // 特征值 λ
    b: 1,          // Jordan 块的超对角元
    k: 3,          // 重复施加次数
    inPWorld: false, // 换一套坐标看（相似变换）
    cloud: null,
    anim: makeAnim(true),
  },

  init() {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    this.state.cloud = [];
    for (let i = 0; i < 18; i++) {
      const ang = rnd() * Math.PI * 2;
      const r = 0.7 + rnd() * 1.1;
      this.state.cloud.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
    }
  },

  J() { return { a: this.state.lam, b: this.state.b, c: 0, d: this.state.lam }; },
  P() { return LA.rot2(0.55); },

  Mdisp() {
    const S = this.state;
    const J = this.J();
    if (!S.inPWorld) return J;
    const P = this.P(), Pinv = { a: P.d, b: -P.b, c: -P.c, d: P.a }; // 旋转阵的逆 = 转置
    return LA.mul2(LA.mul2(P, J), Pinv);
  },

  pow(M, k) {
    let R = LA.ident2();
    for (let i = 0; i < k; i++) R = LA.mul2(M, R);
    return R;
  },

  changed(now) { matrixChanged(this.state.anim, this.Mdisp(), now); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const M = effM(S.anim, this.Mdisp(), t);
    const J = this.J();
    const defective = Math.abs(S.b) > 1e-6;
    const e1 = { x: 1, y: 0 };
    const P = this.P();
    const eigLineDir = S.inPWorld ? LA.apply2(P, e1) : e1;

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    LA.draw.grid(ctx, cam, { matrix: M, color: "#2c4470", width: 1.2, emphasis: "#4a6ba6" });
    LA.draw.axes(ctx, cam, { matrix: M, color: "#4f6fa5", width: 1.7 });

    // 唯一特征线
    LA.draw.spanLine(ctx, cam, eigLineDir, defective ? "rgba(210,168,255,.75)" : "rgba(210,168,255,.4)", { width: defective ? 3 : 1.6 });
    if (defective) {
      LA.draw.label(ctx, cam, LA.v.scale(eigLineDir, 4.2), "唯一的特征方向（几何重数 1）", "#d2a8ff", { fontSize: 12, bold: true, center: true });
    }

    // 云雾点被 J^k 反复作用：剪切行进
    const Mk = this.pow(M, S.k);
    S.cloud.forEach((p) => {
      LA.draw.dot(ctx, cam, p, "rgba(230,237,243,.28)", 2.5);
      const img = LA.apply2(Mk, p);
      LA.draw.dot(ctx, cam, img, "#ffa657", 3.5);
    });
    // 示范向量：e2（或 P·e2）被剪切成 (b, λ)
    const e2 = S.inPWorld ? LA.apply2(P, { x: 0, y: 1 }) : { x: 0, y: 1 };
    const e2img = LA.apply2(J, e2);
    if (!S.inPWorld) {
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, e2, "rgba(255,123,114,.6)", { width: 2, dash: [4, 4], head: 8 });
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, e2img, C.j, { width: 3, head: 11 });
      LA.draw.label(ctx, cam, e2img, `J·e₂ = (${LA.fmt(S.b)}, ${LA.fmt(S.lam)})：被推向特征方向`, C.j, { fontSize: 11.5, dx: 8, dy: -8 });
    }

    // J^k 公式水印
    const Jk = this.pow(J, S.k);
    LA.draw.label(ctx, cam, { x: 0, y: 0 },
      `J^${S.k} = [${LA.fmt(Jk.a)}, ${LA.fmt(Jk.b)}; 0, ${LA.fmt(Jk.d)}]`,
      "#f0b429", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13.5, bold: true });
    LA.draw.label(ctx, cam, { x: 0, y: 0 },
      S.inPWorld ? "同一变换，换了坐标（相似）：Jordan 本质不变" :
        (defective ? "橙色点被反复推着沿特征线滑行（抛物线轨迹）" : "b = 0：对角矩阵，各方向独立伸缩（可对角化）"),
      "#8b98a9", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 12.5 });
  },

  hitTest() { return null; },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">Jordan 块 J = [ λ, b ; 0, λ ]</div>
        <div class="kv"><span class="k">特征值 λ</span><span class="v" id="s20lam">${LA.fmt(S.lam)}</span></div>
        <input type="range" id="s20lr" min="0.5" max="3" step="0.1" value="${S.lam}">
        <div class="kv" style="margin-top:4px"><span class="k">剪切元 b（0 = 可对角化）</span><span class="v" id="s20bv">${LA.fmt(S.b)}</span></div>
        <input type="range" id="s20br" min="0" max="1.5" step="0.05" value="${S.b}">
        <div class="kv" style="margin-top:4px"><span class="k">重复施加次数 k</span><span class="v" id="s20kv">${S.k}</span></div>
        <input type="range" id="s20kr" min="0" max="8" step="1" value="${S.k}">
        <label class="chk" style="margin-top:4px"><input type="checkbox" id="s20pw" ${S.inPWorld ? "checked" : ""}> 换一套坐标看（相似变换 B⁻¹JB）</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">诊断</div>
        <div class="kv"><span class="k">特征值（代数重数 2）</span><span class="v" id="s20eig"></span></div>
        <div class="kv"><span class="k">几何重数（特征方向数）</span><span class="v" id="s20geo"></span></div>
        <div class="kv"><span class="k">可对角化？</span><span class="v" id="s20diag"></span></div>
        <div class="kv"><span class="k">最小多项式 m(x)</span><span class="v" id="s20min" style="font-size:12px"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          有的矩阵"差一点"就能对角化：特征值是重根，
          特征方向却只有一个 —— 这叫<span class="hl-r">亏损</span>。<br><br>
          Jordan 标准型是给它们的"最后体面"：
          <span class="hl-y">J = [λ, 1; 0, λ]</span> —— 尽可能对角，只留一个上三角 1。<br><br>
          看橙色云雾被反复施加 J（调大 k）：
          每个点都沿着<b>平行于特征线的方向</b>被推着走，轨迹是抛物线 ——
          这就是 Jordan 块的几何：<b>沿特征方向的剪切</b>。<br><br>
          公式 J^k = [λ^k, k·λ^(k−1); 0, λ^k] 里那个 <b>k</b>，
          就是大 k 时比纯 λ^k 多出来的"漂移项"（.matrix power 里 1 的功劳）。<br><br>
          <b>最小多项式</b>：能"消灭"A 的最低次多项式 m(x)（m(A)=0）。
          对 Jordan 块：亏损时 m = (x−λ)²，非亏损时 m = x−λ ——
          它的次数 = <b>最大 Jordan 块的尺寸</b>。
          把 λ 拖到 0 看：J 变成幂零阵，b≠0 时 J²=0（两步归零，m=x²），
          b=0 时 J=0（一步归零，m=x）。<br><br>
          勾选"换一套坐标"：同一个变换转个角度又出现 ——
          <b>Jordan 型是坐标系无关的本质形状</b>（第 11 章相似变换的终极应用）。
          全体矩阵按相似分类后，每类都有一张 Jordan 标准脸。
        </div>
      </div>`;
    this._panel = el;

    el.querySelector("#s20lr").addEventListener("input", (e) => {
      S.lam = parseFloat(e.target.value);
      el.querySelector("#s20lam").textContent = LA.fmt(S.lam);
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    el.querySelector("#s20br").addEventListener("input", (e) => {
      S.b = parseFloat(e.target.value);
      el.querySelector("#s20bv").textContent = LA.fmt(S.b);
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    el.querySelector("#s20kr").addEventListener("input", (e) => {
      S.k = parseInt(e.target.value);
      el.querySelector("#s20kv").textContent = S.k;
    });
    el.querySelector("#s20pw").addEventListener("change", (e) => {
      S.inPWorld = e.target.checked;
      this.changed(LA.app.now());
    });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const defective = Math.abs(S.b) > 1e-6;
    el.querySelector("#s20eig").textContent = `${LA.fmt(S.lam)}（重根）`;
    el.querySelector("#s20geo").textContent = defective ? "1（亏损!）" : "2";
    const dEl = el.querySelector("#s20diag");
    dEl.textContent = defective ? "✗ 不可对角化 → Jordan 块" : "✓ 可对角化（b=0）";
    dEl.style.color = defective ? "#ff7b72" : "#7ee787";
    const minEl = el.querySelector("#s20min");
    if (minEl) {
      if (defective) {
        minEl.textContent = Math.abs(S.lam) < 1e-9 ? "m(x) = x²（幂零，J²=0）" : `m(x) = (x − ${LA.fmt(S.lam)})²`;
        minEl.style.color = "#ff9ec1";
      } else {
        minEl.textContent = `m(x) = x − ${LA.fmt(S.lam)}`;
        minEl.style.color = "#7ee787";
      }
    }
  },
});
