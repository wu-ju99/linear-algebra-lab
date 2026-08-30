/* =========================================================
 * scenes5.js —— 第14~17章：SVD / 子空间 / 交与和·直和 / 同构
 * ========================================================= */
"use strict";

/* ============================================================
 * 第 14 章 SVD 奇异值分解：A = U Σ Vᵀ
 * 几何：任意变换 = 旋转 · 沿轴拉伸 · 再旋转
 * ============================================================ */
LA.scenes.push({
  id: "svd", icon: "◯", name: "SVD：旋转·拉伸·旋转",
  tagline: "任何矩阵都可以拆成 转一转 → 拉一拉 → 再转一转",
  newCam: () => new LA.Cam2D(64),

  state: {
    A: { a: 1.4, b: 0.7, c: 0.3, d: 1.1 },
    anim: makeAnim(true),
    playing: false, playT0: 0,
    showCircle: true,
  },

  /* 计算 2×2 SVD（基于 AᵀA 的特征分解） */
  svd() {
    const { a, b, c, d } = this.state.A;
    const MtM = { a: a * a + c * c, b: a * b + c * d, c: a * b + c * d, d: b * b + d * d };
    const eig = LA.eigen2(MtM);
    let v1, v2, l1, l2;
    if (eig.allVectors) { l1 = MtM.a; l2 = MtM.a; v1 = { x: 1, y: 0 }; v2 = { x: 0, y: 1 }; }
    else { l1 = Math.max(eig.l1, eig.l2); l2 = Math.min(eig.l1, eig.l2); v1 = eig.v1; v2 = eig.v2 || { x: -v1.y, y: v1.x }; }
    const s1 = Math.sqrt(Math.max(l1, 0)), s2 = Math.sqrt(Math.max(l2, 0));
    const eps = 1e-6;
    let u1, u2;
    if (s1 > eps) u1 = LA.v.norm(LA.apply2(this.state.A, v1)); else u1 = { x: 1, y: 0 };
    if (s2 > eps) u2 = LA.v.norm(LA.apply2(this.state.A, v2)); else u2 = { x: -u1.y, y: u1.x };
    const V = LA.fromCols(v1, v2);
    const VT = { a: V.a, b: V.c, c: V.b, d: V.d };   // 转置
    const SIG = { a: s1, b: 0, c: 0, d: s2 };
    return { s1, s2, v1, v2, u1, u2, VT, SIG, SVT: LA.mul2(SIG, VT), rank2: s2 > 1e-4 };
  },

  M_eff(now) {
    const S = this.state;
    if (S.playing) {
      const sv = this.svd();
      const t = LA.clamp((now - S.playT0) / 3.6, 0, 1);
      if (t >= 1) S.playing = false;
      const e = LA.ease(LA.clamp(t * 3, 0, 1));
      if (t < 1 / 3) return LA.lerp2(LA.ident2(), sv.VT, e);
      if (t < 2 / 3) return LA.lerp2(sv.VT, sv.SVT, LA.ease(LA.clamp(t * 3 - 1, 0, 1)));
      return LA.lerp2(sv.SVT, S.A, LA.ease(LA.clamp(t * 3 - 2, 0, 1)));
    }
    return effM(S.anim, S.A, now);
  },

  changed(now) { matrixChanged(this.state.anim, this.state.A, now); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const M = this.M_eff(t);
    const sv = this.svd();

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    LA.draw.grid(ctx, cam, { matrix: M, color: "#2c4470", width: 1.2, emphasis: "#4a6ba6" });
    LA.draw.axes(ctx, cam, { matrix: M, color: "#4f6fa5", width: 1.7 });

    // 单位圆 → 椭圆（当前 M 的像）
    if (S.showCircle) {
      const circle = [], img = [];
      for (let i = 0; i <= 90; i++) {
        const th = (i / 90) * Math.PI * 2;
        const u = { x: Math.cos(th), y: Math.sin(th) };
        circle.push(u); img.push(LA.apply2(M, u));
      }
      const drawPath = (pts, color, width, alpha, dash) => {
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha;
        if (dash) ctx.setLineDash(dash);
        ctx.beginPath();
        pts.forEach((p, i) => { const s = cam.toS(p); if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y); });
        ctx.stroke();
        ctx.restore();
      };
      drawPath(circle, "rgba(230,237,243,.5)", 1.4, 1, [5, 5]);
      drawPath(img, "#ffa657", 2.4, 1);
    }

    // 静态时：标出 v（圆上的右奇异方向）与 u（椭圆半轴，左奇异方向）
    if (!S.playing && sv.rank2) {
      const drawPair = (v, u, name, color) => {
        LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, v, color, { width: 2, alpha: .65, dash: [4, 4], head: 8 });
        const uTip = LA.apply2(S.A, v);
        LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, uTip, color, { width: 3.2, head: 11 });
        LA.draw.label(ctx, cam, uTip, name, color, { fontSize: 11.5, bold: true, dx: 8, dy: -8 });
      };
      drawPair(sv.v1, sv.u1, `u₁（σ₁=${LA.fmt(sv.s1)}）`, "#d2a8ff");
      if (sv.s2 > 1e-4) drawPair(sv.v2, sv.u2, `u₂（σ₂=${LA.fmt(sv.s2)}）`, "#56d4dd");
      LA.draw.label(ctx, cam, sv.v1, "v₁", "#d2a8ff", { fontSize: 10.5, alpha: 1 });
    }

    // A 的列（可拖）
    const c1 = LA.col1(S.A), c2 = LA.col2(S.A);
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3, head: 10, alpha: .85 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3, head: 10, alpha: .85 });
    LA.draw.handle(ctx, cam, c1, C.i, { hover: this._dragId === "c1" || this._hoverId === "c1" });
    LA.draw.handle(ctx, cam, c2, C.j, { hover: this._dragId === "c2" || this._hoverId === "c2" });

    if (S.playing) {
      const tt = LA.clamp((t - S.playT0) / 3.6, 0, 1);
      const phase = tt < 1 / 3 ? "① Vᵀ：先转一转（圆还是圆）" : tt < 2 / 3 ? "② Σ：沿轴拉伸（圆变椭圆）" : "③ U：再转一转（摆到最终朝向）";
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, phase + `   A = U·Σ·Vᵀ`, "#f0b429",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 14.5, bold: true });
    }
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
        <div class="panel-title">矩阵 A（拖端点试试）</div>
        ${LA.ui.mat2HTML("s14m", S.A)}
        <div class="btn-row">
          <button class="btn primary" id="s14play">▶ 播放三步分解</button>
          <button class="btn" data-p="sym">对称</button>
          <button class="btn" data-p="rank1">奇异(秩1)</button>
          <button class="btn" data-p="iso">各向同性</button>
        </div>
        <label class="chk" style="margin-top:4px"><input type="checkbox" id="s14c" ${S.showCircle ? "checked" : ""}> 显示单位圆 → 椭圆</label>
        <label class="chk"><input type="checkbox" id="s14anim" ${S.anim.on ? "checked" : ""}> 编辑时平滑动画</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">分解结果 A = U·Σ·Vᵀ</div>
        <div class="kv"><span class="k" style="color:#d2a8ff">σ₁（最大拉伸倍数）</span><span class="v" id="s14s1" style="font-size:16px"></span></div>
        <div class="kv"><span class="k" style="color:#56d4dd">σ₂（最小拉伸倍数）</span><span class="v" id="s14s2" style="font-size:16px"></span></div>
        <div class="kv"><span class="k">Vᵀ（先怎么转）</span></div>
        <div id="s14vt"></div>
        <div class="kv" style="margin-top:4px"><span class="k">Σ（拉伸多少）</span></div>
        <div id="s14sig"></div>
        <div class="kv" style="margin-top:4px"><span class="k">U（再怎么转）</span></div>
        <div id="s14u"></div>
        <div class="kv" style="margin-top:4px"><span class="k">det A = ±σ₁σ₂</span><span class="v" id="s14det"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          SVD 是线性代数的大结局：<b>任何线性变换（哪怕又剪又扭），
          本质上都只是"转一转 → 沿轴拉一拉 → 再转一转"。</b><br><br>
          看虚线单位圆的变身：Vᵀ 只转圆（不变样），
          Σ 把圆<span class="hl-y">沿两个垂直方向拉成椭圆</span>（半轴长 = 奇异值 σ₁ σ₂），
          U 再把椭圆转到最终朝向。<br><br>
          · v₁、v₂：<b>输入空间</b>里的" privileged 方向"（AᵀA 的特征方向）<br>
          · u₁、u₂：它们被送到<b>输出空间</b>里的正交方向<br>
          · σ₁/σ₂：<b>这个变换最狠/最温柔的拉伸倍数</b><br><br>
          σ₂ = 0（点"奇异(秩1)"）：椭圆被压成线段 —— 又回到"降维不可逆"。<br>
          💡 这就是图像压缩、PCA、最小二乘背后的那台机器。
        </div>
      </div>`;
    this._panel = el;

    LA.ui.mat2Bind(el, "s14m", (M) => {
      Object.assign(S.A, M);
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    el.querySelector("#s14play").addEventListener("click", () => {
      if (!this.svd().rank2 && Math.abs(LA.det2(S.A)) < 1e-9 && Math.abs(S.A.a) + Math.abs(S.A.b) + Math.abs(S.A.c) + Math.abs(S.A.d) < 1e-9) {
        LA.app.toast("零矩阵没有可播放的分解"); return;
      }
      S.playing = true; S.playT0 = LA.app.now();
    });
    el.querySelector("#s14c").addEventListener("change", (e) => { S.showCircle = e.target.checked; });
    el.querySelector("#s14anim").addEventListener("change", (e) => { S.anim.on = e.target.checked; });
    const presets = {
      sym: { a: 2, b: 0.5, c: 0.5, d: 1 },
      rank1: { a: 1, b: 2, c: 2, d: 4 },
      iso: { a: 1.2, b: -0.4, c: 0.4, d: 1.2 },
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
    const sv = this.svd();
    el.querySelector("#s14s1").textContent = LA.fmt(sv.s1);
    el.querySelector("#s14s2").textContent = LA.fmt(sv.s2);
    el.querySelector("#s14s1").style.color = "#d2a8ff";
    el.querySelector("#s14s2").style.color = "#56d4dd";
    const fM = (M) => `[${LA.fmt(M.a)}, ${LA.fmt(M.b)}; ${LA.fmt(M.c)}, ${LA.fmt(M.d)}]`;
    el.querySelector("#s14vt").innerHTML = LA.ui.mat2Chip(sv.VT, "#79b8ff");
    el.querySelector("#s14sig").innerHTML = LA.ui.mat2Chip(sv.SIG, "#f0b429");
    el.querySelector("#s14u").innerHTML = LA.ui.mat2Chip((() => {
      // U = A·V·Σ⁻¹（显示用）
      if (sv.s1 < 1e-6) return { a: 1, b: 0, c: 0, d: 1 };
      const u1 = LA.apply2(S.A, sv.v1), u2 = LA.apply2(S.A, sv.v2);
      const n1 = Math.hypot(u1.x, u1.y) || 1, n2 = Math.hypot(u2.x, u2.y) || 1;
      return { a: u1.x / n1, b: u2.x / n2, c: u1.y / n1, d: u2.y / n2 };
    })(), "#d2a8ff");
    const det = LA.det2(S.A);
    const detEl = el.querySelector("#s14det");
    detEl.textContent = `${LA.fmt2(det)}（${det >= 0 ? "保持定向" : "翻转"}，|det| = ${LA.fmt2(Math.abs(sv.s1 * sv.s2))}）`;
    LA.ui.setMat2(el, "s14m", S.A);
  },
});

/* ============================================================
 * 第 15 章 线性子空间：必须过原点的"平面国"
 * ============================================================ */
LA.scenes.push({
  id: "subspaces", icon: "⊂", name: "子空间：过原点的封闭世界",
  tagline: "含 0 · 加法封闭 · 数乘封闭，缺一不可",
  newCam: () => new LA.Cam2D(66),

  state: {
    u: { x: 1, y: 2 },
    w: { x: -2, y: 1 },
    c: 1.5,
    showNonExample: true,
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const det = LA.det2(LA.fromCols(S.u, S.w));
    const dependent = Math.abs(det) < 1e-6;

    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a", width: 1.5 });

    // span{u,w}：独立 → 全平面淡染；共线 → 共享线高亮
    if (!dependent) {
      ctx.save();
      ctx.fillStyle = "rgba(126,231,135,.045)";
      ctx.fillRect(0, 0, cam.w, cam.h);
      ctx.restore();
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "span{u, w} = 整个平面 ℝ²（二维子空间）", "#7ee787",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 13.5, bold: true });
    } else {
      const dir = (LA.v.len(S.u) > 1e-6) ? S.u : S.w;
      if (LA.v.len(dir) > 1e-6) {
        LA.draw.spanLine(ctx, cam, dir, "rgba(126,231,135,.8)", { width: 3.5 });
        LA.draw.label(ctx, cam, { x: 0, y: 0 }, "u、w 共线：span 塌缩成一条直线（一维子空间）", "#7ee787",
          { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 13.5, bold: true });
      }
    }

    // 各自的张成线
    LA.draw.spanLine(ctx, cam, S.u, "rgba(126,231,135,.45)", { width: 1.6 });
    LA.draw.spanLine(ctx, cam, S.w, "rgba(255,123,114,.45)", { width: 1.6 });

    // c·u：数乘封闭 —— 沿 span{u} 滑动永远不出界
    const cu = LA.v.scale(S.u, S.c);
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, cu, "#d2a8ff", { width: 2.2, dash: [3, 3], head: 9 });
    LA.draw.dot(ctx, cam, cu, "#d2a8ff", 4);
    LA.draw.label(ctx, cam, cu, `${LA.fmt(S.c)}·u`, "#d2a8ff", { fontSize: 11 });

    // u + w：加法封闭
    const sum = LA.v.add(S.u, S.w);
    LA.draw.poly(ctx, cam, [{ x: 0, y: 0 }, S.u, sum, S.w], "rgba(255,166,87,.06)", "rgba(255,166,87,.3)", { dash: [5, 5], width: 1.1 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, sum, C.sum, { width: 2.8, head: 11 });
    LA.draw.label(ctx, cam, sum, "u+w（还在 span 里）", C.sum, { fontSize: 11.5, dy: -22 });

    // 原点强调
    LA.draw.dot(ctx, cam, { x: 0, y: 0 }, "#f0b429", 5);
    LA.draw.label(ctx, cam, { x: 0, y: 0 }, "0", "#f0b429", { screen: cam.toS({ x: 0, y: 0 }), dx: 8, dy: 12, fontSize: 12, bold: true });

    // 向量
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.u, C.i, { width: 3.4, head: 12, label: "u" });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.w, C.j, { width: 3.4, head: 12, label: "w" });
    LA.draw.handle(ctx, cam, S.u, C.i, { hover: this._dragId === "u" || this._hoverId === "u" });
    LA.draw.handle(ctx, cam, S.w, C.j, { hover: this._dragId === "w" || this._hoverId === "w" });

    // 反例：不过原点的直线
    if (S.showNonExample) {
      const p0 = { x: 0, y: 1 }, dir = { x: 1, y: 0.5 };
      LA.draw.line(ctx, cam, LA.v.add(p0, LA.v.scale(dir, -60)), LA.v.add(p0, LA.v.scale(dir, 60)), "rgba(139,152,169,.55)", { width: 1.6, dash: [8, 6] });
      LA.draw.label(ctx, cam, { x: -3.4, y: 0.7 }, "✗ 不过原点的直线：不是子空间（0 不在上面）", "#8b98a9", { fontSize: 12 });
    }
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p) => { S[id] = clampCol(p); this.refreshPanel(); },
    });
    if (LA.hitHandle(sx, sy, cam, S.u, 20)) return mk("u");
    if (LA.hitHandle(sx, sy, cam, S.w, 20)) return mk("w");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">张成 span{u, w}（拖 u、w）</div>
        <div class="kv"><span class="k">det [u w]</span><span class="v" id="s15det"></span></div>
        <div class="kv"><span class="k">维数</span><span class="v" id="s15dim"></span></div>
        <div class="kv"><span class="k">数乘 c·u（c 可滑）</span><span class="v" id="s15cu"></span></div>
        <input type="range" id="s15c" min="-3" max="3" step="0.1" value="${S.c}">
        <div class="kv" style="margin-top:4px"><span class="k">封闭性检查</span><span class="v" id="s15close" style="color:#7ee787">全部通过 ✓</span></div>
        <label class="chk" style="margin-top:4px"><input type="checkbox" id="s15n" ${S.showNonExample ? "checked" : ""}> 显示反例直线</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          子空间 = 空间里自成一体的"小宇宙"，只守三条规矩：<br>
          ① 含零向量（原点必在）<br>
          ② 加法封闭：里面任意两个向量相加，出不去<br>
          ③ 数乘封闭：任意拉伸/反向，也出不去<br><br>
          最小的子空间是 <span class="hl-y">{0}</span> 本身；
          一个非零向量的 span 是一条<span class="hl-y">过原点的直线</span>；
          两个不共线向量的 span 是<span class="hl-y">整个平面</span>。<br><br>
          拖动紫色 c·u 滑杆，看它沿着张成线滑来滑去永远不出界 —— 这就是封闭。<br><br>
          ⚠️ 虚线反例：把直线平移离开原点，哪怕只挪一格，
          0 就不在里面了 —— 马上失去子空间资格。
          <b>"过不过原点"是子空间的第一道门槛。</b>
        </div>
      </div>`;
    this._panel = el;

    el.querySelector("#s15c").addEventListener("input", (e) => {
      S.c = parseFloat(e.target.value);
      this.refreshPanel();
    });
    el.querySelector("#s15n").addEventListener("change", (e) => { S.showNonExample = e.target.checked; });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const det = LA.det2(LA.fromCols(S.u, S.w));
    el.querySelector("#s15det").textContent = LA.fmt2(det);
    const dependent = Math.abs(det) < 1e-6;
    const dim = (LA.v.len(S.u) < 1e-6 && LA.v.len(S.w) < 1e-6) ? "0（只有 {0}）" : dependent ? "1（一条直线）" : "2（整个 ℝ²）";
    const dimEl = el.querySelector("#s15dim");
    dimEl.textContent = dim;
    dimEl.style.color = dependent ? "#79b8ff" : "#7ee787";
    const cu = LA.v.scale(S.u, S.c);
    el.querySelector("#s15cu").textContent = `(${LA.fmt(cu.x)}, ${LA.fmt(cu.y)})`;
  },
});

/* ============================================================
 * 第 16 章 子空间的交与和 · 直和
 * ============================================================ */
LA.scenes.push({
  id: "span-sum", icon: "⊎", name: "交与和 · 直和",
  tagline: "U+W 覆盖多大，U∩W 剩多少，唯一拆分 = 直和",
  newCam: () => new LA.Cam2D(62),

  state: {
    u: { x: 2, y: 0.5 },
    w: { x: -0.5, y: 2 },
    x: { x: 3, y: 2 },
    showSecond: false,   // 共线时展示第二种拆法
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const B = LA.fromCols(S.u, S.w);
    const det = LA.det2(B);
    const dependent = Math.abs(det) < 1e-6;
    const Binv = dependent ? null : (() => { const d = det; return { a: B.d / d, b: -B.b / d, c: -B.c / d, d: B.a / d }; })();

    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a", width: 1.5 });

    // U+W 的范围
    if (!dependent) {
      ctx.save(); ctx.fillStyle = "rgba(121,184,255,.05)"; ctx.fillRect(0, 0, cam.w, cam.h); ctx.restore();
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "U + W = span{u,w} = ℝ²（和最大就是这么大）", "#79b8ff",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13, bold: true });
      // U∩W = {0}
      LA.draw.dot(ctx, cam, { x: 0, y: 0 }, "#f0b429", 6);
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "U ∩ W = {0}（只共享原点 → 可直和）", "#f0b429",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 13, bold: true });
    } else {
      const dir = (LA.v.len(S.u) > 1e-6) ? S.u : S.w;
      if (LA.v.len(dir) > 1e-6) {
        LA.draw.spanLine(ctx, cam, dir, "rgba(121,184,255,.8)", { width: 3.5 });
        LA.draw.label(ctx, cam, { x: 0, y: 0 }, "u、w 共线：U = W → U+W = U∩W = 这条直线", "#79b8ff",
          { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13, bold: true });
      }
    }

    // 张成线
    LA.draw.spanLine(ctx, cam, S.u, "rgba(126,231,135,.45)", { width: 1.6 });
    LA.draw.spanLine(ctx, cam, S.w, "rgba(255,123,114,.45)", { width: 1.6 });

    // x 的拆解 x = α·u + β·w
    if (Binv) {
      const ab = LA.apply2(Binv, S.x);
      const p1 = LA.v.scale(S.u, ab.x);
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, p1, C.i, { width: 2.4, alpha: .8, dash: [5, 4], noHead: Math.abs(ab.y) < 1e-9 });
      if (Math.abs(ab.y) > 1e-9) LA.draw.arrow(ctx, cam, p1, S.x, C.j, { width: 2.4, alpha: .8, dash: [5, 4] });
      LA.draw.label(ctx, cam, LA.v.scale(p1, 0.6), `${LA.fmt(ab.x)}·u`, C.i, { fontSize: 11 });
      if (Math.abs(ab.y) > 1e-9) {
        const mid = LA.v.scale(LA.v.add(p1, S.x), 0.5);
        LA.draw.label(ctx, cam, mid, `${LA.fmt(ab.y)}·w`, C.j, { fontSize: 11 });
      }
    } else if (S.showSecond && LA.v.len(S.u) > 1e-6 && LA.v.len(S.w) > 1e-6) {
      // 共线时：拆法无穷多。λ = w/u 投影比；x = (α+1)u + (β − 1/λ)w 是另一套配方
      const lam = LA.v.dot(S.w, S.u) / LA.v.dot(S.u, S.u);
      const ab = null; // 无 Binv
      // 用一维坐标算：x 在方向 u 上的坐标
      const xCoord = LA.v.dot(S.x, S.u) / LA.v.dot(S.u, S.u);
      const recipe = (t) => {
        const a1 = xCoord + t, b1 = -(t) / lam;
        return { a1, b1 };
      };
      [0, 1].forEach((tt, idx) => {
        const { a1, b1 } = recipe(tt);
        const p1 = LA.v.scale(S.u, a1);
        const col = idx === 0 ? C.i : "#d2a8ff";
        LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, p1, col, { width: 2.2, alpha: .8, dash: [5, 4], noHead: true });
        LA.draw.arrow(ctx, cam, p1, S.x, idx === 0 ? C.j : "#d2a8ff", { width: 2.2, alpha: .8, dash: [5, 4] });
        LA.draw.label(ctx, cam, LA.v.scale(p1, 0.6), idx === 0 ? `拆法A` : `拆法B（不同！）`, col, { fontSize: 11.5 });
      });
      LA.draw.label(ctx, cam, S.x, "同一个 x，无数种拆法 → 直和失效", "#d2a8ff", { bold: true, dy: -40, dx: 8, fontSize: 12.5 });
    }

    // x 向量
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.x, C.v, { width: 3.6, head: 12 });
    LA.draw.handle(ctx, cam, S.x, C.v, { hover: this._dragId === "x" || this._hoverId === "x" });
    if (!Binv && !S.showSecond) {
      LA.draw.label(ctx, cam, S.x, "x", C.v, { dy: -26 });
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "x 当然还在 U+W 里，但拆法有无数种（勾选下方看第二种）", "#8b98a9",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 12.5 });
    } else if (Binv) {
      LA.draw.label(ctx, cam, S.x, `x = (唯一拆法)`, C.v, { dy: -28, dx: 8, fontSize: 12 });
    }

    // 向量 u w
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.u, C.i, { width: 3.4, head: 12, label: "u" });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.w, C.j, { width: 3.4, head: 12, label: "w" });
    LA.draw.handle(ctx, cam, S.u, C.i, { hover: this._dragId === "u" || this._hoverId === "u" });
    LA.draw.handle(ctx, cam, S.w, C.j, { hover: this._dragId === "w" || this._hoverId === "w" });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p) => { S[id] = clampCol(p); this.refreshPanel(); },
    });
    if (LA.hitHandle(sx, sy, cam, S.x, 20)) return mk("x");
    if (LA.hitHandle(sx, sy, cam, S.u, 20)) return mk("u");
    if (LA.hitHandle(sx, sy, cam, S.w, 20)) return mk("w");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">两个子空间 + 一个目标向量（都可拖）</div>
        <div class="btn-row">
          <button class="btn" data-p="indep">独立(可直和)</button>
          <button class="btn" data-p="collin">共线(直和失效)</button>
        </div>
        <label class="chk" style="margin-top:4px"><input type="checkbox" id="s16sec" ${S.showSecond ? "checked" : ""}> 共线时显示第二种拆法</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">诊断</div>
        <div class="kv"><span class="k">U + W（能到达的范围）</span><span class="v" id="s16sum"></span></div>
        <div class="kv"><span class="k">U ∩ W（共同拥有）</span><span class="v" id="s16cap"></span></div>
        <div class="kv"><span class="k">直和 U ⊕ W？</span><span class="v" id="s16direct"></span></div>
        <div class="kv"><span class="k">dim(U+W)</span><span class="v" id="s16dim"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>和 U+W</b>：两个子空间的"势力范围合并"， = 所有 α·u + β·w 能到的地方。
          在 ℝ² 里最多就是全平面。<br><br>
          <b>交 U∩W</b>：两个世界共同的地盘。两个不同的过原点直线，交集只有
          <span class="hl-y">{0}</span>；共线时交集是整条线。<br><br>
          <b>直和 U⊕W</b>：交只有 {0} 时的特殊状态 ——
          每个向量都有<span class="hl-g">唯一</span>的拆法 x = α·u + β·w
          （虚线走步）。拖动 x，配方虽然变，但永远只有这一种。<br><br>
          把 w 拖到和 u 共线：拆法瞬间变成<span class="hl-r">无穷多种</span>
          （勾选"显示第二种拆法"亲眼看两套配方通向同一个 x）
          —— 直和失效，"唯一坐标"的便利没了。<br><br>
          💡 直和 = "完美的分工"：每个部分贡献自己的维度，互不重复。
          维数公式：dim(U+W) = dim U + dim W − dim(U∩W)。
        </div>
      </div>`;
    this._panel = el;

    el.querySelector("#s16sec").addEventListener("change", (e) => { S.showSecond = e.target.checked; });
    el.querySelectorAll("[data-p]").forEach((btn) => btn.addEventListener("click", () => {
      if (btn.dataset.p === "indep") { S.u = { x: 2, y: 0.5 }; S.w = { x: -0.5, y: 2 }; }
      else { S.u = { x: 1, y: 1 }; S.w = { x: -1.5, y: -1.5 }; }
      this.refreshPanel();
    }));
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const det = LA.det2(LA.fromCols(S.u, S.w));
    const dependent = Math.abs(det) < 1e-6;
    const sumEl = el.querySelector("#s16sum"), capEl = el.querySelector("#s16cap"), dirEl = el.querySelector("#s16direct");
    if (!dependent) {
      sumEl.textContent = "ℝ²（全平面）"; sumEl.style.color = "#79b8ff";
      capEl.textContent = "{0}（只有原点）"; capEl.style.color = "#7ee787";
      dirEl.textContent = "✓ 是直和"; dirEl.style.color = "#7ee787";
    } else {
      const hasU = LA.v.len(S.u) > 1e-6, hasW = LA.v.len(S.w) > 1e-6;
      if (!hasU && !hasW) {
        sumEl.textContent = "{0}"; capEl.textContent = "{0}";
      } else {
        sumEl.textContent = "一条直线"; sumEl.style.color = "#ffa657";
        capEl.textContent = "同一条直线"; capEl.style.color = "#ffa657";
      }
      dirEl.textContent = "✗ 不是直和"; dirEl.style.color = "#ff7b72";
    }
    const dimU = LA.v.len(S.u) > 1e-6 ? 1 : 0;
    const dimW = LA.v.len(S.w) > 1e-6 ? 1 : 0;
    const dimCap = dependent ? (dimU === 1 && dimW === 1 ? 1 : 0) : 0;
    el.querySelector("#s16dim").textContent = `${dimU + dimW - dimCap} = ${dimU} + ${dimW} − ${dimCap}`;
  },
});

/* ============================================================
 * 第 17 章 线性空间同构：R² ≅ ℂ
 * 左右两个世界，线性结构完全同步
 * ============================================================ */
LA.scenes.push({
  id: "isomorphism", icon: "≅", name: "同构：不同的世界，同一套结构",
  tagline: "R² ≅ ℂ：加法对加法，乘法对变换，一一对应",
  newCam: () => null,

  state: {
    v1: { x: 1.5, y: 1 },
    v2: { x: 0.5, y: 1.5 },
    z: { x: 0.7, y: 0.7 },      // 复数乘子 a+bi
    showMult: true,
    camL: new LA.Cam2D(56),
    camR: new LA.Cam2D(56),
  },

  zMat() {
    const S = this.state;
    return { a: S.z.x, b: -S.z.y, c: S.z.y, d: S.z.x };
  },

  draw(ctx, cam, app, t) {
    const w = cam.w, h = cam.h;
    const S = this.state;
    const cv = document.getElementById("cv");
    S.camL.setSize(w / 2, h);
    S.camR.setSize(w / 2, h);

    // 分隔线与标题
    ctx.save();
    ctx.strokeStyle = "#263042"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    ctx.restore();
    LA.draw.label(ctx, S.camL, { x: -4.8, y: 4.6 }, "世界一：ℝ²（箭头视角）", "#8b98a9", { screen: { x: 14, y: 14 }, fontSize: 13, bold: true });
    LA.draw.label(ctx, S.camR, { x: -4.8, y: 4.6 }, "世界二：ℂ（复数 a+bi）", "#8b98a9", { screen: { x: w / 2 + 14, y: 14 }, fontSize: 13, bold: true });

    const M = this.zMat();
    const sum = LA.v.add(S.v1, S.v2);

    /* ---- 左世界 ℝ² ---- */
    ctx.save();
    LA.draw.grid(ctx, S.camL, { color: "#1d2634" });
    LA.draw.axes(ctx, S.camL, { color: "#2c3849" });
    if (S.showMult) {
      LA.draw.grid(ctx, S.camL, { matrix: M, color: "#2b4468", width: 1.1, emphasis: "#4d6f9e" });
      LA.draw.arrow(ctx, S.camL, { x: 0, y: 0 }, { x: 1, y: 0 }, "rgba(126,231,135,.5)", { width: 1.8, head: 8 });
      LA.draw.arrow(ctx, S.camL, { x: 0, y: 0 }, { x: 0, y: 1 }, "rgba(255,123,114,.5)", { width: 1.8, head: 8 });
    }
    LA.draw.poly(ctx, S.camL, [{ x: 0, y: 0 }, S.v1, sum, S.v2], "rgba(255,166,87,.06)", "rgba(255,166,87,.35)", { dash: [5, 5], width: 1.1 });
    LA.draw.arrow(ctx, S.camL, { x: 0, y: 0 }, sum, C.sum, { width: 2.6, head: 10 });
    LA.draw.arrow(ctx, S.camL, { x: 0, y: 0 }, S.v1, C.i, { width: 3.2, head: 11 });
    LA.draw.arrow(ctx, S.camL, { x: 0, y: 0 }, S.v2, C.j, { width: 3.2, head: 11 });
    LA.draw.handle(ctx, S.camL, S.v1, C.i, { hover: this._dragId === "v1" || this._hoverId === "v1" });
    LA.draw.handle(ctx, S.camL, S.v2, C.j, { hover: this._dragId === "v2" || this._hoverId === "v2" });
    ctx.restore();

    /* ---- 右世界 ℂ ---- */
    ctx.save();
    ctx.translate(w / 2, 0);
    LA.draw.grid(ctx, S.camR, { color: "#1d2634" });
    LA.draw.axes(ctx, S.camR, { color: "#2c3849" });
    // 虚轴标注
    LA.draw.label(ctx, S.camR, { x: 0.25, y: 4.3 }, "bi（虚轴）", "#8b98a9", { fontSize: 10.5 });
    LA.draw.label(ctx, S.camR, { x: 4.2, y: -0.35 }, "a（实轴）", "#8b98a9", { fontSize: 10.5 });
    LA.draw.poly(ctx, S.camR, [{ x: 0, y: 0 }, S.v1, sum, S.v2], "rgba(255,166,87,.06)", "rgba(255,166,87,.35)", { dash: [5, 5], width: 1.1 });
    LA.draw.arrow(ctx, S.camR, { x: 0, y: 0 }, sum, C.sum, { width: 2.6, head: 10 });
    LA.draw.arrow(ctx, S.camR, { x: 0, y: 0 }, S.v1, C.i, { width: 3.2, head: 11 });
    LA.draw.arrow(ctx, S.camR, { x: 0, y: 0 }, S.v2, C.j, { width: 3.2, head: 11 });
    // (v1+v2) 对应 z1+z2，旁边显示复数乘子 z 的点
    LA.draw.dot(ctx, S.camR, S.z, "#f0b429", 5.5);
    LA.draw.handle(ctx, S.camR, S.z, "#f0b429", { hover: this._dragId === "z" || this._hoverId === "z" });
    LA.draw.label(ctx, S.camR, S.z, `乘子 z = ${LA.fmt(S.z.x)} + ${LA.fmt(S.z.y)}i`, "#f0b429", { bold: true, fontSize: 11.5, dy: -24, dx: 8 });
    if (S.showMult) {
      // 单位圆被乘以 z 后变成半径 |z| 的圆 + 基向量旋转
      const mod = Math.hypot(S.z.x, S.z.y);
      const e1 = { x: S.z.x, y: S.z.y }, e2 = { x: -S.z.y, y: S.z.x };
      LA.draw.arrow(ctx, S.camR, { x: 0, y: 0 }, e1, "rgba(126,231,135,.8)", { width: 2, head: 8 });
      LA.draw.arrow(ctx, S.camR, { x: 0, y: 0 }, e2, "rgba(255,123,114,.8)", { width: 2, head: 8 });
      ctx.save();
      ctx.strokeStyle = "rgba(255,166,87,.6)"; ctx.lineWidth = 1.6;
      const org = S.camR.toS({ x: 0, y: 0 });
      ctx.beginPath(); ctx.arc(org.x, org.y, mod * S.camR.ppu, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 同步提示
    LA.draw.label(ctx, S.camL, { x: 0, y: 0 }, S.showMult ? "乘 z 的效果 = 矩阵 [[a,−b],[b,a]] 作用在左世界" : "两边平行四边形一模一样",
      "#5b6675", { screen: { x: 14, y: h - 18 }, fontSize: 12 });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const cv = document.getElementById("cv");
    const w = cv._cssW;
    const local = sx < w / 2 ? { cam: S.camL, sx, off: 0 } : { cam: S.camR, sx: sx - w / 2, off: w / 2 };
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p, cam2, dsx, dsy) => {
        const lcx = (id === "z") ? dsx - w / 2 : dsx;
        const wp = local.cam.toW(lcx, dsy);
        S[id] = clampCol(wp);
        this.refreshPanel && this.refreshPanel();
      },
    });
    if (sx < w / 2) {
      if (LA.hitHandle(local.sx, sy, S.camL, S.v1, 20)) return mk("v1");
      if (LA.hitHandle(local.sx, sy, S.camL, S.v2, 20)) return mk("v2");
    } else {
      if (LA.hitHandle(local.sx, sy, S.camR, S.z, 20)) return mk("z");
    }
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">同构映射 φ：ℝ² → ℂ</div>
        <div class="panel-note" style="font-size:12.5px">
          φ(a, b) = a + b·i<br>
          左世界拖 <span style="color:${C.i}">v₁</span>、<span style="color:${C.j}">v₂</span>，
          右世界 <b>z₁、z₂、z₁+z₂</b> 同步移动 —— 一模一样的平行四边形。
        </div>
        <label class="chk" style="margin-top:4px"><input type="checkbox" id="s17m" ${S.showMult ? "checked" : ""}> 演示复数乘法 ↔ 线性变换</label>
        <div class="kv"><span class="k">乘法矩阵（右拖金色 z）</span></div>
        <div id="s17mz"></div>
        <div class="kv" style="margin-top:4px"><span class="k">效果</span><span class="v" id="s17fx"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">还有这些同构</div>
        <div class="panel-note" style="font-size:12.5px">
          · ℝ² ≅ 一次多项式空间 {a + b·x}：<br>(a,b) ↔ "a + bx"，加法数乘照样同步<br>
          · ℝⁿ ≅ 列向量 ≅ 行向量 ≅ n 维数组<br>
          · 2×2 对称矩阵 ≅ ℝ³（由 3 个自由分量决定）<br><br>
          <b>有限维判定：维数相同 ⟺ 同构。</b><br>
          维数就是"自由度"，自由度一样就能一套一一对应的"词典"。
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>同构 = 两个向量空间之间"保结构的词典"：</b><br>
          一一对应，且 加法对应加法、数乘对应数乘。<br><br>
          在左边拖动 v₁、v₂：平行四边形怎么画，右边 ℂ 里的 z₁、z₂ 就怎么画
          —— <b>结构一模一样</b>，只是"箭头"换名叫"复数"。<br><br>
          最妙的是乘法：ℂ 里乘以 z = a+bi（右世界拖金点），
          翻译到 ℝ² 里就是矩阵 <span class="hl-y">[[a, −b], [b, a]]</span> 的作用
          —— 旋转 θ = atan2(b,a)，拉伸 |z|。<br>
          复数乘法"自古以来"就是线性变换，只是没人这么叫它。<br><br>
          💡 同构告诉你：<b>向量长什么样（箭头/数对/多项式/复数）根本不重要</b>，
          重要的只有线性结构。数学研究的是结构，不是对象。
        </div>
      </div>`;
    this._panel = el;

    el.querySelector("#s17m").addEventListener("change", (e) => { S.showMult = e.target.checked; });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const M = this.zMat();
    const mz = el.querySelector("#s17mz");
    if (!mz.dataset.built) { mz.innerHTML = LA.ui.mat2HTML("s17zz", M, { readonly: true, cls: "readonly" }); mz.dataset.built = "1"; }
    LA.ui.setMat2(el, "s17zz", M);
    const mod = Math.hypot(S.z.x, S.z.y);
    const ang = Math.atan2(S.z.y, S.z.x) * 180 / Math.PI;
    el.querySelector("#s17fx").textContent = `旋转 ${LA.fmt(ang)}°，拉伸 ${LA.fmt(mod)}`;
  },
});
