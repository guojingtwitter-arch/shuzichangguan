const C = {
  blue: "#1187C9",
  deepBlue: "#0067B1",
  lightBlue: "#E7F2FB",
  paleBlue: "#F5FAFE",
  red: "#D71920",
  black: "#111827",
  gray: "#6B7280",
  line: "#D7DEE6",
  green: "#18A058",
};

function box(ctx, slide, x, y, w, h, fill = "#FFFFFF", line = C.line, width = 1) {
  return ctx.addShape(slide, {
    x, y, w, h,
    fill,
    line: { style: "solid", fill: line, width },
  });
}

function text(ctx, slide, value, x, y, w, h, opts = {}) {
  return ctx.addText(slide, {
    text: value,
    x, y, w, h,
    fontSize: opts.size ?? 22,
    color: opts.color ?? C.black,
    bold: opts.bold ?? false,
    typeface: opts.face ?? "Microsoft YaHei",
    align: opts.align ?? "left",
    valign: opts.valign ?? "top",
    fill: opts.fill ?? "#00000000",
    line: { style: "solid", fill: "#00000000", width: 0 },
    insets: opts.insets ?? { left: 0, right: 0, top: 0, bottom: 0 },
  });
}

function moduleCard(ctx, slide, x, y, w, h, title, claim, groups) {
  box(ctx, slide, x, y, w, h, "#FFFFFF", C.line, 1.2);
  box(ctx, slide, x + 34, y - 18, w - 68, 46, C.blue, C.blue, 0);
  text(ctx, slide, title, x + 34, y - 9, w - 68, 30, {
    size: 25,
    color: "#FFFFFF",
    bold: true,
    align: "center",
  });

  text(ctx, slide, claim, x + 35, y + 52, w - 70, 50, {
    size: 22,
    color: C.deepBlue,
    bold: true,
    align: "center",
  });

  const left = x + 36;
  const top = y + 125;
  const chipW = (w - 92) / 2;
  const chipH = 38;
  const gapX = 20;
  const gapY = 14;
  groups.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cx = left + col * (chipW + gapX);
    const cy = top + row * (chipH + gapY);
    const accent = item.accent ? C.red : C.black;
    ctx.addShape(slide, {
      x: cx,
      y: cy,
      w: chipW,
      h: chipH,
      fill: "#FFFFFF",
      line: { style: "dashed", fill: "#AFC2D4", width: 1.1 },
    });
    text(ctx, slide, item.text, cx + 8, cy + 8, chipW - 16, 22, {
      size: 17,
      color: accent,
      bold: item.accent ?? false,
      align: "center",
    });
  });

  const effectY = y + h - 108;
  ctx.addShape(slide, {
    geometry: "trapezoid",
    x: x + 92,
    y: effectY - 12,
    w: w - 184,
    h: 28,
    fill: C.lightBlue,
    line: { style: "solid", fill: "#00000000", width: 0 },
  });
  text(ctx, slide, "目标效果", x + 118, effectY - 6, w - 236, 20, {
    size: 15,
    color: C.gray,
    bold: true,
    align: "center",
  });

  const effects = groups.map((g) => g.effect).filter(Boolean).slice(0, 3);
  const ew = (w - 106) / 3;
  effects.forEach((effect, idx) => {
    const ex = x + 36 + idx * (ew + 17);
    ctx.addShape(slide, {
      x: ex,
      y: y + h - 66,
      w: ew,
      h: 40,
      fill: "#FFFFFF",
      line: { style: "dashed", fill: "#AFC2D4", width: 1.1 },
    });
    text(ctx, slide, effect, ex + 5, y + h - 57, ew - 10, 24, {
      size: 16,
      color: C.black,
      bold: true,
      align: "center",
    });
  });
}

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  slide.background.fill = "#FFFFFF";

  text(ctx, slide, "宁德银发合伙人场景建设支撑", 38, 26, 650, 44, {
    size: 34,
    color: C.black,
    bold: true,
  });
  box(ctx, slide, 38, 82, 1204, 3, C.blue, C.blue, 0);
  text(ctx, slide, "China Mobile", 1082, 28, 150, 24, {
    size: 18,
    color: C.blue,
    bold: true,
    align: "right",
  });
  text(ctx, slide, "中国移动", 1088, 52, 144, 24, {
    size: 22,
    color: C.blue,
    bold: true,
    align: "right",
  });

  text(ctx, slide, "□", 42, 112, 22, 28, { size: 20, color: C.black, bold: true });
  text(ctx, slide, "依托福小创平台开展本地化二次开发，围绕银发合伙人“", 72, 109, 560, 30, {
    size: 21,
    color: C.black,
    bold: true,
  });
  text(ctx, slide, "场景运营、商机转化、运营优化", 610, 109, 330, 30, {
    size: 21,
    color: C.red,
    bold: true,
  });
  text(ctx, slide, "”三大模块，", 920, 109, 130, 30, {
    size: 21,
    color: C.black,
    bold: true,
  });
  text(ctx, slide, "形成标准动作线上流转、客户线索闭环转化、运营打法动态优化的数智化支撑体系", 72, 143, 1080, 30, {
    size: 21,
    color: C.black,
    bold: true,
  });

  const cardY = 208;
  const cardH = 462;
  const cardW = 382;
  const gap = 28;
  moduleCard(ctx, slide, 42, cardY, cardW, cardH, "场景运营标准化", "以社区网格服务为主线，形成可复制的银发合伙人运营模板", [
    { text: "社区入户服务", accent: true },
    { text: "电话调查协同" },
    { text: "内容转发获客", accent: true },
    { text: "在线培训赋能" },
    { text: "走访计划发布", effect: "动作可执行" },
    { text: "水印打卡留痕", effect: "过程可留痕" },
    { text: "三级后台监控", effect: "进度可查看" },
    { text: "替代群内接龙" },
  ]);

  moduleCard(ctx, slide, 42 + cardW + gap, cardY, cardW, cardH, "商机转化闭环化", "以商机池为抓手，打通线索采集、分级、跟进、转化链路", [
    { text: "电话调查登记", accent: true },
    { text: "客户扫码浏览" },
    { text: "宣传内容转发", accent: true },
    { text: "入户需求发布" },
    { text: "客户行为采集", effect: "线索可沉淀" },
    { text: "意向等级判定", effect: "跟进可追踪" },
    { text: "直销员跟进", effect: "转化可闭环" },
    { text: "办理结果标记" },
  ]);

  moduleCard(ctx, slide, 42 + (cardW + gap) * 2, cardY, cardW, cardH, "运营优化数智化", "以数据看板和激励机制为牵引，动态优化场景打法和运营机制", [
    { text: "计划发布数" },
    { text: "入户完成率", accent: true },
    { text: "打卡留痕率" },
    { text: "商机转化率", accent: true },
    { text: "积分激励牵引", effect: "问题可预警" },
    { text: "薄弱网格识别", effect: "激励可兑现" },
    { text: "零产能唤醒", effect: "打法可优化" },
    { text: "标杆案例复制" },
  ]);

  return slide;
}
