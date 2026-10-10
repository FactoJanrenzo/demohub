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

const OUT = process.argv[2] || "Sower-of-Best.pptx";

const THEME = {
  name: "Pink Harvest",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1A1A1A", lt1: "FFFFFF", dk2: "4A1240", lt2: "FDEBF3",
    accent1: "D6336C", accent2: "9C3FB0", accent3: "1B8FA0",
    accent4: "E0602F", accent5: "6A4FC4", accent6: "F5B83D",
    hlink: "D6336C", folHlink: "9C3FB0",
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
  pres.title = "Sower of Best";
  pres.author = "Erika Mariano";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const SEC = [C.accent1, C.accent2, C.accent3, C.accent4, C.accent5];
  const HI = C.accent6; // gold highlight on dark slides
  const MUTED = "9A6A8C";

  // ---------- Layouts ----------
  pres.defineSlideMaster({ title: "Dark", background: { path: img("bg_dark") } });
  pres.defineSlideMaster({
    title: "Light Title",
    background: { path: img("bg_light") },
    slideNumber: { x: 12.25, y: 6.95, w: 0.7, h: 0.4, fontSize: 14, color: MUTED, align: "right" },
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
    slideNumber: { x: 12.25, y: 6.95, w: 0.7, h: 0.4, fontSize: 14, color: MUTED, align: "right" },
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
    meditate: gi.GiMeditation, wheat: gi.GiWheat, mic: fa.FaMicrophone,
  };
  for (const [k, comp] of Object.entries(want)) I[k] = await icon(comp);
  const arrowPink = await icon(fa.FaArrowRight, "#D6336C");

  // ---------- Helpers ----------
  const shadow = () => ({ type: "outer", color: "4A1240", opacity: 0.18, blur: 10, offset: 3, angle: 90 });
  const T = (slide, text, opts) => slide.addText(text, { isTextBox: true, margin: 0, ...opts });

  // Animations, written into the slide XML by finalize.py.
  // trigger "auto" = plays by itself one after another when the slide opens; "click" = next click.
  const ANIM = {};
  const anim = (names, trigger = "auto", effect = "float") => (ANIM[slideNo] = ANIM[slideNo] || []).push({ names: [].concat(names), trigger, effect });
  const ic = (name) => [name, name + " glyph"];

  function iconCircle(slide, data, x, y, d, fill, name) {
    slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: name });
    const pad = d * 0.24;
    slide.addImage({ data, x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, objectName: name + " glyph" });
    return ic(name);
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
    const s = add("Dark", section, notes || `${ref} ${text.replace(/\[\[|\]\]/g, "")}`);
    s.addText(rich(text, { fontSize: size, color: C.background1, fontFace: "Cambria" }, { color: HI, bold: true }),
      { x: 0.9, y: 1.5, w: 9.0, h: 4.4, valign: "middle", margin: 0, isTextBox: true, paraSpaceAfter: 6, lineSpacingMultiple: 1.08, objectName: "Verse" });
    T(s, ref, { x: 0.9, y: 6.05, w: 9.0, h: 0.7, fontSize: 28, bold: true, color: HI, objectName: "Reference" });
    iconCircle(s, I[iconKey], 10.3, 2.45, 2.5, color, "Verse icon");
    anim(ic("Verse icon"), "auto", "zoom");
    anim("Verse", "auto", "fade");
    anim("Reference", "auto", "fade");
    return s;
  }

  function divider(n, title, iconKey) {
    const section = `${n}. Sow ${title}`;
    pres.addSection({ title: section });
    const s = add("Dark", section, section);
    sectionSlides.push(slideNo);
    const col = SEC[n - 1];
    T(s, n + ".", { x: 0.4, y: 1.0, w: 3.6, h: 4.6, fontSize: 250, bold: true, fontFace: "Cambria", color: col, align: "center", valign: "middle", objectName: "Section number" });
    T(s, "Sow " + title, { x: 4.1, y: 1.9, w: 5.4, h: 3.4, fontSize: 60, bold: true, fontFace: "Cambria", color: C.background1, valign: "middle", objectName: "Section title" });
    iconCircle(s, I[iconKey], 9.75, 2.05, 3.2, col, "Section icon");
    anim("Section number", "auto", "zoom");
    anim("Section title", "auto", "float");
    anim(ic("Section icon"), "auto", "zoom");
    return s;
  }

  function statement(section, { pre, big, color, iconKey, notes, bigSize = 60 }) {
    const s = add("Light Statement", section, notes);
    iconCircle(s, I[iconKey], 0.9, 1.9, 3.4, color, "Statement icon");
    T(s, pre, { x: 5.0, y: 1.3, w: 7.6, h: 2.0, fontSize: 40, fontFace: "Cambria", color: C.text2, valign: "bottom", objectName: "Lead-in" });
    T(s, big, { x: 5.0, y: 3.5, w: 7.6, h: 2.6, fontSize: bigSize, bold: true, fontFace: "Cambria", color, valign: "top", objectName: "Key phrase" });
    anim(ic("Statement icon"), "auto", "zoom");
    anim("Lead-in", "auto", "fade");
    anim("Key phrase", "auto", "float");
    return s;
  }

  function subpoint(section, { title, iconKey, ref, text, color }) {
    const s = add("Light Title", section, `${title}\n${ref} ${text}`);
    s.addText(title, { placeholder: "title" });
    iconCircle(s, I[iconKey], 0.8, 2.25, 3.0, color, "Point icon");
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.4, y: 1.75, w: 8.3, h: 4.85, rectRadius: 0.2, fill: { color: C.background2 }, line: { type: "none" }, shadow: shadow(), objectName: "Verse card" });
    s.addText(rich(text, { fontSize: 32, color: C.text1 }, { bold: true, color: C.text2 }),
      { x: 4.85, y: 2.0, w: 7.4, h: 3.6, valign: "middle", margin: 0, isTextBox: true, lineSpacingMultiple: 1.05, objectName: "Verse" });
    T(s, ref, { x: 4.85, y: 5.75, w: 7.4, h: 0.6, fontSize: 26, bold: true, color: C.accent1, objectName: "Reference" });
    anim(ic("Point icon"), "auto", "zoom");
    anim(["Verse card", "Verse", "Reference"], "auto", "float");
    return s;
  }

  // ======================= SLIDES =======================
  // All on-slide wording is taken verbatim from the original sermon outline.

  // --- Introduction ---
  pres.addSection({ title: "Introduction" });
  {
    const s = add(null, "Introduction", "Sower of Best\nErika Mariano");
    s.background = { path: img("hero") };
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.3, w: 6.7, h: 4.9, rectRadius: 0.25, fill: { color: C.text2, transparency: 15 }, line: { type: "none" }, objectName: "Title panel" });
    T(s, "Sower of Best", { x: 1.1, y: 1.65, w: 5.9, h: 2.9, fontSize: 76, bold: true, fontFace: "Cambria", color: C.background1, valign: "middle", objectName: "Title" });
    iconCircle(s, I.mic, 1.1, 4.85, 0.85, C.accent1, "Speaker icon");
    T(s, "Erika Mariano", { x: 2.2, y: 4.85, w: 4.8, h: 0.85, fontSize: 34, bold: true, color: HI, valign: "middle", objectName: "Speaker" });
    anim(["Title panel", "Title"], "auto", "float");
    anim([...ic("Speaker icon"), "Speaker"], "auto", "fade");
  }
  {
    const txt = "Now that we are healed and delivered from our old life let us sow positive seeds to our family and friends";
    const s = add("Light Statement", "Introduction", txt);
    T(s, txt, { x: 0.8, y: 1.0, w: 7.3, h: 5.3, fontSize: 42, fontFace: "Cambria", color: C.text2, valign: "middle", lineSpacingMultiple: 1.1, objectName: "Statement" });
    s.addImage({ path: img("sprout"), x: 8.55, y: 1.25, w: 4.3, h: 4.3, objectName: "Sprout illustration" });
    anim("Sprout illustration", "auto", "zoom");
    anim("Statement", "auto", "fade");
  }
  verseSlide("Introduction", { ref: "Galatians 6:7 (NIV)", text: "Do not be deceived: God cannot be mocked. A man reaps what he sows.", iconKey: "wheat", color: C.accent1, size: 50 });
  {
    const txt = "If we sow positive things we will reap a good harvest";
    const s = add("Light Statement", "Introduction", txt);
    T(s, txt, { x: 0.6, y: 0.5, w: 12.1, h: 1.9, fontSize: 48, bold: true, fontFace: "Cambria", color: C.text2, align: "center", valign: "middle", objectName: "Statement" });
    anim("Statement", "auto", "fade");
    ["seed", "sprout", "wheat"].forEach((pic, i) => {
      const cx = 2.25 + i * 4.42;
      s.addImage({ path: img(pic), x: cx - 1.6, y: 2.85, w: 3.2, h: 3.2, objectName: pic + " illustration" });
      anim(pic + " illustration", "auto", "zoom");
      if (i < 2) { s.addImage({ data: arrowPink, x: cx + 1.85, y: 4.1, w: 0.7, h: 0.7, objectName: "Arrow " + i }); anim("Arrow " + i, "auto", "fade"); }
    });
  }
  {
    const txt = "Here are 5 things we can start to sow:";
    const s = add("Light Statement", "Introduction", txt);
    T(s, txt, { x: 0.6, y: 0.7, w: 12.1, h: 1.6, fontSize: 54, bold: true, fontFace: "Cambria", color: C.text2, align: "center", valign: "middle", objectName: "Statement" });
    anim("Statement", "auto", "fade");
    ["attitudes", "integrity", "spirituality", "discipline", "image"].forEach((k, i) => {
      const x = 0.95 + i * 2.4;
      iconCircle(s, I[k], x, 3.1, 1.9, SEC[i], "Seed icon " + (i + 1));
      T(s, String(i + 1), { x, y: 5.15, w: 1.9, h: 0.9, fontSize: 44, bold: true, fontFace: "Cambria", color: SEC[i], align: "center", objectName: "Seed number " + (i + 1) });
      anim([...ic("Seed icon " + (i + 1)), "Seed number " + (i + 1)], "auto", "zoom");
    });
  }

  // --- 1. Positive attitudes ---
  divider(1, "Positive Attitudes", "attitudes");
  const S1 = "1. Sow Positive Attitudes";
  subpoint(S1, { title: "I. Be positive in your words", iconKey: "words", color: C.accent1, ref: "Ephesians 4:29 (NIV)",
    text: "Do not let any unwholesome talk come out of your mouths, but only what is helpful for building others up according to their needs, that it may benefit those who listen." });
  subpoint(S1, { title: "II. Sow good works", iconKey: "works", color: C.accent1, ref: "Matthew 5:16 (NIV)",
    text: "In the same way, let your light shine before men, that they may see your good deeds and praise your Father in heaven." });
  subpoint(S1, { title: "III. Be kind and loving in how you relate to others", iconKey: "kind", color: C.accent1, ref: "Ephesians 4:31–32 (NIV)",
    text: "Get rid of all bitterness, rage and anger, brawling and slander, along with every form of malice.  Be kind and compassionate to one another…" });

  // --- 2. Integrity ---
  divider(2, "Integrity", "integrity");
  const S2 = "2. Sow Integrity";
  verseSlide(S2, { ref: "1 Timothy 4:7–8 (NIV)", iconKey: "godly", color: C.accent2, size: 32,
    text: "Have nothing to do with godless myths and old wives' tales; rather, [[train yourself to be godly]].  For physical training is of some value, but [[godliness has value for all things]], holding promise for both the present life and the life to come." });
  {
    const rows = [
      ["bible", [{ text: "The Bible says, " }, { text: "“Train yourself to be godly.”", options: { italic: true } }]],
      ["godly", [{ text: "To be godly means to live a God centered life" }]],
      ["scale", [{ text: "Integrity is the quality of being upright morally" }]],
    ];
    const s = add("Light Title", S2, "Walking in integrity and godliness\n- The Bible says, “Train yourself to be godly.”\n- To be godly means to live a God centered life\n- Integrity is the quality of being upright morally");
    s.addText("Walking in integrity and godliness", { placeholder: "title" });
    rows.forEach(([k, runs], i) => {
      const y = 1.75 + i * 1.6;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 12.1, h: 1.35, rectRadius: 0.2, fill: { color: C.background2 }, line: { type: "none" }, objectName: "Row " + i });
      iconCircle(s, I[k], 0.85, y + 0.15, 1.05, C.accent2, "Row icon " + i);
      s.addText(runs.map((r) => ({ text: r.text, options: { ...(r.options || {}) } })),
        { x: 2.2, y, w: 10.3, h: 1.35, fontSize: 32, bold: true, color: C.text2, valign: "middle", margin: 0, isTextBox: true, objectName: "Row text " + i });
      anim(["Row " + i, ...ic("Row icon " + i), "Row text " + i], "click", "float");
    });
  }
  {
    const pre = "To live in integrity means to live on what is right all the time.";
    const s = add("Light Statement", S2, "Walking in integrity and godliness\n- To live in integrity means to live on what is right all the time. NO COMPROMISE with sin.");
    iconCircle(s, I.ban, 0.9, 1.9, 3.4, C.accent4, "Statement icon");
    T(s, pre, { x: 5.0, y: 1.1, w: 7.6, h: 2.4, fontSize: 40, fontFace: "Cambria", color: C.text2, valign: "bottom", objectName: "Lead-in" });
    s.addText([{ text: "No compromise", options: { underline: { style: "sng" } } }, { text: " with sin." }],
      { x: 5.0, y: 3.7, w: 7.6, h: 2.4, fontSize: 58, bold: true, fontFace: "Cambria", color: C.accent4, valign: "top", margin: 0, isTextBox: true, objectName: "Key phrase" });
    anim(ic("Statement icon"), "auto", "zoom");
    anim("Lead-in", "auto", "fade");
    anim("Key phrase", "auto", "float");
  }

  // --- 3. Spirituality ---
  divider(3, "Spirituality", "spirituality");
  const S3 = "3. Sow Spirituality";
  {
    const txt = "You are the light of the world—like a city on a mountain, glowing in the night for all to see.";
    const s = add("Dark", S3, "Matthew 5:14 (NLT) " + txt);
    s.background = { path: img("city") };
    T(s, "“", { x: 0.7, y: 0.35, w: 1.6, h: 1.6, fontSize: 150, fontFace: "Cambria", bold: true, color: C.accent1, objectName: "Quote mark" });
    T(s, txt, { x: 0.9, y: 1.6, w: 6.4, h: 4.2, fontSize: 38, color: C.background1, fontFace: "Cambria", valign: "middle", lineSpacingMultiple: 1.08, objectName: "Verse" });
    T(s, "Matthew 5:14 (NLT)", { x: 0.9, y: 6.05, w: 6.4, h: 0.7, fontSize: 28, bold: true, color: HI, objectName: "Reference" });
    anim("Verse", "auto", "fade");
    anim("Reference", "auto", "fade");
  }
  {
    const txt = "Sowing spirituality means you are bringing the presence of God into your home, school and workplace";
    const s = add("Light Statement", S3, txt);
    T(s, txt, { x: 0.6, y: 0.6, w: 12.1, h: 2.6, fontSize: 44, bold: true, fontFace: "Cambria", color: C.text2, align: "center", valign: "middle", objectName: "Statement" });
    anim("Statement", "auto", "fade");
    ["home", "school", "work"].forEach((k, i) => { iconCircle(s, I[k], 2.0 + i * 3.6, 3.75, 2.2, C.accent3, k + " icon"); anim(ic(k + " icon"), "auto", "zoom"); });
  }
  {
    const s = add("Light Title", S3, "How to sow spirituality?\nI. Manifest the Christ-like character\nII. Bring prayer\nIII. Bring the Word of God\nIV. Bring the cell group into your home, schools, and workplace");
    s.addText("How to sow spirituality?", { placeholder: "title" });
    const items = [["cross", "I", "Manifest the Christ-like character"], ["prayer", "II", "Bring prayer"], ["bible", "III", "Bring the Word of God"], ["cell", "IV", "Bring the cell group into your home, schools, and workplace"]];
    items.forEach(([k, num, label], i) => {
      const x = 0.6 + (i % 2) * 6.2, y = 1.7 + Math.floor(i / 2) * 2.5;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.9, h: 2.25, rectRadius: 0.2, fill: { color: C.background2 }, line: { type: "none" }, shadow: shadow(), objectName: num + " card" });
      iconCircle(s, I[k], x + 0.35, y + 0.4, 1.45, C.accent3, num + " icon");
      s.addText([{ text: num + ". ", options: { color: C.accent3 } }, { text: label }],
        { x: x + 2.1, y: y + 0.15, w: 3.6, h: 1.95, fontSize: 28, bold: true, color: C.text2, valign: "middle", margin: 0, isTextBox: true, objectName: num + " text" });
      anim([num + " card", ...ic(num + " icon"), num + " text"], "click", "float");
    });
  }

  // --- 4. Discipline ---
  divider(4, "Discipline", "discipline");
  const S4 = "4. Sow Discipline";
  statement(S4, { pre: "Discipline is", big: "self control", color: C.accent4, iconKey: "meditate", bigSize: 66, notes: "Discipline is self control" });
  {
    const s = add("Light Title", S4, "Discipline means:\n- Self control; not impulsive and uncontrolled\n- Order and proper management\n- Sticking to right priorities and activities");
    s.addText("Discipline means:", { placeholder: "title" });
    [["hand", "Self control; not impulsive and uncontrolled"], ["tasks", "Order and proper management"], ["target", "Sticking to right priorities and activities"]].forEach(([k, t], i) => {
      const y = 1.75 + i * 1.6;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 12.1, h: 1.35, rectRadius: 0.2, fill: { color: C.background2 }, line: { type: "none" }, objectName: "Row " + i });
      iconCircle(s, I[k], 0.85, y + 0.15, 1.05, C.accent4, "Row icon " + i);
      T(s, t, { x: 2.2, y, w: 10.3, h: 1.35, fontSize: 34, bold: true, color: C.text2, valign: "middle", objectName: "Row text " + i });
      anim(["Row " + i, ...ic("Row icon " + i), "Row text " + i], "click", "float");
    });
  }
  verseSlide(S4, { ref: "1 Peter 5:8 (NIV)", iconKey: "lion", color: C.accent4, size: 40,
    text: "[[Be self-controlled]] and alert. Your enemy the devil prowls around like a roaring lion looking for someone to devour." });
  verseSlide(S4, { ref: "1 Corinthians 9:27 (NLT)", iconKey: "run", color: C.accent4, size: 36,
    text: "I discipline my body like an athlete, training it to do what it should. Otherwise, I fear that after preaching to others I myself might be disqualified." });

  // --- 5. Correct image ---
  divider(5, "A Correct Image", "image");
  const S5 = "5. Sow A Correct Image";
  statement(S5, { pre: "To sow a correct image is to be", big: "at peace with yourself", color: C.accent5, iconKey: "dove", notes: "To sow a correct image is to be at peace with yourself" });
  {
    const s = add("Light Title", S5, "Having a correct image means:\n- You have a positive self esteem.\n- You feel good about yourself.\n- You have a healthy outlook of who you are in Christ.");
    s.addText("Having a correct image means:", { placeholder: "title" });
    [["thumbs", "You have a positive self esteem."], ["smile", "You feel good about yourself."], ["eye", "You have a healthy outlook of who you are in Christ."]].forEach(([k, t], i) => {
      const y = 1.8 + i * 1.75;
      iconCircle(s, I[k], 0.75, y, 1.3, C.accent5, "Row icon " + i);
      T(s, t, { x: 2.4, y, w: 10.3, h: 1.3, fontSize: 36, bold: true, color: C.text2, valign: "middle", objectName: "Row text " + i });
      anim([...ic("Row icon " + i), "Row text " + i], "click", "float");
    });
  }
  {
    const s = add("Light Title", S5, "Having a correct image means:\n- You see yourself the way God sees you. Unique, precious, lovable and important.\n- You see yourself as a winner in Christ and not a failure.");
    s.addText("Having a correct image means:", { placeholder: "title" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.65, w: 12.1, h: 2.75, rectRadius: 0.2, fill: { color: C.background1 }, line: { color: "EBD9F7", width: 1 }, shadow: shadow(), objectName: "God sees you card" });
    T(s, "You see yourself the way God sees you. Unique, precious, lovable and important.", { x: 1.0, y: 1.8, w: 11.3, h: 1.3, fontSize: 34, bold: true, color: C.text2, valign: "middle", objectName: "God sees you text" });
    const g1 = ["God sees you card", "God sees you text"];
    ["finger", "gem", "kind", "star"].forEach((k, i) => g1.push(...iconCircle(s, I[k], 3.0 + i * 2.1, 3.2, 1.0, C.accent5, k + " icon")));
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.8, w: 12.1, h: 1.6, rectRadius: 0.2, fill: { color: C.accent5 }, line: { type: "none" }, shadow: shadow(), objectName: "Winner banner" });
    s.addImage({ data: I.trophy, x: 1.0, y: 5.05, w: 1.1, h: 1.1, objectName: "Trophy" });
    T(s, "You see yourself as a winner in Christ and not a failure.", { x: 2.5, y: 4.8, w: 10.0, h: 1.6, fontSize: 34, bold: true, color: C.background1, valign: "middle", objectName: "Winner text" });
    anim(g1, "click", "float");
    anim(["Winner banner", "Trophy", "Winner text"], "click", "float");
  }
  verseSlide(S5, { ref: "Psalms 139:13–14 (NIV)", iconKey: "womb", color: C.accent5, size: 34,
    text: "For you created my inmost being; you knit me together in my mother's womb.   I praise you because [[I am fearfully and wonderfully made]]; your works are wonderful, I know that full well." });
  verseSlide(S5, { ref: "Philippians 4:13 (NKJV)", iconKey: "mountain", color: C.accent5, size: 56,
    text: "I can do all things through Christ who strengthens me." });

  // --- Summary ---
  pres.addSection({ title: "Summary" });
  {
    const s = add("Dark", "Summary", "Sowing the Best:\n1. Sow positive attitudes\n2. Sow integrity\n3. Sow spirituality\n4. Sow discipline\n5. Sow a correct image");
    T(s, "Sowing the Best:", { x: 0.7, y: 1.0, w: 8, h: 1.0, fontSize: 54, bold: true, fontFace: "Cambria", color: C.background1, objectName: "Summary title" });
    s.addImage({ path: img("wheat"), x: 8.75, y: 1.6, w: 4.0, h: 4.0, objectName: "Harvest illustration" });
    anim("Harvest illustration", "auto", "zoom");
    ["Sow positive attitudes", "Sow integrity", "Sow spirituality", "Sow discipline", "Sow a correct image"].forEach((t, i) => {
      const y = 2.2 + i * 0.92;
      s.addShape(pres.shapes.OVAL, { x: 0.8, y, w: 0.8, h: 0.8, fill: { color: SEC[i] }, line: { type: "none" }, objectName: "Num circle " + i });
      T(s, String(i + 1), { x: 0.8, y, w: 0.8, h: 0.8, fontSize: 30, bold: true, color: C.background1, align: "center", valign: "middle", objectName: "Num " + i });
      T(s, t, { x: 1.9, y, w: 6.5, h: 0.8, fontSize: 36, color: C.background1, valign: "middle", objectName: "Item " + i });
      anim(["Num circle " + i, "Num " + i, "Item " + i], "click", "float");
    });
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  fs.writeFileSync(path.join(__dirname, "meta.json"), JSON.stringify({ dividers: sectionSlides, anim: ANIM }));
  console.log("wrote", OUT, slideNo, "slides; dividers:", sectionSlides);
})();
