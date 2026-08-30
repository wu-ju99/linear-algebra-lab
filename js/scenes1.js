/* =========================================================
 * scenes1.js —— 第1~3章：向量 / 矩阵即变换 / 行列式
 * 场景接口：{ id, icon, name, tagline, newCam(), init(app),
 *            mountPanel(el,app), refreshPanel(app),
 *            draw(ctx,cam,app,t), hitTest(sx,sy,cam) }
 * ========================================================= */
"use strict";
LA.scenes = [];

/* ---------- 公共：矩阵变化时的平滑动画 ---------- */
function makeAnim(on) { return { on, from: LA.ident2(), t0: -1, dur: 0.65 }; }
function effM(anim, M, now) {
  if (!anim.on || anim.t0 < 0) return M;
  const t = LA.clamp((now - anim.t0) / anim.dur, 0, 1);
  return LA.lerp2(anim.from, M, LA.ease(t));
}
function matrixChanged(anim, M, now) {
  if (anim.on) { anim.from = effM(anim, M, now); anim.t0 = now; }
}
function clampCol(p) {
  return { x: LA.clamp(LA.snap(p.x), -10, 10), y: LA.clamp(LA.snap(p.y), -10, 10) };
}

const C = {
  i: "#7ee787", j: "#ff7b72", v: "#ffd75e", w: "#79b8ff",
  sum: "#ffa657", kv: "#d2a8ff", gold: "#f0b429", grid: "#2c4470",
};

/* ============================================================
 * 第 1 章 向量实验室
 * ============================================================ */
LA.scenes.push({
  id: "vectors", icon: "➜", name: "向量：空间中的箭头",
  tagline: "向量 = 缩放基向量再相加",
  newCam: () => new LA.Cam2D(78),

  state: {
    v: { x: 2, y: 1 },
    w: { x: -1, y: 2 },
    k: 1.5,
    showComponents: true,
    showSum: true,
    showK: false,
  },

  init() {},

  draw(ctx, cam, app, t) {
    const S = this.state;
    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a", width: 1.5 });

    // 基向量
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, { x: 1, y: 0 }, C.i, { width: 3, label: "î", head: 10 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, { x: 0, y: 1 }, C.j, { width: 3, label: "ĵ", head: 10 });

    // 加法：平行四边形
    if (S.showSum) {
      const sum = LA.v.add(S.v, S.w);
      LA.draw.poly(ctx, cam, [{ x: 0, y: 0 }, S.v, sum, S.w], "rgba(255,166,87,.07)", "rgba(255,166,87,.35)", { dash: [5, 5], width: 1.2 });
      LA.draw.arrow(ctx, cam, S.v, sum, C.w, { width: 2, dash: [6, 5], alpha: .8, noHead: true });
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, sum, C.sum, { width: 3, label: `v+w = (${LA.fmt(sum.x)}, ${LA.fmt(sum.y)})`, head: 11 });
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.w, C.w, { width: 3, label: "w", head: 11 });
    }

    // k·v
    if (S.showK) {
      const kv = LA.v.scale(S.v, S.k);
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, kv, C.kv, { width: 2.5, dash: [2, 3], label: `${LA.fmt(S.k)}·v`, head: 10, alpha: .9 });
    }

    // v 的分量投影
    if (S.showComponents) {
      LA.draw.line(ctx, cam, S.v, { x: S.v.x, y: 0 }, "rgba(126,231,135,.5)", { dash: [4, 4], width: 1.2 });
      LA.draw.line(ctx, cam, S.v, { x: 0, y: S.v.y }, "rgba(255,123,114,.5)", { dash: [4, 4], width: 1.2 });
      LA.draw.dot(ctx, cam, { x: S.v.x, y: 0 }, "rgba(126,231,135,.8)", 3);
      LA.draw.dot(ctx, cam, { x: 0, y: S.v.y }, "rgba(255,123,114,.8)", 3);
    }

    // 主角 v
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.v, C.v, { width: 3.8, head: 13 });
    LA.draw.label(ctx, cam, S.v, `v = (${LA.fmt(S.v.x)}, ${LA.fmt(S.v.y)})`, C.v, { bold: true, dy: -30, dx: 8 });
    LA.draw.handle(ctx, cam, S.v, C.v, { hover: this._dragId === "v" || this._hoverId === "v" });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    if (LA.hitHandle(sx, sy, cam, S.v, 20)) return {
      id: "v", cursor: "grab",
      drag: (p) => { S.v = clampCol(p); LA.app.refreshPanel(); },
    };
    if (S.showSum && LA.hitHandle(sx, sy, cam, S.w, 18)) return {
      id: "w", cursor: "grab",
      drag: (p) => { S.w = clampCol(p); LA.app.refreshPanel(); },
    };
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">此时此刻</div>
        <div class="kv"><span class="k" style="color:${C.v}">v</span><span class="v" id="s1v"></span></div>
        <div class="kv"><span class="k" style="color:${C.w}">w</span><span class="v" id="s1w"></span></div>
        <div class="kv"><span class="k" style="color:${C.sum}">v + w</span><span class="v" id="s1sum"></span></div>
        <div class="kv"><span class="k">|v| 长度</span><span class="v" id="s1len"></span></div>
        <div class="kv"><span class="k">v 的方向角</span><span class="v" id="s1ang"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">动手玩</div>
        <label class="chk"><input type="checkbox" id="s1c1" ${S.showComponents ? "checked" : ""}> 分量投影（v 的 x、y 从哪来）</label>
        <label class="chk"><input type="checkbox" id="s1c2" ${S.showSum ? "checked" : ""}> 向量加法 v+w（平行四边形法则）</label>
        <label class="chk"><input type="checkbox" id="s1c3" ${S.showK ? "checked" : ""}> 标量乘法 k·v</label>
        <div style="margin-top:6px">
          <div class="kv"><span class="k">系数 k</span><span class="v" id="s1kv">1.5</span></div>
          <input type="range" id="s1k" min="-2" max="2" step="0.1" value="${S.k}">
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          平面上的每个向量，都只是对基向量的一份"走步指令"：<br>
          <span class="hl-y">v = (2, 1)</span> 的意思是 ——
          先沿 <span class="hl-g">î</span> 方向走 2 步，再沿 <span class="hl-r">ĵ</span> 方向走 1 步。<br><br>
          所以 <b>加法</b> 就是把两份指令接在一起走；
          <b>数乘</b> 就是把每一步的步长放大 k 倍。<br><br>
          💡 试着把 w 拖到和 v 同一条直线上 —— 这就是"线性相关"：w 不再提供任何新方向。
        </div>
      </div>`;
    el.querySelector("#s1c1").addEventListener("change", (e) => { S.showComponents = e.target.checked; });
    el.querySelector("#s1c2").addEventListener("change", (e) => { S.showSum = e.target.checked; });
    el.querySelector("#s1c3").addEventListener("change", (e) => { S.showK = e.target.checked; });
    el.querySelector("#s1k").addEventListener("input", (e) => {
      S.k = parseFloat(e.target.value);
      el.querySelector("#s1kv").textContent = LA.fmt(S.k);
    });
    this._panel = el;
    this.refreshPanel(app);
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const sum = LA.v.add(S.v, S.w);
    el.querySelector("#s1v").textContent = `(${LA.fmt(S.v.x)}, ${LA.fmt(S.v.y)})`;
    el.querySelector("#s1w").textContent = `(${LA.fmt(S.w.x)}, ${LA.fmt(S.w.y)})`;
    el.querySelector("#s1sum").textContent = `(${LA.fmt(sum.x)}, ${LA.fmt(sum.y)})`;
    el.querySelector("#s1len").textContent = LA.fmt(LA.v.len(S.v));
    el.querySelector("#s1ang").textContent = LA.fmt(Math.atan2(S.v.y, S.v.x) * 180 / Math.PI) + "°";
  },
});

/* ============================================================
 * 第 2 章 矩阵即变换（核心章节）
 * ============================================================ */
const PRESETS2 = [
  { name: "恒等", M: { a: 1, b: 0, c: 0, d: 1 } },
  { name: "旋转90°", M: { a: 0, b: -1, c: 1, d: 0 } },
  { name: "旋转45°", M: { a: 0.71, b: -0.71, c: 0.71, d: 0.71 } },
  { name: "放大×2", M: { a: 2, b: 0, c: 0, d: 2 } },
  { name: "剪切", M: { a: 1, b: 1, c: 0, d: 1 } },
  { name: "反射(y轴)", M: { a: -1, b: 0, c: 0, d: 1 } },
  { name: "压扁投影", M: { a: 1, b: 0, c: 0, d: 0 } },
];

LA.scenes.push({
  id: "transform", icon: "✥", name: "矩阵：空间的运动",
  tagline: "矩阵的两列 = î 和 ĵ 的落点",
  newCam: () => new LA.Cam2D(72),

  state: {
    M: { a: 1, b: 1, c: 0.5, d: 1 },
    v: { x: 1.5, y: 0.5 },
    anim: makeAnim(true),
    showCombo: true,
    showOriginal: true,
  },

  init() {},

  M_eff(now) { return effM(this.state.anim, this.state.M, now); },

  changed(now) { matrixChanged(this.state.anim, this.state.M, now); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const M = this.M_eff(t);
    const c1 = LA.col1(M), c2 = LA.col2(M);

    if (S.showOriginal) {
      LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
      LA.draw.axes(ctx, cam, { color: "#28344a" });
    }
    LA.draw.grid(ctx, cam, { matrix: M, color: C.grid, width: 1.2, emphasis: "#4a6ba6" });
    LA.draw.axes(ctx, cam, { matrix: M, color: "#52709f", width: 1.8 });

    const Av = LA.apply2(M, S.v);

    // 列分解：Av = vx·î′ + vy·ĵ′（头尾相接）
    if (S.showCombo) {
      const p1 = LA.v.scale(c1, S.v.x);
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, p1, C.i, { width: 2.2, alpha: .75, noHead: S.v.y !== 0 });
      if (Math.abs(S.v.y) > 1e-9)
        LA.draw.arrow(ctx, cam, p1, Av, C.j, { width: 2.2, alpha: .75 });
      LA.draw.label(ctx, cam, LA.v.scale(p1, 0.5), `${LA.fmt(S.v.x)}·î′`, C.i, { fontSize: 11, alpha: 1 });
    }

    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, Av, C.sum, { width: 3.2, head: 12 });
    LA.draw.label(ctx, cam, Av, `Av = (${LA.fmt(Av.x)}, ${LA.fmt(Av.y)})`, C.sum, { bold: true, dy: -28, dx: 8 });
    LA.draw.dot(ctx, cam, Av, C.sum, 4);

    // 基向量 + 拖拽点
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3.6, head: 12, label: `î′=(${LA.fmt(M.a)}, ${LA.fmt(M.c)})` });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3.6, head: 12, label: `ĵ′=(${LA.fmt(M.b)}, ${LA.fmt(M.d)})` });
    LA.draw.handle(ctx, cam, c1, C.i, { hover: this._dragId === "c1" || this._hoverId === "c1" });
    LA.draw.handle(ctx, cam, c2, C.j, { hover: this._dragId === "c2" || this._hoverId === "c2" });

    // 原向量 v（虚影）
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.v, "rgba(255,215,94,.45)", { width: 2, dash: [4, 4], head: 9 });
    LA.draw.handle(ctx, cam, S.v, C.v, { hover: this._dragId === "v" || this._hoverId === "v" });
    LA.draw.label(ctx, cam, S.v, "v", C.v, { dy: -26 });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const app2 = LA.app;
    const M = this.M_eff(app2.now());
    const c1 = LA.col1(M), c2 = LA.col2(M);
    if (LA.hitHandle(sx, sy, cam, c1, 20)) return {
      id: "c1", cursor: "grab",
      drag: (p) => { const q = clampCol(p); S.M.a = q.x; S.M.c = q.y; this.changed(app2.now()); LA.app.refreshPanel(); },
    };
    if (LA.hitHandle(sx, sy, cam, c2, 20)) return {
      id: "c2", cursor: "grab",
      drag: (p) => { const q = clampCol(p); S.M.b = q.x; S.M.d = q.y; this.changed(app2.now()); LA.app.refreshPanel(); },
    };
    if (LA.hitHandle(sx, sy, cam, S.v, 16)) return {
      id: "v", cursor: "grab",
      drag: (p) => { S.v = clampCol(p); LA.app.refreshPanel(); },
    };
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">矩阵 A —— 拖动画布上的彩色端点试试</div>
        ${LA.ui.mat2HTML("s2m", S.M)}
        <div class="btn-row" id="s2presets"></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">此时此刻</div>
        <div class="kv"><span class="k">î 的落点（第 1 列）</span><span class="v" style="color:${C.i}" id="s2c1"></span></div>
        <div class="kv"><span class="k">ĵ 的落点（第 2 列）</span><span class="v" style="color:${C.j}" id="s2c2"></span></div>
        <div class="kv"><span class="k">v 变换后 Av</span><span class="v" style="color:${C.sum}" id="s2av"></span></div>
        <div class="kv"><span class="k">det A（面积倍数）</span><span class="v" id="s2det"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">显示选项</div>
        <label class="chk"><input type="checkbox" id="s2o1" ${S.showCombo ? "checked" : ""}> 显示列分解：Av = x·î′ + y·ĵ′</label>
        <label class="chk"><input type="checkbox" id="s2o2" ${S.showOriginal ? "checked" : ""}> 显示原始网格（对比）</label>
        <label class="chk"><input type="checkbox" id="s2o3" ${S.anim.on ? "checked" : ""}> 平滑动画</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          矩阵不是一堆数字，而是一份<b>"空间运动说明书"</b>：<br>
          第 <span class="hl-g">一列</span> 写着 î 被搬到了哪，第 <span class="hl-r">二列</span> 写着 ĵ 被搬到了哪。<br><br>
          基向量一动，整个网格跟着动 —— 因为网格上每个点都可以由 î、ĵ 组合出来，所以它们的新位置完全决定了整个变换。<br><br>
          <b>矩阵 × 向量</b> 的几何含义：把 v 的坐标当作"配方"，去混合变换后的基向量：<br>
          <span class="hl-y">Av = x·î′ + y·ĵ′</span>（打开"列分解"看头尾相接的绿色+红色箭头）
        </div>
      </div>`;
    this._panel = el;

    // 预设按钮
    const pr = el.querySelector("#s2presets");
    PRESETS2.forEach((p) => {
      const b = document.createElement("button");
      b.className = "btn"; b.textContent = p.name;
      b.addEventListener("click", () => {
        Object.assign(S.M, p.M);
        this.changed(LA.app.now());
        LA.ui.setMat2(el, "s2m", S.M);
        this.refreshPanel(app);
      });
      pr.appendChild(b);
    });

    LA.ui.mat2Bind(el, "s2m", (M) => {
      Object.assign(S.M, M);
      this.changed(LA.app.now());
      this.refreshPanel(app);
    });
    el.querySelector("#s2o1").addEventListener("change", (e) => { S.showCombo = e.target.checked; });
    el.querySelector("#s2o2").addEventListener("change", (e) => { S.showOriginal = e.target.checked; });
    el.querySelector("#s2o3").addEventListener("change", (e) => { S.anim.on = e.target.checked; });

    this.refreshPanel(app);
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const M = S.M;
    el.querySelector("#s2c1").textContent = `(${LA.fmt(M.a)}, ${LA.fmt(M.c)})`;
    el.querySelector("#s2c2").textContent = `(${LA.fmt(M.b)}, ${LA.fmt(M.d)})`;
    const Av = LA.apply2(M, S.v);
    el.querySelector("#s2av").textContent = `(${LA.fmt(Av.x)}, ${LA.fmt(Av.y)})`;
    el.querySelector("#s2det").textContent = LA.fmt2(LA.det2(M));
    LA.ui.setMat2(el, "s2m", M);
  },
});

/* ============================================================
 * 第 3 章 行列式：面积与定向
 * ============================================================ */
LA.scenes.push({
  id: "determinant", icon: "▣", name: "行列式：面积与定向",
  tagline: "det = 空间被拉伸/压扁/翻转了多少",
  newCam: () => new LA.Cam2D(80),

  state: {
    M: { a: 2, b: 1, c: 0.5, d: 2 },
    anim: makeAnim(true),
  },

  M_eff(now) { return effM(this.state.anim, this.state.M, now); },
  changed(now) { matrixChanged(this.state.anim, this.state.M, now); },

  draw(ctx, cam, app, t) {
    const M = this.M_eff(t);
    const c1 = LA.col1(M), c2 = LA.col2(M);
    const det = LA.det2(M);

    LA.draw.grid(ctx, cam, { color: "#182130", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    LA.draw.grid(ctx, cam, { matrix: M, color: "#243350", width: 1.1 });

    const collapsed = Math.abs(det) < 0.02;
    // 变换后的单位正方形（平行四边形）
    const fillCol = collapsed ? "rgba(121,184,255,.25)" : (det > 0 ? "rgba(126,231,135,.28)" : "rgba(255,123,114,.30)");
    const strokeCol = collapsed ? "#79b8ff" : (det > 0 ? "#7ee787" : "#ff7b72");
    LA.draw.poly(ctx, cam, [{ x: 0, y: 0 }, c1, LA.v.add(c1, c2), c2], fillCol, strokeCol, { width: 2 });

    // 原始单位正方形虚影
    LA.draw.poly(ctx, cam, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
      "rgba(230,237,243,.05)", "rgba(230,237,243,.4)", { dash: [5, 5], width: 1.2 });

    // 面积标签
    const cen = LA.v.scale(LA.v.add(c1, c2), 0.5);
    const lbl = collapsed ? "面积 ≈ 0 被压扁!" : `面积 = ${LA.fmt2(Math.abs(det))}${det < 0 ? " (已翻转↺)" : ""}`;
    LA.draw.label(ctx, cam, cen, lbl, strokeCol, { bold: true, center: true, fontSize: 14, borderColor: strokeCol + "66" });

    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3.4, head: 12 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3.4, head: 12 });
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
        S.M[keys[0]] = q.x; S.M[keys[1]] = q.y;
        this.changed(app2.now());
        LA.ui.setMat2(this._panel, "s3m", S.M);
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
        <div class="panel-title">行列式 det A</div>
        <div class="big-det" id="s3big"></div>
        <div class="kv"><span class="k">含义</span><span class="v" id="s3mean"></span></div>
        <div class="kv"><span class="k">定向</span><span class="v" id="s3orient"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">矩阵 A</div>
        ${LA.ui.mat2HTML("s3m", S.M)}
        <div class="btn-row" id="s3presets"></div>
        <label class="chk" style="margin-top:6px"><input type="checkbox" id="s3anim" ${S.anim.on ? "checked" : ""}> 平滑动画</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          det A 回答一个问题：<b>空间被缩放了多少倍？</b><br><br>
          · det = <span class="hl-g">2</span>：所有面积都变成原来的 2 倍<br>
          · det = <span class="hl-r">负数</span>：平面被<b>翻转</b>了（顺时针↔逆时针调换，像翻面饼）<br>
          · det = <span class="hl-b">0</span>：整个平面被<b>压扁成一条线</b> —— 降维！此时矩阵不可逆，因为无数个点挤到了同一个位置，信息丢失，再也回不去了。<br><br>
          💡 把 <span class="hl-r">ĵ′</span> 拖到和 <span class="hl-g">î′</span> 共线，亲眼看看"压扁"。
        </div>
      </div>`;
    this._panel = el;

    const pr = el.querySelector("#s3presets");
    PRESETS2.slice(1).forEach((p) => {
      const b = document.createElement("button");
      b.className = "btn"; b.textContent = p.name;
      b.addEventListener("click", () => {
        Object.assign(S.M, p.M);
        this.changed(LA.app.now());
        LA.ui.setMat2(el, "s3m", S.M);
        this.refreshPanel();
      });
      pr.appendChild(b);
    });

    LA.ui.mat2Bind(el, "s3m", (M) => {
      Object.assign(S.M, M);
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    el.querySelector("#s3anim").addEventListener("change", (e) => { S.anim.on = e.target.checked; });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    const det = LA.det2(S.M);
    const big = el.querySelector("#s3big");
    big.textContent = LA.fmt2(det);
    big.style.color = Math.abs(det) < 0.02 ? "#79b8ff" : (det > 0 ? "#7ee787" : "#ff7b72");
    el.querySelector("#s3mean").textContent = Math.abs(det) < 0.02 ? "面积被压成 0"
      : `面积 ×${LA.fmt2(Math.abs(det))}`;
    el.querySelector("#s3orient").textContent = Math.abs(det) < 0.02 ? "—" : (det > 0 ? "保持 (逆时针为正)" : "翻转了!");
    el.querySelector("#s3orient").style.color = det < 0 && Math.abs(det) >= 0.02 ? "#ff7b72" : "#e6edf3";
  },
});
