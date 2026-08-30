/* =========================================================
 * puzzles.js —— 第 7 章：闯关挑战
 * 每关给你一个目标（金色幽灵网格 / 星星），用矩阵把空间"变"过去
 * ========================================================= */
"use strict";

function drawStar(ctx, sx, sy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = sx + Math.cos(ang) * rr, y = sy + Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

const PUZZLE_LEVELS = [
  {
    title: "第 1 关 · 送向量回家",
    desc: "拖动 <b>î′、ĵ′</b> 构造你的矩阵，让黄色向量 <b>v = (1, 2)</b> 变换后正好落在<b>金色星星</b> (2, 1) 上。",
    hint: "答案不唯一！只要 x·î′ + y·ĵ′ 落在星星上即可。例如把两个基向量互换：î′=(0,1)、ĵ′=(1,0)，就把 (1,2) 变成了 (2,1)。",
    success: "注意到了吗？只要「配方混合」的结果对，矩阵不必是唯一答案 —— 这就是「同一个动作，多种分解」。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    v: { x: 1, y: 2 },
    star: { x: 2, y: 1 },
    check: (M, v) => { const r = LA.apply2(M, v); return LA.v.dist(r, { x: 2, y: 1 }) < 0.16; },
  },
  {
    title: "第 2 关 · 面积翻六倍",
    desc: "构造一个矩阵，让单位正方形的面积变成 <b>6 倍</b>（det = 6，保持正向）。",
    hint: "例如 î′=(3,0)、ĵ′=(0,2)。任何「面积恰好是 6」的平行四边形都算过关 —— 拖歪一点试试？",
    success: "行列式 = 面积缩放倍数。你刚刚「手动」体验了 det 的定义。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    v: { x: 0, y: 0 },
    star: null,
    check: (M) => Math.abs(LA.det2(M) - 6) < 0.08 && LA.det2(M) > 0,
  },
  {
    title: "第 3 关 · 降维打击",
    desc: "把整个平面<b>压扁成一条直线</b>：让 det ≈ 0，但矩阵本身不能是零矩阵。",
    hint: "把 ĵ′ 拖到和 î′ 躺在同一条直线上，比如 î′=(2,0)、ĵ′=(−1,0)。两个基向量共线 → 平面塌缩。",
    success: "压扁之后，无数个不同的点挤到了同一个位置 —— 信息永久丢失，所以<b>奇异矩阵没有逆矩阵</b>。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    v: { x: 0, y: 0 },
    star: null,
    check: (M) => Math.abs(LA.det2(M)) < 0.02 && Math.max(Math.abs(M.a), Math.abs(M.b), Math.abs(M.c), Math.abs(M.d)) > 0.4,
  },
  {
    title: "第 4 关 · 照镜子",
    desc: "构造关于直线 <b>y = x</b> 的镜面反射（金色虚线网格是目标的样子）。",
    hint: "照镜子时 î 和 ĵ 互换位置：î′=(0,1)、ĵ′=(1,0)。",
    success: "反射矩阵 det = −1：面积没变，但<b>定向翻转了</b> —— 这就是负行列式的几何含义。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    v: { x: 0, y: 0 },
    star: null,
    ghostM: { a: 0, b: 1, c: 1, d: 0 },
    check: (M) => ["a", "b", "c", "d"].every((k) => Math.abs(M[k] - { a: 0, b: 1, c: 1, d: 0 }[k]) < 0.08),
  },
  {
    title: "第 5 关 · 方向不变的箭头",
    desc: "构造一个矩阵，把 (1,1) 方向上的向量<b>拉长为 2 倍</b>但<b>不转向</b>：也就是让 <b>A·(1,1) = (2,2)</b>。<br>你正在亲手制造特征向量！",
    hint: "只需要 î′ + ĵ′ = (2,2)。例如 î′=(2,1)、ĵ′=(0,1)；也可以让另一边乱动 —— 特征方向只关心自己那条线。",
    success: "(1,1) 就是这个矩阵的<span style='color:#d2a8ff'><b>特征向量</b></span>，特征值 λ=2。别的向量都会被拐弯，只有它原地拉伸。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    v: { x: 1, y: 1 },
    star: { x: 2, y: 2 },
    showV: true,
    check: (M) => { const r = LA.apply2(M, { x: 1, y: 1 }); return LA.v.dist(r, { x: 2, y: 2 }) < 0.08; },
  },
  {
    title: "第 6 关 · 完美旋转",
    desc: "只用<b>纯旋转</b>（不能拉伸）把 î 转到 <b>120°</b>：î′ 应落在 (−0.5, 0.87) 的星星上，且两个基向量长度都必须是 1。",
    hint: "旋转矩阵 [cosθ, −sinθ; sinθ, cosθ]：θ=120° 时 cos=−0.5、sin≈0.87，所以 î′=(−0.5, 0.87)、ĵ′=(−0.87, −0.5)。",
    success: "旋转矩阵：两列都是单位长度、彼此垂直、det=1。这类「正交矩阵」只转不拉，是空间中最「温柔」的变换。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    v: { x: 1, y: 0 },
    star: { x: Math.cos(2 * Math.PI / 3), y: Math.sin(2 * Math.PI / 3) },
    showV: true,
    check: (M) => {
      const r = LA.apply2(M, { x: 1, y: 0 });
      const l1 = Math.hypot(M.a, M.c), l2 = Math.hypot(M.b, M.d);
      return LA.v.dist(r, { x: Math.cos(2 * Math.PI / 3), y: Math.sin(2 * Math.PI / 3) }) < 0.06 &&
        Math.abs(l1 - 1) < 0.05 && Math.abs(l2 - 1) < 0.05 && Math.abs(LA.det2(M) - 1) < 0.08;
    },
  },
  /* ---------- 进阶篇：矩阵的深层性质 ---------- */
  {
    title: "第 7 关 · 幂零：平方归零",
    desc: "构造一个<b>非零</b>矩阵 A，使 <b>A² = 0</b>（自己乘自己恰好归零）。",
    hint: "幂零矩阵的迹和行列式都必须是 0。试试 î′=(1,1)、ĵ′=(−1,−1)：两列共线且反向。",
    success: "这就是<b>幂零矩阵</b>：反复作用最终把整个平面送进原点。Jordan 块 λ=0（第 20 章）就是它的标准形 —— 最小多项式 x²，两步归零。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    check: (M) => {
      const A2 = LA.mul2(M, M);
      const maxA = Math.max(Math.abs(M.a), Math.abs(M.b), Math.abs(M.c), Math.abs(M.d));
      return Math.abs(A2.a) < 0.02 && Math.abs(A2.b) < 0.02 && Math.abs(A2.c) < 0.02 && Math.abs(A2.d) < 0.02 && maxA > 0.4;
    },
  },
  {
    title: "第 8 关 · 投影：自乘不变",
    desc: "构造<b>非零且不是 I</b> 的矩阵 A，使 <b>A² = A</b>（乘多少次都不变）。这类矩阵叫<b>投影</b>。",
    hint: "试试把 î′、ĵ′ 都拖到 (0.5, 0.5)（向直线 y=x 的斜投影），或 î′=(1,0)、ĵ′=(0,0)（向 x 轴的正交投影）。",
    success: "<b>投影矩阵</b>：A² = A（幂等）。几何上 = 把空间沿某方向压到一条直线上，压一次和压多次效果一样。它的特征值只有 0 和 1（第 16 关会再用到它）。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    check: (M) => {
      const A2 = LA.mul2(M, M);
      const diffOk = ["a", "b", "c", "d"].every((k) => Math.abs(A2[k] - M[k]) < 0.02);
      const maxA = Math.max(Math.abs(M.a), Math.abs(M.b), Math.abs(M.c), Math.abs(M.d));
      const isI = Math.abs(M.a - 1) < 0.05 && Math.abs(M.d - 1) < 0.05 && Math.abs(M.b) < 0.05 && Math.abs(M.c) < 0.05;
      return diffOk && maxA > 0.4 && !isI;
    },
  },
  {
    title: "第 9 关 · 对合：自己是自己的逆",
    desc: "构造<b>不是 I</b> 的矩阵 A，使 <b>A² = I</b>（A⁻¹ = A，做两次等于没做）。",
    hint: "所有<b>反射</b>都满足！比如 î、ĵ 互换 [[0,1],[1,0]]，或关于 x 轴反射 [[1,0],[0,−1]]。",
    success: "<b>对合矩阵</b>：A² = I。除了 I，它们全是 det = −1 的反射 —— 照一次镜子和照两次镜子，当然一样。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    check: (M) => {
      const A2 = LA.mul2(M, M);
      const ok = Math.abs(A2.a - 1) < 0.02 && Math.abs(A2.d - 1) < 0.02 && Math.abs(A2.b) < 0.02 && Math.abs(A2.c) < 0.02;
      const isI = Math.abs(M.a - 1) < 0.05 && Math.abs(M.d - 1) < 0.05 && Math.abs(M.b) < 0.05 && Math.abs(M.c) < 0.05;
      return ok && !isI;
    },
  },
  {
    title: "第 10 关 · 与旋转共舞",
    desc: "金色虚线是旋转矩阵 <b>B（逆时针 90°）</b>。构造一个矩阵 A，使它与 B <b>可交换</b>：<b>AB = BA</b>。",
    hint: "和旋转 90° 可交换的矩阵必须长成 [a, −b; b, a]（旋转+伸缩的复数模样）。试 î′=(1, 1)、ĵ′=(−1, 1)。",
    success: "与旋转可交换的矩阵 = 「旋转 + 均匀伸缩」—— 正是复数乘法矩阵 [[a,−b],[b,a]]（第 17 章）。可交换不是随便的事：B 的不变子空间结构锁死了 A 的形状。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    ghostM: { a: 0, b: -1, c: 1, d: 0 },
    check: (M) => {
      const B = { a: 0, b: -1, c: 1, d: 0 };
      const AB = LA.mul2(M, B), BA = LA.mul2(B, M);
      return ["a", "b", "c", "d"].every((k) => Math.abs(AB[k] - BA[k]) < 0.08);
    },
  },
  {
    title: "第 11 关 · 指定特征值",
    desc: "构造一个特征值为 <b>λ₁ = 3、λ₂ = −1</b> 的矩阵。<br>提示：tr = λ₁+λ₂，det = λ₁λ₂。",
    hint: "tr A = 2 且 det A = −3 就行！最简单的：î′=(3,0)、ĵ′=(0,−1)。无数个矩阵都共享这一对特征值。",
    success: "特征值由 χ(λ) = λ² − (tr)λ + det 完全决定：迹与行列式一定，特征值就锁死了 —— 但特征<b>方向</b>还可以随意转。这就是「无数矩阵共享同一套谱」。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    check: (M) => Math.abs(LA.trace2(M) - 2) < 0.06 && Math.abs(LA.det2(M) + 3) < 0.08,
  },
  {
    title: "第 12 关 · 亏损：Jordan 出场",
    desc: "构造一个特征值<b>重根 λ = 2</b> 但<b>不是 2I</b> 的矩阵（亏损：不可对角化）。",
    hint: "tr = 4、det = 4 但矩阵 ≠ 2I。经典款：î′=(2,1)、ĵ′=(0,2)。",
    success: "特征值重根却只有一个特征方向 —— <b>亏损矩阵</b>，它对角化失败，只能化成 <b>Jordan 块 [2,1; 0,2]</b>（第 20 章）。最小多项式 (x−2)²。",
    initM: { a: 2, b: 0, c: 0, d: 2 },
    check: (M) => {
      const trOk = Math.abs(LA.trace2(M) - 4) < 0.06;
      const detOk = Math.abs(LA.det2(M) - 4) < 0.06;
      const not2I = Math.max(Math.abs(M.a - 2), Math.abs(M.b), Math.abs(M.c), Math.abs(M.d - 2)) > 0.4;
      return trOk && detOk && not2I;
    },
  },
  {
    title: "第 13 关 · 正交但翻转",
    desc: "构造一个<b>正交矩阵</b>（两列单位长且互相垂直），但要求 <b>det = −1</b>（翻转定向）。",
    hint: "旋转的 det 是 +1；要 −1 就得是<b>反射</b>。比如照直线 y = x 的镜子：î′=(0,1)、ĵ′=(1,0)。",
    success: "正交矩阵分两族：det=+1 的旋转与 det=−1 的反射。你造的是反射 —— 保长度保角度，但把空间「翻了个面」（第 24 章）。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    check: (M) => {
      const l1 = Math.hypot(M.a, M.c), l2 = Math.hypot(M.b, M.d);
      const dot = M.a * M.b + M.c * M.d;
      return Math.abs(l1 - 1) < 0.06 && Math.abs(l2 - 1) < 0.06 && Math.abs(dot) < 0.06 && LA.det2(M) < -0.7;
    },
  },
  {
    title: "第 14 关 · 各向同性放大",
    desc: "构造一个把<b>所有方向都均匀放大 2 倍</b>的矩阵：σ₁ = σ₂ = 2（奇异值都是 2）。<br>判据：两列长度都是 2 且互相垂直。",
    hint: "均匀放大 = 任意方向都一样：A = 2×(任意旋转)。比如 î′=(1.4, 1.4)、ĵ′=(−1.4, 1.4)。",
    success: "奇异值相等（σ₁=σ₂）⟹ 单位圆变成<b>圆</b>（只是变大了）—— 这叫各向同性：没有偏爱方向。它 = 正交阵 × 2I，是 SVD 里「纯伸缩」退化为纯放大的特例（第 14 章）。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    check: (M) => {
      const l1 = Math.hypot(M.a, M.c), l2 = Math.hypot(M.b, M.d);
      const dot = M.a * M.b + M.c * M.d;
      return Math.abs(l1 - 2) < 0.1 && Math.abs(l2 - 2) < 0.1 && Math.abs(dot) < 0.1;
    },
  },
  {
    title: "第 15 关 · 谱定理实战",
    desc: "构造矩阵 A，使特征方向 <b>(1,1)</b> 被拉伸 <b>3 倍</b>、特征方向 <b>(1,−1)</b> 保持 <b>1 倍</b>。<br>判据：A(1,1)=(3,3) 且 A(1,−1)=(1,−1)。",
    hint: "在特征基下只是各自伸缩，合起来 A = QΛQᵀ = [[2,1],[1,2]]：î′=(2,1)、ĵ′=(1,2)。",
    success: "这就是<b>谱定理的用法</b>（第 26 章）：给出正交特征方向 + 各自的伸缩倍数，矩阵被唯一确定 —— A = QΛQᵀ。对称矩阵的能量全部写在这组数里。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    v: { x: 1, y: 1 },
    star: { x: 3, y: 3 },
    showV: true,
    check: (M) => {
      const r1 = LA.apply2(M, { x: 1, y: 1 });
      const r2 = LA.apply2(M, { x: 1, y: -1 });
      return LA.v.dist(r1, { x: 3, y: 3 }) < 0.1 && LA.v.dist(r2, { x: 1, y: -1 }) < 0.1;
    },
  },
  {
    title: "第 16 关 · 到 y=x 的正交投影",
    desc: "构造到直线 <b>y = x</b> 的<b>正交投影</b>矩阵：<br>判据：A(1,1) = (1,1)（线上的不动）且 A(1,−1) = (0,0)（垂直方向被压没）。",
    hint: "两条特征方向：线上保持（λ=1），垂线压扁（λ=0）。A = QΛQᵀ = [[0.5,0.5],[0.5,0.5]]。",
    success: "正交投影 = 特征值 1 和 0 的对称矩阵：线上成分保留、垂直成分湮灭。它还<b>幂等</b>（A²=A，第 8 关）—— 投两次和投一次一样。这就是最小二乘的执行者（第 29 章）。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    check: (M) => {
      const r1 = LA.apply2(M, { x: 1, y: 1 });
      const r2 = LA.apply2(M, { x: 1, y: -1 });
      return LA.v.dist(r1, { x: 1, y: 1 }) < 0.08 && LA.v.len(r2) < 0.08;
    },
  },
  {
    title: "第 17 关 · 保面积变换",
    desc: "构造一个 <b>det = 1</b> 但<b>不是 I</b> 的矩阵（可以有剪切、旋转等任何花样）。",
    hint: "剪切的 det 永远是 1：î′=(1,1)、ĵ′=(0,1)；或任何旋转。",
    success: "det = 1 的矩阵群叫 <b>SL(2)</b> —— <b>保面积群</b>，也就是 2D 的<b>辛群</b>（第 34 章）：形状随便歪，有向面积分毫必守。行星轨道的演化就藏在这个群里。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    check: (M) => {
      const maxDiff = Math.max(Math.abs(M.a - 1), Math.abs(M.b), Math.abs(M.c), Math.abs(M.d - 1));
      return Math.abs(LA.det2(M) - 1) < 0.05 && maxDiff > 0.35;
    },
  },
  {
    title: "第 18 关 · 指定奇异值",
    desc: "终极挑战：构造奇异值为 <b>σ₁ = 3、σ₂ = 0.5</b> 的矩阵（把单位圆变成 3×0.5 的椭圆，方向随意）。<br>判据会直接计算你矩阵的奇异值。",
    hint: "最简单：A = diag(3, 0.5)，即 î′=(3,0)、ĵ′=(0,0.5)。想进阶就把这个对角阵随便转一转（UΣVᵀ）。",
    success: "恭喜通关！你指定了<b>奇异值</b> —— SVD（第 14 章）的三个自由度：往哪拉（V）、拉多少（Σ）、转到哪（U）。不管 U、V 怎么转，σ 一出现，A 对空间的「拉伸指纹」就定了。",
    initM: { a: 1, b: 0, c: 0, d: 1 },
    check: (M) => {
      const MtM = LA.mul2({ a: M.a, b: M.c, c: M.b, d: M.d }, M);
      const eig = LA.eigen2(MtM);
      if (!eig.real) return false;
      const s1 = Math.sqrt(Math.max(eig.l1, 0)), s2 = Math.sqrt(Math.max(eig.l2, 0));
      return Math.abs(s1 - 3) < 0.12 && Math.abs(s2 - 0.5) < 0.12;
    },
  },
];

LA.scenes.push({
  id: "puzzles", icon: "🏁", name: "闯关挑战：用直觉解题",
  tagline: "18 道关卡，从送向量回家到指定奇异值",
  newCam: () => new LA.Cam2D(80),

  state: {
    idx: 0,
    M: PUZZLE_LEVELS[0].initM,
    v: PUZZLE_LEVELS[0].v,
    anim: makeAnim(true),
    done: JSON.parse(localStorage.getItem("la_lab_done") || "[]"),
    showHint: false,
  },

  level() { return PUZZLE_LEVELS[this.state.idx]; },

  M_eff(t) { return effM(this.state.anim, this.state.M, t); },
  changed(now) { matrixChanged(this.state.anim, this.state.M, now); },

  doneCount() { return this.state.done.filter(Boolean).length; },
  totalCount() { return PUZZLE_LEVELS.length; },

  loadLevel(i) {
    const S = this.state;
    S.idx = i;
    S.M = { ...PUZZLE_LEVELS[i].initM };
    S.v = { ...PUZZLE_LEVELS[i].v };
    S.showHint = false;
    this.changed(LA.app.now());
    this.renderBar();
    this.refreshPanel();
  },

  draw(ctx, cam, app, t) {
    const S = this.state;
    const L = this.level();
    const M = this.M_eff(t);

    // 原始网格
    LA.draw.grid(ctx, cam, { color: "#182130", width: 1 });
    LA.draw.axes(ctx, cam, { color: "#28344a" });

    // 目标幽灵网格
    if (L.ghostM) {
      LA.draw.grid(ctx, cam, { matrix: L.ghostM, color: "rgba(240,180,41,.30)", width: 1.2, emphasis: "rgba(240,180,41,.55)" });
      LA.draw.axes(ctx, cam, { matrix: L.ghostM, color: "rgba(240,180,41,.4)", width: 1.6 });
      const g1 = LA.col1(L.ghostM), g2 = LA.col2(L.ghostM);
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, g1, "rgba(240,180,41,.55)", { width: 2.5, dash: [6, 5] });
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, g2, "rgba(240,180,41,.55)", { width: 2.5, dash: [6, 5] });
    }

    // 用户变换
    LA.draw.grid(ctx, cam, { matrix: M, color: "#2c4470", width: 1.2, emphasis: "#4a6ba6" });
    LA.draw.axes(ctx, cam, { matrix: M, color: "#4f6fa5", width: 1.8 });

    // 星星目标
    if (L.star) {
      const s = cam.toS(L.star);
      drawStar(ctx, s.x, s.y, 15, "#f0b429");
      ctx.save();
      ctx.strokeStyle = "rgba(240,180,41,.5)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(s.x, s.y, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // 向量变换结果
    if (L.showV !== false && L.v && (L.v.x || L.v.y)) {
      const r = LA.apply2(M, L.v);
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, L.v, "rgba(255,215,94,.45)", { width: 2, dash: [4, 4], head: 9 });
      LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, r, C.sum, { width: 3.2, head: 12 });
      LA.draw.label(ctx, cam, r, `Av = (${LA.fmt(r.x)}, ${LA.fmt(r.y)})`, C.sum, { bold: true, dy: -26, dx: 8 });
      LA.draw.handle(ctx, cam, L.v, C.v, { hover: this._dragId === "v" || this._hoverId === "v" });
    }

    // 用户基向量
    const c1 = LA.col1(M), c2 = LA.col2(M);
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c1, C.i, { width: 3.4, head: 12 });
    LA.draw.arrow(ctx, cam, { x: 0, y: 0 }, c2, C.j, { width: 3.4, head: 12 });
    LA.draw.handle(ctx, cam, c1, C.i, { hover: this._dragId === "c1" || this._hoverId === "c1" });
    LA.draw.handle(ctx, cam, c2, C.j, { hover: this._dragId === "c2" || this._hoverId === "c2" });

    // det 小提示
    LA.draw.label(ctx, cam, { x: 0, y: 0 }, `det = ${LA.fmt2(LA.det2(S.M))}`, "#8b98a9",
      { screen: cam.toS({ x: 0, y: 0 }), dx: 14, dy: 40, fontSize: 12.5 });
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
        this.refreshPanel();
      },
    });
    if (LA.hitHandle(sx, sy, cam, c1, 20)) return mk("c1", ["a", "c"]);
    if (LA.hitHandle(sx, sy, cam, c2, 20)) return mk("c2", ["b", "d"]);
    if (this.level().v && (this.level().v.x || this.level().v.y) && LA.hitHandle(sx, sy, cam, S.v, 16) && this.level().showV) {
      return {
        id: "v", cursor: "grab",
        drag: (p) => { S.v = clampCol(p); },
      };
    }
    return null;
  },

  mountPanel(el, app) {
    const S = this.state;
    el.innerHTML = `
      <div class="panel-block">
        <div class="panel-title">关卡进度</div>
        <div id="pz-steps" style="display:flex; gap:6px; flex-wrap:wrap"></div>
        <div class="btn-row" style="margin-top:8px">
          <button class="btn" id="pz-reset">↺ 重玩本关</button>
          <button class="btn" id="pz-prev">‹ 上一关</button>
          <button class="btn" id="pz-next">下一关 ›</button>
        </div>
      </div>
      <div class="panel-block">
        <div class="panel-title">你的矩阵</div>
        ${LA.ui.mat2HTML("pzm", S.M)}
        <label class="chk" style="margin-top:6px"><input type="checkbox" id="pz-anim" ${S.anim.on ? "checked" : ""}> 平滑动画</label>
      </div>
      <div class="panel-block">
        <div class="panel-title">提示 & 道具</div>
        <div class="panel-note" id="pz-status"></div>
        <div class="puzzle-hint" id="pz-hint" style="display:none"></div>
      </div>
      <div class="panel-block">
        <div class="panel-title">说人话</div>
        <div class="panel-note">
          前面六章的直觉，现在全部用上：<br>
          · 想<b>送向量回家</b>？想想"列分解"配方。<br>
          · 想<b>控制面积</b>？盯住 det。<br>
          · 想<b>旋转</b>？两列单位长、互相垂直。<br><br>
          过关标准都在题目里，答案往往不唯一 —— 放开拖！
        </div>
      </div>`;
    this._panel = el;

    el.querySelector("#pz-reset").addEventListener("click", () => this.loadLevel(S.idx));
    el.querySelector("#pz-prev").addEventListener("click", () => this.loadLevel(Math.max(0, S.idx - 1)));
    el.querySelector("#pz-next").addEventListener("click", () => this.loadLevel(Math.min(PUZZLE_LEVELS.length - 1, S.idx + 1)));
    LA.ui.mat2Bind(el, "pzm", (M) => {
      Object.assign(S.M, M);
      this.changed(LA.app.now());
      this.refreshPanel();
    });
    el.querySelector("#pz-anim").addEventListener("change", (e) => { S.anim.on = e.target.checked; });

    this.renderBar();
    this.refreshPanel();
  },

  renderBar() {
    const wrap = document.getElementById("canvas-wrap");
    let bar = document.getElementById("pz-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "pz-bar"; bar.className = "puzzle-bar";
      bar.innerHTML = `
        <span class="p-title" id="pz-btitle"></span>
        <span class="p-desc" id="pz-bdesc"></span>
        <button class="btn primary" id="pz-check">✓ 检查答案</button>
        <button class="btn" id="pz-hintbtn">💡 提示</button>
        <span class="puzzle-progress" id="pz-bprog"></span>`;
      wrap.appendChild(bar);
      bar.querySelector("#pz-check").addEventListener("click", () => this.check());
      bar.querySelector("#pz-hintbtn").addEventListener("click", () => {
        this.state.showHint = true;
        const h = document.getElementById("pz-hint");
        h.style.display = "block";
        h.innerHTML = "💡 " + this.level().hint;
      });
    }
    const L = this.level();
    bar.querySelector("#pz-btitle").textContent = L.title;
    bar.querySelector("#pz-bdesc").innerHTML = L.desc;
    bar.querySelector("#pz-bprog").textContent = `${this.state.idx + 1} / ${PUZZLE_LEVELS.length} · 已通关 ${this.doneCount()}`;
    const h = document.getElementById("pz-hint");
    if (h) {
      h.style.display = this.state.showHint ? "block" : "none";
      h.innerHTML = this.state.showHint ? "💡 " + L.hint : "";
    }
  },

  check() {
    const S = this.state, L = this.level();
    if (L.check(S.M, S.v)) {
      S.done[S.idx] = true;
      localStorage.setItem("la_lab_done", JSON.stringify(S.done));
      this.showSuccess(L);
      LA.app.updateBadges && LA.app.updateBadges();
      this.renderBar();
    } else {
      const bar = document.getElementById("pz-bar");
      if (bar) {
        bar.classList.remove("shake");
        void bar.offsetWidth;
        bar.classList.add("shake");
      }
      LA.app.toast("还差一点！对照题目再试试，或者点 💡 提示");
    }
  },

  showSuccess(L) {
    const wrap = document.getElementById("canvas-wrap");
    this.removeOverlay();
    const S = this.state;
    const last = S.idx === PUZZLE_LEVELS.length - 1;
    const ov = document.createElement("div");
    ov.className = "puzzle-overlay";
    ov.id = "pz-overlay";
    const allDone = this.doneCount() === PUZZLE_LEVELS.length;
    ov.innerHTML = `
      <div class="puzzle-card">
        <div class="big">🎉</div>
        <h3>关卡完成！</h3>
        <p>${L.success}</p>
        ${allDone ? `<p><b>🏆 你已通关全部 ${PUZZLE_LEVELS.length} 关！</b><br>现在回到前面的章节，自由地玩坏每一个矩阵吧。</p>` : ""}
        <div class="btn-row">
          ${!last ? `<button class="btn primary" id="pz-ovnext">下一关 ›</button>` : ""}
          ${last ? `<button class="btn primary" id="pz-ovnext">🔄 重新挑战本关</button>` : ""}
          <button class="btn" id="pz-ovstay">留在这关</button>
        </div>
      </div>`;
    wrap.appendChild(ov);
    ov.querySelector("#pz-ovnext").addEventListener("click", () => {
      this.removeOverlay();
      this.loadLevel(last ? S.idx : Math.min(PUZZLE_LEVELS.length - 1, S.idx + 1));
    });
    ov.querySelector("#pz-ovstay").addEventListener("click", () => this.removeOverlay());
  },

  removeOverlay() {
    const ov = document.getElementById("pz-overlay");
    if (ov) ov.remove();
  },

  unmount() {
    const bar = document.getElementById("pz-bar");
    if (bar) bar.remove();
    this.removeOverlay();
  },

  refreshPanel() {
    const S = this.state, el = this._panel;
    if (!el) return;
    LA.ui.setMat2(el, "pzm", S.M);
    const steps = el.querySelector("#pz-steps");
    steps.innerHTML = "";
    PUZZLE_LEVELS.forEach((L, i) => {
      const b = document.createElement("button");
      b.className = "btn";
      b.style.cssText = "flex:0 0 auto; padding:5px 9px;" +
        (S.done[i] ? "background:#1d4028;border-color:#2f6a41;color:#7ee787" :
          (i === S.idx ? "border-color:#f0b429;color:#f0b429" : ""));
      b.textContent = (S.done[i] ? "✓ " : "") + (i + 1);
      b.addEventListener("click", () => this.loadLevel(i));
      steps.appendChild(b);
    });
    const det = LA.det2(S.M);
    el.querySelector("#pz-status").innerHTML =
      `当前 det = <b style="color:${det > 0 ? "#7ee787" : "#ff7b72"}">${LA.fmt2(det)}</b>；
       î′ 长度 ${LA.fmt(Math.hypot(S.M.a, S.M.c))}，ĵ′ 长度 ${LA.fmt(Math.hypot(S.M.b, S.M.d))}`;
    const h = el.querySelector("#pz-hint");
    h.style.display = S.showHint ? "block" : "none";
    if (S.showHint) h.innerHTML = "💡 " + this.level().hint;
  },
});
