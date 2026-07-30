const WRAPPER_NAME = "NeuroCafe SocialNet v2 / native UX proposal";
const TEMP_WRAPPER_NAME = `${WRAPPER_NAME} / building`;
const FLOW_PREFIX = "NeuroCafe Flow / ";
const LEGACY_NODE_ID = "785:1141";

const C = {
  app: "#F7F7F4",
  surface: "#FFFFFF",
  surface2: "#EEF4F7",
  line: "#D8DCD7",
  text: "#1F2328",
  muted: "#5F6368",
  soft: "#8B969F",
  primary: "#4F8A59",
  primaryDark: "#245F32",
  blue: "#1876D1",
  blueDark: "#0D5FAD",
  blueSoft: "#DCEEFF",
  greenSoft: "#E3F1E2",
  amberSoft: "#FFF1D6",
  amberLine: "#E7CA8A",
  red: "#8F342D",
  redSoft: "#FFE7E1"
};

const fonts = {};
let buildInProgress = false;
let pendingWrapper = null;
let createdDuringBuild = [];

function trackNode(node) {
  if (buildInProgress) createdDuringBuild.push(node);
  return node;
}

function rgb(hex) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255
  };
}

function solid(hex, opacity = 1) {
  return { type: "SOLID", color: rgb(hex), opacity };
}

function shadow(y = 8, blur = 22, opacity = 0.08) {
  return [{
    type: "DROP_SHADOW",
    color: { r: 0.03, g: 0.08, b: 0.11, a: opacity },
    offset: { x: 0, y },
    radius: blur,
    spread: 0,
    visible: true,
    blendMode: "NORMAL"
  }];
}

async function loadFont(style) {
  const candidates = style === "Semi Bold" ? ["Semi Bold", "SemiBold", "Medium"] : [style, "Regular"];
  for (const candidate of candidates) {
    try {
      const fontName = { family: "Inter", style: candidate };
      await figma.loadFontAsync(fontName);
      return fontName;
    } catch (error) {
      // Try the next local Inter style.
    }
  }
  const fallback = { family: "Arial", style: style === "Bold" ? "Bold" : "Regular" };
  await figma.loadFontAsync(fallback);
  return fallback;
}

function applyAuto(node, direction, gap, padding = 0, primary = "AUTO", counter = "AUTO") {
  node.layoutMode = direction;
  node.itemSpacing = gap;
  node.paddingTop = padding;
  node.paddingRight = padding;
  node.paddingBottom = padding;
  node.paddingLeft = padding;
  node.primaryAxisSizingMode = primary;
  node.counterAxisSizingMode = counter;
}

function makeFrame(name, width, height, fill, radius = 0) {
  const node = trackNode(figma.createFrame());
  node.name = name;
  node.resize(width, height);
  node.fills = fill ? [solid(fill)] : [];
  node.cornerRadius = radius;
  node.clipsContent = false;
  return node;
}

function fixedFrame(name, width, height, fill, radius = 0) {
  const node = makeFrame(name, width, height, fill, radius);
  node.primaryAxisSizingMode = "FIXED";
  node.counterAxisSizingMode = "FIXED";
  return node;
}

function keepFixed(node, width, height) {
  node.resize(width, height);
  node.primaryAxisSizingMode = "FIXED";
  node.counterAxisSizingMode = "FIXED";
}

function keepFixedWidth(node, width) {
  node.resize(width, Math.max(10, node.height));
  if (node.layoutMode === "VERTICAL") {
    node.counterAxisSizingMode = "FIXED";
    node.primaryAxisSizingMode = "AUTO";
  } else {
    node.primaryAxisSizingMode = "FIXED";
    node.counterAxisSizingMode = "AUTO";
  }
}

function addText(parent, name, characters, size, style, color, width, lineHeight = Math.round(size * 1.35)) {
  const node = trackNode(figma.createText());
  node.name = name;
  node.fontName = fonts[style] || fonts.Regular;
  node.fontSize = size;
  node.lineHeight = { unit: "PIXELS", value: lineHeight };
  node.fills = [solid(color)];
  parent.appendChild(node);
  node.characters = characters;
  node.textAutoResize = "HEIGHT";
  node.resize(width, Math.max(lineHeight, 2));
  node.layoutSizingHorizontal = "FIXED";
  return node;
}

function addHugText(parent, name, characters, size, style, color, lineHeight = Math.round(size * 1.35)) {
  const node = trackNode(figma.createText());
  node.name = name;
  node.fontName = fonts[style] || fonts.Regular;
  node.fontSize = size;
  node.lineHeight = { unit: "PIXELS", value: lineHeight };
  node.fills = [solid(color)];
  parent.appendChild(node);
  node.characters = characters;
  node.textAutoResize = "WIDTH_AND_HEIGHT";
  return node;
}

function card(name, width, fill = C.surface, stroke = C.line) {
  const node = makeFrame(name, width, 10, fill, 8);
  applyAuto(node, "VERTICAL", 12, 16, "AUTO", "FIXED");
  node.resize(width, 10);
  node.counterAxisSizingMode = "FIXED";
  node.primaryAxisSizingMode = "AUTO";
  node.strokes = [solid(stroke)];
  node.strokeWeight = 1;
  node.effects = shadow(6, 16, 0.06);
  return node;
}

function row(name, gap = 8, padding = 0) {
  const node = makeFrame(name, 10, 10, null, 0);
  applyAuto(node, "HORIZONTAL", gap, padding);
  node.counterAxisAlignItems = "CENTER";
  return node;
}

function column(name, gap = 8, padding = 0) {
  const node = makeFrame(name, 10, 10, null, 0);
  applyAuto(node, "VERTICAL", gap, padding);
  return node;
}

function button(label, variant = "primary", width = null) {
  const bg = variant === "primary" ? C.blue : variant === "blue" ? C.blueSoft : C.surface2;
  const color = variant === "primary" ? "#FFFFFF" : variant === "blue" ? C.blue : C.text;
  const node = makeFrame(`Button / ${label}`, width || 10, 44, bg, 22);
  applyAuto(node, "HORIZONTAL", 8, 12);
  node.counterAxisAlignItems = "CENTER";
  node.primaryAxisAlignItems = "CENTER";
  if (width) {
    keepFixed(node, width, 44);
  }
  const isCompactAction = width && width <= 100 && label.length >= 8;
  const labelNode = addText(node, "Label", label, isCompactAction ? 12 : 14, "Semi Bold", color, width ? width - 24 : 200, isCompactAction ? 18 : 20);
  labelNode.textAlignHorizontal = "CENTER";
  return node;
}

function chip(label, variant = "default") {
  const bg = variant === "blue" ? C.blueSoft : variant === "green" ? C.greenSoft : C.surface2;
  const color = variant === "blue" ? C.blue : variant === "green" ? C.primaryDark : C.muted;
  const node = makeFrame(`Chip / ${label}`, 10, 30, bg, 15);
  applyAuto(node, "HORIZONTAL", 6, 10);
  node.counterAxisAlignItems = "CENTER";
  addHugText(node, "Label", label, 13, "Medium", color, 18);
  return node;
}

function progress(width, value, fill = C.primary) {
  const node = fixedFrame("Progress", width, 8, "#E1E8E2", 4);
  const active = fixedFrame("Progress value", Math.max(8, Math.round(width * value)), 8, fill, 4);
  node.appendChild(active);
  return node;
}

function stateCard(name, title, body, tone = "info") {
  const fill = tone === "success" ? C.greenSoft : tone === "error" ? C.redSoft : tone === "warning" ? C.amberSoft : C.blueSoft;
  const stroke = tone === "success" ? "#B9DEC9" : tone === "error" ? "#E5B0A8" : tone === "warning" ? C.amberLine : "#BDD7F0";
  const accent = tone === "success" ? C.primaryDark : tone === "error" ? C.red : tone === "warning" ? "#9B6A00" : C.blue;
  const node = card(name, 356, fill, stroke);
  addText(node, "Title", title, 18, "Bold", accent, 324, 24);
  addText(node, "Body", body, 14, "Regular", C.muted, 324, 20);
  return node;
}

function avatar(initial, fill = C.blueSoft, color = C.blue) {
  const node = fixedFrame(`Avatar / ${initial}`, 42, 42, fill, 21);
  node.layoutMode = "HORIZONTAL";
  node.primaryAxisAlignItems = "CENTER";
  node.counterAxisAlignItems = "CENTER";
  const text = addText(node, "Initial", initial, 18, "Bold", color, 30, 22);
  text.textAlignHorizontal = "CENTER";
  return node;
}

function hamburger() {
  const node = fixedFrame("Icon / Menu", 44, 44, null, 22);
  [13, 21, 29].forEach((y) => {
    const line = fixedFrame("Line", 20, 2, C.text, 1);
    line.x = 12;
    line.y = y;
    node.appendChild(line);
  });
  return node;
}

function searchIcon() {
  const node = fixedFrame("Icon / Search", 44, 44, null, 22);
  const circle = trackNode(figma.createEllipse());
  circle.name = "Lens";
  circle.resize(16, 16);
  circle.x = 11;
  circle.y = 10;
  circle.fills = [];
  circle.strokes = [solid(C.text)];
  circle.strokeWeight = 2;
  node.appendChild(circle);
  const handle = fixedFrame("Handle", 9, 2, C.text, 1);
  handle.rotation = 45;
  handle.x = 25;
  handle.y = 25;
  node.appendChild(handle);
  return node;
}

function moreIcon() {
  const node = fixedFrame("Icon / More", 44, 44, null, 22);
  [14, 21, 28].forEach((x) => {
    const dot = trackNode(figma.createEllipse());
    dot.name = "Dot";
    dot.resize(3, 3);
    dot.x = x;
    dot.y = 20;
    dot.fills = [solid(C.muted)];
    node.appendChild(dot);
  });
  return node;
}

function topBar(title) {
  const node = fixedFrame("Top app bar", 392, 60, C.surface, 0);
  applyAuto(node, "HORIZONTAL", 0, 8);
  node.counterAxisAlignItems = "CENTER";
  node.primaryAxisAlignItems = "CENTER";
  node.strokes = [solid(C.line)];
  node.strokeWeight = 1;

  node.appendChild(hamburger());

  const titleText = addText(node, "Title", title, 17, "Semi Bold", C.text, 208, 24);
  titleText.textAlignHorizontal = "CENTER";

  const balance = makeFrame("Balance / 850 нейро", 72, 26, C.blue, 13);
  applyAuto(balance, "HORIZONTAL", 2, 6);
  balance.counterAxisAlignItems = "CENTER";
  balance.primaryAxisAlignItems = "CENTER";
  const balanceText = addText(balance, "Value", "850 нейро", 10, "Bold", "#FFFFFF", 60, 14);
  balanceText.textAlignHorizontal = "CENTER";
  keepFixed(balance, 72, 26);
  node.appendChild(balance);

  node.appendChild(searchIcon());
  keepFixed(node, 392, 60);
  return node;
}

function tabs(active) {
  const node = fixedFrame("Tabs", 392, 44, C.surface, 0);
  applyAuto(node, "HORIZONTAL", 4, 10);
  node.counterAxisAlignItems = "CENTER";
  node.primaryAxisAlignItems = "CENTER";
  node.strokes = [solid(C.line)];
  node.strokeWeight = 1;
  ["Лента", "Челленджи", "Друзья"].forEach((label) => {
    const isActive = label === active;
    const tab = makeFrame(`Tab / ${label}`, 120, 44, isActive ? C.blueSoft : null, 22);
    applyAuto(tab, "HORIZONTAL", 0, 6);
    tab.counterAxisAlignItems = "CENTER";
    tab.primaryAxisAlignItems = "CENTER";
    const labelNode = addText(tab, "Label", label, 12, "Semi Bold", isActive ? C.blueDark : C.muted, 108, 16);
    labelNode.textAlignHorizontal = "CENTER";
    keepFixed(tab, 120, 44);
    node.appendChild(tab);
  });
  keepFixed(node, 392, 44);
  return node;
}

function statusBar() {
  const node = fixedFrame("Status bar", 392, 28, C.app, 0);
  applyAuto(node, "HORIZONTAL", 0, 14);
  node.counterAxisAlignItems = "CENTER";
  addText(node, "Time", "9:41", 11, "Semi Bold", C.text, 286, 14);
  addText(node, "System", "●  ●  ●", 9, "Medium", C.muted, 74, 14);
  keepFixed(node, 392, 28);
  return node;
}

function phone(name, activeTab) {
  const node = fixedFrame(name, 392, 879, C.app, 28);
  node.clipsContent = true;
  node.strokes = [solid("#CCD7D2")];
  node.strokeWeight = 1;
  node.effects = shadow(14, 30, 0.1);
  applyAuto(node, "VERTICAL", 0, 0);
  node.appendChild(statusBar());
  node.appendChild(topBar("Сообщество"));
  node.appendChild(tabs(activeTab));
  keepFixed(node, 392, 879);
  return node;
}

function contentArea() {
  const node = makeFrame("Content", 392, 10, null, 0);
  applyAuto(node, "VERTICAL", 12, 12);
  node.counterAxisSizingMode = "FIXED";
  node.resize(392, 10);
  node.clipsContent = false;
  return node;
}

function bottomNav(active = "Сообщество") {
  const node = fixedFrame("Bottom navigation", 392, 64, C.surface, 0);
  applyAuto(node, "HORIZONTAL", 4, 8);
  node.counterAxisAlignItems = "CENTER";
  node.primaryAxisAlignItems = "CENTER";
  ["Главная", "Сообщество", "Учёба"].forEach((label) => {
    const isActive = label === active;
    const item = fixedFrame(`Bottom nav / ${label}`, 120, 48, isActive ? C.blueSoft : null, 8);
    applyAuto(item, "VERTICAL", 2, 4);
    item.counterAxisAlignItems = "CENTER";
    item.primaryAxisAlignItems = "CENTER";
    const icon = fixedFrame("Icon", 18, 18, isActive ? C.blue : "#C7CCD0", 9);
    item.appendChild(icon);
    const text = addText(item, "Label", label, 10, "Medium", isActive ? C.blue : C.muted, 104, 14);
    text.textAlignHorizontal = "CENTER";
    keepFixed(item, 120, 48);
    node.appendChild(item);
  });
  keepFixed(node, 392, 64);
  return node;
}

function finishPhone(screen, content, activeNav = "Сообщество") {
  content.resize(392, 683);
  content.primaryAxisSizingMode = "FIXED";
  content.counterAxisSizingMode = "FIXED";
  content.clipsContent = true;
  content.overflowDirection = "VERTICAL";
  screen.appendChild(content);
  screen.appendChild(bottomNav(activeNav));
  keepFixed(screen, 392, 879);
  return screen;
}

function handoffDestination(name, title, body, activeNav) {
  const screen = fixedFrame(name, 392, 879, C.app, 28);
  screen.clipsContent = true;
  screen.strokes = [solid("#CCD7D2")];
  screen.strokeWeight = 1;
  screen.effects = shadow(14, 30, 0.1);
  applyAuto(screen, "VERTICAL", 0, 0, "FIXED", "FIXED");
  screen.appendChild(topBar(title));
  const content = contentArea();
  const handoff = card(`Handoff / ${title}`, 356, C.surface2, "#C7E7DD");
  addText(handoff, "Eyebrow", "Переход в существующий раздел", 13, "Bold", C.primaryDark, 324, 18);
  addText(handoff, "Title", title, 25, "Bold", C.text, 324, 32);
  addText(handoff, "Body", body, 15, "Regular", C.muted, 324, 22);
  handoff.appendChild(button("Вернуться в сообщество", "primary", 224));
  content.appendChild(handoff);
  content.resize(392, 755);
  content.primaryAxisSizingMode = "FIXED";
  content.counterAxisSizingMode = "FIXED";
  screen.appendChild(content);
  screen.appendChild(bottomNav(activeNav));
  keepFixed(screen, 392, 879);
  return screen;
}

function screenFeed() {
  const screen = phone("01 Сообщество / Лента", "Лента");
  const content = contentArea();

  const goal = card("Card / Цель дня", 356, C.surface2, "#C7E7DD");
  const goalHead = row("Goal header", 8, 0);
  goalHead.appendChild(chip("Цель дня", "green"));
  goalHead.appendChild(chip("1 из 3 действий", "blue"));
  goal.appendChild(goalHead);
  addText(goal, "Headline", "Оставьте осмысленный отклик", 22, "Bold", C.text, 324, 28);
  addText(goal, "Description", "Прочитайте материал, напишите 2-3 предложения и поддержите одного участника.", 15, "Regular", C.muted, 324, 22);
  goal.appendChild(progress(324, 0.34));
  goal.appendChild(button("Оставить отклик", "primary", 176));
  content.appendChild(goal);

  const post = card("Card / Афоризм дня", 356);
  const author = row("Author", 10, 0);
  author.appendChild(avatar("Н", C.greenSoft, C.primaryDark));
  const authorText = column("Author text", 2, 0);
  addText(authorText, "Name", "НейроКафе", 16, "Bold", C.text, 218, 20);
  addText(authorText, "Meta", "Афоризм дня · отклик засчитывается", 13, "Regular", C.muted, 218, 18);
  author.appendChild(authorText);
  author.appendChild(moreIcon());
  post.appendChild(author);
  addText(post, "Quote", "Смысл проявляется там, где мы замечаем связь между действием и состоянием.", 19, "Semi Bold", C.text, 324, 26);
  addText(post, "Hint", "Ответьте, что откликнулось, и день в серии сохранится.", 14, "Regular", C.muted, 324, 20);
  const actions = row("Actions", 8, 0);
  actions.appendChild(button("Ответить", "blue", 112));
  actions.appendChild(button("Поддержу", "ghost", 96));
  actions.appendChild(button("В свою ленту", "ghost", 100));
  post.appendChild(actions);
  content.appendChild(post);

  const checklist = card("Card / Что засчитается сегодня", 356, C.surface, C.line);
  addText(checklist, "Title", "Что засчитается сегодня", 18, "Bold", C.text, 324, 24);
  ["Прочитать материал", "Оставить смысловой комментарий", "Сделать репост"].forEach((item, i) => {
    const line = row(`Checklist item ${i + 1}`, 10, 0);
    const dot = fixedFrame("Check", 22, 22, i === 0 ? C.primary : "#DDE7E2", 11);
    if (i === 0) addText(dot, "Mark", "✓", 13, "Bold", "#FFFFFF", 14, 16);
    line.appendChild(dot);
    line.appendChild(addText(line, "Label", item, 15, "Medium", i === 0 ? C.text : C.muted, 280, 20));
    checklist.appendChild(line);
  });
  content.appendChild(checklist);

  return finishPhone(screen, content);
}

function screenResponse() {
  const screen = phone("02 Сообщество / Отклик", "Лента");
  const content = contentArea();

  content.appendChild(button("← Назад к ленте", "ghost", 156));
  addText(content, "Screen title", "Отклик к материалу", 25, "Bold", C.text, 356, 32);
  const context = card("Card / Context", 356, C.surface2, "#C7E7DD");
  addText(context, "Label", "Афоризм дня", 13, "Bold", C.primaryDark, 324, 18);
  addText(context, "Text", "Что вы заметили в сегодняшней практике?", 18, "Semi Bold", C.text, 324, 24);
  content.appendChild(context);

  const form = card("Form / Response", 356);
  addText(form, "Question", "Что откликнулось?", 18, "Bold", C.text, 324, 24);
  const field = fixedFrame("Textarea", 324, 160, "#F7FAF8", 16);
  field.strokes = [solid("#CAD7D0")];
  field.strokeWeight = 1;
  applyAuto(field, "VERTICAL", 0, 14);
  keepFixed(field, 324, 160);
  addText(field, "Placeholder", "Напишите 2-3 предложения: что заметили, что попробуете, какой вопрос появился", 15, "Regular", C.muted, 296, 22);
  form.appendChild(field);
  form.appendChild(button("Опубликовать отклик", "primary", 220));
  content.appendChild(form);

  const reward = card("Reward", 356, C.greenSoft, "#B9DEC9");
  addText(reward, "Title", "+20 нейро после проверки качества", 17, "Bold", C.primaryDark, 324, 22);
  addText(reward, "Body", "Награда засчитывается за содержательный, уникальный отклик без повторов.", 14, "Regular", C.muted, 324, 20);
  content.appendChild(reward);

  const examples = card("Examples", 356, C.surface, C.line);
  addText(examples, "Title", "Примеры хорошего отклика", 18, "Bold", C.text, 324, 24);
  addText(examples, "Example 1", "1. Я заметила, что часто тороплю вывод. Сегодня попробую остановиться на первом ощущении.", 14, "Regular", C.muted, 324, 20);
  addText(examples, "Example 2", "2. Вопрос к практике: где в моём рисунке появляется связь между выбором и состоянием?", 14, "Regular", C.muted, 324, 20);
  content.appendChild(examples);

  return finishPhone(screen, content);
}

function screenChallenge() {
  const screen = phone("03 Сообщество / Челлендж", "Челленджи");
  const content = contentArea();

  const hero = card("Challenge hero", 356, C.surface2, "#C7E7DD");
  addText(hero, "Title", "5 откликов с поддержкой друзей", 26, "Bold", C.text, 324, 32);
  addText(hero, "Reason", "Вы оставили 2 отклика за неделю. Следующий мягкий шаг - 5 откликов с поддержкой друзей.", 15, "Regular", C.muted, 324, 22);
  const meta = row("Progress meta", 8, 0);
  meta.appendChild(chip("2 / 5 откликов", "green"));
  meta.appendChild(chip("+120 нейро и бейдж", "blue"));
  hero.appendChild(meta);
  hero.appendChild(progress(324, 0.4));
  hero.appendChild(button("Продолжить цель", "primary", 176));
  content.appendChild(hero);

  const tasks = card("Tasks", 356);
  addText(tasks, "Title", "Что осталось", 20, "Bold", C.text, 324, 26);
  ["Оставить 3 отклика", "Поддержать 2 участников", "Сохранить серию недели"].forEach((item, i) => {
    const task = row(`Task ${i + 1}`, 10, 0);
    const mark = fixedFrame("State", 24, 24, i === 0 ? C.primary : "#E3EBE7", 12);
    if (i === 0) addText(mark, "Done", "✓", 14, "Bold", "#FFFFFF", 16, 18);
    task.appendChild(mark);
    task.appendChild(addText(task, "Text", item, 16, "Medium", C.text, 270, 22));
    tasks.appendChild(task);
  });
  content.appendChild(tasks);

  const why = card("Why", 356, C.amberSoft, C.amberLine);
  addText(why, "Title", "Почему это важно", 20, "Bold", C.text, 324, 26);
  addText(why, "Body", "Серия поддерживает регулярность, а отклик помогает не просто читать материалы, а превращать их в личную практику.", 15, "Regular", C.muted, 324, 22);
  content.appendChild(why);

  const quality = card("Quality", 356);
  addText(quality, "Title", "Качество важнее количества", 18, "Bold", C.text, 324, 24);
  addText(quality, "Body", "Повторные однотипные действия не ускоряют прогресс. Засчитываются осмысленные ответы и реальная поддержка.", 14, "Regular", C.muted, 324, 20);
  content.appendChild(quality);

  return finishPhone(screen, content);
}

function screenFriends() {
  const screen = phone("04 Сообщество / Друзья", "Друзья");
  const content = contentArea();

  addText(content, "Screen title", "Друзья", 25, "Bold", C.text, 356, 32);

  const friend = card("Friend card", 356, C.surface2, "#C7E7DD");
  const head = row("Friend header", 10, 0);
  head.appendChild(avatar("О", C.blueSoft, C.blue));
  const copy = column("Friend copy", 2, 0);
  addText(copy, "Name", "Ольга", 18, "Bold", C.text, 250, 24);
  addText(copy, "Status", "день 4 из 7", 14, "Regular", C.muted, 250, 20);
  head.appendChild(copy);
  friend.appendChild(head);
  addText(friend, "Team", "Команда практики", 20, "Bold", C.text, 324, 26);
  addText(friend, "Progress text", "Общий прогресс: 5 из 9 действий", 15, "Regular", C.muted, 324, 22);
  friend.appendChild(progress(324, 0.56, C.blue));
  const actions = row("Friend actions", 8, 0);
  actions.appendChild(button("Поддержать", "primary", 136));
  actions.appendChild(button("Позвать в челлендж", "blue", 168));
  friend.appendChild(actions);
  content.appendChild(friend);

  const rating = card("Weekly rating", 356);
  addText(rating, "Title", "Рейтинг недели", 20, "Bold", C.text, 324, 26);
  [
    ["1", "Мария", "12 действий"],
    ["2", "Ольга", "10 действий"],
    ["3", "Андрей", "9 действий"]
  ].forEach(([place, name, score]) => {
    const item = row(`Rating ${place}`, 10, 0);
    const badge = fixedFrame("Place", 28, 28, place === "1" ? C.amberSoft : C.surface2, 14);
    addText(badge, "Number", place, 14, "Bold", place === "1" ? "#9B6A00" : C.muted, 18, 18);
    item.appendChild(badge);
    item.appendChild(addText(item, "Name", name, 16, "Semi Bold", C.text, 168, 22));
    item.appendChild(addText(item, "Score", score, 14, "Regular", C.muted, 94, 20));
    rating.appendChild(item);
  });
  content.appendChild(rating);

  const invite = card("Invite friend", 356);
  addText(invite, "Title", "Пригласить в практику", 18, "Bold", C.text, 324, 24);
  addText(invite, "Body", "Позовите знакомого в общий челлендж, когда будете готовы практиковать вместе.", 15, "Regular", C.muted, 324, 22);
  invite.appendChild(button("Пригласить друга", "ghost", 176));
  content.appendChild(invite);

  return finishPhone(screen, content);
}

function screenResponseSuccess() {
  const screen = phone("05 Состояние / Отклик опубликован", "Лента");
  const content = contentArea();

  const success = card("Success / Отклик опубликован", 356, C.greenSoft, "#B9DEC9");
  addText(success, "Eyebrow", "Проверка качества пройдена", 13, "Bold", C.primaryDark, 324, 18);
  addText(success, "Title", "Отклик опубликован", 26, "Bold", C.text, 324, 32);
  addText(success, "Body", "+20 нейро начислены после проверки содержательности и уникальности. День серии сохранен.", 16, "Regular", C.muted, 324, 23);
  success.appendChild(progress(324, 0.67, C.primary));
  success.appendChild(button("Поддержать участника", "primary", 220));
  content.appendChild(success);

  const next = card("Next step", 356);
  addText(next, "Title", "Следующий мягкий шаг", 19, "Bold", C.text, 324, 25);
  addText(next, "Body", "Марине нужна одна поддержка, чтобы закрыть цель дня.", 15, "Regular", C.muted, 324, 22);
  const author = row("Suggested author", 10, 0);
  author.appendChild(avatar("М", C.greenSoft, C.primaryDark));
  const copy = column("Copy", 2, 0);
  addText(copy, "Name", "Марина", 16, "Bold", C.text, 250, 20);
  addText(copy, "Meta", "нужна 1 поддержка до цели дня", 13, "Regular", C.muted, 250, 18);
  author.appendChild(copy);
  next.appendChild(author);
  content.appendChild(next);

  const closed = stateCard("Closed day feedback", "Цель дня закрыта", "Вы выполнили 3 из 3 действий: +50 нейро, серия сохранена.", "success");
  content.appendChild(closed);

  return finishPhone(screen, content);
}

function screenResponseError(name, title, body, tone) {
  const screen = phone(name, "Лента");
  const content = contentArea();

  content.appendChild(button("← Назад к форме", "ghost", 156));
  addText(content, "Screen title", "Проверка отклика", 25, "Bold", C.text, 356, 32);
  const error = stateCard(`Response error / ${title}`, title, body, tone);
  error.appendChild(button("Исправить отклик", "primary", 176));
  content.appendChild(error);

  const guidance = card("Response quality guidance", 356);
  addText(guidance, "Title", "Как пройти проверку", 18, "Bold", C.text, 324, 24);
  addText(guidance, "Body", "Добавьте личное наблюдение, связь с материалом и следующий шаг. После исправления форма проверяется заново.", 14, "Regular", C.muted, 324, 20);
  content.appendChild(guidance);

  return finishPhone(screen, content);
}

function screenSupportSuccess() {
  const screen = phone("09 Состояние / Поддержка отправлена", "Друзья");
  const content = contentArea();

  const success = stateCard(
    "Success / Поддержка отправлена",
    "Поддержка отправлена",
    "Участник увидит вашу поддержку. Это помогает продолжить практику без давления и соревнования.",
    "success"
  );
  success.appendChild(button("Вернуться в ленту", "primary", 188));
  content.appendChild(success);

  return finishPhone(screen, content);
}

function screenRepostSuccess() {
  const screen = phone("09A Состояние / Репост добавлен", "Лента");
  const content = contentArea();
  const success = stateCard(
    "Success / Репост добавлен",
    "Публикация добавлена в вашу ленту",
    "+10 нейро начислены. Репост засчитан в цель дня.",
    "success"
  );
  success.appendChild(button("Вернуться в ленту", "primary", 188));
  content.appendChild(success);
  return finishPhone(screen, content);
}

function formValidationRoutes() {
  const node = card("Handoff / Маршруты проверки формы", 392, C.surface, C.line);
  addText(node, "Eyebrow", "Только для проверки прототипа", 13, "Bold", C.primaryDark, 360, 18);
  addText(node, "Title", "Маршруты проверки отклика", 20, "Bold", C.text, 360, 27);
  addText(
    node,
    "Body",
    "В продукте ветка определяется автоматической проверкой качества. Эти кнопки показывают три результата и не входят в пользовательский UI.",
    14,
    "Regular",
    C.muted,
    360,
    20
  );
  node.appendChild(button("Сценарий / Валидный отклик", "primary", 256));
  node.appendChild(button("Сценарий / Короткий отклик", "blue", 256));
  node.appendChild(button("Сценарий / Повторный отклик", "ghost", 256));
  node.appendChild(button("Сценарий / Ошибка сети", "ghost", 256));
  return node;
}

function screenQualityStates() {
  const screen = phone("06 Состояния / Качество отклика", "Лента");
  const content = contentArea();

  addText(content, "Screen title", "Проверка отклика", 25, "Bold", C.text, 356, 32);
  content.appendChild(stateCard("Error / Короткий отклик", "Отклик слишком короткий", "Добавьте 1-2 предложения: что заметили, какой вывод забираете, какой вопрос появился.", "error"));
  content.appendChild(stateCard("Error / Повтор", "Похоже на повтор", "Нейро не начисляются за одинаковые ответы. Переформулируйте мысль через сегодняшний материал.", "warning"));
  content.appendChild(stateCard("Error / Лимит", "Действие уже засчитано", "Сегодня серия сохранена. Можно поддержать участника или вернуться завтра.", "info"));

  const examples = card("Good response examples", 356);
  addText(examples, "Title", "Что считается качественным", 18, "Bold", C.text, 324, 24);
  addText(examples, "Point 1", "1. Есть личное наблюдение, а не только «спасибо».", 14, "Regular", C.muted, 324, 20);
  addText(examples, "Point 2", "2. Есть связь с материалом дня.", 14, "Regular", C.muted, 324, 20);
  addText(examples, "Point 3", "3. Есть следующий шаг или вопрос к практике.", 14, "Regular", C.muted, 324, 20);
  examples.appendChild(button("Исправить отклик", "primary", 176));
  content.appendChild(examples);

  return finishPhone(screen, content);
}

function screenEmptyFeed() {
  const screen = phone("07 Состояние / Пустая лента", "Лента");
  const content = contentArea();

  const empty = card("Empty feed", 356, C.surface2, "#C7E7DD");
  addText(empty, "Eyebrow", "Первый вход", 13, "Bold", C.primaryDark, 324, 18);
  addText(empty, "Title", "Лента ещё наполняется", 24, "Bold", C.text, 324, 30);
  addText(empty, "Body", "Сообщество только открывается. Начните с материала инструктора и оставьте первый отклик.", 15, "Regular", C.muted, 324, 22);
  empty.appendChild(button("Оставить первый отклик", "primary", 232));
  content.appendChild(empty);

  const seed = card("Instructor seed post", 356);
  const author = row("Instructor", 10, 0);
  author.appendChild(avatar("И", C.blueSoft, C.blue));
  const copy = column("Instructor copy", 2, 0);
  addText(copy, "Name", "Инструктор Нейрографики", 16, "Bold", C.text, 250, 20);
  addText(copy, "Meta", "пример качественного отклика", 13, "Regular", C.muted, 250, 18);
  author.appendChild(copy);
  seed.appendChild(author);
  addText(seed, "Text", "Я заметила, что линия становится спокойнее, когда я перестаю торопить результат.", 17, "Semi Bold", C.text, 324, 24);
  addText(seed, "Benefit", "Здесь мы делимся опытом и наблюдениями, которые помогают практике.", 14, "Regular", C.muted, 324, 20);
  content.appendChild(seed);

  const noFriends = stateCard("Empty friends entry", "Друзей пока нет", "Поддержите участника недели или пригласите знакомого в общий челлендж.", "info");
  content.appendChild(noFriends);

  return finishPhone(screen, content);
}

function popupFrame(name, width, fill = C.surface) {
  const node = makeFrame(name, width, 10, fill, 16);
  applyAuto(node, "VERTICAL", 8, 16);
  node.counterAxisSizingMode = "FIXED";
  node.primaryAxisSizingMode = "AUTO";
  node.strokes = [solid(C.line)];
  node.strokeWeight = 1;
  node.effects = shadow(16, 34, 0.16);
  return node;
}

function menuItem(parent, label, tone = "default") {
  const isActive = tone === "active";
  const item = fixedFrame(`Menu item / ${label}`, parent.width - 32, 44, isActive ? C.blueSoft : null, 8);
  applyAuto(item, "HORIZONTAL", 10, 10);
  item.counterAxisAlignItems = "CENTER";
  addText(
    item,
    "Label",
    label,
    16,
    isActive ? "Semi Bold" : "Medium",
    tone === "danger" ? C.red : isActive ? C.blue : C.text,
    parent.width - 52,
    22
  );
  keepFixed(item, parent.width - 32, 44);
  parent.appendChild(item);
  return item;
}

function overlayCanvas(name, panel, placement) {
  const node = makeFrame(name, 392, 879, null, 28);
  keepFixed(node, 392, 879);
  node.clipsContent = true;

  const background = fixedFrame("Overlay background / Close", 392, 879, C.text, 28);
  background.opacity = 0.32;
  node.appendChild(background);

  if (placement === "LEFT") {
    keepFixed(panel, panel.width, 879);
    panel.x = 0;
    panel.y = 0;
  } else if (placement === "BOTTOM") {
    panel.x = Math.round((392 - panel.width) / 2);
    panel.y = 879 - panel.height;
  } else {
    panel.x = Math.round((392 - panel.width) / 2);
    panel.y = Math.round((879 - panel.height) / 2);
  }

  node.appendChild(panel);
  node.setSharedPluginData("neurocafe", "overlayPositionType", placement === "BOTTOM" ? "BOTTOM_CENTER" : placement === "LEFT" ? "TOP_LEFT" : "CENTER");
  node.setSharedPluginData("neurocafe", "outsideClose", "true");
  return node;
}

function burgerMenuOverlay() {
  const panel = popupFrame("Panel / Главное меню", 276, "#F5F5F5");
  const head = row("Menu header", 8, 0);
  addText(head, "Title", "Меню", 20, "Bold", C.text, 188, 26);
  const close = fixedFrame("Button / Закрыть меню", 44, 44, C.surface, 22);
  applyAuto(close, "HORIZONTAL", 0, 8);
  close.counterAxisAlignItems = "CENTER";
  close.primaryAxisAlignItems = "CENTER";
  const closeText = addText(close, "Icon", "×", 24, "Regular", C.text, 24, 28);
  closeText.textAlignHorizontal = "CENTER";
  head.appendChild(close);
  panel.appendChild(head);

  ["Главная", "Курсы", "Форум"].forEach((label) => menuItem(panel, label));
  menuItem(panel, "Сообщество", "active");
  const divider = fixedFrame("Divider", 244, 1, C.line, 0);
  panel.appendChild(divider);
  ["Сообщения", "Достижения", "Приложения", "Контакты", "Профиль", "Настройки"].forEach((label) => menuItem(panel, label));
  return overlayCanvas("Overlay / Главное меню", panel, "LEFT");
}

function postContextOverlay() {
  const panel = popupFrame("Panel / Действия публикации / Bottom sheet", 360);
  panel.topLeftRadius = 18;
  panel.topRightRadius = 18;
  const handle = fixedFrame("Drag handle", 44, 4, "#C7CCD0", 2);
  panel.appendChild(handle);
  addText(panel, "Title", "Действия с публикацией", 18, "Bold", C.text, 328, 24);
  menuItem(panel, "Пожаловаться", "danger");
  menuItem(panel, "Скрыть публикацию");
  menuItem(panel, "Отмена");
  return overlayCanvas("Overlay / Действия публикации / Bottom sheet", panel, "BOTTOM");
}

function reportDialogOverlay() {
  const panel = popupFrame("Panel / Жалоба", 328);
  addText(panel, "Title", "Пожаловаться на публикацию", 20, "Bold", C.text, 296, 26);
  addText(panel, "Body", "Выберите причину. Автор не увидит, кто отправил жалобу.", 14, "Regular", C.muted, 296, 20);
  ["Спам или повтор", "Оскорбление", "Опасный совет"].forEach((label, index) => {
    const option = fixedFrame(`Report reason / ${label}`, 296, 44, index === 0 ? C.blueSoft : C.surface2, 8);
    applyAuto(option, "HORIZONTAL", 10, 10);
    option.counterAxisAlignItems = "CENTER";
    const radio = fixedFrame("Radio", 18, 18, index === 0 ? C.blue : C.surface, 9);
    radio.strokes = [solid(index === 0 ? C.blue : C.line)];
    radio.strokeWeight = 1;
    option.appendChild(radio);
    addText(option, "Label", label, 14, "Medium", C.text, 244, 20);
    keepFixed(option, 296, 44);
    panel.appendChild(option);
  });
  panel.appendChild(button("Отправить жалобу", "primary", 180));
  panel.appendChild(button("Отмена", "ghost", 120));
  return overlayCanvas("Overlay / Жалоба", panel, "CENTER");
}

function reportSuccessOverlay() {
  const panel = popupFrame("Panel / Жалоба отправлена", 328, C.greenSoft);
  addText(panel, "Eyebrow", "Готово", 13, "Bold", C.primaryDark, 296, 18);
  addText(panel, "Title", "Жалоба отправлена", 21, "Bold", C.text, 296, 28);
  addText(panel, "Body", "Мы проверим публикацию. Её можно скрыть из вашей ленты уже сейчас.", 14, "Regular", C.muted, 296, 20);
  panel.appendChild(button("Вернуться в ленту", "primary", 184));
  return overlayCanvas("Overlay / Жалоба отправлена", panel, "CENTER");
}

function actionErrorOverlay() {
  const panel = popupFrame("Panel / Ошибка отправки отклика", 328, C.redSoft);
  addText(panel, "Eyebrow", "Отклик не отправлен", 13, "Bold", C.red, 296, 18);
  addText(panel, "Title", "Не удалось отправить", 21, "Bold", C.text, 296, 28);
  addText(panel, "Body", "Проверьте соединение. Текст отклика сохранён и откроется в форме.", 14, "Regular", C.muted, 296, 20);
  panel.appendChild(button("Повторить", "primary", 148));
  panel.appendChild(button("Вернуться к отклику", "ghost", 196));
  return overlayCanvas("Overlay / Ошибка отправки отклика", panel, "CENTER");
}

function interactionSpec(title, trigger, close, destination, child) {
  const width = Math.max(392, child.width + 32);
  const node = makeFrame(`Interaction spec / ${title}`, width, 10, C.surface, 8);
  applyAuto(node, "VERTICAL", 12, 16);
  node.counterAxisSizingMode = "FIXED";
  node.primaryAxisSizingMode = "AUTO";
  node.strokes = [solid(C.line)];
  node.strokeWeight = 1;
  node.effects = shadow(10, 24, 0.08);

  addText(node, "Title", title, 19, "Bold", C.text, width - 32, 25);
  const meta = column("Interaction metadata", 6, 0);
  addText(meta, "Trigger", `Триггер: ${trigger}`, 13, "Semi Bold", C.primaryDark, width - 32, 19);
  addText(meta, "Close", `Закрытие/назад: ${close}`, 13, "Regular", C.muted, width - 32, 19);
  addText(meta, "Destination", `Назначение: ${destination}`, 13, "Regular", C.muted, width - 32, 19);
  node.appendChild(meta);
  node.appendChild(child);
  return node;
}

function interactionNotes() {
  const node = popupFrame("Interaction rules / NeuroMir patterns", 500);
  addText(node, "Title", "Переходы и всплывающие меню", 24, "Bold", C.text, 468, 31);
  const rules = [
    "Бургер открывает меню поверх экрана; закрытие — крестик или клик вне панели.",
    "Основной CTA ведёт к отклику, публикация — к подтверждению с +20 нейро.",
    "Меню публикации открывается по троеточию и не показывает админские действия.",
    "Жалоба подтверждается отдельным окном, после отправки есть понятный возврат.",
    "Переходы между экранами — Smart Animate 200 мс; меню — Move in слева 220 мс; bottom sheet — Move in снизу 200 мс."
  ];
  rules.forEach((rule, index) => {
    const rowNode = row(`Rule ${index + 1}`, 10, 0);
    const marker = fixedFrame("Marker", 28, 28, index % 2 === 0 ? C.blueSoft : C.greenSoft, 14);
    addText(marker, "Index", String(index + 1), 13, "Bold", index % 2 === 0 ? C.blue : C.primaryDark, 18, 18);
    rowNode.appendChild(marker);
    addText(rowNode, "Text", rule, 14, "Regular", C.muted, 410, 20);
    node.appendChild(rowNode);
  });
  return node;
}

function nodeAction(destination, navigation = "NAVIGATE", transition = "SMART_ANIMATE", duration = 0.2, direction = null) {
  const transitionData = direction
    ? { type: transition, direction, matchLayers: false, easing: { type: "EASE_OUT" }, duration }
    : { type: transition, easing: { type: "EASE_OUT" }, duration };
  const action = {
    type: "NODE",
    destinationId: destination.id,
    navigation,
    transition: transitionData,
    resetScrollPosition: true
  };
  return action;
}

async function onClick(node, action) {
  if (!node || !node.setReactionsAsync) return;
  try {
    await node.setReactionsAsync([{ trigger: { type: "ON_CLICK" }, actions: [action] }]);
  } catch (error) {
    const destination = action.destinationId ? await figma.getNodeByIdAsync(action.destinationId) : null;
    const destinationParent = destination && destination.parent ? destination.parent.type : "none";
    throw new Error(
      `Prototype link failed: ${node.name} -> ${destination ? destination.name : action.destinationId} (destination parent: ${destinationParent}). ${error.message || error}`
    );
  }
}

async function closeOnClick(node) {
  if (!node || !node.setReactionsAsync) return;
  await node.setReactionsAsync([{ trigger: { type: "ON_CLICK" }, actions: [{ type: "CLOSE" }] }]);
}

function requiredNode(root, name, context = root.name) {
  const node = root.findOne((candidate) => candidate.name === name);
  if (!node) throw new Error(`Missing prototype node "${name}" in "${context}"`);
  return node;
}

async function wirePrototype(flow) {
  const jobs = [];
  const communityScreens = [
    flow.feed,
    flow.response,
    flow.challenge,
    flow.friends,
    flow.success,
    flow.quality,
    flow.empty,
    flow.shortError,
    flow.repeatError,
    flow.supportSuccess,
    flow.repostSuccess
  ];
  const allScreens = [...communityScreens, flow.home, flow.study];
  communityScreens.forEach((screen) => {
    jobs.push(onClick(
      requiredNode(screen, "Icon / Menu"),
      nodeAction(flow.menu, "OVERLAY", "MOVE_IN", 0.22, "LEFT", { x: 0, y: 0 })
    ));
  });

  const tabTargets = { Лента: flow.feed, Челленджи: flow.challenge, Друзья: flow.friends };
  communityScreens.forEach((screen) => {
    Object.entries(tabTargets).forEach(([label, target]) => {
      if (target !== screen) {
        jobs.push(onClick(requiredNode(screen, `Tab / ${label}`), nodeAction(target)));
      }
    });
  });

  [
    requiredNode(flow.feed, "Button / Оставить отклик"),
    requiredNode(flow.feed, "Button / Ответить")
  ].forEach((node) => jobs.push(onClick(node, nodeAction(flow.response))));
  jobs.push(onClick(requiredNode(flow.feed, "Button / В свою ленту"), nodeAction(flow.repostSuccess)));

  jobs.push(onClick(requiredNode(flow.response, "Button / ← Назад к ленте"), nodeAction(flow.feed)));
  jobs.push(onClick(requiredNode(flow.response, "Button / Опубликовать отклик"), nodeAction(flow.success)));
  jobs.push(onClick(requiredNode(flow.validation, "Button / Сценарий / Валидный отклик"), nodeAction(flow.success)));
  jobs.push(onClick(requiredNode(flow.validation, "Button / Сценарий / Короткий отклик"), nodeAction(flow.shortError)));
  jobs.push(onClick(requiredNode(flow.validation, "Button / Сценарий / Повторный отклик"), nodeAction(flow.repeatError)));
  jobs.push(onClick(
    requiredNode(flow.validation, "Button / Сценарий / Ошибка сети"),
    nodeAction(flow.error, "OVERLAY", "DISSOLVE", 0.16, null, { x: 0, y: 0 })
  ));

  [flow.shortError, flow.repeatError].forEach((screen) => {
    jobs.push(onClick(requiredNode(screen, "Button / ← Назад к форме"), nodeAction(flow.response)));
    jobs.push(onClick(requiredNode(screen, "Button / Исправить отклик"), nodeAction(flow.response)));
  });
  jobs.push(onClick(requiredNode(flow.quality, "Button / Исправить отклик"), nodeAction(flow.response)));
  jobs.push(onClick(requiredNode(flow.empty, "Button / Оставить первый отклик"), nodeAction(flow.response)));
  jobs.push(onClick(requiredNode(flow.challenge, "Button / Продолжить цель"), nodeAction(flow.response)));
  jobs.push(onClick(requiredNode(flow.friends, "Button / Позвать в челлендж"), nodeAction(flow.challenge)));

  [
    requiredNode(flow.feed, "Button / Поддержу"),
    requiredNode(flow.friends, "Button / Поддержать"),
    requiredNode(flow.success, "Button / Поддержать участника")
  ].forEach((node) => jobs.push(onClick(node, nodeAction(flow.supportSuccess))));
  jobs.push(onClick(requiredNode(flow.supportSuccess, "Button / Вернуться в ленту"), nodeAction(flow.feed)));
  jobs.push(onClick(requiredNode(flow.repostSuccess, "Button / Вернуться в ленту"), nodeAction(flow.feed)));

  allScreens.forEach((screen) => {
    if (screen !== flow.home) jobs.push(onClick(requiredNode(screen, "Bottom nav / Главная"), nodeAction(flow.home)));
    if (screen !== flow.feed) jobs.push(onClick(requiredNode(screen, "Bottom nav / Сообщество"), nodeAction(flow.feed)));
    if (screen !== flow.study) jobs.push(onClick(requiredNode(screen, "Bottom nav / Учёба"), nodeAction(flow.study)));
  });
  [flow.home, flow.study].forEach((screen) => {
    jobs.push(onClick(requiredNode(screen, "Button / Вернуться в сообщество"), nodeAction(flow.feed)));
  });

  jobs.push(onClick(
    requiredNode(flow.feed, "Icon / More"),
    nodeAction(flow.context, "OVERLAY", "MOVE_IN", 0.2, "BOTTOM", { x: 0, y: 0 })
  ));

  jobs.push(closeOnClick(requiredNode(flow.menu, "Overlay background / Close")));
  jobs.push(closeOnClick(requiredNode(flow.menu, "Button / Закрыть меню")));
  jobs.push(closeOnClick(requiredNode(flow.menu, "Menu item / Сообщество")));
  jobs.push(onClick(requiredNode(flow.menu, "Menu item / Главная"), nodeAction(flow.home)));
  jobs.push(onClick(requiredNode(flow.menu, "Menu item / Курсы"), nodeAction(flow.study)));
  ["Форум", "Сообщения", "Достижения", "Приложения", "Контакты", "Профиль", "Настройки"].forEach((label) => {
    jobs.push(closeOnClick(requiredNode(flow.menu, `Menu item / ${label}`)));
  });
  jobs.push(closeOnClick(requiredNode(flow.context, "Overlay background / Close")));
  jobs.push(onClick(requiredNode(flow.context, "Menu item / Пожаловаться"), nodeAction(flow.report, "SWAP", "DISSOLVE", 0.16)));
  jobs.push(closeOnClick(requiredNode(flow.context, "Menu item / Скрыть публикацию")));
  jobs.push(closeOnClick(requiredNode(flow.context, "Menu item / Отмена")));
  jobs.push(closeOnClick(requiredNode(flow.report, "Overlay background / Close")));
  jobs.push(onClick(requiredNode(flow.report, "Button / Отправить жалобу"), nodeAction(flow.reportSuccess, "SWAP", "DISSOLVE", 0.18)));
  jobs.push(closeOnClick(requiredNode(flow.report, "Button / Отмена")));
  jobs.push(closeOnClick(requiredNode(flow.reportSuccess, "Overlay background / Close")));
  jobs.push(closeOnClick(requiredNode(flow.reportSuccess, "Button / Вернуться в ленту")));
  jobs.push(closeOnClick(requiredNode(flow.error, "Overlay background / Close")));
  jobs.push(onClick(requiredNode(flow.error, "Button / Повторить"), nodeAction(flow.response)));
  jobs.push(onClick(requiredNode(flow.error, "Button / Вернуться к отклику"), nodeAction(flow.response)));

  await Promise.all(jobs);
  return jobs.length;
}

function desktopHandoffFrame() {
  const frame = fixedFrame("Desktop handoff / Community layout", 880, 879, C.app, 28);
  frame.clipsContent = true;
  frame.strokes = [solid("#CCD7D2")];
  frame.strokeWeight = 1;
  frame.effects = shadow(14, 30, 0.1);
  applyAuto(frame, "VERTICAL", 0, 0);

  const top = fixedFrame("Desktop top bar", 880, 72, C.surface, 0);
  applyAuto(top, "HORIZONTAL", 18, 22);
  top.counterAxisAlignItems = "CENTER";
  addText(top, "Title", "Сообщество", 25, "Bold", C.text, 230, 32);
  top.appendChild(chip("Лента", "blue"));
  top.appendChild(chip("Челленджи", "default"));
  top.appendChild(chip("Друзья", "default"));
  const spacer = fixedFrame("Spacer", 160, 1, null, 0);
  top.appendChild(spacer);
  top.appendChild(chip("850 нейро", "blue"));
  keepFixed(top, 880, 72);
  frame.appendChild(top);

  const content = makeFrame("Desktop content", 880, 10, null, 0);
  applyAuto(content, "HORIZONTAL", 20, 24, "FIXED", "AUTO");
  content.resize(880, 10);

  const feed = column("Center feed", 14, 0);
  keepFixedWidth(feed, 528);
  const goal = card("Desktop / Daily goal", 528, C.surface2, "#C7E7DD");
  addText(goal, "Title", "Цель дня: оставить осмысленный отклик", 24, "Bold", C.text, 496, 31);
  addText(goal, "Body", "Горизонтальный блок над лентой остаётся видимым и не растягивает карточки на всю ширину.", 15, "Regular", C.muted, 496, 22);
  goal.appendChild(progress(496, 0.34));
  feed.appendChild(goal);

  const post = card("Desktop / Post card", 528);
  addText(post, "Label", "Афоризм дня · НейроКафе", 14, "Bold", C.primaryDark, 496, 19);
  addText(post, "Text", "Смысл проявляется там, где мы замечаем связь между действием и состоянием.", 22, "Semi Bold", C.text, 496, 29);
  addText(post, "Benefit", "Поддержка помогает автору закрыть челлендж, а отклик сохраняет вашу серию.", 15, "Regular", C.muted, 496, 22);
  const actions = row("Desktop actions", 10, 0);
  actions.appendChild(button("Откликнуться", "primary", 150));
  actions.appendChild(button("Поддержать", "blue", 132));
  actions.appendChild(button("В свою ленту", "ghost", 128));
  post.appendChild(actions);
  feed.appendChild(post);
  content.appendChild(feed);

  const aside = column("Right context", 14, 0);
  keepFixedWidth(aside, 284);
  const streak = card("Desktop / Streak", 284, C.surface, C.line);
  addText(streak, "Title", "Серия", 19, "Bold", C.text, 252, 25);
  addText(streak, "Body", "1 из 3 действий сегодня", 14, "Regular", C.muted, 252, 20);
  streak.appendChild(progress(252, 0.34, C.blue));
  aside.appendChild(streak);
  const challenge = card("Desktop / Challenge", 284, C.amberSoft, C.amberLine);
  addText(challenge, "Title", "Ваш вызов", 19, "Bold", C.text, 252, 25);
  addText(challenge, "Body", "Причина: 2 отклика за неделю. Цель: 5 откликов с поддержкой.", 14, "Regular", C.muted, 252, 20);
  aside.appendChild(challenge);
  const friend = card("Desktop / Friend support", 284, C.greenSoft, "#B9DEC9");
  addText(friend, "Title", "Кого поддержать", 19, "Bold", C.text, 252, 25);
  addText(friend, "Body", "Ольге нужна 1 поддержка до закрытия дня.", 14, "Regular", C.muted, 252, 20);
  friend.appendChild(button("Поддержать", "primary", 132));
  aside.appendChild(friend);
  content.appendChild(aside);

  frame.appendChild(content);
  keepFixed(frame, 880, 879);
  return frame;
}

function launchMaterialsBlock() {
  const node = makeFrame("Launch/admin materials / separate from user UI", 1100, 10, C.surface, 8);
  applyAuto(node, "VERTICAL", 16, 24);
  node.strokes = [solid(C.line)];
  node.strokeWeight = 1;
  node.effects = shadow(14, 28, 0.09);
  addText(node, "Title", "Launch/admin materials stay outside the user phone", 28, "Bold", C.text, 1048, 36);
  addText(node, "Body", "Письмо, баннер и push нужны для запуска, но в пользовательской навигации остаются только Лента, Челленджи и Друзья.", 17, "Regular", C.muted, 1048, 25);
  const grid = row("Launch copy cards", 14, 0);
  [
    ["Email", "Тема: НейроКафе открывает сообщество практики", "Где использовать: email перед запуском раздела."],
    ["Banner", "Публикуйте инсайты. Собирайте достижения.", "Где использовать: баннер на главном экране приложения."],
    ["Push", "Сегодня в ленте новый афоризм", "Где использовать: мягкий возврат к первому отклику."]
  ].forEach(([label, title, body]) => {
    const item = card(`Launch / ${label}`, 330, label === "Banner" ? C.amberSoft : C.surface, label === "Banner" ? C.amberLine : C.line);
    addText(item, "Label", label, 13, "Bold", C.primaryDark, 298, 18);
    addText(item, "Title", title, 19, "Bold", C.text, 298, 25);
    addText(item, "Body", body, 14, "Regular", C.muted, 298, 20);
    grid.appendChild(item);
  });
  node.appendChild(grid);
  return node;
}

function notesBlock() {
  const node = makeFrame("UX logic notes", 460, 10, C.surface, 8);
  applyAuto(node, "VERTICAL", 18, 24);
  node.strokes = [solid(C.line)];
  node.strokeWeight = 1;
  node.effects = shadow(14, 28, 0.09);
  addText(node, "Title", "UX logic notes", 30, "Bold", C.text, 412, 38);
  const points = [
    ["First meaningful action", "Главный экран ведет к первому отклику, а не к административным кнопкам копирования."],
    ["Rewards for meaningful behavior", "Нейро начисляются за осмысленный комментарий, поддержку и серию, а не за механическое нажатие."],
    ["Empty states seeded by instructors", "Первые посты и примеры должны идти от инструкторов, чтобы задать тон общения."],
    ["Moderation and quality guardrails", "Нужны ограничения повторов, жалобы, подсказки и проверка качества откликов."],
    ["Analytics events", "Отдельно измеряем открытие сообщества, старт цели, отправку отклика, поддержку и возврат из push."],
    ["Desktop handoff", "Широкий экран использует центральную ленту и правый контекст, без растянутых карточек и launch-вкладки."],
    ["Owner routing", "Если проверка находит замечание, оно уходит дизайнеру, продукту, разработке или запуску по типу решения."]
  ];
  points.forEach(([title, body], index) => {
    const item = row(`Note ${index + 1}`, 12, 0);
    const marker = fixedFrame("Marker", 32, 32, index % 2 === 0 ? C.greenSoft : C.blueSoft, 16);
    addText(marker, "Index", String(index + 1), 15, "Bold", index % 2 === 0 ? C.primaryDark : C.blue, 22, 20);
    item.appendChild(marker);
    const text = column("Text", 4, 0);
    addText(text, "Note title", title, 17, "Bold", C.text, 340, 23);
    addText(text, "Note body", body, 14, "Regular", C.muted, 340, 20);
    item.appendChild(text);
    node.appendChild(item);
  });
  return node;
}

async function main() {
  fonts.Regular = await loadFont("Regular");
  fonts.Medium = await loadFont("Medium");
  fonts["Semi Bold"] = await loadFont("Semi Bold");
  fonts.Bold = await loadFont("Bold");

  if (figma.loadAllPagesAsync) {
    await figma.loadAllPagesAsync();
  }

  const targetPage = figma.root.children.find((page) => page.name === "Главная") || figma.currentPage;
  await figma.setCurrentPageAsync(targetPage);

  const existing = targetPage.findAll((node) => node.name === WRAPPER_NAME);
  targetPage.findAll((node) => node.name === TEMP_WRAPPER_NAME).forEach((node) => node.remove());
  targetPage.children
    .filter((node) => node.name.startsWith(FLOW_PREFIX))
    .forEach((node) => node.remove());

  buildInProgress = true;
  createdDuringBuild = [];
  const wrapper = makeFrame(TEMP_WRAPPER_NAME, 2260, 1080, "#E8EBE5", 28);
  pendingWrapper = wrapper;
  wrapper.x = 5200;
  wrapper.y = -1765;
  applyAuto(wrapper, "VERTICAL", 28, 32);
  wrapper.resize(2260, 1080);
  wrapper.counterAxisSizingMode = "FIXED";
  wrapper.primaryAxisSizingMode = "AUTO";
  wrapper.strokes = [solid(C.line)];
  wrapper.strokeWeight = 1;

  const header = makeFrame("Header", 2196, 10, C.surface, 8);
  applyAuto(header, "VERTICAL", 8, 24);
  header.resize(2196, 10);
  header.counterAxisSizingMode = "FIXED";
  header.primaryAxisSizingMode = "AUTO";
  header.strokes = [solid(C.line)];
  header.strokeWeight = 1;
  addText(header, "Eyebrow", "НейроКафе · соцсеть практики", 15, "Bold", C.primaryDark, 2148, 21);
  addText(header, "Title", "Сообщество в визуальной системе НейроМира", 32, "Bold", C.text, 1600, 40);
  addText(header, "Subtitle", "Единая шапка, вкладки, карточки, нижняя навигация, переходы и всплывающие меню. Пользователь видит только действия своей практики.", 17, "Regular", C.muted, 1800, 24);
  const status = makeFrame("Status note", 360, 10, C.surface, 8);
  applyAuto(status, "VERTICAL", 8, 18);
  status.strokes = [solid(C.line)];
  status.strokeWeight = 1;
  addText(status, "Label", "Статус", 14, "Bold", C.primaryDark, 320, 20);
  addText(status, "Text", "Интерактивный прототип для независимой проверки. Админские кнопки в пользовательском UI отсутствуют.", 14, "Regular", C.muted, 320, 20);
  const statusRow = row("Status row", 12, 0);
  statusRow.appendChild(status);
  statusRow.appendChild(chip("392 px · mobile", "blue"));
  statusRow.appendChild(chip("Prototype connected", "green"));
  header.appendChild(statusRow);
  wrapper.appendChild(header);

  const feedScreen = screenFeed();
  const responseScreen = screenResponse();
  const challengeScreen = screenChallenge();
  const friendsScreen = screenFriends();
  const successScreen = screenResponseSuccess();
  const qualityScreen = screenQualityStates();
  const emptyScreen = screenEmptyFeed();
  const shortErrorScreen = screenResponseError(
    "06A Состояние / Короткий отклик",
    "Отклик слишком короткий",
    "Добавьте 1-2 предложения: личное наблюдение, связь с материалом или следующий шаг.",
    "error"
  );
  const repeatErrorScreen = screenResponseError(
    "06B Состояние / Повторный отклик",
    "Похоже на повтор",
    "Нейро не начисляются за одинаковые ответы. Переформулируйте мысль через сегодняшний материал.",
    "warning"
  );
  const supportSuccessScreen = screenSupportSuccess();
  const repostSuccessScreen = screenRepostSuccess();
  const validationRoutes = formValidationRoutes();
  const homeDestination = handoffDestination(
    "10 Переход / Главная",
    "Главная",
    "Здесь продолжается существующий главный экран НейроМира. Нижняя навигация сохраняет выбранный раздел.",
    "Главная"
  );
  const studyDestination = handoffDestination(
    "11 Переход / Учёба",
    "Учёба",
    "Здесь продолжается существующий раздел курсов и практик. Возврат в сообщество доступен из нижней навигации.",
    "Учёба"
  );
  const menuOverlay = burgerMenuOverlay();
  const contextOverlay = postContextOverlay();
  const reportOverlay = reportDialogOverlay();
  const reportSuccess = reportSuccessOverlay();
  const actionError = actionErrorOverlay();

  addText(wrapper, "Section title / Основные экраны", "Основные экраны", 22, "Bold", C.text, 2196, 29);
  const body = row("Screens and notes", 32, 0);
  body.appendChild(feedScreen.clone());
  body.appendChild(responseScreen.clone());
  body.appendChild(challengeScreen.clone());
  body.appendChild(friendsScreen.clone());
  body.appendChild(interactionNotes());
  wrapper.appendChild(body);

  addText(wrapper, "Section title / Состояния и desktop", "Обязательные состояния и desktop handoff", 22, "Bold", C.text, 2196, 29);
  const states = row("Required states and desktop handoff", 32, 0);
  states.appendChild(successScreen.clone());
  states.appendChild(qualityScreen.clone());
  states.appendChild(emptyScreen.clone());
  states.appendChild(desktopHandoffFrame());
  wrapper.appendChild(states);

  addText(wrapper, "Section title / Проверка формы", "Маршруты проверки формы и поддержки", 22, "Bold", C.text, 2196, 29);
  const validationStates = row("Validation routes and support states", 24, 0);
  validationStates.appendChild(shortErrorScreen.clone());
  validationStates.appendChild(repeatErrorScreen.clone());
  validationStates.appendChild(supportSuccessScreen.clone());
  validationStates.appendChild(repostSuccessScreen.clone());
  validationStates.appendChild(validationRoutes.clone());
  wrapper.appendChild(validationStates);

  addText(wrapper, "Section title / Нижняя навигация", "Назначения нижней навигации", 22, "Bold", C.text, 2196, 29);
  const navDestinations = row("Bottom navigation destinations", 24, 0);
  navDestinations.appendChild(homeDestination.clone());
  navDestinations.appendChild(studyDestination.clone());
  wrapper.appendChild(navDestinations);

  addText(wrapper, "Section title / Переходы", "Переходы и всплывающие меню", 22, "Bold", C.text, 2196, 29);
  const overlaySpecs = row("Prototype overlays / triggers and destinations", 24, 0);
  overlaySpecs.appendChild(interactionSpec(
    "Burger / навигация",
    "нажатие на иконку меню в шапке",
    "крестик, тап вне панели или пункт «Сообщество»",
    "выбранный раздел приложения",
    menuOverlay.clone()
  ));
  overlaySpecs.appendChild(interactionSpec(
    "Действия публикации",
    "троеточие в карточке",
    "«Отмена» или тап вне bottom sheet",
    "жалоба, скрытие или возврат в ленту",
    contextOverlay.clone()
  ));
  overlaySpecs.appendChild(interactionSpec(
    "Подтверждение жалобы",
    "пункт «Пожаловаться»",
    "«Отмена» возвращает к публикации",
    "feedback об отправке жалобы",
    reportOverlay.clone()
  ));
  overlaySpecs.appendChild(notesBlock());
  wrapper.appendChild(overlaySpecs);

  const feedbackSpecs = row("Prototype feedback / success and error", 24, 0);
  feedbackSpecs.appendChild(interactionSpec(
    "Успешная отправка",
    "подтверждение формы или жалобы",
    "кнопка возвращает в ленту",
    "лента с сохранённым состоянием",
    reportSuccess.clone()
  ));
  feedbackSpecs.appendChild(interactionSpec(
    "Ошибка отправки",
    "ошибка сети после отправки",
    "возврат к сохранённому тексту",
    "повтор запроса или экран отклика",
    actionError.clone()
  ));
  wrapper.appendChild(feedbackSpecs);

  wrapper.appendChild(launchMaterialsBlock());

  targetPage.appendChild(wrapper);
  const prototypeFrames = [
    feedScreen,
    responseScreen,
    challengeScreen,
    friendsScreen,
    successScreen,
    qualityScreen,
    emptyScreen,
    shortErrorScreen,
    repeatErrorScreen,
    supportSuccessScreen,
    repostSuccessScreen,
    homeDestination,
    studyDestination,
    validationRoutes,
    menuOverlay,
    contextOverlay,
    reportOverlay,
    reportSuccess,
    actionError
  ];
  prototypeFrames.forEach((node, index) => {
    node.name = `${FLOW_PREFIX}${node.name}`;
    node.x = 7600 + (index % 6) * 440;
    node.y = -1765 + Math.floor(index / 6) * 960;
    targetPage.appendChild(node);
  });
  const connectionCount = await wirePrototype({
    feed: feedScreen,
    response: responseScreen,
    challenge: challengeScreen,
    friends: friendsScreen,
    success: successScreen,
    quality: qualityScreen,
    empty: emptyScreen,
    shortError: shortErrorScreen,
    repeatError: repeatErrorScreen,
    supportSuccess: supportSuccessScreen,
    repostSuccess: repostSuccessScreen,
    validation: validationRoutes,
    home: homeDestination,
    study: studyDestination,
    menu: menuOverlay,
    context: contextOverlay,
    report: reportOverlay,
    reportSuccess,
    error: actionError
  });

  const seenFlowNodes = new Set();
  const otherFlowStarts = targetPage.flowStartingPoints.filter((point) => {
    if (point.name === "NeuroCafe Сообщество" || point.nodeId === feedScreen.id || seenFlowNodes.has(point.nodeId)) {
      return false;
    }
    seenFlowNodes.add(point.nodeId);
    return true;
  });
  targetPage.flowStartingPoints = [
    { nodeId: feedScreen.id, name: "NeuroCafe Сообщество" },
    ...otherFlowStarts
  ];

  wrapper.name = WRAPPER_NAME;
  existing.forEach((node) => node.remove());
  const legacy = await figma.getNodeByIdAsync(LEGACY_NODE_ID);
  if (legacy && "visible" in legacy) legacy.visible = false;
  pendingWrapper = null;
  buildInProgress = false;
  createdDuringBuild = [];

  figma.currentPage.selection = [wrapper];
  figma.viewport.scrollAndZoomIntoView([wrapper]);

  figma.notify(`NeuroCafe proposal updated: ${connectionCount} prototype connections added.`);
  figma.closePlugin();
}

main().catch((error) => {
  if (pendingWrapper && pendingWrapper.parent) {
    try {
      pendingWrapper.remove();
    } catch (cleanupError) {
      // Continue cleanup of any top-level nodes created before the failure.
    }
  }
  for (let index = createdDuringBuild.length - 1; index >= 0; index -= 1) {
    const node = createdDuringBuild[index];
    try {
      if (node && node.parent && node.parent.type === "PAGE") node.remove();
    } catch (cleanupError) {
      // Removed with the temporary wrapper or no longer available.
    }
  }
  pendingWrapper = null;
  buildInProgress = false;
  createdDuringBuild = [];
  const message = error && error.message ? error.message : String(error);
  figma.notify(`NeuroCafe proposal failed: ${message}`);
  figma.closePlugin(message);
});
