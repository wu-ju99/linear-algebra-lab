/* =========================================================
 * scenes3.js —— 第8~11章：点积 / 叉积 / 线性方程组 / 逆矩阵
 * ========================================================= */
"use strict";

/* ============================================================
 * 第 8 章 点积：投影 × 长度
 * ============================================================ */
LA.scenes.push({
  id: "dot", icon: "⊙", name: "点积：投影乘长度",
  tagline: "a·b = |a||b|cosθ = 投影长度 × 被投影长度",
  newCam: () => new LA.Cam2D(80),

  state: {
    a: { x: 2, y: 1 },
    b: { x: -1, y: 2 },     // 初始垂直 → 点积恰好为 0
    showProj: true,
    showAngle: true,
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a", width: 1.5 });

    const d = LA.v.dot(S.a, S.b);
    const lb2 = LA.v.len(S.b) ** 2;
    const proj = lb2 > 1e-9 ? LA.v.scale(S.b, d / lb2) : { x: 0, y: 0 };
    const dCol = Math.abs(d) < 0.02 ? "#8b98a9" : (d > 0 ? "#7ee787" : "#ff7b72");

    // b 所在直线（投影参考线）
    if (S.showProj) LA.draw.spanLine(ctx, cam, S.b, "rgba(121,184,255,.22)", { width: 1.2, dash: [4, 5] });

    // 夹角弧（采样劣角，方向恒正确）
    if (S.showAngle) {
      const angA = Math.atan2(S.a.y, S.a.x), angB = Math.atan2(S.b.y, S.b.x);
      const R = Math.min(46 / cam.ppu, LA.v.len(S.a) * 0.55, LA.v.len(S.b) * 0.55);
      if (R > 8 / cam.ppu) {
        let dAng = angB - angA;
        while (dAng > Math.PI) dAng -= 2 * Math.PI;
        while (dAng < -Math.PI) dAng += 2 * Math.PI;
        ctx.save();
        ctx.strokeStyle = dCol; ctx.lineWidth = 2;
        ctx.beginPath();
        const N = 24;
        for (let i = 0; i <= N; i++) {
          const a2 = angA + (dAng * i) / N;
          const s = cam.toS({ x: Math.cos(a2) * R, y: Math.sin(a2) * R });
          if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
        ctx.restore();
        const mid = angA + dAng / 2;
        LA.draw.label(ctx, cam, { x: Math.cos(mid) * R * 1.5, y: Math.sin(mid) * R * 1.5 },
          `θ=${LA.fmt(Math.acos(LA.clamp(d / (LA.v.len(S.a) * LA.v.len(S.b) || 1), -1, 1)) * 180 / Math.PI)}°`,
          dCol, { center: true, fontSize: 11.5 });
      }
    }

    // 投影：从 a 的 tip 向 b 的直线作垂线
    if (S.showProj && lb2 > 1e-9) {
      LA.draw.line(ctx, cam, S.a, proj, "rgba(255,166,87,.65)", { dash: [4, 4], width: 1.4 });
      // 垂足直角标记
      const foot = proj;
      const dir = LA.v.norm(S.b);
      const perp = { x: -dir.y, y: dir.x };
      const s1 = LA.v.add(foot, LA.v.scale(dir, 0.18));
      const s2 = LA.v.add(s1, LA.v.scale(perp, 0.18));
      const s3 = LA.v.add(foot, LA.v.scale(perp, 0.18));
      LA.draw.poly(ctx, cam, [foot, s1, s2, s3], null, "rgba(255,166,87,.8)", { width: 1.2 });
      // 投影向量（橙色粗）
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, proj, "#ffa657", { width: 4, head: 12 });
      LA.draw.label(ctx, cam, proj, `a 的投影 (${LA.fmt(proj.x)}, ${LA.fmt(proj.y)})`, "#ffa657", { fontSize: 11.5, dy: 18 });
      LA.draw.dot(ctx, cam, proj, "#ffa657", 4);
    }

    // 两个主角向量
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.a, C.i, { width: 3.6, head: 12, label: "a" });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.b, C.w, { width: 3.6, head: 12, label: "b" });
    LA.draw.handle(ctx, cam, S.a, C.i, { hover: this._dragId === "a" || this._hoverId === "a" });
    LA.draw.handle(ctx, cam, S.b, C.w, { hover: this._dragId === "b" || this._hoverId === "b" });

    // 点积大字
    LA.draw.label(ctx, cam, { x: 0, y: 0 }, `a·b = ${LA.fmt2(d)}`, dCol,
      { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -46, fontSize: 17, bold: true });
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
    if (LA.hitHandle(sx, sy, cam, S.a, 20)) return mk("a");
    if (LA.hitHandle(sx, sy, cam, S.b, 20)) return mk("b");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">点积 a·b</div>
        <div class="big-det" id="s8big"></div>
        <div class="kv"><span class="k">含义</span><span class="v" id="s8mean"></span></div>
        <div class="kv"><span class="k">|a|·|b|·cosθ</span><span class="v" id="s8dec"></span></div>
        <div class="kv"><span class="k">夹角 θ</span><span class="v" id="s8ang"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">动手玩</div>
        <label class="chk"><input type="checkbox" id="s8p" ${S.showProj ? "checked" : ""}> 显示投影与垂线</label>
        <label class="chk"><input type="checkbox" id="s8a" ${S.showAngle ? "checked" : ""}> 显示夹角弧</label>
        <div class="btn-row">
          <button class="btn" id="s8perp">⊥ 摆成垂直</button>
          <button class="btn" id="s8opp">↔ 摆成反向</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          点积回答一个问题：<b>a 和 b 有多"方向一致"？</b><br><br>
          几何算法：<span class="hl-y">把 a 投影到 b 上，投影长度 × b 的长度</span>。<br><br>
          · 指向大致相同 → <span class="hl-g">正数</span><br>
          · <b>互相垂直 → 正好 0</b>（投影长度为零）<br>
          · 指向大致相反 → <span class="hl-r">负数</span><br><br>
          点积输出的是一个<b>数</b>，不是向量。它是"相似程度探测器"——
          机器学习里判断两个向量像不像，全靠它。<br><br>
          💡 拖着 a 绕 b 转一圈，看点积从正 → 0 → 负 的连续变化。
        </div>
      </div>`;
    this._panel = el;

    el.querySelector("#s8p").addEventListener("change", (e) => { S.showProj = e.target.checked; });
    el.querySelector("#s8a").addEventListener("change", (e) => { S.showAngle = e.target.checked; });
    el.querySelector("#s8perp").addEventListener("click", () => {
      const len = LA.v.len(S.a) || 2;
      const dir = LA.v.norm(S.a);
      S.b = { x: LA.snap(-dir.y * len), y: LA.snap(dir.x * len) };
      this.refreshPanel();
    });
    el.querySelector("#s8opp").addEventListener("click", () => {
      S.b = { x: LA.snap(-S.a.x), y: LA.snap(-S.a.y) };
      this.refreshPanel();
    });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const d = LA.v.dot(S.a, S.b);
    const la = LA.v.len(S.a), lb = LA.v.len(S.b);
    const cos = (la * lb) > 1e-9 ? LA.clamp(d / (la * lb), -1, 1) : 0;
    const big = el.querySelector("#s8big");
    big.textContent = LA.fmt2(d);
    big.style.color = Math.abs(d) < 0.02 ? "#8b98a9" : (d > 0 ? "#7ee787" : "#ff7b72");
    el.querySelector("#s8mean").textContent = Math.abs(d) < 0.02 ? "垂直！" : (d > 0 ? "方向一致" : "方向相反");
    el.querySelector("#s8dec").textContent = `${LA.fmt(la)} × ${LA.fmt(lb)} × ${LA.fmt(cos)}`;
    el.querySelector("#s8ang").textContent = (la * lb) > 1e-9 ? LA.fmt(Math.acos(cos) * 180 / Math.PI) + "°" : "—";
  },
});

/* ============================================================
 * 第 9 章 叉积：垂直于两者的新向量
 * ============================================================ */
LA.scenes.push({
  id: "cross", icon: "⨯", name: "叉积：垂直的新向量",
  tagline: "a×b：方向由右手定则，长度 = 平行四边形面积",
  newCam: () => null, // 用 LA.Cam3

  state: {
    a: { x: 2, y: 0, z: 0 },
    b: { x: 0, y: 2, z: 0 },
    order: "ab",            // "ab" | "ba"
    cam3: new LA.Cam3(),
    showPara: true,
  },

  init() {},

  draw(ctx, cam, app, t) {
    const w = cam.w, h = cam.h;
    const S = this.state;
    const c3 = S.cam3;
    const u = S.order === "ab" ? S.a : S.b;
    const v = S.order === "ab" ? S.b : S.a;
    const cross = {
      x: u.y * v.z - u.z * v.y,
      y: u.z * v.x - u.x * v.z,
      z: u.x * v.y - u.y * v.x,
    };
    const area = Math.hypot(cross.x, cross.y, cross.z);
    const O = { x: 0, y: 0, z: 0 };

    // 地面网格 z=0
    const R = 3;
    for (let k = -R; k <= R; k++) {
      c3.line(ctx, w, h, { x: k, y: -R, z: 0 }, { x: k, y: R, z: 0 }, "#1d2836", 1, .85);
      c3.line(ctx, w, h, { x: -R, y: k, z: 0 }, { x: R, y: k, z: 0 }, "#1d2836", 1, .85);
    }
    // 坐标轴
    c3.line(ctx, w, h, { x: -4, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }, "#2c3849", 1.3, .9);
    c3.line(ctx, w, h, { x: 0, y: -4, z: 0 }, { x: 0, y: 4, z: 0 }, "#2c3849", 1.3, .9);
    c3.line(ctx, w, h, { x: 0, y: 0, z: -3 }, { x: 0, y: 0, z: 3.5 }, "#2c3849", 1.3, .9, [4, 4]);

    // 张成平行四边形
    if (S.showPara && area > 1e-6) {
      const uv = { x: u.x + v.x, y: u.y + v.y, z: u.z + v.z };
      const pts = [O, u, uv, v].map((p) => c3.proj(p, w, h));
      ctx.save();
      ctx.beginPath();
      pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.fillStyle = "rgba(210,168,255,.14)"; ctx.fill();
      ctx.strokeStyle = "rgba(210,168,255,.55)"; ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]); ctx.stroke();
      ctx.restore();
    }

    // u、v 与叉积箭头
    c3.arrow(ctx, w, h, O, u, C.i, { width: 3.6 });
    c3.arrow(ctx, w, h, O, v, C.j, { width: 3.6 });
    if (area > 1e-6) {
      const tipScale = LA.clamp(area / 4, 0.35, 2.2) / (area || 1);
      c3.arrow(ctx, w, h, O, { x: cross.x * tipScale, y: cross.y * tipScale, z: cross.z * tipScale },
        "#d2a8ff", { width: 4, head: 13 });
      const tp = c3.proj({ x: cross.x * tipScale, y: cross.y * tipScale, z: cross.z * tipScale }, w, h);
      LA.draw.label(ctx, { w, h, toS: (p) => p }, tp,
        `${S.order === "ab" ? "a×b" : "b×a"}（面积 ${LA.fmt2(area)}）`, "#d2a8ff", { fontSize: 12.5, bold: true, dx: 12, dy: -12 });
    } else {
      const oScr = c3.proj(O, w, h);
      LA.draw.label(ctx, cam, oScr, "共线了！叉积 = 0（面积为零）", "#79b8ff",
        { screen: true, dx: 14, dy: -20, fontSize: 13, bold: true });
    }

    // 向量标签
    const ua = c3.proj(u, w, h), va = c3.proj(v, w, h);
    LA.draw.label(ctx, { w, h, toS: (p) => p }, ua, S.order === "ab" ? "a" : "b", C.i, { dx: 10, dy: -12, bold: true });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, va, S.order === "ab" ? "b" : "a", C.j, { dx: 10, dy: -12, bold: true });

    // 可拖拽端点光环
    [["u", u], ["v", v]].forEach(([id, p]) => {
      const s = c3.proj(p, w, h);
      ctx.save();
      ctx.strokeStyle = "#f0b429"; ctx.globalAlpha = (this._dragId === id || this._hoverId === id) ? .9 : .5;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });

    // 右手定则水印
    LA.draw.label(ctx, cam, { x: 14, y: h - 18 },
      S.order === "ab" ? "右手定则：食指 a → 中指 b → 拇指向上 = a×b" : "交换了顺序：b×a 指向正下方（a×b = −b×a）",
      "#5b6675", { screen: true, fontSize: 12 });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const cv = document.getElementById("cv");
    const w = cv._cssW, h = cv._cssH;
    const c3 = S.cam3;
    const mk = (id, vec) => ({
      id, cursor: "grab",
      // (p, cam2, sx, sy)：3D 场景没有 2D 相机，p 为 null，用屏幕坐标反投影
      drag: (p, cam2, sx, sy) => {
        const hit = c3.unprojectToPlane(sx, sy, w, h, vec.z);
        if (!hit) return;
        vec.x = LA.clamp(LA.snap(hit.x), -5, 5);
        vec.y = LA.clamp(LA.snap(hit.y), -5, 5);
        LA.app.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, { toS: (p) => S.cam3.proj(p, w, h) }, S.a, 22)) return mk("u", S.a);
    if (LA.hitHandle(sx, sy, { toS: (p) => S.cam3.proj(p, w, h) }, S.b, 22)) return mk("v", S.b);
    return null;
  },

  wantsOrbit() { return true; },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">叉积 a×b</div>
        <div class="kv"><span class="k" style="color:#d2a8ff">向量 a×b</span><span class="v" id="s9vec" style="color:#d2a8ff"></span></div>
        <div class="kv"><span class="k">|a×b| = 平行四边形面积</span><span class="v" id="s9area" style="font-size:16px"></span></div>
        <div class="kv"><span class="k">a·b（点积）</span><span class="v" id="s9dot"></span></div>
        <div class="kv"><span class="k">夹角 θ</span><span class="v" id="s9ang"></span></div>
        <div class="btn-row">
          <button class="btn" id="s9swap">🔄 交换成 b×a</button>
          <button class="btn" id="s9view">重置视角</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">把向量抬离地面</div>
        <div class="kv"><span class="k">a 的 z 分量</span><span class="v" id="s9azv">0</span></div>
        <input type="range" id="s9az" min="-3" max="3" step="0.1" value="${S.a.z}">
        <div class="kv" style="margin-top:6px"><span class="k">b 的 z 分量</span><span class="v" id="s9bzv">0</span></div>
        <input type="range" id="s9bz" min="-3" max="3" step="0.1" value="${S.b.z}">
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          叉积和点积完全相反：<b>输入两个向量，输出一个新的向量</b>。<br><br>
          · <b>方向</b>：垂直于 a 和 b 张成的平面（四指从 a 卷向 b，拇指指向就是 a×b —— 右手定则）<br>
          · <b>长度</b> = a、b 张成的<b>平行四边形面积</b><br><br>
          所以：a、b 共线 → 张不成面积 → 叉积 = <b>0</b>；
          a、b 垂直 → 面积最大 = |a||b|。<br><br>
          ⚠️ 顺序有方向：<span class="hl-y">a×b = −b×a</span>。点"交换顺序"看它掉头朝下。<br><br>
          💡 拖动金色端点（在地面内移动），再用滑杆把 a 或 b 抬起来 ——
          叉积向量会跟着倾斜、变长变短，永远垂直于两者。
        </div>
      </div>`;
    this._panel = el;

    el.querySelector("#s9swap").addEventListener("click", () => {
      S.order = S.order === "ab" ? "ba" : "ab";
      el.querySelector("#s9swap").textContent = S.order === "ab" ? "🔄 交换成 b×a" : "🔄 交换成 a×b";
      this.refreshPanel();
    });
    el.querySelector("#s9view").addEventListener("click", () => {
      S.cam3 = new LA.Cam3();
    });
    el.querySelector("#s9az").addEventListener("input", (e) => {
      S.a.z = parseFloat(e.target.value);
      el.querySelector("#s9azv").textContent = LA.fmt(S.a.z);
      this.refreshPanel();
    });
    el.querySelector("#s9bz").addEventListener("input", (e) => {
      S.b.z = parseFloat(e.target.value);
      el.querySelector("#s9bzv").textContent = LA.fmt(S.b.z);
      this.refreshPanel();
    });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const u = S.order === "ab" ? S.a : S.b;
    const v = S.order === "ab" ? S.b : S.a;
    const cr = {
      x: u.y * v.z - u.z * v.y,
      y: u.z * v.x - u.x * v.z,
      z: u.x * v.y - u.y * v.x,
    };
    const area = Math.hypot(cr.x, cr.y, cr.z);
    const f3 = (p) => `(${LA.fmt(p.x)}, ${LA.fmt(p.y)}, ${LA.fmt(p.z)})`;
    el.querySelector("#s9vec").textContent = f3(cr);
    el.querySelector("#s9area").textContent = LA.fmt2(area);
    const d = u.x * v.x + u.y * v.y + u.z * v.z;
    el.querySelector("#s9dot").textContent = LA.fmt2(d);
    const lu = Math.hypot(u.x, u.y, u.z), lv = Math.hypot(v.x, v.y, v.z);
    el.querySelector("#s9ang").textContent = (lu * lv) > 1e-9
      ? LA.fmt(Math.acos(LA.clamp(d / (lu * lv), -1, 1)) * 180 / Math.PI) + "°" : "—";
  },
});

/* ============================================================
 * 第 10 章 线性方程组：两条直线的交点 = 列的配方
 * ============================================================ */
LA.scenes.push({
  id: "systems", icon: "⚖", name: "线性方程组：交点在哪",
  tagline: "Ax = b：行视图找交点，列视图找配方",
  newCam: () => new LA.Cam2D(70),

  state: {
    A: { a: 2, b: 1, c: 1, d: 2 },
    b: { x: 4, y: 5 },
    showRows: true,
    showCols: true,
    showStruct: true,
  },

  solution() {
    const S = this.state, { a, b, c, d } = S.A;
    const det = LA.det2(S.A);
    if (Math.abs(det) < 1e-7) return null;
    return { x: (S.b.x * d - b * S.b.y) / det, y: (a * S.b.y - S.b.x * c) / det };
  },

  status() {
    const S = this.state, { a, b, c, d } = S.A;
    const det = LA.det2(S.A);
    if (Math.abs(det) > 1e-7) return { kind: "unique" };
    // 增广行 (a,b,bx) × (c,d,by) 全为零 → 两行相同 → 无穷多解
    const cx = b * S.b.y - S.b.x * d, cy = S.b.x * c - a * S.b.y;
    if (Math.abs(cx) < 1e-6 && Math.abs(cy) < 1e-6) return { kind: "infinite" };
    return { kind: "none" };
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const st = this.status();
    const sol = this.solution();

    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a", width: 1.5 });

    // 行视图：两条方程直线
    const drawRow = (p, q, rhs, color, dashed) => {
      // p·X + q·Y = rhs
      const R = 60;
      if (Math.abs(q) > 1e-9) {
        LA.draw.line(ctx, cam, { x: -R, y: (rhs - p * -R) / q }, { x: R, y: (rhs - p * R) / q }, color, { width: 2.2, dash: dashed ? [7, 5] : null });
      } else if (Math.abs(p) > 1e-9) {
        LA.draw.line(ctx, cam, { x: rhs / p, y: -R }, { x: rhs / p, y: R }, color, { width: 2.2, dash: dashed ? [7, 5] : null });
      }
    };
    if (S.showRows) {
      drawRow(S.A.a, S.A.b, S.b.x, "#79b8ff");
      drawRow(S.A.c, S.A.d, S.b.y, "#d2a8ff", st.kind === "infinite");
    }

    // 列视图：解作为配方 x·î′ + y·ĵ′ = b
    if (S.showCols && sol) {
      const c1 = LA.col1(S.A), c2 = LA.col2(S.A);
      const p1 = LA.v.scale(c1, sol.x);
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, p1, C.i, { width: 2.4, alpha: .8, noHead: Math.abs(sol.y) < 1e-9 });
      if (Math.abs(sol.y) > 1e-9)
        LA.draw.arrow(ctx, cam, p1, S.b, C.j, { width: 2.4, alpha: .8 });
      LA.draw.label(ctx, cam, LA.v.scale(p1, 0.5), `${LA.fmt(sol.x)}·î′`, C.i, { fontSize: 11 });
    }

    // 交点（唯一解）
    if (st.kind === "unique" && sol) {
      const s = cam.toS(sol);
      const pulse = 12 + Math.sin(t * 3) * 3;
      ctx.save();
      ctx.strokeStyle = "rgba(240,180,41,.55)"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(s.x, s.y, pulse + 6, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      LA.draw.dot(ctx, cam, sol, "#f0b429", 6, { stroke: "#10141b" });
      LA.draw.label(ctx, cam, sol, `交点 = (${LA.fmt(sol.x)}, ${LA.fmt(sol.y)})`, "#f0b429", { bold: true, dy: -30, dx: 10 });
    }

    // b 向量 + 可拖拽端点
    if (S.showCols) {
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.b, C.v, { width: 3, head: 11, alpha: .9 });
      LA.draw.label(ctx, cam, S.b, "b", C.v, { dy: -24 });
    }
    const c1 = LA.col1(S.A), c2 = LA.col2(S.A);
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3.2, head: 11, alpha: .95 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3.2, head: 11, alpha: .95 });
    LA.draw.handle(ctx, cam, c1, C.i, { hover: this._dragId === "c1" || this._hoverId === "c1" });
    LA.draw.handle(ctx, cam, c2, C.j, { hover: this._dragId === "c2" || this._hoverId === "c2" });
    LA.draw.handle(ctx, cam, S.b, C.v, { hover: this._dragId === "b" || this._hoverId === "b" });

    // 解的结构（无穷多解时）：通解 = 特解 + 齐次解（核的平移）
    if (st.kind === "infinite" && S.showStruct) {
      const { a, b, c, d } = S.A;
      let x0 = null;
      if (Math.abs(a) > 1e-6) x0 = { x: S.b.x / a, y: 0 };
      else if (Math.abs(b) > 1e-6) x0 = { x: 0, y: S.b.x / b };
      else if (Math.abs(c) > 1e-6) x0 = { x: S.b.y / c, y: 0 };
      else if (Math.abs(d) > 1e-6) x0 = { x: 0, y: S.b.y / d };
      let kdir = null;
      if (Math.abs(a) + Math.abs(b) > 1e-6) kdir = LA.v.norm({ x: b, y: -a });
      else if (Math.abs(c) + Math.abs(d) > 1e-6) kdir = LA.v.norm({ x: d, y: -c });
      if (x0 && kdir) {
        const R = (Math.max(cam.w, cam.h) / cam.ppu) * 1.5;
        // 齐次解空间：过原点的核线
        LA.draw.spanLine(ctx, cam, kdir, "rgba(86,212,221,.6)", { width: 2 });
        LA.draw.label(ctx, cam, LA.v.scale(kdir, 4.6), "齐次解 Ax=0（子空间，过原点）", "#56d4dd", { fontSize: 11.5, bold: true });
        // 通解：过 x₀ 的平行线（仿射，不过原点）
        const p1 = LA.v.add(x0, LA.v.scale(kdir, -R));
        const p2 = LA.v.add(x0, LA.v.scale(kdir, R));
        LA.draw.line(ctx, cam, p1, p2, "#ffa657", { width: 3 });
        LA.draw.dot(ctx, cam, x0, "#f0b429", 6, { stroke: "#10141b" });
        LA.draw.label(ctx, cam, x0, "特解 x₀", "#f0b429", { bold: true, fontSize: 12, dy: -26, dx: 8 });
        LA.draw.label(ctx, cam, p2, "全部解：x₀ + t·ξ（不过原点 → 不是子空间）", "#ffa657", { fontSize: 12, bold: true });
        LA.draw.arrow(ctx, cam, x0, LA.v.add(x0, LA.v.scale(kdir, 1.2)), "rgba(255,166,87,.8)", { width: 1.8, head: 8 });
      }
    }

    if (st.kind !== "unique") {
      const msg = st.kind === "none"
        ? "det = 0：两条直线平行 → 无解！"
        : "det = 0：两条直线重合 → 无穷多解！";
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, msg, st.kind === "none" ? "#ff7b72" : "#79b8ff",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -46, fontSize: 14, bold: true });
    }
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const mk = (id, keys) => ({
      id, cursor: "grab",
      drag: (p) => {
        if (id === "b") { S.b = clampCol(p); }
        else { const q = clampCol(p); S.A[keys[0]] = q.x; S.A[keys[1]] = q.y; }
        LA.app.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, cam, LA.col1(S.A), 20)) return mk("c1", ["a", "c"]);
    if (LA.hitHandle(sx, sy, cam, LA.col2(S.A), 20)) return mk("c2", ["b", "d"]);
    if (LA.hitHandle(sx, sy, cam, S.b, 18)) return mk("b");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">方程组（拖 î′、ĵ′ 或 b 试试）</div>
        <div class="mx-caption">矩阵 <b>A</b>（系数）</div>
        ${LA.ui.mat2HTML("s10m", S.A)}
        <div class="mx-caption" style="margin-top:8px">向量 <b>b</b>（等号右边）</div>
        <div style="display:flex; gap:6px; width:160px">
          <input type="number" step="0.5" id="s10bx" value="${LA.fmt2(S.b.x)}">
          <input type="number" step="0.5" id="s10by" value="${LA.fmt2(S.b.y)}">
        </div>
        <div class="btn-row">
          <button class="btn" data-p="unique">唯一解</button>
          <button class="btn" data-p="none">无解(平行)</button>
          <button class="btn" data-p="infinite">无穷解(重合)</button>
        </div>
        <label class="chk" style="margin-top:4px"><input type="checkbox" id="s10r" ${S.showRows ? "checked" : ""}> 行视图：两条方程直线</label>
        <label class="chk"><input type="checkbox" id="s10st" ${S.showStruct ? "checked" : ""}> 解的结构（无穷解时：特解 + 齐次解）</label>
        <label class="chk"><input type="checkbox" id="s10c" ${S.showCols ? "checked" : ""}> 列视图：解 = 配方系数</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">此时此刻</div>
        <div class="big-det" id="s10sol"></div>
        <div class="kv"><span class="k">det A</span><span class="v" id="s10det"></span></div>
        <div class="kv"><span class="k">解的状态</span><span class="v" id="s10stat"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          "解方程组" 有两种几何读法：<br><br>
          <b>行视图</b>：每行方程是一条直线，解 = <span class="hl-y">交点</span>。
          拖动 <span class="hl-g">î′</span>、<span class="hl-r">ĵ′</span> 改变系数，看直线怎么转、交点怎么跑。<br><br>
          <b>列视图</b>：Ax = b 在问"<b>î′ 和 ĵ′ 按什么比例混合，才能拼出 b？</b>"
          解就是那两个比例系数 x、y。<br><br>
          det = 0（列共线）时：<br>
          · b 在这条线外 → <span class="hl-r">无解</span>（平行线）<br>
          · b 在这条线上 → <span class="hl-b">无穷多解</span>（怎么混都行）<br><br>
          这就是为什么"除以 det"（逆矩阵）在 det=0 时失效。
        </div>
      </div>`;
    this._panel = el;

    LA.ui.mat2Bind(el, "s10m", (M) => { Object.assign(S.A, M); this.refreshPanel(); });
    el.querySelector("#s10bx").addEventListener("input", (e) => {
      const v = parseFloat(e.target.value); if (isFinite(v)) S.b.x = v; this.refreshPanel();
    });
    el.querySelector("#s10by").addEventListener("input", (e) => {
      const v = parseFloat(e.target.value); if (isFinite(v)) S.b.y = v; this.refreshPanel();
    });
    el.querySelector("#s10r").addEventListener("change", (e) => { S.showRows = e.target.checked; });
    el.querySelector("#s10st").addEventListener("change", (e) => { S.showStruct = e.target.checked; });
    el.querySelector("#s10c").addEventListener("change", (e) => { S.showCols = e.target.checked; });
    const presets = {
      unique: { A: { a: 2, b: 1, c: 1, d: 2 }, b: { x: 4, y: 5 } },
      none: { A: { a: 1, b: 2, c: 2, d: 4 }, b: { x: 3, y: 5 } },
      infinite: { A: { a: 1, b: 2, c: 2, d: 4 }, b: { x: 3, y: 6 } },
    };
    el.querySelectorAll("[data-p]").forEach((btn) => btn.addEventListener("click", () => {
      const p = presets[btn.dataset.p];
      Object.assign(S.A, p.A);
      S.b = { ...p.b };
      this.refreshPanel();
    }));
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    LA.ui.setMat2(el, "s10m", S.A);
    setNumSafe(el.querySelector("#s10bx"), S.b.x);
    setNumSafe(el.querySelector("#s10by"), S.b.y);
    const st = this.status(), sol = this.solution();
    const solEl = el.querySelector("#s10sol");
    if (sol) {
      solEl.textContent = `x = ${LA.fmt2(sol.x)}, y = ${LA.fmt2(sol.y)}`;
      solEl.style.color = "#f0b429";
    } else {
      solEl.textContent = st.kind === "none" ? "无解" : "x, y 有无穷多种";
      solEl.style.color = st.kind === "none" ? "#ff7b72" : "#79b8ff";
    }
    const det = LA.det2(S.A);
    const detEl = el.querySelector("#s10det");
    detEl.textContent = LA.fmt2(det);
    detEl.style.color = Math.abs(det) < 1e-7 ? "#ff7b72" : "#e6edf3";
    const stat = el.querySelector("#s10stat");
    stat.textContent = st.kind === "unique" ? "唯一解（直线相交）" : st.kind === "none" ? "无解（直线平行）" : "无穷多解（直线重合）";
    stat.style.color = st.kind === "unique" ? "#7ee787" : st.kind === "none" ? "#ff7b72" : "#79b8ff";
  },
});

/* ============================================================
 * 第 11 章 逆矩阵：撤销一次变换
 * ============================================================ */
LA.scenes.push({
  id: "inverse", icon: "↺", name: "逆矩阵：撤销变换",
  tagline: "A⁻¹A = I：先 A 后 A⁻¹，一切回到原样",
  newCam: () => new LA.Cam2D(70),

  state: {
    A: { a: 1.5, b: 0.5, c: 0.5, d: 1 },
    bVec: { x: 2, y: 1.5 },
    anim: makeAnim(true),
    playing: false, playT0: 0,
    showInvGrid: false,   // 默认关：双网格叠加太密，勾选后再对比
  },

  inv() {
    const det = LA.det2(this.state.A);
    if (Math.abs(det) < 1e-7) return null;
    const S = this.state.A;
    return { a: S.d / det, b: -S.b / det, c: -S.c / det, d: S.a / det };
  },

  changed(now) { matrixChanged(this.state.anim, this.state.A, now); },

  M_eff(now) {
    const S = this.state;
    if (S.playing) {
      const inv = this.inv();
      if (!inv) { S.playing = false; return S.A; }
      const t = LA.clamp((now - S.playT0) / 2.0, 0, 1);
      if (t >= 1) S.playing = false;
      // 前半段 A → I（撤销），后半段 I → A⁻¹（反向再做一遍）
      return t < 0.5
        ? LA.lerp2(S.A, LA.ident2(), LA.ease(t * 2))
        : LA.lerp2(LA.ident2(), inv, LA.ease((t - 0.5) * 2));
    }
    return effM(S.anim, S.A, now);
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const inv = this.inv();
    const singular = !inv;
    const Mdisp = this.M_eff(t);

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });

    // 逆变换网格（琥珀色）
    if (!singular && S.showInvGrid && !S.playing) {
      LA.draw.grid(ctx, cam, { matrix: inv, color: "#4a3b22", width: 1.1, emphasis: "#7a6136" });
      LA.draw.axes(ctx, cam, { matrix: inv, color: "#6b5530", width: 1.5 });
    }
    // 正变换网格（播放撤销动画时显示中间态）
    LA.draw.grid(ctx, cam, { matrix: Mdisp, color: "#2c4470", width: 1.2, emphasis: "#4a6ba6" });
    LA.draw.axes(ctx, cam, { matrix: Mdisp, color: "#4f6fa5", width: 1.7 });

    const c1 = LA.col1(S.A), c2 = LA.col2(S.A);
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3.2, head: 11 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3.2, head: 11 });
    LA.draw.handle(ctx, cam, c1, C.i, { hover: this._dragId === "c1" || this._hoverId === "c1" });
    LA.draw.handle(ctx, cam, c2, C.j, { hover: this._dragId === "c2" || this._hoverId === "c2" });

    if (!singular) {
      // v = A⁻¹b：经过 A 变成 b 的那个"原始向量"
      const v = LA.apply2(inv, S.bVec);
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, v, "#d2a8ff", { width: 3.2, head: 12 });
      LA.draw.label(ctx, cam, v, `v = A⁻¹b (${LA.fmt(v.x)}, ${LA.fmt(v.y)})`, "#d2a8ff", { bold: true, dy: -26, dx: 8 });
      LA.draw.handle(ctx, cam, v, "#d2a8ff", { hover: false });
      // 弧线 v → b（表示 A 把 v 送到 b）
      const mid = LA.v.scale(LA.v.add(v, S.bVec), 0.55);
      const n = LA.v.norm({ x: -(S.bVec.y - v.y), y: S.bVec.x - v.x });
      const ctrl = LA.v.add(mid, LA.v.scale(n, LA.v.dist(v, S.bVec) * 0.25));
      ctx.save();
      ctx.strokeStyle = "rgba(255,215,94,.5)"; ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      const p0 = cam.toS(v), pc = cam.toS(ctrl), p1 = cam.toS(S.bVec);
      ctx.moveTo(p0.x, p0.y); ctx.quadraticCurveTo(pc.x, pc.y, p1.x, p1.y);
      ctx.stroke();
      ctx.restore();
    }

    // b（金色，可拖拽）
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.bVec, C.v, { width: 3.4, head: 12 });
    LA.draw.label(ctx, cam, S.bVec, "b", C.v, { dy: -26 });
    LA.draw.handle(ctx, cam, S.bVec, C.v, { hover: this._dragId === "b" || this._hoverId === "b" });

    if (singular) {
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "det = 0：变换把平面压扁了 → 信息丢失，不可逆！",
        "#ff7b72", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 14, bold: true });
    }
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const inv = this.inv();
    const mkCol = (id, keys) => ({
      id, cursor: "grab",
      drag: (p) => {
        const q = clampCol(p);
        S.A[keys[0]] = q.x; S.A[keys[1]] = q.y;
        this.changed(LA.app.now());
        this.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, cam, LA.col1(S.A), 20)) return mkCol("c1", ["a", "c"]);
    if (LA.hitHandle(sx, sy, cam, LA.col2(S.A), 20)) return mkCol("c2", ["b", "d"]);
    if (LA.hitHandle(sx, sy, cam, S.bVec, 18)) return {
      id: "b", cursor: "grab",
      drag: (p) => { S.bVec = clampCol(p); this.refreshPanel(); },
    };
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">矩阵 A（拖端点 / 输入）</div>
        ${LA.ui.mat2HTML("s11m", S.A)}
        <div class="btn-row">
          <button class="btn primary" id="s11play">▶ 播放"撤销"动画</button>
          <button class="btn" data-p="singular">💥 变成奇异矩阵</button>
          <button class="btn" data-p="rot">↻ 旋转45°</button>
        </div>
        <label class="chk" style="margin-top:4px"><input type="checkbox" id="s11show" ${S.showInvGrid ? "checked" : ""}> 显示 A⁻¹ 的网格（琥珀色）</label>
        <label class="chk"><input type="checkbox" id="s11anim" ${S.anim.on ? "checked" : ""}> 编辑时平滑动画</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">此时此刻</div>
        <div class="kv"><span class="k">det A</span><span class="v" id="s11det"></span></div>
        <div class="mx-caption" style="margin-top:6px">逆矩阵 <b>A⁻¹</b></div>
        <div id="s11inv"></div>
        <div class="kv" style="margin-top:6px"><span class="k">验证 A⁻¹A</span><span class="v" id="s11check"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          逆矩阵就是<b>"撤销键"</b>：A 把空间拧成什么样，A⁻¹ 就精确地拧回来。<br><br>
          <span class="hl-y">A⁻¹A = I</span>：先做 A 再做 A⁻¹，每个向量都回到原地。<br><br>
          金色向量 <b>b</b> 是变换后的结果；紫色向量 <b>v = A⁻¹b</b> 是"它原来是谁"。
          拖动 b，看 v 沿着虚线弧被 A 送到 b。<br><br>
          求解方程组也靠它：<span class="hl-y">x = A⁻¹b</span>（上一章的交点就是这么算的）。<br><br>
          ⚠️ 但<b>压扁不可撤销</b>：det = 0 时无数个点挤成一个，信息已经丢失，
          谁也说不清它原来是谁 —— 所以奇异矩阵没有逆。
          点 💥 亲眼看看失效的瞬间。
        </div>
      </div>`;
    this._panel = el;

    LA.ui.mat2Bind(el, "s11m", (M) => {
      Object.assign(S.A, M);
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    el.querySelector("#s11play").addEventListener("click", () => {
      if (!this.inv()) { LA.app.toast("矩阵不可逆，无法撤销！先把 det 改成不为 0"); return; }
      S.playing = true; S.playT0 = LA.app.now();
    });
    el.querySelector("#s11show").addEventListener("change", (e) => { S.showInvGrid = e.target.checked; });
    el.querySelector("#s11anim").addEventListener("change", (e) => { S.anim.on = e.target.checked; });
    el.querySelector('[data-p="singular"]').addEventListener("click", () => {
      Object.assign(S.A, { a: 1, b: 2, c: 2, d: 4 });
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    el.querySelector('[data-p="rot"]').addEventListener("click", () => {
      Object.assign(S.A, { a: 0.71, b: -0.71, c: 0.71, d: 0.71 });
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const det = LA.det2(S.A);
    const inv = this.inv();
    const detEl = el.querySelector("#s11det");
    detEl.textContent = LA.fmt2(det);
    detEl.style.color = Math.abs(det) < 1e-7 ? "#ff7b72" : "#7ee787";
    const invBox = el.querySelector("#s11inv");
    if (!invBox.dataset.built) {
      invBox.innerHTML = LA.ui.mat2HTML("s11inv", LA.ident2(), { readonly: true, cls: "readonly" });
      invBox.dataset.built = "1";
    }
    if (inv) {
      LA.ui.setMat2(el, "s11inv", inv);
      const back = LA.mul2(inv, S.A);
      const ok = Math.abs(back.a - 1) < 1e-6 && Math.abs(back.d - 1) < 1e-6 &&
        Math.abs(back.b) < 1e-6 && Math.abs(back.c) < 1e-6;
      el.querySelector("#s11check").innerHTML = ok
        ? `<span style="color:#7ee787">A⁻¹A = I ✓</span>`
        : LA.ui.mat2Chip(back, "#8b98a9");
    } else {
      LA.ui.setMat2(el, "s11inv", LA.ident2());
      el.querySelector("#s11check").innerHTML = `<span style="color:#ff7b72">不存在（det = 0）</span>`;
    }
    LA.ui.setMat2(el, "s11m", S.A);
  },
});
