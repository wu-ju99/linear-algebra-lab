/* =========================================================
 * scenes2.js —— 第4~6章：复合变换 / 特征值 / 三维变换
 * ========================================================= */
"use strict";

/* ============================================================
 * 第 4 章 复合变换：矩阵乘法的真面目
 * ============================================================ */
LA.scenes.push({
  id: "compose", icon: "⇉", name: "复合变换：矩阵乘法",
  tagline: "BA 的意思是\"先 A 后 B\"（从右往左读）",
  newCam: () => new LA.Cam2D(72),

  state: {
    A: { a: 0, b: -1, c: 1, d: 0 },   // 旋转 90°
    B: { a: 1, b: 1, c: 0, d: 1 },    // 剪切
    v: { x: 1.5, y: 0.5 },
    aFirst: true,                      // true: 先 A 后 B
    showMid: true,
    anim: makeAnim(true),
  },

  comp() {
    const S = this.state;
    return S.aFirst ? LA.mul2(S.B, S.A) : LA.mul2(S.A, S.B);
  },
  changed(now) { matrixChanged(this.state.anim, this.comp(), now); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const M = effM(S.anim, this.comp(), t);

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    LA.draw.grid(ctx, cam, { matrix: M, color: "#2c4470", width: 1.2, emphasis: "#4a6ba6" });
    LA.draw.axes(ctx, cam, { matrix: M, color: "#4f6fa5", width: 1.8 });

    const first = S.aFirst ? S.A : S.B;
    const Av = LA.apply2(first, S.v);
    const BAv = LA.apply2(M, S.v);

    // 中间结果
    if (S.showMid) {
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, Av, C.w, { width: 2.2, dash: [6, 5], alpha: .85 });
      LA.draw.dot(ctx, cam, Av, C.w, 3.5);
      LA.draw.label(ctx, cam, Av, S.aFirst ? "Av（先做完 A）" : "Bv（先做完 B）", C.w, { fontSize: 11.5 });
    }

    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, BAv, C.sum, { width: 3.4, head: 12 });
    LA.draw.label(ctx, cam, BAv, `${S.aFirst ? "BA" : "AB"}·v`, C.sum, { bold: true, dy: -28, dx: 8 });
    LA.draw.dot(ctx, cam, BAv, C.sum, 4);

    // 原向量
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.v, "rgba(255,215,94,.5)", { width: 2, dash: [4, 4], head: 9 });
    LA.draw.handle(ctx, cam, S.v, C.v, { hover: this._dragId === "v" || this._hoverId === "v" });
    LA.draw.label(ctx, cam, S.v, "v", C.v, { dy: -26 });

    // 顺序提示（画在原点旁）
    LA.draw.label(ctx, cam, cam.toS({ x: 0, y: 0 }), S.aFirst ? "顺序：v →(A)→ Av →(B)→ BAv" : "顺序：v →(B)→ Bv →(A)→ ABv",
      "#8b98a9", { screen: true, dx: 14, dy: 18, fontSize: 12.5 });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    if (LA.hitHandle(sx, sy, cam, S.v, 18)) return {
      id: "v", cursor: "grab",
      drag: (p) => { S.v = clampCol(p); },
    };
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">两个变换（先做 A，再做 B）</div>
        <div class="mx-caption"><b style="color:${C.i}">A</b>（第一步）</div>
        ${LA.ui.mat2HTML("s4a", S.A)}
        <div class="mx-caption" style="margin-top:8px"><b style="color:${C.j}">B</b>（第二步）</div>
        ${LA.ui.mat2HTML("s4b", S.B)}
        <div class="btn-row">
          <button class="btn" id="s4swap">🔄 交换顺序</button>
          <button class="btn" id="s4rand">🎲 随机一组</button>
        </div>
        <label class="chk" style="margin-top:4px"><input type="checkbox" id="s4mid" ${S.showMid ? "checked" : ""}> 显示中间结果</label>
        <label class="chk"><input type="checkbox" id="s4anim" ${S.anim.on ? "checked" : ""}> 平滑动画</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">此时此刻</div>
        <div class="kv"><span class="k" id="s4ordk">复合 BA = 先 A 后 B</span></div>
        <div id="s4comp"></div>
        <div class="kv" style="margin-top:4px"><span class="k">det 复合矩阵</span><span class="v" id="s4det"></span></div>
        <div class="kv"><span class="k">detA × detB</span><span class="v" id="s4detprod"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>矩阵乘法 = 变换一个接一个地上。</b><br>
          "BA·v" 要从右往左读：先对 v 做 A，再做 B。<br><br>
          而"先 A 后 B"的总效果，本身就等价于一个单独的矩阵（复合矩阵）——
          这就是矩阵乘法规则的来源：它不是数字游戏，是<b>动作的串联</b>。<br><br>
          ⚠️ 顺序很重要！先旋转再剪切 ≠ 先剪切再旋转。
          点上面的 <b>🔄 交换顺序</b>，看橙色向量换了个位置 —— 这就是
          <span class="hl-r">BA ≠ AB</span>（矩阵乘法不满足交换律）。<br><br>
          💡 但不管什么顺序：<b>det(BA) = detA × detB</b> —— 面积倍数永远相乘。
        </div>
      </div>`;
    this._panel = el;

    LA.ui.mat2Bind(el, "s4a", (M) => { Object.assign(S.A, M); this.changed(LA.app.now()); this.refreshPanel(); });
    LA.ui.mat2Bind(el, "s4b", (M) => { Object.assign(S.B, M); this.changed(LA.app.now()); this.refreshPanel(); });

    el.querySelector("#s4swap").addEventListener("click", () => {
      S.aFirst = !S.aFirst;
      this.changed(LA.app.now());
      this.refreshPanel();
      LA.app.toast(S.aFirst ? "现在：先做 A，再做 B" : "现在：先做 B，再做 A");
    });
    el.querySelector("#s4rand").addEventListener("click", () => {
      const r = () => LA.snap((Math.random() * 2 - 1) * 1.5);
      Object.assign(S.A, { a: r(), b: r(), c: r(), d: r() });
      Object.assign(S.B, { a: r(), b: r(), c: r(), d: r() });
      this.changed(LA.app.now());
      LA.ui.setMat2(el, "s4a", S.A); LA.ui.setMat2(el, "s4b", S.B);
      this.refreshPanel();
    });
    el.querySelector("#s4mid").addEventListener("change", (e) => { S.showMid = e.target.checked; });
    el.querySelector("#s4anim").addEventListener("change", (e) => { S.anim.on = e.target.checked; });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const BA = this.comp();
    el.querySelector("#s4ordk").textContent = S.aFirst ? "复合 BA（先 A 后 B）" : "复合 AB（先 B 后 A）";
    el.querySelector("#s4comp").innerHTML = LA.ui.mat2Chip(BA, "#ffa657");
    el.querySelector("#s4det").textContent = LA.fmt2(LA.det2(BA));
    el.querySelector("#s4detprod").textContent = LA.fmt2(LA.det2(S.A) * LA.det2(S.B));
    LA.ui.setMat2(el, "s4a", S.A);
    LA.ui.setMat2(el, "s4b", S.B);
  },
});

/* ============================================================
 * 第 5 章 特征值与特征向量
 * ============================================================ */
LA.scenes.push({
  id: "eigen", icon: "⌖", name: "特征向量：不转向的箭头",
  tagline: "Av = λv：只拉伸，不拐弯",
  newCam: () => new LA.Cam2D(72),

  state: {
    M: { a: 2, b: 1, c: 1, d: 2 },   // 特征值 3、1；特征向量 (1,1)、(1,-1)
    anim: makeAnim(false),           // 网格平时直接显示 M
    playing: false, playT0: 0,
    cloud: null,
    showCloud: true,
  },

  init() {
    // 固定伪随机的一组方向（云雾向量）
    let seed = 42;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    this.state.cloud = [];
    for (let i = 0; i < 26; i++) {
      const ang = rnd() * Math.PI * 2;
      this.state.cloud.push({ x: Math.cos(ang), y: Math.sin(ang) });
    }
  },

  M_eff(now) {
    const S = this.state;
    if (S.playing) {
      const t = LA.clamp((now - S.playT0) / 1.7, 0, 1);
      return LA.lerp2(LA.ident2(), S.M, LA.ease(t));
    }
    return S.M;
  },
  changed(now) { matrixChanged(this.state.anim, this.state.M, now); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const M = this.M_eff(t);
    const eig = LA.eigen2(S.M);

    LA.draw.grid(ctx, cam, { color: "#182130", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    LA.draw.grid(ctx, cam, { matrix: M, color: "#2b4468", width: 1.2, emphasis: "#4d6f9e" });

    // 云雾向量：播放动画时看它们怎么飞
    if (S.playing && S.showCloud) {
      const prog = LA.clamp((t - S.playT0) / 1.7, 0, 1);
      if (prog < 1) {
        S.cloud.forEach((u) => {
          const img = LA.apply2(S.M, u);
          const p = LA.v.lerp(u, img, LA.ease(prog));
          LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, p, "#9aa7b8", { width: 1.6, alpha: .35, head: 6 });
        });
      }
    }

    // 特征方向
    const drawEig = (v, l, color, name) => {
      if (!v) return;
      LA.draw.spanLine(ctx, cam, v, color + "55", { width: 1.2 });
      // 箭头长度 = |λ|，方向按 λ 正负（负 λ = 被翻到反方向）
      const arrowTip = LA.v.scale(v, LA.clamp(Math.abs(l), 0.3, 4) * Math.sign(l));
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, arrowTip, color, { width: 3.2, head: 11 });
      LA.draw.label(ctx, cam, arrowTip, `${name}（λ=${LA.fmt(l)}）`, color, { fontSize: 12, bold: true });
    };

    if (eig.real && !eig.allVectors) {
      drawEig(eig.v1, eig.l1, "#d2a8ff", "特征方向 1");
      if (eig.v2) drawEig(eig.v2, eig.l2, "#56d4dd", "特征方向 2");
    }
    if (eig.real && eig.allVectors) {
      LA.draw.label(ctx, cam, { x: 0, y: 3.2 }, "这个矩阵 = λI：所有方向都是特征方向!", "#d2a8ff", { center: true, bold: true, fontSize: 13 });
    }
    if (!eig.real) {
      LA.draw.label(ctx, cam, { x: 0, y: 3.2 }, "这个变换在旋转平面：没有实特征向量！", "#79b8ff", { center: true, bold: true, fontSize: 13 });
    }

    // 基向量 + 拖拽点
    const c1 = LA.col1(S.M), c2 = LA.col2(S.M);
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3.2, head: 11, alpha: .9 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3.2, head: 11, alpha: .9 });
    LA.draw.handle(ctx, cam, c1, C.i, { hover: this._dragId === "c1" || this._hoverId === "c1" });
    LA.draw.handle(ctx, cam, c2, C.j, { hover: this._dragId === "c2" || this._hoverId === "c2" });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const app2 = LA.app;
    const c1 = LA.col1(S.M), c2 = LA.col2(S.M);
    const mk = (id, keys) => ({
      id, cursor: "grab",
      drag: (p) => {
        const q = clampCol(p);
        S.M[keys[0]] = q.x; S.M[keys[1]] = q.y;
        this.changed(app2.now());
        LA.ui.setMat2(this._panel, "s5m", S.M);
        LA.app.refreshPanel();
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
        <div class="panel-title">矩阵 A（拖端点试试找特征方向）</div>
        ${LA.ui.mat2HTML("s5m", S.M)}
        <div class="btn-row">
          <button class="btn primary" id="s5play">▶ 播放变换动画</button>
          <button class="btn" id="s5presets-rot">🎲 旋转(无特征)</button>
        </div>
        <label class="chk" style="margin-top:4px"><input type="checkbox" id="s5cloud" ${S.showCloud ? "checked" : ""}> 动画时显示云雾向量</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">特征值 / 特征向量</div>
        <div class="kv"><span class="k" style="color:#d2a8ff">λ₁ 与特征方向</span><span class="v" id="s5e1"></span></div>
        <div class="kv"><span class="k" style="color:#56d4dd">λ₂ 与特征方向</span><span class="v" id="s5e2"></span></div>
        <div class="kv"><span class="k">tr A = λ₁+λ₂</span><span class="v" id="s5tr"></span></div>
        <div class="kv"><span class="k">det A = λ₁×λ₂</span><span class="v" id="s5det"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          大部分向量经过变换都会<b>又转又伸</b>，但总有几个"倔强"的方向：
          变换后<b>仍然躺在原来的直线上</b>，只是被拉伸了 λ 倍 ——
          这就是<span class="hl-y">特征向量</span>，λ 叫<span class="hl-y">特征值</span>。<br><br>
          点 <b>▶ 播放变换动画</b>：灰色云雾里，只有紫色/青色直线上的箭头
          是"原地伸缩"，别的都在拐弯。<br><br>
          💡 <b>特征值 = 变换的"骨架"</b>：det = λ₁λ₂，tr = λ₁+λ₂，
          对角化就是把坐标轴搬到特征方向上，让复杂的变换显出"只拉伸"的简单本色。<br><br>
          ⚠️ 如果 det<0 之类导致 λ 是复数（比如纯旋转），说明这个变换在转圈，
          平面上没有不转向的箭头。
        </div>
      </div>`;
    this._panel = el;

    LA.ui.mat2Bind(el, "s5m", (M) => {
      Object.assign(S.M, M);
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    el.querySelector("#s5play").addEventListener("click", () => {
      S.playing = true; S.playT0 = LA.app.now();
    });
    el.querySelector("#s5presets-rot").addEventListener("click", () => {
      Object.assign(S.M, { a: 0, b: -1, c: 1, d: 0 });
      this.changed(LA.app.now());
      LA.ui.setMat2(el, "s5m", S.M);
      this.refreshPanel();
    });
    el.querySelector("#s5cloud").addEventListener("change", (e) => { S.showCloud = e.target.checked; });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const eig = LA.eigen2(S.M);
    const e1 = el.querySelector("#s5e1"), e2 = el.querySelector("#s5e2");
    if (!eig.real) {
      e1.textContent = `${LA.fmt(eig.re)} + ${LA.fmt(eig.im)}i`;
      e2.textContent = `${LA.fmt(eig.re)} − ${LA.fmt(eig.im)}i`;
      e1.style.color = e2.style.color = "#79b8ff";
    } else if (eig.allVectors) {
      e1.textContent = `λ=${LA.fmt(eig.l1)}，所有向量`;
      e2.textContent = "—";
    } else {
      e1.textContent = `${LA.fmt(eig.l1)} → (${LA.fmt(eig.v1.x)}, ${LA.fmt(eig.v1.y)})`;
      e2.textContent = eig.v2 ? `${LA.fmt(eig.l2)} → (${LA.fmt(eig.v2.x)}, ${LA.fmt(eig.v2.y)})` : `λ=${LA.fmt(eig.l2)}（重根）`;
      e1.style.color = "#d2a8ff"; e2.style.color = "#56d4dd";
    }
    el.querySelector("#s5tr").textContent = LA.fmt2(LA.trace2(S.M));
    el.querySelector("#s5det").textContent = LA.fmt2(LA.det2(S.M));
  },
});

/* ============================================================
 * 第 6 章 三维变换（自研微型 3D 引擎，无依赖）
 * ============================================================ */
LA.scenes.push({
  id: "three-d", icon: "⬢", name: "三维：体积与 3×3 矩阵",
  tagline: "3×3 矩阵 = 三维空间的运动，det = 体积倍数",
  newCam: () => null, // 用自己的 3D 相机

  state: {
    M3: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    preset: "ident", theta: 45,
    cam3: { yaw: 0.65, pitch: 0.42, zoom: 1 },
    lastPoint: null,
  },

  init() { this.setPreset("ident"); },

  /* ---- 3D 相机与投影 ---- */
  proj(p, w, h) {
    const { yaw, pitch, zoom } = this.state.cam3;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const eye = { x: 10 * cp * Math.cos(yaw), y: 10 * cp * Math.sin(yaw), z: 10 * sp };
    const L = (v) => Math.hypot(v.x, v.y, v.z) || 1;
    const f = { x: -eye.x / L(eye), y: -eye.y / L(eye), z: -eye.z / L(eye) };          // forward
    let r = { x: f.y * 1 - f.z * 0, y: f.z * 0 - f.x * 1, z: 0 };                       // f × up(0,0,1)
    const rl = Math.hypot(r.x, r.y) || 1;
    r = { x: r.x / rl, y: r.y / rl, z: 0 };
    const u = { x: r.y * f.z - r.z * f.y, y: r.z * f.x - r.x * f.z, z: r.x * f.y - r.y * f.x }; // r × f
    const rel = { x: p.x - eye.x, y: p.y - eye.y, z: p.z - eye.z };
    const depth = Math.max(rel.x * f.x + rel.y * f.y + rel.z * f.z, 0.6);
    const px = rel.x * r.x + rel.y * r.y + rel.z * r.z;
    const py = rel.x * u.x + rel.y * u.y + rel.z * u.z;
    const FOCAL = 9;
    const pf = (FOCAL / depth) * (Math.min(w, h) / 8.2) * zoom;
    return { x: w / 2 + px * pf, y: h / 2 - py * pf, depth };
  },

  seg3(ctx, w, h, a, b, color, width, alpha, dashed) {
    const A = this.proj(a, w, h), B = this.proj(b, w, h);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
    if (dashed) ctx.setLineDash(dashed);
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    ctx.restore();
    return (A.depth + B.depth) / 2;
  },

  draw(ctx, cam, app, t) {
    const w = cam.w, h = cam.h;
    const S = this.state;
    const M = S.M3;
    const T = (p) => LA.apply3(M, p);

    ctx.clearRect(0, 0, w, h);
    // z 轴（竖直参考线）
    this.seg3(ctx, w, h, { x: 0, y: 0, z: -4 }, { x: 0, y: 0, z: 4 }, "#2c3849", 1.2, .8);

    // xy 平面网格（z=0），变换后
    const R = 3;
    for (let k = -R; k <= R; k++) {
      this.seg3(ctx, w, h, T({ x: k, y: -R, z: 0 }), T({ x: k, y: R, z: 0 }), "#2b4468", 1.1, .8);
      this.seg3(ctx, w, h, T({ x: -R, y: k, z: 0 }), T({ x: R, y: k, z: 0 }), "#2b4468", 1.1, .8);
      this.seg3(ctx, w, h, { x: k, y: -R, z: 0 }, { x: k, y: R, z: 0 }, "#1a2230", 1, .6, [3, 4]);
      this.seg3(ctx, w, h, { x: -R, y: k, z: 0 }, { x: R, y: k, z: 0 }, "#1a2230", 1, .6, [3, 4]);
    }

    // 单位立方体：原始（虚）与变换后（实）
    const corners = [];
    for (let i = 0; i < 8; i++) corners.push({ x: i & 1, y: (i >> 1) & 1, z: (i >> 2) & 1 });
    const edges = [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
    const det = LA.det3(M);
    const col3 = Math.abs(det) < 0.02 ? "#79b8ff" : (det > 0 ? "#56d4dd" : "#ff7b72");
    edges.forEach(([a, b]) => {
      this.seg3(ctx, w, h, corners[a], corners[b], "rgba(230,237,243,.35)", 1.2, .7, [4, 4]);
      this.seg3(ctx, w, h, T(corners[a]), T(corners[b]), col3, 2.2, 1);
    });
    corners.forEach((c) => {
      const p = this.proj(T(c), w, h);
      ctx.save(); ctx.fillStyle = col3;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });

    // 基向量：原始虚影 + 变换后
    const basis = [
      { e: { x: 1, y: 0, z: 0 }, c: C.i },
      { e: { x: 0, y: 1, z: 0 }, c: C.j },
      { e: { x: 0, y: 0, z: 1 }, c: "#79b8ff" },
    ];
    basis.forEach(({ e, c }, idx) => {
      const tip = T(e);
      // 屏幕空间箭头
      const o = this.proj({ x: 0, y: 0, z: 0 }, w, h), tv = this.proj(tip, w, h);
      const dx = tv.x - o.x, dy = tv.y - o.y, L = Math.hypot(dx, dy);
      if (L > 2) {
        ctx.save();
        ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 3.4; ctx.lineCap = "round";
        const head = 11, ux = dx / L, uy = dy / L;
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(tv.x - ux * head * .7, tv.y - uy * head * .7); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tv.x, tv.y);
        ctx.lineTo(tv.x - ux * head - uy * head * .42, tv.y - uy * head + ux * head * .42);
        ctx.lineTo(tv.x - ux * head + uy * head * .42, tv.y - uy * head - ux * head * .42);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        LA.draw.label(ctx, { w, h, toS: (p) => p }, tv, ["î′", "ĵ′", "k̂′"][idx] + ` (${LA.fmt(tip.x)},${LA.fmt(tip.y)},${LA.fmt(tip.z)})`, c, { fontSize: 11, dx: 10, dy: -10 });
      }
      this.seg3(ctx, w, h, { x: 0, y: 0, z: 0 }, e, "rgba(230,237,243,.3)", 1, .6, [3, 3]);
    });

    // det 大字水印
    ctx.save();
    ctx.globalAlpha = .16;
    ctx.fillStyle = col3;
    ctx.font = '700 92px Consolas, monospace';
    ctx.textAlign = "center";
    ctx.fillText(`det=${LA.fmt2(det)}`, w / 2, h - 40);
    ctx.restore();
  },

  hitTest() { return null; }, // 拖动 = 旋转视角（由 main 的 pan 处理）
  wantsOrbit() { return true; },

  setPreset(id) {
    const S = this.state;
    S.preset = id;
    const th = S.theta * Math.PI / 180;
    if (id === "ident") S.M3 = LA.ident3();
    else if (id === "rotz") S.M3 = LA.rot3z(th);
    else if (id === "rotx") S.M3 = LA.rot3x(th);
    else if (id === "roty") S.M3 = LA.rot3y(th);
    else if (id === "scale") S.M3 = [[2, 0, 0], [0, 1.4, 0], [0, 0, 0.6]];
    else if (id === "proj") S.M3 = [[1, 0, 0], [0, 1, 0], [0, 0, 0]];
    else if (id === "shear") S.M3 = [[1, 1, 0], [0, 1, 0], [0, 0, 1]];
    else if (id === "random") {
      S.M3 = [[0, 0, 0], [0, 0, 0], [0, 0, 0]].map((row, i) =>
        row.map(() => LA.snap((Math.random() * 2 - 1) * 1.4)));
      S.M3[2][2] = 1;
    }
    if (this._panel) {
      LA.ui.setMat3(this._panel, "s6m", S.M3);
      this.refreshPanel();
    }
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">变换预设</div>
        <div class="btn-row">
          <button class="btn" data-p="ident">恒等</button>
          <button class="btn" data-p="rotz">绕 z 轴旋转</button>
          <button class="btn" data-p="rotx">绕 x 轴旋转</button>
          <button class="btn" data-p="roty">绕 y 轴旋转</button>
          <button class="btn" data-p="scale">拉伸</button>
          <button class="btn" data-p="shear">剪切</button>
          <button class="btn" data-p="proj">压扁到 xy 面</button>
          <button class="btn" data-p="random">🎲 随机</button>
        </div>
        <div style="margin-top:8px">
          <div class="kv"><span class="k">角度 θ</span><span class="v" id="s6thv">45°</span></div>
          <input type="range" id="s6theta" min="0" max="360" step="1" value="${S.theta}">
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">矩阵 A（3×3，可直接改）</div>
        ${LA.ui.mat3HTML("s6m", S.M3)}
        <div class="kv" style="margin-top:8px"><span class="k">det = 体积倍数</span><span class="v" id="s6det" style="font-size:18px"></span></div>
        <div class="btn-row"><button class="btn" id="s6view">重置视角</button></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          3×3 矩阵就是三维版的"运动说明书"：三列分别是
          <span class="hl-g">î</span>、<span class="hl-r">ĵ</span>、<span class="hl-b">k̂</span> 三个基向量的落点。<br><br>
          <b>det = 单位立方体被变成的平行六面体体积倍数</b>。<br>
          · 旋转：det = 1，体积不变<br>
          · <b>压扁到 xy 面</b>：det = 0，三维被压成二维 —— 不可逆！<br>
          · det &lt; 0：空间被"镜像翻转"（左右手互换）<br><br>
          🖱️ <b>拖动空白处旋转视角</b>，滚轮缩放 —— 从不同角度看这个平行六面体。
        </div>
      </div>`;
    this._panel = el;

    el.querySelectorAll("[data-p]").forEach((b) =>
      b.addEventListener("click", () => this.setPreset(b.dataset.p)));
    el.querySelector("#s6theta").addEventListener("input", (e) => {
      S.theta = parseFloat(e.target.value);
      el.querySelector("#s6thv").textContent = S.theta + "°";
      if (["rotz", "rotx", "roty"].includes(S.preset)) this.setPreset(S.preset);
    });
    el.querySelector("#s6view").addEventListener("click", () => {
      S.cam3 = { yaw: 0.65, pitch: 0.42, zoom: 1 };
    });
    LA.ui.mat3Bind(el, "s6m", (M) => {
      S.M3 = M; S.preset = "custom";
      this.refreshPanel();
    });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const det = LA.det3(S.M3);
    const d = el.querySelector("#s6det");
    d.textContent = LA.fmt2(det);
    d.style.color = Math.abs(det) < 0.02 ? "#79b8ff" : (det > 0 ? "#56d4dd" : "#ff7b72");
  },
});
