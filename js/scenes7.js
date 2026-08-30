/* =========================================================
 * scenes7.js —— 第21~22章：λ矩阵与不变因子 / 相似判定
 * ========================================================= */
"use strict";

/* ---------- 多项式格式化（≤2 次，首一化显示） ---------- */
function fmtPoly2(a2, a1, a0) {
  const parts = [];
  const term = (coef, sym) => {
    if (Math.abs(coef) < 1e-9) return;
    const sign = coef > 0 ? (parts.length ? " + " : "") : (parts.length ? " − " : "−");
    const abs = Math.abs(coef);
    const num = (sym && Math.abs(abs - 1) < 1e-9) ? "" : LA.fmt(abs);
    parts.push(sign + num + sym);
  };
  term(a2, "λ²"); term(a1, "λ"); term(a0, "");
  return parts.length ? parts.join("") : "0";
}

/* ---------- 相似不变量信息包（2×2） ---------- */
function simInfo(M) {
  const { a, b, c, d } = M;
  const t = a + d, dd = a * d - b * c;
  const scalar = Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9 && Math.abs(a - d) < 1e-9;
  const chi = fmtPoly2(1, -t, dd);
  const d1 = scalar ? `λ ${-a >= 0 ? "+" : "−"} ${LA.fmt(Math.abs(a))}` : "1";
  const d2 = scalar ? `λ ${-a >= 0 ? "+" : "−"} ${LA.fmt(Math.abs(a))}` : chi;
  // 有理标准型（不变因子伴侣阵）：非纯量 → C = [[0, −det],[1, tr]]；纯量 → tI
  const companion = scalar ? { a: a, b: 0, c: 0, d: a } : { a: 0, b: -dd, c: 1, d: t };
  return { t, dd, scalar, chi, d1, d2, companion };
}
function simEqual(A, B) {
  const ia = simInfo(A), ib = simInfo(B);
  return Math.abs(ia.t - ib.t) < 1e-6 && Math.abs(ia.dd - ib.dd) < 1e-6 && ia.scalar === ib.scalar;
}

/* ============================================================
 * 第 21 章 λ矩阵与不变因子
 * ============================================================ */
LA.scenes.push({
  id: "lambda-matrix", icon: "λ", name: "λ矩阵：不变因子的流水线",
  tagline: "λI−A → 行列式因子 → 不变因子 → Smith → 有理标准型",
  newCam: () => new LA.Cam2D(60),

  state: {
    A: { a: 1, b: 1, c: 0, d: 2 },   // 非纯量，χ = (λ−1)(λ−2)
    anim: makeAnim(true),
  },

  M_eff(now) { return effM(this.state.anim, this.state.A, now); },
  changed(now) { matrixChanged(this.state.anim, this.state.A, now); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const M = this.M_eff(t);
    const info = simInfo(S.A);
    const C = info.companion;

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });

    // 有理标准型 C 的网格（琥珀）
    LA.draw.grid(ctx, cam, { matrix: C, color: "#4a3b22", width: 1.2, emphasis: "#7a6136" });
    LA.draw.axes(ctx, cam, { matrix: C, color: "#6b5530", width: 1.5 });
    // A 的网格（蓝）
    LA.draw.grid(ctx, cam, { matrix: M, color: "#2c4470", width: 1.3, emphasis: "#4a6ba6" });
    LA.draw.axes(ctx, cam, { matrix: M, color: "#4f6fa5", width: 1.8 });

    const c1 = LA.col1(S.A), c2 = LA.col2(S.A);
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3.2, head: 11 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3.2, head: 11 });
    LA.draw.handle(ctx, cam, c1, C.i, { hover: this._dragId === "c1" || this._hoverId === "c1" });
    LA.draw.handle(ctx, cam, c2, C.j, { hover: this._dragId === "c2" || this._hoverId === "c2" });

    const msg = info.scalar
      ? "纯量阵：C = A，它已是自己的有理标准型（不变因子 λ−t, λ−t）"
      : "琥珀网格 = 有理标准型 C（伴侣阵）：A 与 C 相似 —— 同一变换的最简代表";
    LA.draw.label(ctx, cam, { x: 0, y: 0 }, msg, info.scalar ? "#56d4dd" : "#f0b429",
      { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 13, bold: true });
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
        <div class="panel-title">矩阵 A（拖 î′、ĵ′）</div>
        ${LA.ui.mat2HTML("s21m", S.A)}
        <div class="btn-row">
          <button class="btn" data-p="generic">一般阵</button>
          <button class="btn" data-p="jordanish">单 Jordan 块</button>
          <button class="btn" data-p="scalar">纯量阵 2I</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">特征矩阵 λI − A</div>
        <div id="s21lm" style="font-family:Consolas,monospace; font-size:14px; line-height:1.9; color:#79b8ff"></div>
        <div class="panel-note" style="font-size:11.5px; margin-top:2px">元素是 λ 的多项式（一次式或常数）</div>
      </div>
      <div class="panel-block">
        <div class="panel-title">行列式因子 → 不变因子</div>
        <div class="kv"><span class="k">D₁ = 各元素的最大公因式</span><span class="v" id="s21d1"></span></div>
        <div class="kv"><span class="k">D₂ = 行列式 = 特征多项式</span><span class="v" id="s21d2"></span></div>
        <div class="kv"><span class="k">不变因子 d₁ = D₁</span><span class="v" id="s21i1" style="color:#f0b429"></span></div>
        <div class="kv"><span class="k">不变因子 d₂ = D₂/D₁</span><span class="v" id="s21i2" style="color:#f0b429"></span></div>
        <div class="kv"><span class="k">Smith 标准型</span><span class="v" id="s21smith" style="font-size:12px"></span></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">有理标准型（Frobenius）</div>
        <div id="s21rat"></div>
        <div class="panel-note" style="font-size:12px; margin-top:4px" id="s21ratNote"></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          把矩阵的每个位置都换成 λ 的多项式，得到<span class="hl-y">λ矩阵</span> λI − A
          —— "特征矩阵"。<br><br>
          对它做"多项式版"的初等变换（消法只能乘多项式），
          一路化简到对角形 —— <b>Smith 标准型</b> diag(d₁, d₂)，
          其中 d₁ | d₂ 就是<span class="hl-y">不变因子</span>。<br><br>
          它们是<b>相似不变量</b>：A 怎么换坐标，d₁、d₂ 都不变。
          所以"谁和谁相似"由它们说了算（第 22 章）。<br><br>
          2×2 的全景图（拖 A 亲眼验证）：<br>
          · <b>非纯量</b>：四个元素里有常数 → d₁=1，d₂=χ(λ)（特征多项式）
            → 有理标准型 = 伴侣阵 <b>C = [0, −det; 1, tr]</b>，A ∼ C<br>
          · <b>纯量 tI</b>：d₁=d₂=λ−t → Smith = diag(λ−t, λ−t)，有理标准型 = 自己<br><br>
          d₂ 的次数 = "这个矩阵需要几个连锁向量" ——
          它直接决定 Jordan 块的个数（第 20 章）。
        </div>
      </div>`;
    this._panel = el;

    LA.ui.mat2Bind(el, "s21m", (M) => {
      Object.assign(S.A, M);
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    const presets = {
      generic: { a: 1.5, b: 0.5, c: 0.3, d: 1 },
      jordanish: { a: 1, b: 1, c: 0, d: 2 },
      scalar: { a: 2, b: 0, c: 0, d: 2 },
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
    const { a, b, c, d } = S.A;
    const info = simInfo(S.A);
    // λI − A 符号显示
    const fλ = (coef, k) => {
      // 元素 = coef·λ + k
      const parts = [];
      if (Math.abs(coef) > 1e-9) parts.push(Math.abs(coef - 1) < 1e-9 ? "λ" : `${LA.fmt(coef)}λ`);
      if (Math.abs(k) > 1e-9) parts.push((parts.length ? (k > 0 ? " + " : " − ") : (k > 0 ? "" : "−")) + LA.fmt(Math.abs(k)));
      return parts.length ? parts.join("") : "0";
    };
    el.querySelector("#s21lm").innerHTML =
      `[ ${fλ(1, -a)},  ${fλ(0, -b)} ]<br>[ ${fλ(0, -c)},  ${fλ(1, -d)} ]`;
    el.querySelector("#s21d1").textContent = info.d1;
    el.querySelector("#s21d2").textContent = `det(λI−A) = ${info.chi}`;
    el.querySelector("#s21i1").textContent = info.d1;
    el.querySelector("#s21i2").textContent = info.d2;
    el.querySelector("#s21smith").textContent = info.scalar
      ? `diag(λ−${LA.fmt(a)}, λ−${LA.fmt(a)})`
      : `diag(1, ${info.chi})`;
    // 有理标准型
    const rat = el.querySelector("#s21rat");
    if (!rat.dataset.built) { rat.innerHTML = LA.ui.mat2HTML("s21c", info.companion, { readonly: true, cls: "readonly" }); rat.dataset.built = "1"; }
    LA.ui.setMat2(el, "s21c", info.companion);
    el.querySelector("#s21ratNote").textContent = info.scalar
      ? "纯量阵没有更简的形式：伴侣阵就是自己。"
      : `χ = ${info.chi} 的伴侣阵：C = [0, −det A; 1, tr A]。A 与 C 相似！`;
    LA.ui.setMat2(el, "s21m", S.A);
  },
});

/* ============================================================
 * 第 22 章 相似判定
 * ============================================================ */
LA.scenes.push({
  id: "similarity", icon: "∼", name: "相似判定：谁和谁同宗",
  tagline: "对比相似不变量：迹 / det / 特征多项式 / 不变因子",
  newCam: () => new LA.Cam2D(56),

  state: {
    A: { a: 1, b: 1, c: 0, d: 2 },
    B: { a: 0, b: -2, c: 1, d: 3 },
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const same = simEqual(S.A, S.B);

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });

    // B 的网格（橙）
    LA.draw.grid(ctx, cam, { matrix: S.B, color: "#4a3b22", width: 1.2, emphasis: "#7a6136" });
    LA.draw.axes(ctx, cam, { matrix: S.B, color: "#6b5530", width: 1.5 });
    // A 的网格（蓝）
    LA.draw.grid(ctx, cam, { matrix: S.A, color: "#2c4470", width: 1.3, emphasis: "#4a6ba6" });
    LA.draw.axes(ctx, cam, { matrix: S.A, color: "#4f6fa5", width: 1.8 });

    const c1 = LA.col1(S.A), c2 = LA.col2(S.A);
    const e1 = LA.col1(S.B), e2 = LA.col2(S.B);
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3, head: 10 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3, head: 10 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, e1, "#d2a8ff", { width: 2.4, head: 9, alpha: .85 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, e2, "#56d4dd", { width: 2.4, head: 9, alpha: .85 });
    LA.draw.handle(ctx, cam, c1, C.i, { hover: this._dragId === "a1" || this._hoverId === "a1" });
    LA.draw.handle(ctx, cam, c2, C.j, { hover: this._dragId === "a2" || this._hoverId === "a2" });
    LA.draw.handle(ctx, cam, e1, "#d2a8ff", { hover: this._dragId === "b1" || this._hoverId === "b1" });
    LA.draw.handle(ctx, cam, e2, "#56d4dd", { hover: this._dragId === "b2" || this._hoverId === "b2" });

    LA.draw.label(ctx, cam, { x: 0, y: 0 }, same ? "A ∼ B ✓（不变因子完全相同）" : "A ∼ B ✗（相似不变量对不上）",
      same ? "#7ee787" : "#ff7b72",
      { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 14.5, bold: true });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const mk = (id, M, keys) => ({
      id, cursor: "grab",
      drag: (p) => {
        const q = clampCol(p);
        S[M][keys[0]] = q.x; S[M][keys[1]] = q.y;
        this.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, cam, LA.col1(S.A), 20)) return mk("a1", "A", ["a", "c"]);
    if (LA.hitHandle(sx, sy, cam, LA.col2(S.A), 20)) return mk("a2", "A", ["b", "d"]);
    if (LA.hitHandle(sx, sy, cam, LA.col1(S.B), 20)) return mk("b1", "B", ["a", "c"]);
    if (LA.hitHandle(sx, sy, cam, LA.col2(S.B), 20)) return mk("b2", "B", ["b", "d"]);
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">两个矩阵（画布上 4 个端点都可拖）</div>
        <div class="mx-caption"><b style="color:${C.i}">A</b>（绿/红端点，蓝网格）</div>
        ${LA.ui.mat2HTML("s22a", S.A)}
        <div class="mx-caption" style="margin-top:6px"><b style="color:#d2a8ff">B</b>（紫/青端点，琥珀网格）</div>
        ${LA.ui.mat2HTML("s22b", S.B)}
        <div class="btn-row">
          <button class="btn" data-p="yes">✓ 相似对</button>
          <button class="btn" data-p="trace">✗ 迹不同</button>
          <button class="btn" data-p="trap">✗ 纯量陷阱</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">不变量对比</div>
        <table style="width:100%; font-size:12.5px; border-collapse:collapse" id="s22tbl"></table>
        <div class="big-det" id="s22verdict" style="font-size:18px"></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          <b>A ∼ B</b>（相似）= 存在可逆 P 使 B = P⁻¹AP =
          "同一个变换，两套坐标下的描述"（第 11 章）。<br><br>
          相似的矩阵必须<b>共享所有相似不变量</b>，一条对不上就不相似：<br>
          · 秩、|det|、<b>迹 tr</b>（斜对角和）<br>
          · 特征多项式 χ(λ)<br>
          · <b>行列式因子 / 不变因子</b>（第 21 章的流水线产物）—— 完整判据<br><br>
          试三个预设：<br>
          · ✓ <b>相似对</b>：所有不变量一致（其中一个是另一个的伴侣阵！）<br>
          · ✗ <b>迹不同</b>：第一关就被识破<br>
          · ✗ <b>纯量陷阱</b>：迹、det、χ 全都相同，
            但 A=2I 是纯量阵而 B 不是 —— 不变因子
            (λ−2, λ−2) 对 (1, (λ−2)²) 暴露真相。
            <b>这正是"只有不变因子才是完整判据"的意义</b>。
        </div>
      </div>`;
    this._panel = el;

    LA.ui.mat2Bind(el, "s22a", (M) => { Object.assign(S.A, M); this.refreshPanel(); });
    LA.ui.mat2Bind(el, "s22b", (M) => { Object.assign(S.B, M); this.refreshPanel(); });
    const presets = {
      yes: { A: { a: 1, b: 1, c: 0, d: 2 }, B: { a: 0, b: -2, c: 1, d: 3 } },
      trace: { A: { a: 1, b: 1, c: 0, d: 2 }, B: { a: 0, b: -3, c: 1, d: 3 } },
      trap: { A: { a: 2, b: 0, c: 0, d: 2 }, B: { a: 2, b: 1, c: 0, d: 2 } },
    };
    el.querySelectorAll("[data-p]").forEach((btn) => btn.addEventListener("click", () => {
      const p = presets[btn.dataset.p];
      Object.assign(S.A, p.A); Object.assign(S.B, p.B);
      this.refreshPanel();
    }));
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    LA.ui.setMat2(el, "s22a", S.A);
    LA.ui.setMat2(el, "s22b", S.B);
    const ia = simInfo(S.A), ib = simInfo(S.B);
    const rows = [
      ["tr", LA.fmt(ia.t), LA.fmt(ib.t), Math.abs(ia.t - ib.t) < 1e-6],
      ["det", LA.fmt(ia.dd), LA.fmt(ib.dd), Math.abs(ia.dd - ib.dd) < 1e-6],
      ["χ(λ)", ia.chi, ib.chi, ia.chi === ib.chi],
      ["d₁", ia.d1, ib.d1, ia.d1 === ib.d1],
      ["d₂（最小多项式）", ia.d2, ib.d2, ia.d2 === ib.d2],
    ];
    el.querySelector("#s22tbl").innerHTML = rows.map(([k, va, vb, ok]) =>
      `<tr style="border-bottom:1px solid #21262d">
        <td style="padding:4px 0; color:var(--muted)">${k}</td>
        <td style="padding:4px 8px; color:#79b8ff; font-family:Consolas,monospace">${va}</td>
        <td style="padding:4px 8px; color:#ffa657; font-family:Consolas,monospace">${vb}</td>
        <td style="padding:4px; color:${ok ? "#7ee787" : "#ff7b72"}">${ok ? "✓" : "✗"}</td>
      </tr>`).join("");
    const same = simEqual(S.A, S.B);
    const vd = el.querySelector("#s22verdict");
    vd.textContent = same ? "A ∼ B ✓ 相似" : "A ∼ B ✗ 不相似";
    vd.style.color = same ? "#7ee787" : "#ff7b72";
  },
});
