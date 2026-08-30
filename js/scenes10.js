/* =========================================================
 * scenes10.js —— 第31章：四大关系（等价 / 相似 / 合同 / 正交相似）
 * ========================================================= */
"use strict";

function randomInv2() {
  const th = Math.random() * Math.PI;
  const s1 = 0.6 + Math.random() * 1.4, s2 = 0.6 + Math.random() * 1.4;
  const R = LA.rot2(th);
  const K = { a: s1, b: 1, c: 0, d: s2 };
  return LA.mul2(R, K);
}
function randomOrtho2() {
  const th = Math.random() * Math.PI * 2;
  let Q = LA.rot2(th);
  if (Math.random() < 0.4) { // 有时掺入反射（det = −1，仍是正交阵）
    Q = { a: Q.a, b: -Q.b, c: Q.c, d: -Q.d };
  }
  return Q;
}
function inv2(M) {
  const d = LA.det2(M);
  return { a: M.d / d, b: -M.b / d, c: -M.c / d, d: M.a / d };
}
function rankOf(M) {
  if (Math.abs(LA.det2(M)) > 1e-9) return 2;
  if (Math.abs(M.a) + Math.abs(M.b) + Math.abs(M.c) + Math.abs(M.d) > 1e-9) return 1;
  return 0;
}
function inertiaOf(M) {
  const eig = LA.eigen2(M);
  if (!eig.real) return null;
  if (eig.allVectors) {
    const l = M.a;
    return { pos: l > 1e-9 ? 2 : 0, neg: l < -1e-9 ? 2 : 0, zero: Math.abs(l) < 1e-9 ? 2 : 0 };
  }
  const cls = (l) => l > 1e-9 ? "pos" : l < -1e-9 ? "neg" : "zero";
  const r = {};
  r[cls(eig.l1)] = (r[cls(eig.l1)] || 0) + 1;
  r[cls(eig.l2)] = (r[cls(eig.l2)] || 0) + 1;
  return { pos: r.pos || 0, neg: r.neg || 0, zero: r.zero || 0 };
}
function chiStrOf(M) {
  return fmtPoly2(1, -(M.a + M.d), LA.det2(M));
}

const RELATIONS = {
  equiv: { name: "等价", formula: "B = P·A·Q", sym: false },
  sim: { name: "相似", formula: "B = P⁻¹·A·P", sym: false },
  contract: { name: "合同", formula: "B = Pᵀ·A·P", sym: true },
  orth: { name: "正交相似", formula: "B = Qᵀ·A·Q（QᵀQ=I）", sym: true },
};

LA.scenes.push({
  id: "relations", icon: "≡", name: "四大关系：等价·相似·合同·正交相似",
  tagline: "自由度不同的四种换坐标，各自守住不同的不变量",
  newCam: () => new LA.Cam2D(52),

    state: {
    rel: "sim",
    A: { a: 1, b: 1, c: 0, d: 2 },
    P: randomInv2(),
    Q: randomOrtho2(),
    anim: makeAnim(true),
  },

  isSymMode() { return RELATIONS[this.state.rel].sym; },
  Aeff() { return this.state.A; },

  Bmat() {
    const S = this.state, A = S.A;
    if (S.rel === "equiv") return LA.mul2(LA.mul2(S.P, A), S.Q);
    if (S.rel === "sim") return LA.mul2(LA.mul2(inv2(S.P), A), S.P);
    if (S.rel === "contract") {
      const Pt = { a: S.P.a, b: S.P.c, c: S.P.b, d: S.P.d };  // Pᵀ（不是逆！）
      return LA.mul2(LA.mul2(Pt, A), S.P);
    }
    const Q = S.Q, Qt = { a: Q.a, b: Q.c, c: Q.b, d: Q.d };
    return LA.mul2(LA.mul2(Qt, A), Q);
  },

  changed(now) { matrixChanged(this.state.anim, this.A(), now); },
  A() { return this.Aeff(); },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const rel = RELATIONS[S.rel];
    const B = this.Bmat();
    const sym = this.isSymMode();
    const c1 = sym ? { x: S.A.a, y: S.A.b } : LA.col1(S.A);
    const c2 = sym ? { x: S.A.b, y: S.A.c } : LA.col2(S.A);

    LA.draw.grid(ctx, cam, { color: "#1d2634", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });
    // B（琥珀）
    LA.draw.grid(ctx, cam, { matrix: B, color: "#4a3b22", width: 1.2, emphasis: "#7a6136" });
    LA.draw.axes(ctx, cam, { matrix: B, color: "#6b5530", width: 1.5 });
    // A（蓝）
    LA.draw.grid(ctx, cam, { matrix: S.A, color: "#2c4470", width: 1.3, emphasis: "#4a6ba6" });
    LA.draw.axes(ctx, cam, { matrix: S.A, color: "#4f6fa5", width: 1.8 });

    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3.2, head: 11 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3.2, head: 11 });
    LA.draw.handle(ctx, cam, c1, C.i, { hover: this._dragId === "c1" || this._hoverId === "c1" });
    LA.draw.handle(ctx, cam, c2, C.j, { hover: this._dragId === "c2" || this._hoverId === "c2" });

    LA.draw.label(ctx, cam, { x: 0, y: 0 }, `${rel.name}：${rel.formula}`,
      "#f0b429", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -112, fontSize: 14.5, bold: true });
    LA.draw.label(ctx, cam, { x: 0, y: 0 }, "蓝网格 = A，琥珀网格 = B（拖 A 的端点，B 实时跟着换坐标）",
      "#8b98a9", { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: -88, fontSize: 12 });
  },

  hitTest(sx, sy, cam) {
    const S = this.state;
    const sym = this.isSymMode();
    const c1 = sym ? { x: S.A.a, y: S.A.b } : LA.col1(S.A);
    const c2 = sym ? { x: S.A.b, y: S.A.c } : LA.col2(S.A);
    const mk = (id) => ({
      id, cursor: "grab",
      drag: (p) => {
        const q = clampCol(p);
        if (sym) {
          if (id === "c1") { S.A.a = q.x; S.A.b = q.y; S.A.c = q.y; }
          else { S.A.b = q.x; S.A.c = q.y; }
        } else if (id === "c1") { S.A.a = q.x; S.A.c = q.y; }
        else { S.A.b = q.x; S.A.d = q.y; }
        this.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, cam, c1, 20)) return mk("c1");
    if (LA.hitHandle(sx, sy, cam, c2, 20)) return mk("c2");
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">选择关系（B 由该关系生成）</div>
        <div class="btn-row">
          ${Object.entries(RELATIONS).map(([k, r]) => `<button class="btn" data-r="${k}">${r.name}</button>`).join("")}
        </div>
        <div class="btn-row">
          <button class="btn primary" id="s31regen">🎲 换一组 P / Q</button>
        </div>
        <div class="mx-caption" style="margin-top:4px">矩阵 A（拖画布端点；对称模式自动保持 Aᵀ=A）</div>
        ${LA.ui.mat2HTML("s31a", S.A)}
        <div class="btn-row">
          <button class="btn" data-a="generic">一般</button>
          <button class="btn" data-a="rank1">秩1</button>
          <button class="btn" data-a="spd">对称正定</button>
          <button class="btn" data-a="sid">对称不定</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">不变量对比（A vs B）</div>
        <table style="width:100%; font-size:12px; border-collapse:collapse" id="s31tbl"></table>
      </div>
      <div class="panel-block">
        <div class="panel-title">该关系的标准形（由 A 算出）</div>
        <div id="s31std"></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note" id="s31why"></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">四者的地图</div>
        <div class="panel-note" style="font-size:12px">
          自由度从大到小：<br>
          <span class="hl-y">等价</span>（行、列各自由变换）⊃
          <span class="hl-y">相似</span>（P⁻¹ 与 P 配对）；合同（Pᵀ 与 P 配对）是另一条线；<br>
          <span class="hl-y">正交相似</span> = 相似 ∩ 合同（P 是正交阵时 Pᵀ = P⁻¹）。<br><br>
          · 等价最宽松：只保 <b>秩</b> → 标准形 [Iᵣ 0; 0 0]<br>
          · 合同保 <b>惯性指数</b>（Sylvester 定理）→ 对称阵标准化 diag(±1, 0)<br>
          · 相似保 <b>特征多项式及以下一切</b> → Jordan 标准形<br>
          · 正交相似最严苛：还要不破坏内积 → 对称阵的谱定理 Λ<br><br>
          同一个 A，关系不同答案就不同：拿 Jordan 块 A=[[1,1],[0,1]] 说 ——
          在<b>相似</b>下它的标准形就是自己（亏损，没有更简形式）；
          在<b>等价</b>下秩为 2，标准形直接是 I（"亏损"这件事被完全抹掉了）；
          在<b>合同</b>下先得对称化才有资格谈标准形。<br>
          <b>先问关系，再谈标准形。</b>
        </div>
      </div>`;
    this._panel = el;

    el.querySelectorAll("[data-r]").forEach((btn) => btn.addEventListener("click", () => {
      const prev = S.rel;
      S.rel = btn.dataset.r;
      if (S.rel === "orth") S.Q = randomOrtho2();          // 正交相似：Q 必须是正交阵
      if (S.rel !== "orth") S.P = randomInv2();
      if (RELATIONS[S.rel].sym && !RELATIONS[prev].sym) {
        // 进入对称模式：把 A 对称化
        const m = (S.A.b + S.A.c) / 2;
        S.A = { a: S.A.a, b: m, c: m, d: S.A.d };
        LA.ui.setMat2(el, "s31a", S.A);
        LA.app.toast("该关系要求对称：A 已自动对称化（拖动时保持 Aᵀ=A）");
      }
      this.refreshPanel();
    }));
    el.querySelector("#s31regen").addEventListener("click", () => {
      S.P = randomInv2();
      S.Q = S.rel === "orth" ? randomOrtho2() : randomInv2();
      this.refreshPanel();
      LA.app.toast("已换一组随机 P / Q —— 注意不变量纹丝不动");
    });
    LA.ui.mat2Bind(el, "s31a", (M) => {
      if (this.isSymMode()) {
        const m = (M.b + M.c) / 2;
        S.A = { a: M.a, b: m, c: m, d: M.d };
      } else S.A = M;
      this.refreshPanel();
    });
    const presetsA = {
      generic: { a: 1, b: 1, c: 0, d: 2 },
      rank1: { a: 1, b: 2, c: 2, d: 4 },
      spd: { a: 2, b: 0.6, c: 0.6, d: 1 },
      sid: { a: 1, b: 1.5, c: 1.5, d: -1 },
    };
    el.querySelectorAll("[data-a]").forEach((btn) => btn.addEventListener("click", () => {
      const p = presetsA[btn.dataset.a];
      if (this.isSymMode() && !p.symKeep) {
        const m = (p.b + p.c) / 2;
        S.A = { a: p.a, b: m, c: m, d: p.d };
      } else S.A = { ...p };
      LA.ui.setMat2(el, "s31a", S.A);
      this.refreshPanel();
    }));
    this.refreshPanel();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    if (document.activeElement && !el.contains(document.activeElement)) LA.ui.setMat2(el, "s31a", S.A);
    const rel = RELATIONS[S.rel];
    const B = this.Bmat();
    const A = S.A;

    // 不变量对比表
    const ia = inertiaOf(A), ib = inertiaOf(B);
    const inA = ia ? `(${ia.pos},${ia.neg},${ia.zero})` : "复/—";
    const inB = ib ? `(${ib.pos},${ib.neg},${ib.zero})` : "复/—";
    const eq = (x, y) => Math.abs(x - y) < 1e-6;
    const rows = [
      ["秩", `${rankOf(A)}`, `${rankOf(B)}`, rankOf(A) === rankOf(B), true],
      ["det", LA.fmt(LA.det2(A)), LA.fmt(LA.det2(B)), eq(LA.det2(A), LA.det2(B)), ["sim", "orth"].includes(S.rel)],
      ["迹", LA.fmt(A.a + A.d), LA.fmt(B.a + B.d), eq(A.a + A.d, B.a + B.d), ["sim", "orth"].includes(S.rel)],
      ["χ(λ)", chiStrOf(A), chiStrOf(B), chiStrOf(A) === chiStrOf(B), ["sim", "orth"].includes(S.rel)],
      ["惯性(正,负,零)", inA, inB, inA === inB, S.rel !== "equiv"],
    ];
    el.querySelector("#s31tbl").innerHTML = rows.map(([k, va, vb, ok, guaranteed]) =>
      `<tr style="border-bottom:1px solid #21262d">
        <td style="padding:4px 0; color:${guaranteed ? "#7ee787" : "var(--muted)"}">${k}${guaranteed ? " 🔒" : ""}</td>
        <td style="padding:4px 8px; color:#79b8ff; font-family:Consolas,monospace">${va}</td>
        <td style="padding:4px 8px; color:#ffa657; font-family:Consolas,monospace">${vb}</td>
        <td style="padding:4px; color:${ok ? "#7ee787" : "#ff7b72"}">${ok ? "✓" : "✗"}</td>
      </tr>`).join("") +
      `<tr><td colspan="4" style="padding-top:6px; font-size:11px; color:var(--muted)">🔒 = 该关系理论上保证不变（右边打勾是必然，不是巧合）</td></tr>`;

    // 标准形
    const stdEl = el.querySelector("#s31std");
    const chip = (M, color, label) => `<div class="kv"><span class="k">${label}</span></div><div>${LA.ui.mat2Chip(M, color)}</div>`;
    let html = "";
    if (S.rel === "equiv") {
      const r = rankOf(A);
      const std = r === 2 ? LA.ident2() : { a: 1, b: 0, c: 0, d: 0 };
      html = chip(r === 0 ? { a: 0, b: 0, c: 0, d: 0 } : std, "#f0b429",
        r === 0 ? "零矩阵（秩0）" : `秩 ${r} → [ I_${r} 0 ; 0 0 ]：等价只由秩决定`);
    } else if (S.rel === "sim") {
      const eig = LA.eigen2(A);
      if (!eig.real) {
        html = chip({ a: eig.re, b: -eig.im, c: eig.im, d: eig.re }, "#f0b429", "复特征值 → 实 Jordan 块 [a −b; b a]（旋转伸缩块）");
      } else if (eig.allVectors) {
        html = chip({ a: A.a, b: 0, c: 0, d: A.d }, "#f0b429", `对角 diag(${LA.fmt(A.a)}, ${LA.fmt(A.d)})：纯量/对角阵就是标准形`);
      } else if (Math.abs(LA.det2(A) - (A.a + A.d) * (A.a + A.d) / 4) < 1e-6 && eig.repeated) {
        html = chip({ a: eig.l1, b: 1, c: 0, d: eig.l1 }, "#f0b429", `亏损重根 → Jordan 块 [λ 1; 0 λ]，λ=${LA.fmt(eig.l1)}`);
      } else {
        html = chip({ a: eig.l1, b: 0, c: 0, d: eig.l2 }, "#f0b429", `可对角化 → diag(λ₁, λ₂)（两个单根）`);
      }
    } else if (S.rel === "contract") {
      const inr = inertiaOf(A) || { pos: 0, neg: 0, zero: 2 };
      const M2 = inr.pos === 2 ? LA.ident2()
        : (inr.pos === 1 && inr.neg === 1) ? { a: 1, b: 0, c: 0, d: -1 }
        : (inr.pos === 1 && inr.zero === 1) ? { a: 1, b: 0, c: 0, d: 0 }
        : (inr.neg === 2) ? { a: -1, b: 0, c: 0, d: -1 }
        : (inr.neg === 1 && inr.zero === 1) ? { a: -1, b: 0, c: 0, d: 0 }
        : { a: 0, b: 0, c: 0, d: 0 };
      html = chip(M2, "#f0b429", `Sylvester 惯性定理：合同标准形只看 (正,负,零) = (${inr.pos},${inr.neg},${inr.zero})`);
    } else {
      const { l1, l2 } = this.eigData();
      html = chip({ a: l1, b: 0, c: 0, d: l2 }, "#f0b429", `谱定理：正交相似标准形 = Λ = diag(λ₁, λ₂)（第 26 章）`);
    }
    stdEl.innerHTML = html;

    // 关系解释
    const why = {
      equiv: "等价：行、列各自由可逆变换，自由度最大。能被完全榨干的信息只有<b>秩</b>—— 任何秩 r 的矩阵都能化成 [Iᵣ 0; 0 0]。线性方程组的消元、求逆的初等行变换，都是在等价类里活动。",
      sim: "相似：B = P⁻¹AP，是<b>同一个线性变换在不同基下的坐标</b>（第 11 章）。所以它必须保住与'变换本身'有关的一切：det、迹、特征多项式、不变因子。标准形是 Jordan 块（第 20 章）。",
      contract: "合同：B = PᵀAP，是<b>对称双线性函数/二次型换基</b>（第 29、13 章）。它保的不是特征值，而是<b>惯性指数</b>（正、负方向各几个）—— Sylvester 惯性定理。标准形 diag(±1, 0)，符号差 (p−q) 是核心签名。",
      orth: "正交相似：换基矩阵还是正交的（不破坏长度与角度，第 24 章）。它同时是相似也是合同—— 最严格，也因此最漂亮：对称矩阵的谱定理 A = QΛQᵀ（第 26 章）保证了对称阵总能化到对角 Λ。",
    }[S.rel];
    el.querySelector("#s31why").innerHTML = why;
  },

  eigData() {
    const A = S_A(this);
    const eig = LA.eigen2(A);
    let v1 = eig.v1, v2 = eig.v2;
    if (eig.allVectors) { v1 = { x: 1, y: 0 }; v2 = { x: 0, y: 1 }; }
    else if (eig.real && !v2) v2 = { x: -v1.y, y: v1.x };
    return { eig, v1, v2, l1: eig.allVectors ? A.a : eig.l1, l2: eig.allVectors ? A.a : eig.l2 };
  },
});

function S_A(scene) { return scene.state.A; }
