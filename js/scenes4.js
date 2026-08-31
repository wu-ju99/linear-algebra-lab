/* =========================================================
 * scenes4.js —— 第11~13章：基变换 / 分块矩阵 / 二次型
 * ========================================================= */
"use strict";

/* ============================================================
 * 第 11 章 基变换与坐标切换
 * ============================================================ */
LA.scenes.push({
  id: "basis-change", icon: "⇄", name: "基变换：换个坐标看世界",
  tagline: "向量没动，动的是量尺；B⁻¹AB = 同一变换的新描述",
  newCam: () => new LA.Cam2D(64),

  state: {
    b1: { x: 1, y: 1 },
    b2: { x: -1, y: 2 },
    v: { x: 3, y: 1 },
    A: { a: 0, b: -1, c: 1, d: 0 },   // 用来演示相似变换 B⁻¹AB
    viewB: false, viewT0: -1,          // 主视角切换动画
    showDecomp: true,
  },

  B() { return LA.fromCols(this.state.b1, this.state.b2); },
  Binv() {
    const det = LA.det2(this.B());
    if (Math.abs(det) < 1e-7) return null;
    const B = this.B();
    return { a: B.d / det, b: -B.b / det, c: -B.c / det, d: B.a / det };
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const Binv = this.Binv();
    const degenerate = !Binv;
    // 视角切换过渡（0.6s 交叉淡化）
    let p = S.viewT0 < 0 ? 1 : LA.clamp((t - S.viewT0) / 0.6, 0, 1);
    const mix = S.viewB ? LA.ease(p) : 1 - LA.ease(p);   // 1 = b 基为主

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1, alpha: 1 - mix * 0.55 });
    LA.draw.axes(ctx, cam, { color: "#28344a", alpha: 1 - mix * 0.5 });
    if (!degenerate) {
      LA.draw.grid(ctx, cam, { matrix: this.B(), color: mix > 0.5 ? "#4f7ab8" : "#2c4470", width: 1.1 + mix * 0.3, emphasis: mix > 0.5 ? "#7aa5d8" : "#4a6ba6", alpha: 0.35 + mix * 0.65 });
      LA.draw.axes(ctx, cam, { matrix: this.B(), color: "#4f6fa5", width: 1.5, alpha: 0.4 + mix * 0.6 });
    }

    // 新基向量
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.b1, C.i, { width: 3.4, head: 12, label: `b₁ (${LA.fmt(S.b1.x)}, ${LA.fmt(S.b1.y)})` });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.b2, C.j, { width: 3.4, head: 12, label: `b₂ (${LA.fmt(S.b2.x)}, ${LA.fmt(S.b2.y)})` });
    LA.draw.handle(ctx, cam, S.b1, C.i, { hover: this._dragId === "b1" || this._hoverId === "b1" });
    LA.draw.handle(ctx, cam, S.b2, C.j, { hover: this._dragId === "b2" || this._hoverId === "b2" });

    // v 与它在 b 基下的分解走步：v = α·b₁ + β·b₂
    if (S.showDecomp && Binv) {
      const vb = LA.apply2(Binv, S.v);   // v 在 b 基下的坐标 (α, β)
      const p1 = LA.v.scale(S.b1, vb.x);
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, p1, C.i, { width: 2.2, alpha: .7, dash: [5, 4], noHead: Math.abs(vb.y) < 1e-9 });
      if (Math.abs(vb.y) > 1e-9)
        LA.draw.arrow(ctx, cam, p1, S.v, C.j, { width: 2.2, alpha: .7, dash: [5, 4] });
      LA.draw.label(ctx, cam, LA.v.scale(p1, 0.62), `${LA.fmt(vb.x)}·b₁`, C.i, { fontSize: 11 });
    }

    // v：两套坐标同时标注
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.v, C.v, { width: 3.8, head: 13 });
    LA.draw.handle(ctx, cam, S.v, C.v, { hover: this._dragId === "v" || this._hoverId === "v" });
    const vbTxt = Binv ? `b基坐标 (${LA.fmt(LA.apply2(Binv, S.v).x)}, ${LA.fmt(LA.apply2(Binv, S.v).y)})` : "b基坐标 无效(共线)";
    LA.draw.label(ctx, cam, S.v, `标准坐标 (${LA.fmt(S.v.x)}, ${LA.fmt(S.v.y)})`, C.v, { bold: true, dy: -46, dx: 8 });
    LA.draw.label(ctx, cam, S.v, vbTxt, "#d2a8ff", { dy: -26, dx: 8 });

    if (degenerate) {
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "b₁、b₂ 共线了：撑不起一个坐标系！", "#ff7b72",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 14, bold: true });
    }
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p) => {
        S[id] = clampCol(p);
        LA.app.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, cam, S.v, 20)) return mk("v");
    if (LA.hitHandle(sx, sy, cam, S.b1, 20)) return mk("b1");
    if (LA.hitHandle(sx, sy, cam, S.b2, 20)) return mk("b2");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">新基 B（拖画布上的 b₁、b₂）</div>
        <div id="s11b-chip"></div>
        <div class="btn-row">
          <button class="btn" data-b="rot">旋转 45° 的基</button>
          <button class="btn" data-b="shear">剪切式基</button>
          <button class="btn" data-b="bad">病态(近共线)</button>
        </div>
        <div class="btn-row">
          <button class="btn primary" id="s11flip">🔄 切换主视角</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">此时此刻（拖金色 v 看读数）</div>
        <div class="kv"><span class="k" style="color:${C.v}">v 的标准坐标</span><span class="v" id="s11std"></span></div>
        <div class="kv"><span class="k" style="color:#d2a8ff">v 的 b基坐标</span><span class="v" id="s11b"></span></div>
        <div class="kv"><span class="k">翻译：标准 → b基</span><span class="v" id="s11conv"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">进阶：同一个变换的两副面孔</div>
        <div class="mx-caption">变换 <b>A</b>（标准坐标下）</div>
        ${LA.ui.mat2HTML("s11a", S.A)}
        <div class="kv" style="margin-top:6px"><span class="k">A 在 b基下的矩阵</span></div>
        <div id="s11sim"></div>
        <div class="panel-note" style="margin-top:6px; font-size:12px" id="s11simNote"></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>换基不换空间，只换"量尺"。</b><br>
          黄色向量 v 从来没动过，但它在"标准量尺"下读 (3,1)，
          在 b₁b₂ 量尺下读的是<span class="hl-y">另一组数</span> ——
          虚线走步（α·b₁ 再 β·b₂）就是它在新量尺下的真实含义。<br><br>
          两个世界的翻译官：<br>
          · b基 → 标准：<span class="hl-y">B·v</span>（B 的列就是 b₁、b₂）<br>
          · 标准 → b基：<span class="hl-y">B⁻¹·v</span>（反过来查表）<br><br>
          变换也有两副面孔：同一个 A，在 b基下写作
          <span class="hl-y">B⁻¹AB</span>（相似矩阵）——
          物理上是同一个变换，只是"用新语言描述"。<br>
          💡 当 b₁、b₂ 恰好是 A 的特征向量时，B⁻¹AB 变成
          <b>对角阵</b> —— 这就是对角化的本质（回到第 5 章）！
        </div>
      </div>`;
    this._panel = el;

    el.querySelector("#s11flip").addEventListener("click", () => {
      S.viewB = !S.viewB;
      S.viewT0 = LA.app.now();
      LA.app.toast(S.viewB ? "主视角：b₁b₂ 坐标系（网格随基弯曲）" : "主视角：标准坐标系");
    });
    el.querySelector("#s11a") && LA.ui.mat2Bind(el, "s11a", (M) => {
      Object.assign(S.A, M);
      this.refreshPanel();
    });
    const bpresets = {
      rot: { b1: { x: 0.7, y: 0.7 }, b2: { x: -0.7, y: 0.7 } },
      shear: { b1: { x: 1, y: 0 }, b2: { x: 1, y: 1 } },
      bad: { b1: { x: 1, y: 0 }, b2: { x: 1.1, y: 0.1 } },
    };
    el.querySelectorAll("[data-b]").forEach((btn) => btn.addEventListener("click", () => {
      const p = bpresets[btn.dataset.b];
      S.b1 = { ...p.b1 }; S.b2 = { ...p.b2 };
      this.refreshPanel();
    }));
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const B = this.B(), Binv = this.Binv();
    el.querySelector("#s11b-chip").innerHTML = LA.ui.mat2Chip(B, "#79b8ff") +
      ` <span style="color:#8b98a9; font-size:12px">（列 = b₁, b₂，det=${LA.fmt2(LA.det2(B))}）</span>`;
    el.querySelector("#s11std").textContent = `(${LA.fmt(S.v.x)}, ${LA.fmt(S.v.y)})`;
    el.querySelector("#s11b").textContent = Binv
      ? `(${LA.fmt(LA.apply2(Binv, S.v).x)}, ${LA.fmt(LA.apply2(Binv, S.v).y)})`
      : "共线，无坐标";
    el.querySelector("#s11conv").textContent = Binv ? "B⁻¹·v" : "—";
    const sim = Binv ? LA.mul2(LA.mul2(Binv, S.A), B) : null;
    el.querySelector("#s11sim").innerHTML = sim ? LA.ui.mat2Chip(sim, "#ffa657") : `<span style="color:#ff7b72">B 退化，无法计算</span>`;
    const eigA = LA.eigen2(S.A);
    const note = el.querySelector("#s11simNote");
    if (sim && eigA.real && !eigA.allVectors) {
      // 判断 B 的两列是否接近 A 的特征方向 → B⁻¹AB 接近对角
      const off = Math.abs(sim.b) + Math.abs(sim.c);
      note.innerHTML = off < 0.08
        ? "非对角线 ≈ 0：b₁b₂ 是特征方向，A 在这套基下现出<b>对角</b>真身！"
        : "把 b₁、b₂ 拖到 A 的两个特征方向上，这个矩阵会变成对角阵。";
    } else if (eigA.allVectors) {
      note.textContent = "A = λI：在任何基下都长一样。";
    } else {
      note.textContent = "";
    }
  },
});

/* ============================================================
 * 第 12 章 分块矩阵：解耦的子空间
 * ============================================================ */
LA.scenes.push({
  id: "blocks", icon: "⊞", name: "分块矩阵：独立的世界",
  tagline: "对角块各管各的子空间，耦合块让世界串门",
  newCam: () => null,

  state: {
    M2: { a: 1.2, b: -0.5, c: 0.5, d: 1 },      // xy 平面内的 2×2 块（旋转+剪切，地面网格明显变形）
    k: 1.5,                                       // z 方向的 1×1 块
    ux: 0, uy: 0,                                 // 耦合块（右上）：z → xy 的串门
    v3: { x: 1.5, y: 1, z: 1 },
    cam3: new LA.Cam3(),
  },

  init() {
    // 视角偏正一点，让 xy 平面内的旋转/剪切看得见
    this.state.cam3.yaw = 0.22;
    this.state.cam3.pitch = 0.5;
  },

  M3() {
    const S = this.state;
    return [[S.M2.a, S.M2.b, S.ux], [S.M2.c, S.M2.d, S.uy], [0, 0, S.k]];
  },

  draw(ctx, cam, app, t) {
    const w = cam.w, h = cam.h;
    const S = this.state;
    const c3 = S.cam3;
    const M = this.M3();
    const T = (p) => LA.apply3(M, p);
    const coupled = Math.abs(S.ux) + Math.abs(S.uy) > 1e-6;

    // 地面网格（z=0）变换后
    const R = 3;
    for (let k = -R; k <= R; k++) {
      c3.line(ctx, w, h, T({ x: k, y: -R, z: 0 }), T({ x: k, y: R, z: 0 }), "#2c4470", 1.1, .85);
      c3.line(ctx, w, h, T({ x: -R, y: k, z: 0 }), T({ x: R, y: k, z: 0 }), "#2c4470", 1.1, .85);
      c3.line(ctx, w, h, { x: k, y: -R, z: 0 }, { x: k, y: R, z: 0 }, "#1a2230", 1, .6, [3, 4]);
      c3.line(ctx, w, h, { x: -R, y: k, z: 0 }, { x: R, y: k, z: 0 }, "#1a2230", 1, .6, [3, 4]);
    }

    // z 轴：原始虚线 + 变换后（耦合时会歪向一边！）
    c3.line(ctx, w, h, { x: 0, y: 0, z: -3 }, { x: 0, y: 0, z: 3.5 }, "#2c3849", 1.2, .8, [4, 4]);
    c3.line(ctx, w, h, T({ x: 0, y: 0, z: -3 }), T({ x: 0, y: 0, z: 3.5 }), coupled ? "#ff7b72" : "#4f6fa5", 1.6, .9);
    c3.line(ctx, w, h, T({ x: -3, y: 0, z: 0 }), T({ x: 3, y: 0, z: 0 }), "#4f6fa5", 1.5, .9);
    c3.line(ctx, w, h, T({ x: 0, y: -3, z: 0 }), T({ x: 0, y: 3, z: 0 }), "#4f6fa5", 1.5, .9);

    // 样本向量 v3 → M3·v3
    const img = T(S.v3);
    c3.arrow(ctx, w, h, { x: 0, y: 0, z: 0 }, S.v3, C.v, { width: 3.4 });
    c3.arrow(ctx, w, h, { x: 0, y: 0, z: 0 }, img, C.sum, { width: 3.6 });
    const vs = c3.proj(S.v3, w, h), is = c3.proj(img, w, h);
    LA.draw.label(ctx, { w, h, toS: (p) => p }, vs, "v", C.v, { dx: 10, dy: -12, bold: true });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, is, "Av", C.sum, { dx: 10, dy: -12, bold: true });
    // v 的 xy 部分与 z 部分独立演示（解耦时）
    if (!coupled) {
      const vxy = { x: S.v3.x, y: S.v3.y, z: 0 };
      c3.line(ctx, w, h, S.v3, vxy, "rgba(255,215,94,.4)", 1.2, .8, [3, 3]);
      c3.arrow(ctx, w, h, { x: 0, y: 0, z: 0 }, T(vxy), C.i, { width: 2, head: 8 });
      c3.line(ctx, w, h, T(vxy), img, "rgba(255,166,87,.5)", 1.2, .8, [3, 3]);
    }

    // 拖拽端点（v3 和 M2 的两列）
    const handles = [
      ["v", S.v3], ["m1", { x: S.M2.a, y: S.M2.c, z: 0 }], ["m2", { x: S.M2.b, y: S.M2.d, z: 0 }],
    ];
    handles.forEach(([id, p]) => {
      const s = c3.proj(p, w, h);
      ctx.save();
      const col = id === "v" ? "#f0b429" : (id === "m1" ? C.i : C.j);
      ctx.strokeStyle = col; ctx.globalAlpha = (this._dragId === id || this._hoverId === id) ? .95 : .55;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, 10, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });

    // 顶部状态水印
    LA.draw.label(ctx, cam, { x: 14, y: h - 18 },
      coupled ? "耦合中：z 的事情串到了 xy 平面（z 轴歪了）" : "解耦中：xy 平面里发生的永远留在平面里，z 自己管自己",
      coupled ? "#ff9ec1" : "#8b98a9", { screen: true, fontSize: 12 });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const cv = document.getElementById("cv");
    const w = cv._cssW, h = cv._cssH;
    const c3 = S.cam3;
    const fakeCam = { toS: (p) => S.cam3.proj(p, w, h) };
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p, cam2, sx2, sy2) => {
        const z0 = id === "v" ? S.v3.z : 0;
        const hit = c3.unprojectToPlane(sx2, sy2, w, h, z0);
        if (!hit) return;
        const q = { x: LA.clamp(LA.snap(hit.x), -4, 4), y: LA.clamp(LA.snap(hit.y), -4, 4) };
        if (id === "v") { S.v3.x = q.x; S.v3.y = q.y; }
        else if (id === "m1") { S.M2.a = q.x; S.M2.c = q.y; }
        else { S.M2.b = q.x; S.M2.d = q.y; }
        LA.app.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, fakeCam, S.v3, 22)) return mk("v");
    if (LA.hitHandle(sx, sy, fakeCam, { x: S.M2.a, y: S.M2.c, z: 0 }, 22)) return mk("m1");
    if (LA.hitHandle(sx, sy, fakeCam, { x: S.M2.b, y: S.M2.d, z: 0 }, 22)) return mk("m2");
    return null;
  },

  wantsOrbit() { return true; },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">分块结构 A = [ M2 │ u ; 0 │ k ]</div>
        <div class="mx-caption"><b style="color:${C.i}">M2</b>（管 xy 平面，拖地面上的绿/红端点）</div>
        ${LA.ui.mat2HTML("s12m", S.M2)}
        <div style="margin-top:8px">
          <div class="kv"><span class="k">k（管 z 轴的 1×1 块）</span><span class="v" id="s12kv">${LA.fmt(S.k)}</span></div>
          <input type="range" id="s12k" min="-2" max="3" step="0.1" value="${S.k}">
        </div>
        <div class="btn-row">
          <button class="btn" id="s12decouple">✂ 解耦 (u = 0)</button>
          <button class="btn" id="s12couple">🔗 耦合 (u ≠ 0)</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">此时此刻</div>
        <div class="kv"><span class="k">det A = det(M2) × k</span><span class="v" id="s12det"></span></div>
        <div class="kv"><span class="k">特征值 = M2 的 ∪ {k}</span><span class="v" id="s12eig" style="font-size:12px"></span></div>
        <div class="kv"><span class="k">Av（可拖 v 的金色端点）</span><span class="v" id="s12av"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          分块的几何含义：<b>空间被拆成了几个互不干扰的世界。</b><br><br>
          块三角矩阵 [ M2, u ; 0, k ] 里：<br>
          · <b>对角块 M2 和 k</b>：xy 平面的事只在平面内发生（绿色地面怎么转、
            z 轴只管伸缩），彼此完全独立 —— 这叫<span class="hl-y">不变子空间</span>。<br>
          · <b>右上耦合块 u</b>：点"🔗 耦合"，看 z 轴歪向一边 ——
            z 的事情开始串门到 xy 平面，两个世界不再独立。<br>
          · <b>左下块 = 0</b>：xy 永远影响不到 z 的高度。<br><br>
          好处全是算术上的：det = det(M2)×k，特征值 = 两块特征值直接拼起来，
          求逆、求幂都按块分开算。<br>
          💡 大矩阵里找到这样的"块结构"，就找到了它的<b>裂缝</b>——沿着裂缝拆开算。
        </div>
      </div>`;
    this._panel = el;

    LA.ui.mat2Bind(el, "s12m", (M) => { Object.assign(S.M2, M); this.refreshPanel(); });
    el.querySelector("#s12k").addEventListener("input", (e) => {
      S.k = parseFloat(e.target.value);
      el.querySelector("#s12kv").textContent = LA.fmt(S.k);
      this.refreshPanel();
    });
    el.querySelector("#s12decouple").addEventListener("click", () => { S.ux = 0; S.uy = 0; this.refreshPanel(); });
    el.querySelector("#s12couple").addEventListener("click", () => { S.ux = 1; S.uy = 0.5; this.refreshPanel(); });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const M = this.M3();
    const det = LA.det2(S.M2) * S.k;
    const detEl = el.querySelector("#s12det");
    detEl.textContent = LA.fmt2(det);
    detEl.style.color = Math.abs(det) < 0.02 ? "#ff7b72" : "#7ee787";
    const eig = LA.eigen2(S.M2);
    let eigTxt;
    if (!eig.real) eigTxt = `${LA.fmt(eig.re)}±${LA.fmt(eig.im)}i 及 ${LA.fmt(S.k)}`;
    else if (eig.allVectors) eigTxt = `${LA.fmt(eig.l1)}, ${LA.fmt(S.k)}`;
    else eigTxt = `${LA.fmt(eig.l1)}, ${LA.fmt(eig.l2)}, ${LA.fmt(S.k)}`;
    el.querySelector("#s12eig").textContent = eigTxt;
    el.querySelector("#s12av").textContent =
      `(${LA.fmt(LA.apply3(M, S.v3).x)}, ${LA.fmt(LA.apply3(M, S.v3).y)}, ${LA.fmt(LA.apply3(M, S.v3).z)})`;
    LA.ui.setMat2(el, "s12m", S.M2);
  },
});

/* ============================================================
 * 第 13 章 二次型与标准型
 * ============================================================ */
LA.scenes.push({
  id: "quadratic", icon: "◎", name: "二次型：等值线的形状",
  tagline: "xᵀAx 的等值线暴露矩阵本性：椭圆=正定，双曲线=不定",
  newCam: () => new LA.Cam2D(60),

  state: {
    a: 2, b: 0.6, c: 1,          // q = a x² + 2b xy + c y²，矩阵 [[a,b],[b,c]]
    L: 1,                         // 当前等值线水平
    showPrinc: true,
    p: { x: 2, y: 0.5 },          // 采样点（读 q(p)）
  },

  sym() { return { a: this.state.a, b: this.state.b, c: this.state.b, d: this.state.c }; },

  eigInfo() {
    const eig = LA.eigen2(this.sym());
    let v1 = eig.v1, v2 = eig.v2;
    if (eig.allVectors) { v1 = { x: 1, y: 0 }; v2 = { x: 0, y: 1 }; }
    else if (eig.real && !v2) v2 = { x: -v1.y, y: v1.x };
    return { eig, v1, v2 };
  },

  classify() {
    const { eig } = this.eigInfo();
    if (!eig.real) return { txt: "—", color: "#8b98a9" };
    if (eig.allVectors) return { txt: this.state.a > 0 ? "正定（λI，圆）" : "负定（λI，圆）", color: "#7ee787" };
    const { l1, l2 } = eig;
    if (l1 > 1e-7 && l2 > 1e-7) return { txt: "正定：等值线是椭圆，处处只有拉伸", color: "#7ee787" };
    if (l1 < -1e-7 && l2 < -1e-7) return { txt: "负定：q ≤ 0，等值线也是椭圆", color: "#ff9ec1" };
    if (Math.abs(l1) < 1e-7 || Math.abs(l2) < 1e-7) return { txt: "半定：有一条方向 q=0（两条平行线）", color: "#79b8ff" };
    return { txt: "不定：有正有负 → 双曲线，有的方向拉伸有的方向压缩", color: "#ffa657" };
  },

  /* 画水平为 L 的等值线（基于特征分解的参数曲线） */
  drawLevel(ctx, cam, L, color, width, alpha) {
    const { eig, v1, v2 } = this.eigInfo();
    if (!eig.real || !v1 || !v2) return;
    const l1 = eig.allVectors ? this.state.a : eig.l1;
    const l2 = eig.allVectors ? this.state.a : eig.l2;
    const eps = 1e-7;
    const pt = (y1, y2) => LA.v.add(LA.v.scale(v1, y1), LA.v.scale(v2, y2));
    const polyline = (pts) => {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha;
      ctx.beginPath();
      pts.forEach((p, i) => { const s = cam.toS(p); if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y); });
      ctx.stroke();
      ctx.restore();
    };

    if (Math.abs(L) < eps) {   // 零水平：λ=0 的特征方向（没有零特征值时只有原点）
      const z1 = Math.abs(l1) < eps, z2 = Math.abs(l2) < eps;
      if (z1) LA.draw.spanLine(ctx, cam, v1, color, { width: width * 0.7, alpha: alpha * 0.8 });
      if (z2) LA.draw.spanLine(ctx, cam, v2, color, { width: width * 0.7, alpha: alpha * 0.8 });
      return;
    }
    // 退化：某个特征值为 0 → 等值线是一对平行线
    if (Math.abs(l2) < eps) {
      if (L / l1 < 0) return;
      const r = Math.sqrt(L / l1);
      for (const sgn of [1, -1]) {
        const c = pt(sgn * r, 0);
        polyline([LA.v.add(c, LA.v.scale(v2, -80)), LA.v.add(c, LA.v.scale(v2, 80))]);
      }
      return;
    }
    if (Math.abs(l1) < eps) {
      if (L / l2 < 0) return;
      const r = Math.sqrt(L / l2);
      for (const sgn of [1, -1]) {
        const c = pt(0, sgn * r);
        polyline([LA.v.add(c, LA.v.scale(v1, -80)), LA.v.add(c, LA.v.scale(v1, 80))]);
      }
      return;
    }
    const s1 = L / l1, s2 = L / l2;
    if (s1 > 0 && s2 > 0) {    // 椭圆
      const r1 = Math.sqrt(s1), r2 = Math.sqrt(s2);
      const pts = [];
      for (let i = 0; i <= 90; i++) {
        const th = (i / 90) * Math.PI * 2;
        pts.push(pt(r1 * Math.cos(th), r2 * Math.sin(th)));
      }
      polyline(pts);
    } else if (s1 * s2 < 0) {  // 双曲线：两支
      const c1 = Math.sqrt(Math.abs(s1)), c2 = Math.sqrt(Math.abs(s2));
      for (const sgn of [1, -1]) {
        const pts = [];
        for (let i = 0; i <= 70; i++) {
          const tv = -2.6 + (i / 70) * 5.2;
          pts.push(pt(sgn * c1 * Math.cosh(tv), c2 * Math.sinh(tv)));
        }
        polyline(pts);
      }
    } else if (s1 < 0 && s2 < 0) {
      // 该水平无实点（负定与正水平），跳过
      return;
    }
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a", width: 1.5 });

    // 等值线族
    const lvls = [1, 2.5, 5, -1, -2.5, -5];
    lvls.forEach((L) => {
      const col = L > 0 ? "56,212,221" : "255,123,114";
      this.drawLevel(ctx, cam, L, `rgba(${col},1)`, 1.3, 0.4);
    });
    // 当前水平（加粗高亮）
    this.drawLevel(ctx, cam, S.L, "#f0b429", 2.6, 1);

    // 主轴（特征方向）
    if (S.showPrinc) {
      const { eig, v1, v2 } = this.eigInfo();
      if (v1) {
        LA.draw.spanLine(ctx, cam, v1, "rgba(210,168,255,.5)", { width: 1.3 });
        if (v2) LA.draw.spanLine(ctx, cam, v2, "rgba(121,184,255,.5)", { width: 1.3 });
        const l1 = eig.allVectors ? S.a : eig.l1;
        const arrowLen1 = Math.sqrt(Math.abs(l1) + 0.4);
        LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, LA.v.scale(v1, arrowLen1), "#d2a8ff", { width: 2.4, head: 9 });
        if (v2) {
          const l2 = eig.allVectors ? S.a : eig.l2;
          const arrowLen2 = Math.sqrt(Math.abs(l2) + 0.4);
          LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, LA.v.scale(v2, arrowLen2), "#79b8ff", { width: 2.4, head: 9 });
          LA.draw.label(ctx, cam, LA.v.scale(v2, arrowLen2 * 1.3), `主轴2 λ=${LA.fmt(l2)}`, "#79b8ff", { fontSize: 11.5 });
        }
        LA.draw.label(ctx, cam, LA.v.scale(v1, arrowLen1 * 0.62), `主轴1 λ=${LA.fmt(l1)}`, "#d2a8ff", { fontSize: 11.5 });
      }
    }

    // 采样点 p，读 q(p)
    const q = (p) => S.a * p.x * p.x + 2 * S.b * p.x * p.y + S.c * p.y * p.y;
    const qp = q(S.p);
    LA.draw.dot(ctx, cam, S.p, "#e6edf3", 5, { stroke: "#10141b" });
    LA.draw.label(ctx, cam, S.p, `q(p) = ${LA.fmt2(qp)}`, "#e6edf3", { bold: true, dy: -28, dx: 10 });
    LA.draw.handle(ctx, cam, S.p, "#e6edf3", { hover: this._dragId === "p" || this._hoverId === "p" });

    // 标题水印
    const termC = `${S.b >= 0 ? "+" : "−"} ${LA.fmt(Math.abs(2 * S.b))}xy`;
    const termY = `${S.c >= 0 ? "+" : "−"} ${LA.fmt(Math.abs(S.c))}y²`;
    LA.draw.label(ctx, cam, { x: 0, y: 0 }, `q(x) = ${LA.fmt(S.a)}x² ${termC} ${termY}`,
      "#8b98a9", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 14, bold: true });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    if (LA.hitHandle(sx, sy, cam, S.p, 20)) return {
      id: "p", cursor: "grab",
      drag: (p) => { S.p = clampCol(p); this.refreshPanel(); },
    };
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">对称矩阵（q 的系数）</div>
        <div style="display:flex; gap:6px; align-items:center">
          <label style="font-size:12px;color:var(--muted)">a=</label><input type="number" step="0.1" id="s13a" style="width:64px">
          <label style="font-size:12px;color:var(--muted)">b=</label><input type="number" step="0.1" id="s13b" style="width:64px">
          <label style="font-size:12px;color:var(--muted)">c=</label><input type="number" step="0.1" id="s13c" style="width:64px">
        </div>
        <div class="panel-note" style="margin-top:4px; font-size:11.5px">q(x) = a·x² + 2b·xy + c·y²，矩阵 A = [[a,b],[b,c]]</div>
        <div class="btn-row">
          <button class="btn" data-q="ellipse">椭圆(正定)</button>
          <button class="btn" data-q="hyper">双曲线(不定)</button>
          <button class="btn" data-q="para">平行线(半定)</button>
          <button class="btn" data-q="circle">圆(各向同性)</button>
        </div>
        <div style="margin-top:6px">
          <div class="kv"><span class="k">等值线水平 L</span><span class="v" id="s13lv">${LA.fmt(S.L)}</span></div>
          <input type="range" id="s13L" min="-6" max="6" step="0.1" value="${S.L}">
        </div>
        <label class="chk"><input type="checkbox" id="s13p" ${S.showPrinc ? "checked" : ""}> 显示主轴（特征方向）</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">诊断结果</div>
        <div class="kv"><span class="k">定性</span><span class="v" id="s13cls" style="font-size:12.5px; text-align:right"></span></div>
        <div class="kv"><span class="k">顺序主子式 Δ₁, Δ₂</span><span class="v" id="s13pm"></span></div>
        <div class="kv"><span class="k">Sylvester 判据</span><span class="v" id="s13syl" style="font-size:11.5px"></span></div>
        <div class="kv"><span class="k">特征值 λ₁, λ₂</span><span class="v" id="s13eig"></span></div>
        <div class="kv"><span class="k">q(p)（拖白点）</span><span class="v" id="s13qp"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">标准型（主轴定理）</div>
        <div class="big-det" id="s13canon" style="font-size:17px"></div>
        <div class="panel-note" style="font-size:12px">
          用正交矩阵 Q（列 = 单位特征向量）做坐标旋转 x = Qy：
          q = λ₁y₁² + λ₂y₂² —— <b>交叉项 xy 消失了</b>。
          几何上就是把坐标轴转到等值线的对称轴（主轴）上。
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          二次型 = 对称矩阵变身成的<b>函数</b>：输入向量，输出一个数
          q(x) = xᵀAx。<br><br>
          看等值线形状就知道矩阵的"体质"：<br>
          · <span class="hl-g">椭圆</span>（正定）：所有方向都是拉伸，q&gt;0 恒成立<br>
          · <span class="hl-r">双曲线</span>（不定）：有的方向拉伸、有的方向压缩<br>
          · <span class="hl-b">平行线</span>（半定）：存在 q=0 的方向（λ=0）<br><br>
          <b>标准型</b> = 换到主轴坐标系后的样子 λ₁y₁² + λ₂y₂²：
          椭圆的轴长 = 2√(L/λ)，特征值越小轴越长 ——
          <b>小特征值方向就是函数"最平坦"的方向</b>（优化、PCA 全靠这一点）。<br>
          💡 拖动白点 p 翻山越岭，看 q(p) 正负交替。
        </div>
      </div>`;
    this._panel = el;

    ["a", "b", "c"].forEach((k) => {
      el.querySelector(`#s13${k}`).addEventListener("input", (e) => {
        const v = parseFloat(e.target.value);
        if (isFinite(v)) { S[k] = LA.clamp(v, -5, 5); this.refreshPanel(); }
      });
    });
    el.querySelector("#s13L").addEventListener("input", (e) => {
      S.L = parseFloat(e.target.value);
      el.querySelector("#s13lv").textContent = LA.fmt(S.L);
    });
    el.querySelector("#s13p").addEventListener("change", (e) => { S.showPrinc = e.target.checked; });
    const presets = {
      ellipse: { a: 2, b: 0.6, c: 1 },
      hyper: { a: 1, b: 1.5, c: -1 },
      para: { a: 1, b: 0, c: 0 },
      circle: { a: 1, b: 0, c: 1 },
    };
    el.querySelectorAll("[data-q]").forEach((btn) => btn.addEventListener("click", () => {
      const p = presets[btn.dataset.q];
      S.a = p.a; S.b = p.b; S.c = p.c;
      this.refreshPanel();
    }));
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    ["a", "b", "c"].forEach((k) => { setNumSafe(el.querySelector(`#s13${k}`), S[k]); });
    const cls = this.classify();
    const clsEl = el.querySelector("#s13cls");
    clsEl.textContent = cls.txt;
    clsEl.style.color = cls.color;
    const { eig } = this.eigInfo();
    el.querySelector("#s13eig").textContent = !eig.real ? "—"
      : eig.allVectors ? `${LA.fmt(S.a)}（重根）`
      : `${LA.fmt(eig.l1)}, ${LA.fmt(eig.l2)}`;
    // 顺序主子式与 Sylvester 判据
    const d1 = S.a, d2 = S.a * S.c - S.b * S.b;
    const pmEl = el.querySelector("#s13pm");
    pmEl.textContent = `Δ₁ = ${LA.fmt2(d1)}，Δ₂ = ${LA.fmt2(d2)}`;
    const syl = el.querySelector("#s13syl");
    if (d1 > 1e-9 && d2 > 1e-9) {
      syl.textContent = "Δ₁>0 且 Δ₂>0 ⟹ 正定 ✓";
      syl.style.color = "#7ee787";
    } else if (d1 < -1e-9 && d2 > 1e-9) {
      syl.textContent = "Δ₁<0 且 Δ₂>0 ⟹ 负定 ✓";
      syl.style.color = "#ff9ec1";
    } else {
      syl.textContent = "顺序主子式不全为正 → 非正定（用特征值细判）";
      syl.style.color = "#8b98a9";
    }
    const q = S.a * S.p.x * S.p.x + 2 * S.b * S.p.x * S.p.y + S.c * S.p.y * S.p.y;
    el.querySelector("#s13qp").textContent = LA.fmt2(q);
    const canon = el.querySelector("#s13canon");
    if (!eig.real) { canon.textContent = "—"; }
    else if (eig.allVectors) {
      canon.textContent = `q = ${LA.fmt(S.a)}·(y₁² + y₂²)`;
      canon.style.color = "#d2a8ff";
    } else {
      const l1 = eig.l1, l2 = eig.l2;
      const fλ = (l) => (l >= 0 ? "" : "−") + LA.fmt(Math.abs(l));
      canon.textContent = `q = ${fλ(l1)}y₁² ${l2 >= 0 ? "+" : "−"} ${LA.fmt(Math.abs(l2))}y₂²`;
      canon.style.color = "#d2a8ff";
    }
  },
});
