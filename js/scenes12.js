/* =========================================================
 * scenes12.js —— 补充概念：伴随矩阵 / 秩与线性相关性 / 基础解系 / 迹-行列式平面
 * ========================================================= */
"use strict";

/* 3×3 工具 */
function m3mul(A, B) {
  const R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
    for (let k = 0; k < 3; k++) R[i][j] += A[i][k] * B[k][j];
  return R;
}
function m3det(A) {
  return A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
         A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
         A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
}
function minor3(A, i, j) {   // 划掉第 i 行第 j 列的 2×2 行列式
  const rows = [];
  for (let r = 0; r < 3; r++) { if (r === i) continue; const row = []; for (let c = 0; c < 3; c++) { if (c === j) continue; row.push(A[r][c]); } rows.push(row); }
  return rows[0][0] * rows[1][1] - rows[0][1] * rows[1][0];
}
function adj3(A) {          // 伴随矩阵 = 代数余子式矩阵的转置
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
    C[i][j] = ((i + j) % 2 === 0 ? 1 : -1) * minor3(A, i, j);
  const Adj = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) Adj[j][i] = C[i][j];
  return Adj;
}
function m3str(A) {
  return "[" + A.map(row => row.map(v => LA.fmt(v)).join(", ")).join(" ; ") + "]";
}

/* ============================================================
 * 余子式 · 代数余子式 · 伴随矩阵（3×3 可点选）
 * ============================================================ */
LA.scenes.push({
  id: "adjugate", icon: "⌗", name: "余子式 · 代数余子式 · 伴随矩阵",
  tagline: "划掉一行一列 → 带符号 → 转置：A⁻¹ 的另一个公式",
  newCam: () => null,

  state: {
    M3: [[2, 1, 0], [1, 3, 2], [0, 1, 1]],
    sel: { i: 0, j: 0 },
  },

  draw(ctx, cam, app, t) {
    const w = cam.w, h = cam.h;
    const S = this.state;
    const A = S.M3, { i: si, j: sj } = S.sel;
    const gx = Math.max(40, w / 2 - 150), gy = 110, cell = 88;

    // 符号棋盘 + 格子
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const x = gx + j * cell, y = gy + i * cell;
      const selected = i === si && j === sj;
      const crossed = (i === si || j === sj) && !selected;
      const isMinor = i !== si && j !== sj;
      ctx.fillStyle = selected ? "rgba(240,180,41,.25)"
        : crossed ? "rgba(255,123,114,.10)"
        : isMinor ? "rgba(126,231,135,.16)" : "rgba(21,28,38,.9)";
      ctx.strokeStyle = selected ? "#f0b429" : isMinor ? "rgba(126,231,135,.8)" : "#263042";
      ctx.lineWidth = selected ? 2.5 : isMinor ? 1.8 : 1;
      ctx.beginPath(); ctx.rect(x, y, cell - 6, cell - 6); ctx.fill(); ctx.stroke();
      LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: x + (cell - 6) / 2, y: y + (cell - 6) / 2 - 6 },
        LA.fmt(A[i][j]), selected ? "#f0b429" : "#e6edf3", { fontSize: 17, bold: selected, center: true, bg: false });
      // 符号棋盘
      LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: x + cell - 18, y: y + 14 },
        (i + j) % 2 === 0 ? "＋" : "−", "rgba(210,168,255,.8)", { fontSize: 12, center: true, bg: false });
      // 划掉的行列画 ✗
      if (crossed) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,123,114,.55)"; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x + 10, y + 10); ctx.lineTo(x + cell - 16, y + cell - 16);
        ctx.moveTo(x + cell - 16, y + 10); ctx.lineTo(x + 10, y + cell - 16); ctx.stroke();
        ctx.restore();
      }
    }
    // 行列标注
    for (let j = 0; j < 3; j++) LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: gx + j * cell + (cell - 6) / 2, y: gy - 20 }, `第${j + 1}列`, "#8b98a9", { fontSize: 11, center: true });
    for (let i = 0; i < 3; i++) LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: gx - 26, y: gy + i * cell + (cell - 6) / 2 }, `第${i + 1}行`, "#8b98a9", { fontSize: 11, center: true });

    // 选中信息
    const mi = minor3(A, si, sj);
    const aij = ((si + sj) % 2 === 0 ? 1 : -1) * mi;
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: gx + 10, y: gy + 3 * cell + 40 },
      `选中 a${si + 1}${sj + 1}：划掉第${si + 1}行、第${sj + 1}列`, "#f0b429", { fontSize: 13, bold: true });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: gx + 10, y: gy + 3 * cell + 70 },
      `M${si + 1}${sj + 1}（余子式）= ${LA.fmt(mi)}    A${si + 1}${sj + 1}（代数余子式）= ${LA.fmt(aij)}`,
      aij >= 0 ? "#7ee787" : "#ff7b72", { fontSize: 13.5, bold: true });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: gx + 10, y: gy + 3 * cell + 100 },
      "符号棋盘 (−1)^(i+j)：角标紫色 ＋/−；绿框 = 余下的 2×2 余子式块", "#8b98a9", { fontSize: 11.5 });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: gx + 10, y: 40 },
      "点击任意格子选中", "#8b98a9", { fontSize: 12 });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const cv = document.getElementById("cv");
    const w = cv._cssW, h = cv._cssH;
    const gx = Math.max(40, w / 2 - 150), gy = 110, cell = 88;
    const j = Math.floor((sx - gx) / cell), i = Math.floor((sy - gy) / cell);
    if (i >= 0 && i < 3 && j >= 0 && j < 3) return {
      id: "cell" + i + j, cursor: "pointer",
      drag: () => { S.sel = { i, j }; this.refreshPanel(); },
    };
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">选中格子的余子式与代数余子式</div>
        <div class="kv"><span class="k">M（余子式）</span><span class="v" id="s40m"></span></div>
        <div class="kv"><span class="k">A = (−1)^(i+j)·M</span><span class="v" id="s40a"></span></div>
        <div class="kv"><span class="k">按行展开验证</span><span class="v" id="s40expand" style="font-size:12px"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">伴随矩阵 adj(A) = 代数余子式矩阵的转置</div>
        <div class="panel-note" style="font-family:Consolas,monospace; font-size:13px; line-height:1.9" id="s40adj"></div>
        <div class="kv" style="margin-top:4px"><span class="k">验证 A·adj(A) = det·I</span><span class="v" id="s40check" style="font-size:11.5px"></span></div>
        <div class="kv"><span class="k">A⁻¹ = adj(A)/det(A)</span><span class="v" id="s40inv" style="font-size:11.5px"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>余子式 Mᵢⱼ</b>：划掉第 i 行第 j 列，剩下元素的行列式。<br>
          <b>代数余子式 Aᵢⱼ</b>：再乘上棋盘符号 (−1)^(i+j) ——
          就是"这一项在行列式求和里该带 + 还是 −"。<br><br>
          把整张代数余子式表<b>转置</b>一下，就是<span class="hl-y">伴随矩阵 adj(A)</span>。
          它藏着逆矩阵的另一个公式：<br>
          <span class="hl-y">A·adj(A) = det(A)·I　⟹　A⁻¹ = adj(A)/det(A)</span><br>
          （第 12 章的 [A|I] 行变换法更好算，但这个公式在 2×2 时快得出奇：
          主对角互换、副对角变号 —— [[d,−b],[−c,a]]/det。）<br><br>
          💡 按行展开 det = Σⱼ aᵢⱼAᵢⱼ 也随时可用：一行三项，每项一个 2×2 行列式
          —— 3 阶降到 2 阶的通道。
        </div>
      </div>`;
    this._panel = el;
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el || !document.contains(el)) return;
    const A = S.M3, { i, j } = S.sel;
    const mi = minor3(A, i, j);
    const aij = ((i + j) % 2 === 0 ? 1 : -1) * mi;
    el.querySelector("#s40m").textContent = LA.fmt(mi);
    el.querySelector("#s40a").textContent = LA.fmt(aij);
    // 按行展开验证（第 i 行）
    let expand = 0;
    const parts = [];
    for (let jj = 0; jj < 3; jj++) {
      const a = ((i + jj) % 2 === 0 ? 1 : -1) * minor3(A, i, jj);
      const t = A[i][jj] * a;
      expand += t;
      parts.push(`${A[i][jj] >= 0 && jj ? "+" : ""}${LA.fmt(A[i][jj])}·${LA.fmt(a)}`);
    }
    el.querySelector("#s40expand").textContent = `det = ${parts.join(" ")} = ${LA.fmt(expand)}（= ${LA.fmt(m3det(A))} ✓）`;
    const Adj = adj3(A);
    el.querySelector("#s40adj").innerHTML = `adj(A) = ${m3str(Adj)}`;
    const prod = m3mul(A, Adj);
    const det = m3det(A);
    const ok = prod.every((row, r) => row.every((v, c) => Math.abs(v - (r === c ? det : 0)) < 1e-9));
    const chk = el.querySelector("#s40check");
    chk.innerHTML = ok ? `= ${LA.fmt(det)}·I ✓` : m3str(prod);
    chk.style.color = "#7ee787";
    const inv = el.querySelector("#s40inv");
    if (Math.abs(det) > 1e-9) {
      inv.textContent = m3str(Adj.map(row => row.map(v => v / det)));
      inv.style.color = "#e6edf3";
    } else {
      inv.textContent = "det = 0，不可逆";
      inv.style.color = "#ff7b72";
    }
  },
});

/* ============================================================
 * 秩与线性相关性
 * ============================================================ */
LA.scenes.push({
  id: "rank-independence", icon: " rval", name: "秩与线性相关性",
  tagline: "能互相表示就是相关；最大无关组的个数 = 秩",
  newCam: () => new LA.Cam2D(58),

  state: {
    u: { x: 2, y: 0.5 },
    v: { x: 0.6, y: 1.8 },
    w: { x: 2.4, y: 2.2 },
    showW: true,
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const detUV = LA.det2(LA.fromCols(S.u, S.v));
    const indep = Math.abs(detUV) > 1e-6;

    LA.draw.grid(ctx, cam, { color: "#202b3b" });
    LA.draw.axes(ctx, cam, { color: "#39455a" });

    // u, v
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.u, C.i, { width: 3.4, head: 12 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.v, C.j, { width: 3.4, head: 12 });
    LA.draw.label(ctx, cam, S.u, "u", C.i, { dy: -22 });
    LA.draw.label(ctx, cam, S.v, "v", C.j, { dy: -22 });

    if (!indep) {
      const dir = LA.v.len(S.u) > 1e-6 ? S.u : S.v;
      LA.draw.spanLine(ctx, cam, dir, "rgba(255,123,114,.6)", { width: 2.4 });
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "u、v 共线：线性相关（det = 0，rank = 1）", "#ff7b72",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13.5, bold: true });
    } else {
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "u、v 线性无关（det ≠ 0，rank = 2）—— 它们撑起整个平面", "#7ee787",
        { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13.5, bold: true });
    }

    // w 的表示：w = α·u + β·v（3 个向量在 ℝ² 必相关）
    if (S.showW && indep) {
      const B = LA.fromCols(S.u, S.v);
      const d = LA.det2(B);
      const coef = { x: (S.w.x * S.v.y - S.v.x * S.w.y) / d, y: (S.u.x * S.w.y - S.w.x * S.u.y) / d };
      const p1 = LA.v.scale(S.u, coef.x);
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, p1, C.i, { width: 2.2, alpha: .75, dash: [5, 4], noHead: true });
      LA.draw.arrow(ctx, cam, p1, S.w, C.j, { width: 2.2, alpha: .75, dash: [5, 4] });
      LA.draw.label(ctx, cam, LA.v.scale(p1, 0.55), `${LA.fmt(coef.x)}·u`, C.i, { fontSize: 11 });
      if (Math.abs(coef.y) > 1e-9) {
        const mid = LA.v.scale(LA.v.add(p1, S.w), 0.5);
        LA.draw.label(ctx, cam, mid, `${LA.fmt(coef.y)}·v`, C.j, { fontSize: 11 });
      }
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.w, C.v, { width: 3.4, head: 12 });
      LA.draw.handle(ctx, cam, S.w, C.v, { hover: this._dragId === "w" || this._hoverId === "w" });
      LA.draw.label(ctx, cam, S.w, `w = ${LA.fmt(coef.x)}·u ${coef.y >= 0 ? "+" : "−"} ${LA.fmt(Math.abs(coef.y))}·v`, C.v,
        { bold: true, fontSize: 12.5, dy: -30, dx: 8 });
    } else if (S.showW) {
      // u,v 相关时 w 的相关性自然成立
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, S.w, C.v, { width: 3, head: 11 });
      LA.draw.handle(ctx, cam, S.w, C.v, { hover: this._dragId === "w" || this._hoverId === "w" });
      LA.draw.label(ctx, cam, S.w, "w（三个向量挤在一条线上）", C.v, { fontSize: 11.5, dy: -24 });
    } else {
      LA.draw.handle(ctx, cam, S.w, "rgba(210,168,255,.5)", {});
    }
    LA.draw.handle(ctx, cam, S.u, C.i, { hover: this._dragId === "u" || this._hoverId === "u" });
    LA.draw.handle(ctx, cam, S.v, C.j, { hover: this._dragId === "v" || this._hoverId === "v" });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p) => { S[id] = clampCol(p); this.refreshPanel(); },
    });
    if (LA.hitHandle(sx, sy, cam, S.u, 20)) return mk("u");
    if (LA.hitHandle(sx, sy, cam, S.v, 20)) return mk("v");
    if (LA.hitHandle(sx, sy, cam, S.w, 20)) return mk("w");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">诊断（拖 u、v、w）</div>
        <div class="kv"><span class="k">det [u v]</span><span class="v" id="s41det"></span></div>
        <div class="kv"><span class="k">{u, v} 的秩 / 相关性</span><span class="v" id="s41rank2"></span></div>
        <div class="kv"><span class="k">w 的表示系数</span><span class="v" id="s41coef"></span></div>
        <div class="kv"><span class="k">{u, v, w} 的秩</span><span class="v" id="s41rank3"></span></div>
        <label class="chk" style="margin-top:4px"><input type="checkbox" id="s41w" ${S.showW ? "checked" : ""}> 显示第三个向量 w</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>线性相关</b>：存在不全为零的系数使 α·u + β·v + γ·w = 0；
          等价说法：<b>其中至少一个向量可以由其余向量表示出来</b>。
          反之<b>线性无关</b>：谁也不是谁的组合。<br><br>
          几何判据（ℝ²）：两个向量<span class="hl-g">不共线 ⟺ 无关</span>；
          拖 u、v 共线立刻变<span class="hl-r">相关</span>（det = 0）。<br><br>
          <b>个数超过维数必相关</b>：ℝ² 里任意 3 个向量都相关 ——
          所以拖出 w 后，虚线走步永远能把 w 用 u、v 拼出来（系数实时解出）。<br><br>
          <b>秩</b>：向量组的最大无关组所含向量个数 ——
          也就是把这些向量排成矩阵后的<b>矩阵的秩</b>（行秩 = 列秩）。
          det ≠ 0 ⟺ 列无关 ⟺ 秩 = 2 ⟺ 可逆（第 10 章），
          全部是同一件事的不同说法。<br><br>
          💡 关掉 w 只研究 {u, v}；或把 w 拖到 u、v 张成的平面里任何位置看系数变化。
        </div>
      </div>`;
    this._panel = el;
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el || !document.contains(el)) return;
    const det = LA.det2(LA.fromCols(S.u, S.v));
    const indep = Math.abs(det) > 1e-6;
    el.querySelector("#s41det").textContent = LA.fmt(det);
    const r2 = el.querySelector("#s41rank2");
    r2.textContent = indep ? "2 / 无关 ✓" : "1 / 相关 ✗";
    r2.style.color = indep ? "#7ee787" : "#ff7b72";
    let coefTxt = "—（u、v 相关，表示不唯一）";
    if (indep) {
      const d = det;
      const cx = (S.w.x * S.v.y - S.v.x * S.w.y) / d;
      const cy = (S.u.x * S.w.y - S.w.x * S.u.y) / d;
      coefTxt = `α=${LA.fmt(cx)}, β=${LA.fmt(cy)}`;
    }
    el.querySelector("#s41coef").textContent = coefTxt;
    const dim = indep ? 2 : (LA.v.len(S.u) > 1e-6 || LA.v.len(S.v) > 1e-6 || LA.v.len(S.w) > 1e-6 ? 1 : 0);
    const r3 = el.querySelector("#s41rank3");
    r3.textContent = `${dim}（⟦3 个向量在 ℝ² 里永远相关⟧）`;
    r3.style.color = "#79b8ff";
  },
});

/* ============================================================
 * 基础解系
 * ============================================================ */
LA.scenes.push({
  id: "fundamental-system", icon: "ξ", name: "基础解系：解空间的骨架",
  tagline: "n − r 个向量，撑起全部解：x = t·ξ",
  newCam: () => new LA.Cam2D(60),

  state: {
    A: { a: 1, b: 2, c: 2, d: 4 },   // 秩 1
    t: 1,
    anim: makeAnim(true),
  },

  nullDir() {
    const S = this.state.A;
    if (Math.abs(LA.det2(S)) > 1e-9) return null;         // 满秩：只有零解
    if (Math.abs(S.a) + Math.abs(S.b) > 1e-9) return LA.v.norm({ x: S.b, y: -S.a });
    if (Math.abs(S.c) + Math.abs(S.d) > 1e-9) return LA.v.norm({ x: S.d, y: -S.c });
    return { x: 1, y: 0 };                                 // 零矩阵：任何向量都是解
  },

  changed(now) { matrixChanged(this.state.anim, this.state.A, now); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const M = effM(S.anim, S.A, t);
    const xi = this.nullDir();

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    LA.draw.grid(ctx, cam, { matrix: M, color: "#223350", width: 1.1 });

    if (!xi) {
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "满秩：Ax = 0 只有零解（基础解系为空，n − r = 0）",
        "#79b8ff", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13.5, bold: true });
    } else {
      // 解空间：过原点的直线
      LA.draw.spanLine(ctx, cam, xi, "rgba(126,231,135,.75)", { width: 3 });
      LA.draw.label(ctx, cam, LA.v.scale(xi, 4.4), "解空间 Ax = 0（过原点）", "#7ee787", { fontSize: 12.5, bold: true });
      // 基础解系向量 ξ
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, xi, "#f0b429", { width: 3.8, head: 13 });
      LA.draw.label(ctx, cam, xi, "ξ（基础解系）", "#f0b429", { bold: true, fontSize: 12.5, dy: -26, dx: 8 });
      // 不唯一：2ξ 幽灵
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, LA.v.scale(xi, 2), "rgba(240,180,41,.4)", { width: 2, dash: [4, 4], head: 9 });
      LA.draw.label(ctx, cam, LA.v.scale(xi, 2), "2ξ 也行", "rgba(240,180,41,.7)", { fontSize: 11, dx: 6 });
      // t 滑杆动点：通解 x = t·ξ
      const pt = LA.v.scale(xi, S.t);
      LA.draw.dot(ctx, cam, pt, "#ffa657", 6, { stroke: "#10141b" });
      LA.draw.label(ctx, cam, pt, `x = ${LA.fmt(S.t)}·ξ`, "#ffa657", { bold: true, fontSize: 12.5, dy: -26, dx: 8 });
      LA.draw.label(ctx, cam, { x: 0, y: 0 }, "全部解 = ξ 的所有倍数：一个向量撑起整个解空间",
        "#8b98a9", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -64, fontSize: 13, bold: true });
    }

    // A 的列
    const c1 = LA.col1(S.A), c2 = LA.col2(S.A);
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3, head: 10, alpha: .85 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3, head: 10, alpha: .85 });
    LA.draw.handle(ctx, cam, c1, C.i, { hover: this._dragId === "c1" || this._hoverId === "c1" });
    LA.draw.handle(ctx, cam, c2, C.j, { hover: this._dragId === "c2" || this._hoverId === "c2" });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    // 注意：即使满秩（ξ 不存在），矩阵列的手柄也必须保持可拖，
    // 否则用户一旦把 A 拖离秩 1，整个场景就锁死了
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p) => {
        const q = clampCol(p);
        if (id === "c1") { S.A.a = q.x; S.A.c = q.y; }
        else { S.A.b = q.x; S.A.d = q.y; }
        this.changed(LA.app.now());
        this.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, cam, LA.col1(S.A), 20)) return mk("c1");
    if (LA.hitHandle(sx, sy, cam, LA.col2(S.A), 20)) return mk("c2");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">齐次方程组 Ax = 0（拖 î′、ĵ′）</div>
        <div class="kv"><span class="k">rank A = r</span><span class="v" id="s42r"></span></div>
        <div class="kv"><span class="k">自由变量个数 n − r</span><span class="v" id="s42nr"></span></div>
        <div class="kv"><span class="k">基础解系 ξ</span><span class="v" id="s42xi"></span></div>
        <div class="kv"><span class="k">通解（拖滑杆 t）</span><span class="v" id="s42gen"></span></div>
        <input type="range" id="s42t" min="-3" max="3" step="0.1" value="${S.t}">
        <div class="btn-row" style="margin-top:4px">
          <button class="btn" id="s42restore">↺ 恢复秩 1 示例</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          齐次方程组 Ax = 0 的全部解构成一个<b>子空间</b>（过原点！第 15 章），
          它的维数 = <span class="hl-y">n − r</span>（未知数个数 − 秩，秩-零化度定理）。<br><br>
          <b>基础解系</b> = 这个解空间的一组基：n − r 个线性无关的解向量，
          使得任何一个解都能写成它们的线性组合。<br><br>
          秩 1 的 2×2：解空间是一条直线，基础解系只要 <b>1 个向量 ξ</b> ——
          怎么求？自由变量（比如 y）随便取 1，回代解出 x，得到 ξ。<br><br>
          <b>基础解系不唯一</b>：ξ、2ξ、−3ξ 都是合法的基础解系（金色虚线）
          —— 但<span class="hl-y">个数永远 = n − r</span>，这是本质。<br><br>
          非齐次 Ax = b 的通解 = 一个特解 + 这里的全部齐次解
          （第 10 章方程组的橙色解线）。<br><br>
          💡 满秩时 n − r = 0：基础解系是空的，只有零解 —— 又和"可逆"对上了。
        </div>
      </div>`;
    this._panel = el;

    el.querySelector("#s42t").addEventListener("input", (e) => {
      S.t = parseFloat(e.target.value);
      this.refreshPanel();
    });
    el.querySelector("#s42restore").addEventListener("click", () => {
      S.A = { a: 1, b: 2, c: 2, d: 4 };
      S.t = 1;
      el.querySelector("#s42t").value = "1";
      this.changed(LA.app.now());
      this.refreshPanel();
      LA.app.toast("已恢复秩 1 示例：解空间是一条直线");
    });
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el || !document.contains(el)) return;
    const r = Math.abs(LA.det2(S.A)) > 1e-9 ? 2 : (Math.abs(S.A.a) + Math.abs(S.A.b) + Math.abs(S.A.c) + Math.abs(S.A.d) > 1e-9 ? 1 : 0);
    const xi = this.nullDir();
    el.querySelector("#s42r").textContent = `${r}`;
    el.querySelector("#s42nr").textContent = `${2 - r}`;
    el.querySelector("#s42xi").textContent = xi ? `(${LA.fmt(xi.x)}, ${LA.fmt(xi.y)})` : "∅";
    el.querySelector("#s42gen").textContent = xi ? `x = ${LA.fmt(S.t)}·ξ = (${LA.fmt(S.t * xi.x)}, ${LA.fmt(S.t * xi.y)})` : "只有零解";
  },
});

/* ============================================================
 * 迹-行列式平面
 * ============================================================ */
LA.scenes.push({
  id: "trace-det", icon: "τ", name: "迹与行列式平面",
  tagline: "tr 和 det 两个数，定死特征值的全部性格",
  newCam: () => null,

  state: {
    tr: 1, det: 1.2,       // 平面上的点
    TR: [-6, 6], DET: [-8, 8],
  },

  A() {
    const S = this.state;
    return { a: 0, b: -S.det, c: 1, d: S.tr };   // 伴侣阵：tr、det 恰好吻合
  },

  draw(ctx, cam, app, t) {
    const w = cam.w, h = cam.h;
    const S = this.state;
    const px = w * 0.46;
    const X = (tr) => (tr - S.TR[0]) / (S.TR[1] - S.TR[0]) * px;
    const Y = (det) => h / 2 - (det - (S.DET[0] + S.DET[1]) / 2) / (S.DET[1] - S.DET[0]) * h * 0.9;
    const Y0 = Y(0);
    const parab = (tr) => tr * tr / 4;

    /* 区域填色 */
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, px, h); ctx.clip();
    // 鞍点：det < 0（下半平面）
    ctx.fillStyle = "rgba(255,123,114,.12)";
    ctx.fillRect(0, Y0, px, h - Y0);
    // 螺旋：det > tr²/4（抛物线上方）
    ctx.fillStyle = "rgba(121,184,255,.14)";
    ctx.beginPath();
    ctx.moveTo(X(-6), Y(parab(-6)));
    for (let tr = -6; tr <= 6; tr += 0.2) ctx.lineTo(X(tr), Y(parab(tr)));
    ctx.lineTo(X(6), 0); ctx.lineTo(X(-6), 0); ctx.closePath(); ctx.fill();
    // 结点区（抛物线下方 & det>0）：左右两块底色留给背景，仅描边抛物线
    ctx.restore();

    // 抛物线（重根线）
    ctx.save();
    ctx.strokeStyle = "rgba(240,180,41,.85)"; ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    for (let tr = -6; tr <= 6; tr += 0.15) {
      const sx = X(tr), sy = Y(Math.min(parab(tr), S.DET[1]));
      if (tr === -6) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.restore();

    // 轴
    ctx.save();
    ctx.strokeStyle = "#39455a"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, Y0); ctx.lineTo(px, Y0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), h); ctx.stroke();
    ctx.restore();
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: px - 40, y: Y0 + 18 }, "tr（迹）→", "#8b98a9", { fontSize: 12 });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: X(0) + 34, y: 30 }, "det（行列式）↑", "#8b98a9", { fontSize: 12 });

    // 区域标签
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: X(-3), y: Y(-2) }, "鞍点（λ 异号）", "#ff9ec1", { fontSize: 12, bold: true, center: true });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: X(0), y: Y(7) }, "螺旋（复特征值）", "#79b8ff", { fontSize: 12, bold: true, center: true });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: X(3.6), y: Y(1.2) }, "发散结点", "#ffa657", { fontSize: 12, bold: true, center: true });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: X(-3.6), y: Y(1.2) }, "收敛结点", "#7ee787", { fontSize: 12, bold: true, center: true });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: X(4.6), y: Y(parab(4.6) + 0.5) }, "重根线 tr²=4det", "#f0b429", { fontSize: 10.5, center: true });

    // 拖拽点 + 十字线
    const P = { x: X(S.tr), y: Y(S.det) };
    LA.draw.line(ctx, { w, h, toS: (p) => p }, { x: P.x, y: Y0 }, P, "rgba(240,180,41,.4)", { width: 1.2, dash: [3, 3] });
    LA.draw.line(ctx, { w, h, toS: (p) => p }, { x: X(0), y: P.y }, P, "rgba(240,180,41,.4)", { width: 1.2, dash: [3, 3] });
    LA.draw.dot(ctx, { w, h, toS: (p) => p }, P, "#f0b429", 7);
    LA.draw.handle(ctx, { w, h, toS: (p) => p }, P, "#f0b429", { hover: this._dragId === "pt" || this._hoverId === "pt" });
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: P.x + 12, y: P.y - 16 }, `tr=${LA.fmt(S.tr)}, det=${LA.fmt(S.det)}`, "#f0b429", { fontSize: 12, bold: true });

    /* 右：对应的 A（伴侣阵）作用在单位圆上 */
    ctx.save();
    ctx.beginPath(); ctx.rect(px, 0, w - px, h); ctx.clip();
    ctx.translate(px, 0);
    const cam2 = new LA.Cam2D(46);
    cam2.setSize(w - px, h);
    LA.draw.grid(ctx, cam2, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam2, { color: "#2c3849" });
    const A = this.A();
    LA.draw.grid(ctx, cam2, { matrix: A, color: "#2c4470", width: 1.2, emphasis: "#4a6ba6" });
    strokeCircle(ctx, cam2, null, 1, "rgba(230,237,243,.4)", 1.3, 1, [4, 5]);
    strokeCircle(ctx, cam2, A, 1, "#ffa657", 2.2, 1);
    ctx.restore();
    LA.draw.label(ctx, { w, h, toS: (p) => p }, { x: px + 14, y: 14 },
      `A = [0, −det; 1, tr]（伴侣阵）作用于单位圆`, "#8b98a9", { fontSize: 12 });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const cv = document.getElementById("cv");
    const px = cv._cssW * 0.46, h = cv._cssH;
    const X = (tr) => (tr - S.TR[0]) / (S.TR[1] - S.TR[0]) * px;
    const Y = (det) => h / 2 - (det - (S.DET[0] + S.DET[1]) / 2) / (S.DET[1] - S.DET[0]) * h * 0.9;
    if (Math.hypot(sx - X(S.tr), sy - Y(S.det)) <= 20) return {
      id: "pt", cursor: "grab",
      drag: (p, cam2, dsx, dsy) => {
        S.tr = LA.clamp(LA.snap(S.TR[0] + dsx / px * (S.TR[1] - S.TR[0]), 0.05), S.TR[0], S.TR[1]);
        S.det = LA.clamp(LA.snap(S.DET[1] - (dsy - h / 2) / (h * 0.9) * (S.DET[1] - S.DET[0]), 0.05), S.DET[0], S.DET[1]);
        this.refreshPanel();
      },
    };
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">当前点（拖平面上的金色点）</div>
        <div class="kv"><span class="k">tr = λ₁ + λ₂</span><span class="v" id="s43tr"></span></div>
        <div class="kv"><span class="k">det = λ₁ · λ₂</span><span class="v" id="s43det"></span></div>
        <div class="kv"><span class="k">特征值 λ₁, λ₂</span><span class="v" id="s43eig"></span></div>
        <div class="kv"><span class="k">类型判定</span><span class="v" id="s43cls" style="font-size:12px"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          迹和行列式是最容易计算的两个相似不变量，而它们俩合起来
          <b>完全决定 2×2 矩阵的特征值</b>：<br>
          λ = (tr ± √(tr² − 4det)) / 2。<br><br>
          于是整张 (tr, det) 平面被分成几个"性格区"：<br>
          · 下半平面（det&lt;0）：<span class="hl-r">鞍点</span>，一正一负，空间被又拉又压<br>
          · 抛物线 tr²=4det 之上：特征值是<span class="hl-b">复数</span>，变换在旋转（螺旋）<br>
          · 之下：两个实根同号 → <span class="hl-g">结点</span>（tr&lt;0 收敛，tr&gt;0 发散）<br>
          · 抛物线上：重根 —— <b>Jordan 块的领地</b>（第 20 章）<br><br>
          右边是用伴侣阵 [0, −det; 1, tr] 把这个点"翻译"成真实变换的样子
          —— 拖动金点，椭圆的性格随之在四种类型间切换。<br><br>
          💡 tr 和 det 在相似下不变（第 22 章）——
          所以这个平面上的一个点，代表一整个相似等价类。
        </div>
      </div>`;
    this._panel = el;
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el || !document.contains(el)) return;
    const disc = S.tr * S.tr / 4 - S.det;
    el.querySelector("#s43tr").textContent = LA.fmt(S.tr);
    el.querySelector("#s43det").textContent = LA.fmt(S.det);
    const eigEl = el.querySelector("#s43eig"), clsEl = el.querySelector("#s43cls");
    if (disc < -1e-9) {
      const im = Math.sqrt(-disc);
      eigEl.textContent = `${LA.fmt(S.tr / 2)} ± ${LA.fmt(im)}i`;
      clsEl.textContent = S.tr > 1e-9 ? "复特征值：发散螺旋" : S.tr < -1e-9 ? "复特征值：收敛螺旋" : "纯旋转（中心）";
      clsEl.style.color = "#79b8ff";
    } else {
      const s = Math.sqrt(disc);
      const l1 = S.tr / 2 + s, l2 = S.tr / 2 - s;
      eigEl.textContent = `${LA.fmt(l1)}, ${LA.fmt(l2)}`;
      if (S.det < -1e-9) { clsEl.textContent = "鞍点：一正一负，空间又拉又压"; clsEl.style.color = "#ff9ec1"; }
      else if (Math.abs(disc) < 1e-9) { clsEl.textContent = `重根 λ=${LA.fmt(S.tr / 2)}：Jordan 领地（第 20 章）`; clsEl.style.color = "#f0b429"; }
      else { clsEl.textContent = l1 > 0 ? "两正实根：发散结点" : "两负实根：收敛结点"; clsEl.style.color = l1 > 0 ? "#ffa657" : "#7ee787"; }
    }
  },
});
