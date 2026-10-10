const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const fa = require("react-icons/fa");
const gi = require("react-icons/gi");
const buildArt = require("./art");
const { applyTheme } = require(process.env.SKILL_DIR + "/scripts/apply_theme.js");

const OUT = process.argv[2] || "Sowing-the-Best.pptx";

const THEME = {
  name: "Harvest",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1A1A1A", lt1: "FFFFFF", dk2: "1E4D2B", lt2: "EEF5EA",
    accent1: "E0A93B", accent2: "4E8B4A", accent3: "2E86AB",
    accent4: "C8553D", accent5: "7B5EA7", accent6: "8C6239",
    hlink: "2E86AB", folHlink: "7B5EA7",
  },
};

async function icon(Comp, color = "#FFFFFF", size = 512) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const IMG = await buildArt();
  const img = (n) => path.join(IMG, n + ".png");

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
  pres.title = "Sowing the Best";
  pres.subject = "Lesson 8: Sowing the Best";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const SEC = [C.accent1, C.accent2, C.accent3, C.accent4, C.accent5];
  const SEC_HEX = ["E0A93B", "4E8B4A", "2E86AB", "C8553D", "7B5EA7"];

  // ---------- Layouts ----------
  pres.defineSlideMaster({ title: "Dark", background: { path: img("bg_dark") } });
  pres.defineSlideMaster({
    title: "Light Title",
    background: { path: img("bg_light") },
    slideNumber: { x: 12.25, y: 6.95, w: 0.7, h: 0.4, fontSize: 14, color: "5E7A64", align: "right" },
    objects: [{
      placeholder: {
        options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 1.1, fontSize: 40, bold: true, color: C.text2, valign: "middle", margin: 0 },
        text: "Slide title",
      },
    }],
  });
  pres.defineSlideMaster({
    title: "Light Statement",
    background: { path: img("bg_light") },
    slideNumber: { x: 12.25, y: 6.95, w: 0.7, h: 0.4, fontSize: 14, color: "5E7A64", align: "right" },
  });

  // ---------- Icons ----------
  const I = {};
  const want = {
    attitudes: fa.FaSmileBeam, integrity: fa.FaShieldAlt, spirituality: fa.FaPray, discipline: fa.FaDumbbell, image: fa.FaCrown,
    words: fa.FaCommentDots, works: fa.FaHandsHelping, kind: fa.FaHeart, godly: fa.FaCompass, scale: fa.FaBalanceScale,
    ban: fa.FaBan, home: fa.FaHome, school: fa.FaSchool, work: fa.FaBriefcase, prayer: fa.FaPrayingHands, bible: fa.FaBible,
    cross: fa.FaCross, cell: fa.FaUsers, hand: fa.FaHandPaper, tasks: fa.FaTasks, target: fa.FaBullseye, run: fa.FaRunning,
    dove: fa.FaDove, thumbs: fa.FaThumbsUp, smile: fa.FaSmile, eye: fa.FaEye, finger: fa.FaFingerprint, gem: fa.FaGem,
    star: fa.FaStar, trophy: fa.FaTrophy, mountain: fa.FaMountain, womb: fa.FaHandHoldingHeart, lion: gi.GiLion,
    meditate: gi.GiMeditation, sprout: gi.GiSprout, wheat: gi.GiWheat,
  };
  for (const [k, comp] of Object.entries(want)) I[k] = await icon(comp);
  const arrowGold = await icon(fa.FaArrowRight, "#E0A93B");
  SEC_HEX.forEach(() => {});

  // ---------- Helpers ----------
  const shadow = () => ({ type: "outer", color: "1E4D2B", opacity: 0.18, blur: 10, offset: 3, angle: 90 });
  const T = (slide, text, opts) => slide.addText(text, { isTextBox: true, margin: 0, ...opts });

  function iconCircle(slide, data, x, y, d, fill, name) {
    slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: name || "Icon circle" });
    const pad = d * 0.24;
    slide.addImage({ data, x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, objectName: (name || "Icon") + " glyph" });
  }

  // "Text with [[highlight]]" -> runs
  function rich(str, base, hi) {
    return str.split(/(\[\[.*?\]\])/).filter(Boolean).map((s) =>
      s.startsWith("[[") ? { text: s.slice(2, -2), options: { ...base, ...hi } } : { text: s, options: { ...base } });
  }

  const sectionSlides = [];
  let slideNo = 0;
  function add(masterName, sectionTitle, notes) {
    const s = pres.addSlide({ masterName, sectionTitle });
    slideNo++;
    if (notes) s.addNotes(notes);
    return s;
  }

  function verseSlide(section, { ref, text, iconKey, color, size = 30, notes }) {
    const s = add("Dark", section, notes || `${ref}: ${text.replace(/\[\[|\]\]/g, "")}`);
    T(s, "“", { x: 0.7, y: 0.25, w: 1.6, h: 1.6, fontSize: 150, fontFace: "Cambria", bold: true, color, objectName: "Quote mark" });
    s.addText(rich(text, { fontSize: size, color: C.background1, fontFace: "Cambria" }, { color: C.accent1, bold: true }),
      { x: 0.9, y: 1.4, w: 9.0, h: 4.5, valign: "middle", margin: 0, isTextBox: true, paraSpaceAfter: 6, lineSpacingMultiple: 1.08, objectName: "Verse" });
    T(s, "— " + ref, { x: 0.9, y: 6.05, w: 9.0, h: 0.7, fontSize: 28, bold: true, color: C.accent1, objectName: "Reference" });
    iconCircle(s, I[iconKey], 10.3, 2.45, 2.5, color, "Verse icon");
    return s;
  }

  function divider(n, title, iconKey, notes) {
    const section = `${n}. Sow ${title}`;
    pres.addSection({ title: section });
    const s = add("Dark", section, notes);
    sectionSlides.push(slideNo);
    const col = SEC[n - 1];
    T(s, String(n), { x: 0.6, y: 1.0, w: 3.0, h: 4.6, fontSize: 280, bold: true, fontFace: "Cambria", color: col, align: "center", valign: "middle", objectName: "Section number" });
    T(s, "SOW", { x: 3.8, y: 2.15, w: 5.6, h: 0.7, fontSize: 30, bold: true, charSpacing: 10, color: C.background2, objectName: "Kicker" });
    T(s, title, { x: 3.8, y: 2.85, w: 5.8, h: 2.2, fontSize: 60, bold: true, fontFace: "Cambria", color: C.background1, valign: "top", objectName: "Section title" });
    T(s, `Seed ${n} of 5`, { x: 3.8, y: 5.25, w: 5.6, h: 0.6, fontSize: 24, italic: true, color: C.accent1, objectName: "Progress" });
    iconCircle(s, I[iconKey], 9.75, 2.05, 3.2, col, "Section icon");
    return s;
  }

  function statement(section, { pre, big, color, iconKey, notes, bigSize = 60 }) {
    const s = add("Light Statement", section, notes);
    iconCircle(s, I[iconKey], 0.9, 1.9, 3.4, color, "Statement icon");
    T(s, pre, { x: 5.0, y: 1.3, w: 7.6, h: 2.0, fontSize: 40, fontFace: "Cambria", color: C.text2, valign: "bottom", objectName: "Lead-in" });
    T(s, big, { x: 5.0, y: 3.5, w: 7.6, h: 2.6, fontSize: bigSize, bold: true, fontFace: "Cambria", color, valign: "top", objectName: "Key phrase" });
    return s;
  }

  function subpoint(section, { title, iconKey, ref, text, color, notes }) {
    const s = add("Light Title", section, notes);
    s.addText(title, { placeholder: "title" });
    iconCircle(s, I[iconKey], 0.8, 2.25, 3.0, color, "Point icon");
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.4, y: 1.75, w: 8.3, h: 4.85, rectRadius: 0.2, fill: { color: C.background2 }, line: { type: "none" }, shadow: shadow(), objectName: "Verse card" });
    s.addText(rich(text, { fontSize: 32, color: C.text1 }, { bold: true, color: C.text2 }),
      { x: 4.85, y: 2.0, w: 7.4, h: 3.6, valign: "middle", margin: 0, isTextBox: true, lineSpacingMultiple: 1.05, objectName: "Verse" });
    T(s, ref, { x: 4.85, y: 5.75, w: 7.4, h: 0.6, fontSize: 26, bold: true, color: C.accent4, objectName: "Reference" });
    return s;
  }

  // ======================= SLIDES =======================
  // --- Introduction ---
  pres.addSection({ title: "Introduction" });
  {
    const s = add(null, "Introduction", "Lesson 8: Sowing the Best. Welcome everyone. Today we learn how to sow positive seeds into the lives of our family and friends.");
    s.background = { path: img("hero") };
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.15, w: 6.7, h: 5.2, rectRadius: 0.25, fill: { color: C.text2, transparency: 12 }, line: { type: "none" }, objectName: "Title panel" });
    T(s, "LESSON 8", { x: 1.1, y: 1.6, w: 5.8, h: 0.6, fontSize: 26, bold: true, charSpacing: 10, color: C.accent1 });
    T(s, "Sowing the Best", { x: 1.1, y: 2.25, w: 5.9, h: 2.4, fontSize: 70, bold: true, fontFace: "Cambria", color: C.background1, valign: "top" });
    T(s, "5 seeds that bring a good harvest", { x: 1.1, y: 4.85, w: 5.8, h: 1.0, fontSize: 30, italic: true, color: C.background2 });
  }
  {
    const s = add("Light Statement", "Introduction", "Now that we are healed and delivered from our old life, let us sow positive seeds to our family and friends.");
    s.addText(rich("Now that we are healed and delivered from our old life, let us sow [[positive seeds]] to our family and friends.",
      { fontSize: 40, fontFace: "Cambria", color: C.text2 }, { bold: true, color: C.accent4 }),
      { x: 0.8, y: 1.0, w: 7.3, h: 5.3, valign: "middle", margin: 0, isTextBox: true, lineSpacingMultiple: 1.1, objectName: "Statement" });
    s.addImage({ path: img("sprout"), x: 8.55, y: 1.25, w: 4.3, h: 4.3, objectName: "Sprout illustration" });
  }
  verseSlide("Introduction", { ref: "Galatians 6:7 (NIV)", text: "Do not be deceived: God cannot be mocked. [[A man reaps what he sows.]]", iconKey: "wheat", color: C.accent1, size: 50 });
  {
    const s = add("Light Title", "Introduction", "If we sow positive things, we will reap a good harvest. What we plant today is what we will harvest tomorrow.");
    s.addText("Sow positive things, reap a good harvest", { placeholder: "title" });
    const stages = [["seed", "SOW", "Plant positive seeds"], ["sprout", "GROW", "Live it every day"], ["wheat", "REAP", "Enjoy a good harvest"]];
    stages.forEach(([pic, head, sub], i) => {
      const cx = 2.25 + i * 4.42;
      s.addImage({ path: img(pic), x: cx - 1.45, y: 1.75, w: 2.9, h: 2.9, objectName: head + " illustration" });
      T(s, head, { x: cx - 1.9, y: 4.85, w: 3.8, h: 0.65, fontSize: 34, bold: true, color: C.text2, align: "center", charSpacing: 4 });
      T(s, sub, { x: cx - 1.9, y: 5.5, w: 3.8, h: 0.6, fontSize: 24, color: C.text1, align: "center" });
      if (i < 2) s.addImage({ data: arrowGold, x: cx + 1.85, y: 2.85, w: 0.7, h: 0.7, objectName: "Arrow" });
    });
  }
  {
    const s = add("Light Title", "Introduction", "Here are 5 things we can start to sow: 1. Positive attitudes, 2. Integrity, 3. Spirituality, 4. Discipline, 5. A correct image.");
    s.addText("Here are 5 things we can start to sow", { placeholder: "title" });
    const items = [["attitudes", "Positive Attitudes"], ["integrity", "Integrity"], ["spirituality", "Spirituality"], ["discipline", "Discipline"], ["image", "A Correct Image"]];
    items.forEach(([k, label], i) => {
      const x = 0.6 + i * 2.48, w = 2.24;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.75, w, h: 4.75, rectRadius: 0.2, fill: { color: C.background1 }, line: { color: "DCEBD5", width: 1 }, shadow: shadow(), objectName: label + " card" });
      iconCircle(s, I[k], x + (w - 1.5) / 2, 2.1, 1.5, SEC[i], label + " icon");
      T(s, String(i + 1), { x, y: 3.75, w, h: 0.9, fontSize: 48, bold: true, fontFace: "Cambria", color: SEC[i], align: "center" });
      T(s, label, { x: x + 0.08, y: 4.7, w: w - 0.16, h: 1.4, fontSize: 24, bold: true, color: C.text2, align: "center", valign: "top" });
    });
  }

  // --- 1. Positive attitudes ---
  divider(1, "Positive Attitudes", "attitudes", "1. Sow positive attitudes. There are three ways we can do this.");
  const S1 = "1. Sow Positive Attitudes";
  subpoint(S1, { title: "I. Be positive in your words", iconKey: "words", color: C.accent1, ref: "Ephesians 4:29 (NIV)",
    text: "Do not let any unwholesome talk come out of your mouths, but only what is [[helpful for building others up]] according to their needs, that it may benefit those who listen." });
  subpoint(S1, { title: "II. Sow good works", iconKey: "works", color: C.accent1, ref: "Matthew 5:16 (NIV)",
    text: "In the same way, let your light shine before men, that they may [[see your good deeds]] and praise your Father in heaven." });
  subpoint(S1, { title: "III. Be kind and loving to others", iconKey: "kind", color: C.accent1, ref: "Ephesians 4:31–32 (NIV)",
    text: "Get rid of all bitterness, rage and anger, brawling and slander, along with every form of malice. [[Be kind and compassionate to one another…]]",
    notes: "III. Be kind and loving in how you relate to others. Ephesians 4:31-32 (NIV): Get rid of all bitterness, rage and anger, brawling and slander, along with every form of malice. Be kind and compassionate to one another..." });

  // --- 2. Integrity ---
  divider(2, "Integrity", "integrity", "2. Sow integrity.");
  const S2 = "2. Sow Integrity";
  verseSlide(S2, { ref: "1 Timothy 4:7–8 (NIV)", iconKey: "godly", color: C.accent2, size: 32,
    text: "Have nothing to do with godless myths and old wives’ tales; rather, [[train yourself to be godly]]. For physical training is of some value, but [[godliness has value for all things]], holding promise for both the present life and the life to come." });
  {
    const s = add("Light Title", S2, "Walking in integrity and godliness. The Bible says, 'Train yourself to be godly.' To be godly means to live a God-centered life. Integrity is the quality of being upright morally.");
    s.addText("Walking in integrity and godliness", { placeholder: "title" });
    T(s, "The Bible says, “Train yourself to be godly.”", { x: 0.6, y: 1.5, w: 12.1, h: 0.75, fontSize: 30, italic: true, fontFace: "Cambria", color: C.accent2 });
    [["godly", "GODLY", "Living a God-centered life"], ["scale", "INTEGRITY", "Being upright morally"]].forEach(([k, head, def], i) => {
      const x = 0.6 + i * 6.2;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.55, w: 5.9, h: 3.95, rectRadius: 0.2, fill: { color: C.background2 }, line: { type: "none" }, shadow: shadow(), objectName: head + " card" });
      iconCircle(s, I[k], x + 0.45, 2.9, 1.5, C.accent2, head + " icon");
      T(s, "To be", { x: x + 2.2, y: 3.05, w: 3.4, h: 0.5, fontSize: 24, italic: true, color: C.text1 });
      T(s, head, { x: x + 2.2, y: 3.5, w: 3.5, h: 0.8, fontSize: 38, bold: true, fontFace: "Cambria", color: C.accent2 });
      T(s, "means", { x: x + 0.45, y: 4.6, w: 5.0, h: 0.5, fontSize: 24, italic: true, color: C.text1 });
      T(s, def, { x: x + 0.45, y: 5.05, w: 5.1, h: 1.2, fontSize: 32, bold: true, color: C.text2, valign: "top" });
    });
  }
  statement(S2, { pre: "To live in integrity means to live on what is right — all the time.", big: "No compromise with sin!", color: C.accent4, iconKey: "ban",
    notes: "To live in integrity means to live on what is right all the time. NO COMPROMISE with sin." });

  // --- 3. Spirituality ---
  divider(3, "Spirituality", "spirituality", "3. Sow spirituality.");
  const S3 = "3. Sow Spirituality";
  {
    const s = add("Dark", S3, "Matthew 5:14 (NLT): You are the light of the world, like a city on a mountain, glowing in the night for all to see.");
    s.background = { path: img("city") };
    T(s, "“", { x: 0.7, y: 0.25, w: 1.6, h: 1.6, fontSize: 150, fontFace: "Cambria", bold: true, color: C.accent1, objectName: "Quote mark" });
    s.addText(rich("[[You are the light of the world]] — like a city on a mountain, glowing in the night for all to see.",
      { fontSize: 38, color: C.background1, fontFace: "Cambria" }, { bold: true, color: C.accent1 }),
      { x: 0.9, y: 1.6, w: 6.4, h: 4.2, valign: "middle", margin: 0, isTextBox: true, lineSpacingMultiple: 1.08, objectName: "Verse" });
    T(s, "— Matthew 5:14 (NLT)", { x: 0.9, y: 6.05, w: 6.4, h: 0.7, fontSize: 28, bold: true, color: C.accent1, objectName: "Reference" });
  }
  {
    const s = add("Light Title", S3, "Sowing spirituality means you are bringing the presence of God into your home, school and workplace.");
    s.addText("Sowing spirituality means…", { placeholder: "title" });
    T(s, "bringing the presence of God into your", { x: 0.6, y: 1.5, w: 12.1, h: 0.75, fontSize: 32, italic: true, fontFace: "Cambria", color: C.accent3 });
    [["home", "Home"], ["school", "School"], ["work", "Workplace"]].forEach(([k, label], i) => {
      const x = 0.6 + i * 4.15;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.6, w: 3.8, h: 3.9, rectRadius: 0.2, fill: { color: C.background1 }, line: { color: "D6E8EF", width: 1 }, shadow: shadow(), objectName: label + " card" });
      iconCircle(s, I[k], x + 0.95, 2.95, 1.9, C.accent3, label + " icon");
      T(s, label, { x, y: 5.15, w: 3.8, h: 0.9, fontSize: 36, bold: true, color: C.text2, align: "center" });
    });
  }
  {
    const s = add("Light Title", S3, "How to sow spirituality? I. Manifest the Christ-like character. II. Bring prayer. III. Bring the Word of God. IV. Bring the cell group into your home, schools, and workplace.");
    s.addText("How to sow spirituality?", { placeholder: "title" });
    const items = [["cross", "I", "Manifest the Christ-like character"], ["prayer", "II", "Bring prayer"], ["bible", "III", "Bring the Word of God"], ["cell", "IV", "Bring the cell group into your home, school & workplace"]];
    items.forEach(([k, num, label], i) => {
      const x = 0.6 + (i % 2) * 6.2, y = 1.7 + Math.floor(i / 2) * 2.5;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.9, h: 2.25, rectRadius: 0.2, fill: { color: C.background2 }, line: { type: "none" }, shadow: shadow(), objectName: num + " card" });
      iconCircle(s, I[k], x + 0.35, y + 0.4, 1.45, C.accent3, num + " icon");
      T(s, num, { x: x + 2.1, y: y + 0.2, w: 3.5, h: 0.5, fontSize: 24, bold: true, color: C.accent3 });
      T(s, label, { x: x + 2.1, y: y + 0.65, w: 3.6, h: 1.45, fontSize: 26, bold: true, color: C.text2, valign: "top" });
    });
  }

  // --- 4. Discipline ---
  divider(4, "Discipline", "discipline", "4. Sow discipline.");
  const S4 = "4. Sow Discipline";
  statement(S4, { pre: "Discipline is", big: "SELF-CONTROL", color: C.accent4, iconKey: "meditate", bigSize: 66, notes: "Discipline is self control." });
  {
    const s = add("Light Title", S4, "Discipline means: Self control; not impulsive and uncontrolled. Order and proper management. Sticking to right priorities and activities.");
    s.addText("Discipline means", { placeholder: "title" });
    const rows = [["hand", "Self-control", "Not impulsive and uncontrolled"], ["tasks", "Order", "Proper management"], ["target", "Priorities", "Sticking to right priorities and activities"]];
    rows.forEach(([k, head, desc], i) => {
      const y = 1.7 + i * 1.6;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 12.1, h: 1.35, rectRadius: 0.2, fill: { color: C.background2 }, line: { type: "none" }, objectName: head + " row" });
      iconCircle(s, I[k], 0.85, y + 0.15, 1.05, C.accent4, head + " icon");
      T(s, head, { x: 2.2, y, w: 3.4, h: 1.35, fontSize: 32, bold: true, color: C.accent4, valign: "middle" });
      T(s, desc, { x: 5.7, y, w: 6.8, h: 1.35, fontSize: 28, color: C.text2, valign: "middle" });
    });
  }
  verseSlide(S4, { ref: "1 Peter 5:8 (NIV)", iconKey: "lion", color: C.accent4, size: 40,
    text: "[[Be self-controlled and alert.]] Your enemy the devil prowls around like a roaring lion looking for someone to devour." });
  verseSlide(S4, { ref: "1 Corinthians 9:27 (NLT)", iconKey: "run", color: C.accent4, size: 36,
    text: "[[I discipline my body like an athlete]], training it to do what it should. Otherwise, I fear that after preaching to others I myself might be disqualified." });

  // --- 5. Correct image ---
  divider(5, "A Correct Image", "image", "5. Sow a correct image.");
  const S5 = "5. Sow A Correct Image";
  statement(S5, { pre: "To sow a correct image is to be", big: "at peace with yourself", color: C.accent5, iconKey: "dove", notes: "To sow a correct image is to be at peace with yourself." });
  {
    const s = add("Light Title", S5, "Having a correct image means: You have a positive self esteem. You feel good about yourself. You have a healthy outlook of who you are in Christ.");
    s.addText("Having a correct image means", { placeholder: "title" });
    [["thumbs", "You have a positive self-esteem"], ["smile", "You feel good about yourself"], ["eye", "You have a healthy outlook of who you are in Christ"]].forEach(([k, t], i) => {
      const y = 1.8 + i * 1.75;
      iconCircle(s, I[k], 0.75, y, 1.3, C.accent5, "Point icon");
      T(s, t, { x: 2.4, y, w: 10.3, h: 1.3, fontSize: 36, bold: true, color: C.text2, valign: "middle" });
    });
  }
  {
    const s = add("Light Title", S5, "You see yourself the way God sees you: unique, precious, lovable and important. You see yourself as a winner in Christ and not a failure.");
    s.addText("See yourself the way God sees you", { placeholder: "title" });
    [["finger", "Unique"], ["gem", "Precious"], ["kind", "Lovable"], ["star", "Important"]].forEach(([k, word], i) => {
      const x = 0.6 + i * 3.1;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.65, w: 2.8, h: 2.75, rectRadius: 0.2, fill: { color: C.background1 }, line: { color: "E2DAF0", width: 1 }, shadow: shadow(), objectName: word + " card" });
      iconCircle(s, I[k], x + 0.75, 1.9, 1.3, C.accent5, word + " icon");
      T(s, word, { x, y: 3.35, w: 2.8, h: 0.8, fontSize: 32, bold: true, color: C.accent5, align: "center" });
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.8, w: 12.1, h: 1.6, rectRadius: 0.2, fill: { color: C.accent5 }, line: { type: "none" }, shadow: shadow(), objectName: "Winner banner" });
    s.addImage({ data: I.trophy, x: 1.0, y: 5.05, w: 1.1, h: 1.1, objectName: "Trophy" });
    s.addText([{ text: "You are a ", options: {} }, { text: "WINNER", options: { bold: true, color: C.accent1 } }, { text: " in Christ — not a failure!", options: {} }],
      { x: 2.5, y: 4.8, w: 10.0, h: 1.6, fontSize: 36, bold: true, color: C.background1, valign: "middle", margin: 0, isTextBox: true });
  }
  verseSlide(S5, { ref: "Psalm 139:13–14 (NIV)", iconKey: "womb", color: C.accent5, size: 34,
    text: "For you created my inmost being; you knit me together in my mother’s womb. I praise you because [[I am fearfully and wonderfully made]]; your works are wonderful, I know that full well." });
  verseSlide(S5, { ref: "Philippians 4:13 (NKJV)", iconKey: "mountain", color: C.accent5, size: 56,
    text: "[[I can do all things]] through Christ who strengthens me." });

  // --- Conclusion ---
  pres.addSection({ title: "Conclusion" });
  {
    const s = add("Dark", "Conclusion", "Summary - Sowing the Best: 1. Sow positive attitudes. 2. Sow integrity. 3. Sow spirituality. 4. Sow discipline. 5. Sow a correct image.");
    T(s, "Sowing the Best", { x: 0.7, y: 0.45, w: 8, h: 1.1, fontSize: 54, bold: true, fontFace: "Cambria", color: C.background1 });
    ["Sow positive attitudes", "Sow integrity", "Sow spirituality", "Sow discipline", "Sow a correct image"].forEach((t, i) => {
      const y = 1.85 + i * 1.0;
      s.addShape(pres.shapes.OVAL, { x: 0.8, y, w: 0.8, h: 0.8, fill: { color: SEC[i] }, line: { type: "none" } });
      T(s, String(i + 1), { x: 0.8, y, w: 0.8, h: 0.8, fontSize: 30, bold: true, color: C.background1, align: "center", valign: "middle" });
      T(s, t, { x: 1.9, y, w: 6.5, h: 0.8, fontSize: 34, color: C.background1, valign: "middle" });
    });
    s.addImage({ path: img("wheat"), x: 8.75, y: 1.6, w: 4.0, h: 4.0, objectName: "Harvest illustration" });
  }
  {
    const s = add(null, "Conclusion", "Closing: A man reaps what he sows. Let us go and sow the best into our family and friends this week.");
    s.background = { path: img("hero") };
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.4, w: 6.7, h: 4.7, rectRadius: 0.25, fill: { color: C.text2, transparency: 12 }, line: { type: "none" }, objectName: "Closing panel" });
    T(s, "A man reaps what he sows.", { x: 1.1, y: 1.85, w: 5.8, h: 1.6, fontSize: 36, italic: true, fontFace: "Cambria", color: C.background2, valign: "top" });
    T(s, "Let’s sow the best!", { x: 1.1, y: 3.4, w: 5.9, h: 2.0, fontSize: 60, bold: true, fontFace: "Cambria", color: C.accent1, valign: "top" });
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  fs.writeFileSync(path.join(__dirname, "sections.json"), JSON.stringify(sectionSlides));
  console.log("wrote", OUT, slideNo, "slides; dividers:", sectionSlides);
})();
