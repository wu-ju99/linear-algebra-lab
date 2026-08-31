/* =========================================================
 * scenes13.js —— 线性变换的运算：加法 · 数乘 · 复合
 * ========================================================= */
"use strict";

LA.scenes.push({
  id: "linear-ops", icon: "⊕", name: "线性变换的运算",
  tagline: "(S+T)(v) = S(v) + T(v)：逐点定义的三种运算",
  newCam: () => new LA.Cam2D(54),

  state: {
    T1: { a: 0, b: -1, c: 1, d: 0 },   // 旋转 90°
    T2: { a: 1, b: 1, c: 0, d: 1 },    // 剪切
    v: { x: 1.5, y: 0.5 },
    k: 1.5,
    showGridSum: true,
    showScale: true,
    showComp: false,
    anim: makeAnim(true),
  },

  changed(now) { matrixChanged(this.state.anim, this.sum(), now); },

  sum() {
    const { T1, T2 } = this.state;
    return { a: T1.a + T2.a, b: T1.b + T2.b, c: T1.c + T2.c, d: T1.d + T2.d };
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const Sum = effM(S.anim, this.sum(), t);
    const Tv1 = LA.apply2(S.T1, S.v);
    const Tv2 = LA.apply2(S.T2, S.v);
    const sumV = LA.v.add(Tv1, Tv2);
    const kTv1 = LA.v.scale(Tv1, S.k);
    const compV = LA.apply2(S.T2, Tv1);

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    if (S.showGridSum) {
      LA.draw.grid(ctx, cam, { matrix: Sum, color: "#254064", width: 1.1, emphasis: "#3f6396" });
    }

    // 和变换作用在整个空间的基础：T₁v 与 T₂v 的平行四边形 = (T₁+T₂)v
    LA.draw.poly(ctx, cam, [{ x: 0, y: 0 }, Tv1, sumV, Tv2],
      "rgba(255,166,87,.08)", "rgba(255,166,87,.4)", { dash: [5, 5], width: 1.2 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, Tv1, C.i, { width: 3, head: 11 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, Tv2, "#56d4dd", { width: 3, head: 11 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, sumV, C.sum, { width: 3.6, head: 12 });
    LA.draw.label(ctx, cam, Tv1, "T₁(v)", C.i, { fontSize: 11.5, dx: 8, dy: -8 });
    LA.draw.label(ctx, cam, Tv2, "T₂(v)", "#56d4dd", { fontSize: 11.5, dx: 8, dy: -8 });
    LA.draw.label(ctx, cam, sumV, "(T₁+T₂)(v)", C.sum, { bold: true, fontSize: 12.5, dy: -28, dx: 8 });

    // 数乘
    if (S.showScale && Math.abs(S.k) > 1e-9) {
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, kTv1, "#d2a8ff", { width: 2.4, dash: [3, 3], head: 10 });
      LA.draw.label(ctx, cam, kTv1, `(${LA.fmt(S.k)}T₁)(v)`, "#d2a8ff", { fontSize: 11.5, dx: 6, dy: -12 });
    }

    // 复合：T₂(T₁(v))
    if (S.showComp) {
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, compV, "#79b8ff", { width: 2.8, head: 11 });
      LA.draw.label(ctx, cam, compV, "T₂(T₁(v))", "#79b8ff", { bold: true, fontSize: 12, dx: 8, dy: -10 });
    }

    // v 与手柄
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.v, C.v, { width: 2.4, dash: [4, 4], head: 10 });
    LA.draw.label(ctx, cam, S.v, "v", C.v, { fontSize: 12.5, bold: true, dy: -24 });
    LA.draw.handle(ctx, cam, S.v, C.v, { hover: this._dragId === "v" || this._hoverId === "v" });

    // T₁、T₂ 的列手柄
    const t1c1 = LA.col1(S.T1), t1c2 = LA.col2(S.T1);
    const t2c1 = LA.col1(S.T2), t2c2 = LA.col2(S.T2);
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, t1c1, C.i, { width: 2.6, head: 9, alpha: .8 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, t1c2, C.j, { width: 2.6, head: 9, alpha: .8 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, t2c1, "rgba(210,168,255,.8)", { width: 2.4, head: 9 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, t2c2, "rgba(86,212,221,.8)", { width: 2.4, head: 9 });
    LA.draw.handle(ctx, cam, t1c1, C.i, { hover: this._dragId === "t1a" || this._hoverId === "t1a" });
    LA.draw.handle(ctx, cam, t1c2, C.j, { hover: this._dragId === "t1b" || this._hoverId === "t1b" });
    LA.draw.handle(ctx, cam, t2c1, "#d2a8ff", { hover: this._dragId === "t2a" || this._hoverId === "t2a" });
    LA.draw.handle(ctx, cam, t2c2, "#56d4dd", { hover: this._dragId === "t2b" || this._hoverId === "t2b" });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const mk = (id, M, keys) => ({
      id, cursor: "grab",
      drag: (p) => {
        const q = clampCol(p);
        S[M][keys[0]] = q.x; S[M][keys[1]] = q.y;
        this.changed(LA.app.now());
        this.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, cam, S.v, 18)) return mk("v");
    if (LA.hitHandle(sx, sy, cam, LA.col1(S.T1), 20)) return mk("t1a", "T1", ["a", "c"]);
    if (LA.hitHandle(sx, sy, cam, LA.col2(S.T1), 20)) return mk("t1b", "T1", ["b", "d"]);
    if (LA.hitHandle(sx, sy, cam, LA.col1(S.T2), 20)) return mk("t2a", "T2", ["a", "c"]);
    if (LA.hitHandle(sx, sy, cam, LA.col2(S.T2), 20)) return mk("t2b", "T2", ["b", "d"]);
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">两个变换（画布上 5 个端点都可拖）</div>
        <div class="mx-caption"><b style="color:${C.i}">T₁</b>（绿/红端点）</div>
        ${LA.ui.mat2HTML("s44t1", S.T1)}
        <div class="mx-caption" style="margin-top:6px"><b style="color:#d2a8ff">T₂</b>（紫/青端点）</div>
        ${LA.ui.mat2HTML("s44t2", S.T2)}
        <div style="margin-top:6px">
          <div class="kv"><span class="k">数乘系数 k</span><span class="v" id="s44kv">${LA.fmt(S.k)}</span></div>
          <input type="range" id="s44k" min="-2" max="2" step="0.1" value="${S.k}">
        </div>
        <label class="chk" style="margin-top:4px"><input type="checkbox" id="s44g" ${S.showGridSum ? "checked" : ""}> 显示和变换 (T₁+T₂) 的网格</label>
        <label class="chk"><input type="checkbox" id="s44sc" ${S.showScale ? "checked" : ""}> 显示数乘 k·T₁</label>
        <label class="chk"><input type="checkbox" id="s44cp" ${S.showComp ? "checked" : ""}> 显示复合 T₂T₁</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">运算结果（对金色 v）</div>
        <div class="kv"><span class="k" style="color:${C.sum}">(T₁+T₂)(v)</span><span class="v" id="s44sum"></span></div>
        <div class="kv"><span class="k" style="color:#d2a8ff">(kT₁)(v)</span><span class="v" id="s44k"></span></div>
        <div class="kv"><span class="k" style="color:#79b8ff">T₂(T₁(v)) 复合</span><span class="v" id="s44comp"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          线性变换是"函数"，所以函数怎么运算，它们就怎么运算 —— 全部<b>逐点定义</b>：<br><br>
          · <b>加法</b> (T₁+T₂)(v) = T₁(v) + T₂(v)：
            画面里橙色向量正好是绿、青两个像向量的平行四边形之和 ——
            <b>变换相加 = 像逐点相加</b>。加法满足交换律、结合律。<br>
          · <b>数乘</b> (kT)(v) = k·T(v)：把变换的"效果"放大 k 倍。<br>
          · <b>复合</b> T₂T₁：先 T₁ 后 T₂（第 4 章）—— 满足结合律但<b>不可交换</b>。<br><br>
          与矩阵完美对应：<span class="hl-y">和 ↔ 矩阵相加，数乘 ↔ 矩阵数乘，复合 ↔ 矩阵相乘</span>。
          所以研究矩阵运算 = 研究变换运算。<br><br>
          更妙的是：线性变换自己组成一个<b>线性空间</b>（可加可数乘，第 6 章），
          复合又给了它乘法 —— 它是一个"代数"。
          特征值、行列式、迹都是这套运算上的重要函数。<br><br>
          💡 拖 T₁ 的端点：注意橙色和向量、紫色数乘向量同步变化 ——
          三个运算共享同一份输入。
        </div>
      </div>`;
    this._panel = el;

    LA.ui.mat2Bind(el, "s44t1", (M) => { Object.assign(S.T1, M); this.changed(LA.app.now()); this.refreshPanel(); });
    LA.ui.mat2Bind(el, "s44t2", (M) => { Object.assign(S.T2, M); this.changed(LA.app.now()); this.refreshPanel(); });
    el.querySelector("#s44k").addEventListener("input", (e) => {
      S.k = parseFloat(e.target.value);
      el.querySelector("#s44kv").textContent = LA.fmt(S.k);
      this.refreshPanel();
    });
    el.querySelector("#s44g").addEventListener("change", (e) => { S.showGridSum = e.target.checked; });
    el.querySelector("#s44sc").addEventListener("change", (e) => { S.showScale = e.target.checked; });
    el.querySelector("#s44cp").addEventListener("change", (e) => { S.showComp = e.target.checked; });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el || !document.contains(el)) return;
    LA.ui.setMat2(el, "s44t1", S.T1);
    LA.ui.setMat2(el, "s44t2", S.T2);
    const sum = this.sum();
    const sumV = LA.apply2(sum, S.v);
    el.querySelector("#s44sum").textContent = `(${LA.fmt(sumV.x)}, ${LA.fmt(sumV.y)})`;
    const Tv1 = LA.apply2(S.T1, S.v);
    const kV = LA.v.scale(Tv1, S.k);
    el.querySelector("#s44k").textContent = `(${LA.fmt(kV.x)}, ${LA.fmt(kV.y)})`;
    const compV = LA.apply2(S.T2, Tv1);
    el.querySelector("#s44comp").textContent = `(${LA.fmt(compV.x)}, ${LA.fmt(compV.y)})`;
  },
});
