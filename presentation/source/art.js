// Generates the illustrations (SVG -> PNG) used in the deck. Pink "sunrise harvest" style.
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "img");
fs.mkdirSync(OUT, { recursive: true });

// deterministic pseudo-random
let seed = 7;
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

const BLUR = (id, sd) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

// The ribbon "swoosh" from the original deck: pink -> violet -> cyan
function swoosh(x0, y0, w, h, opacity) {
  // tapered ribbons sweeping from the left edge up and off to the right
  let g = `<g opacity="${opacity}">`;
  const bands = [[1.0, 0.30, 0.95], [0.82, 0.18, 0.7], [0.66, 0.10, 0.55], [0.52, 0.06, 0.8], [0.40, 0.035, 0.6]];
  for (const [ys, t, o] of bands) {
    const yA = y0 + h * ys, th = h * t;
    const xE = x0 + w, yE = y0 + h * 0.02;
    g += `<path d="M${x0} ${yA} C ${x0 + w * 0.3} ${yA - h * 0.35}, ${x0 + w * 0.6} ${y0 + h * 0.1}, ${xE} ${yE}
      C ${x0 + w * 0.6} ${y0 + h * 0.1 + th * 0.5}, ${x0 + w * 0.3} ${yA - h * 0.35 + th}, ${x0} ${yA + th}Z" fill="url(#ribbon)" opacity="${o}"/>`;
  }
  return g + "</g>";
}
const RIBBON_GRAD = `<linearGradient id="ribbon" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#FF3D7F"/><stop offset="0.45" stop-color="#B23CD9"/><stop offset="0.8" stop-color="#3CD3E6" stop-opacity="0.8"/><stop offset="1" stop-color="#3CD3E6" stop-opacity="0"/></linearGradient>`;

function sprout(x, y, s, stem, leaf) {
  return `<g>
    <path d="M${x} ${y} C ${x - s * 0.05} ${y - s * 0.5}, ${x + s * 0.05} ${y - s * 0.7}, ${x} ${y - s}" stroke="${stem}" stroke-width="${s * 0.11}" fill="none" stroke-linecap="round"/>
    <path d="M${x} ${y - s} C ${x - s * 0.35} ${y - s * 1.45}, ${x - s * 0.95} ${y - s * 1.2}, ${x - s * 1.0} ${y - s * 0.95} C ${x - s * 0.6} ${y - s * 0.8}, ${x - s * 0.25} ${y - s * 0.85}, ${x} ${y - s}Z" fill="${leaf}"/>
    <path d="M${x} ${y - s} C ${x + s * 0.35} ${y - s * 1.55}, ${x + s * 0.95} ${y - s * 1.35}, ${x + s * 1.0} ${y - s * 1.1} C ${x + s * 0.6} ${y - s * 0.9}, ${x + s * 0.25} ${y - s * 0.9}, ${x} ${y - s}Z" fill="${leaf}"/>
  </g>`;
}

function wheatStalk(x, y, h, lean) {
  const tx = x + lean, ty = y - h;
  let g = `<path d="M${x} ${y} Q ${x + lean * 0.25} ${y - h * 0.55} ${tx} ${ty + 150}" stroke="#CFA046" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  const ang = Math.atan2(lean, h) * 180 / Math.PI;
  g += `<g transform="rotate(${ang.toFixed(1)} ${tx} ${ty + 150})">`;
  for (let i = 0; i < 7; i++) {
    const cy = ty + 18 + i * 21, s = 1 - i * 0.03;
    for (const side of [-1, 1]) {
      const cx = tx + side * 13 * s;
      g += `<ellipse cx="${cx}" cy="${cy}" rx="${12 * s}" ry="${21 * s}" fill="url(#grain)" transform="rotate(${side * 24} ${cx} ${cy})"/>`;
      g += `<path d="M${cx + side * 4} ${cy - 18} l ${side * 14} -26" stroke="#E8B54C" stroke-width="2" opacity="0.8"/>`;
    }
  }
  g += `<ellipse cx="${tx}" cy="${ty + 4}" rx="11" ry="22" fill="url(#grain)"/>`;
  g += `<line x1="${tx}" y1="${ty - 14}" x2="${tx}" y2="${ty - 50}" stroke="#E8B54C" stroke-width="2"/>`;
  return g + "</g>";
}

const svgs = {};

// Dark background: deep plum with a pink sunrise glow and the ribbon swoosh
{
  let bokeh = "";
  for (let i = 0; i < 14; i++) {
    bokeh += `<circle cx="${(200 + rnd() * 1700).toFixed(0)}" cy="${(120 + rnd() * 700).toFixed(0)}" r="${(10 + rnd() * 36).toFixed(0)}" fill="#FF8FC0" opacity="${(0.04 + rnd() * 0.08).toFixed(2)}" filter="url(#b6)"/>`;
  }
  svgs.bg_dark = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
<defs>
 ${RIBBON_GRAD}${BLUR("b6", 6)}${BLUR("b40", 40)}
 <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#22071F"/><stop offset="0.6" stop-color="#43103D"/><stop offset="1" stop-color="#5E1650"/></linearGradient>
 <radialGradient id="glow" cx="0.85" cy="1" r="0.65"><stop offset="0" stop-color="#FF5C9A" stop-opacity="0.55"/><stop offset="0.5" stop-color="#C2367A" stop-opacity="0.18"/><stop offset="1" stop-color="#C2367A" stop-opacity="0"/></radialGradient>
 <radialGradient id="glow2" cx="0.05" cy="0" r="0.5"><stop offset="0" stop-color="#8E44D9" stop-opacity="0.35"/><stop offset="1" stop-color="#8E44D9" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1920" height="1080" fill="url(#g)"/>
<rect width="1920" height="1080" fill="url(#glow)"/>
<rect width="1920" height="1080" fill="url(#glow2)"/>
${bokeh}
${swoosh(-20, -20, 1500, 230, 0.6)}
<path d="M0 955 C 420 895 820 925 1200 965 S 1700 935 1920 945 L1920 1080 L0 1080Z" fill="#1C0518" opacity="0.6"/>
<path d="M0 1010 C 600 960 1200 1000 1920 990 L1920 1080 L0 1080Z" fill="#14030F" opacity="0.85"/>
${[160, 330, 1500, 1680, 1830].map((x, i) => sprout(x, 1003 - (i % 2) * 8, 30 + (i % 3) * 8, "#14030F", "#14030F")).join("")}
</svg>`;
}

// Light background: white with a blush wave at the bottom and a small ribbon in the corner
svgs.bg_light = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
<defs>${RIBBON_GRAD}</defs>
<rect width="1920" height="1080" fill="#FFFFFF"/>
${swoosh(-20, -20, 900, 110, 0.55)}
<path d="M0 1010 C 500 975 1100 1000 1920 985 L1920 1080 L0 1080Z" fill="#FDEBF3"/>
<path d="M0 1045 C 700 1020 1300 1050 1920 1035 L1920 1080 L0 1080Z" fill="#F9D3E4"/>
</svg>`;

// Hero: a sown field under a pink sunrise
{
  let rows = "";
  for (let i = -14; i <= 14; i++) rows += `<line x1="${1350 + i * 18}" y1="795" x2="${1350 + i * 240}" y2="1080" stroke="#2B4F22" stroke-width="7" opacity="0.8"/>`;
  let sprouts = "";
  for (let i = -6; i <= 6; i++) {
    for (const t of [0.3, 0.55, 0.82]) {
      const x = 1350 + i * 18 + (i * 240 - i * 18) * t;
      const y = 795 + 285 * t;
      sprouts += sprout(x + 22 * t, y, 10 + 34 * t, "#4E8A3A", "url(#leaf)");
    }
  }
  let rays = "";
  for (let a = 0; a < 360; a += 15) {
    const r1 = 170, r2 = 560, rad = a * Math.PI / 180;
    rays += `<line x1="${1350 + r1 * Math.cos(rad)}" y1="${600 + r1 * Math.sin(rad)}" x2="${1350 + r2 * Math.cos(rad)}" y2="${600 + r2 * Math.sin(rad)}" stroke="#FFE3C2" stroke-width="10" opacity="0.10" stroke-linecap="round"/>`;
  }
  const cloud = (x, y, s, o) => `<g opacity="${o}" filter="url(#b8)"><ellipse cx="${x}" cy="${y}" rx="${150 * s}" ry="${36 * s}" fill="#FFD3E2"/><ellipse cx="${x - 60 * s}" cy="${y - 22 * s}" rx="${70 * s}" ry="${40 * s}" fill="#FFE1EB"/><ellipse cx="${x + 50 * s}" cy="${y - 28 * s}" rx="${80 * s}" ry="${46 * s}" fill="#FFE8EF"/></g>`;
  const bird = (x, y, s) => `<path d="M${x - 22 * s} ${y - 6 * s} q ${11 * s} -12 ${22 * s} 6 q ${11 * s} -18 ${22 * s} -6" stroke="#3A1440" stroke-width="${3.5 * s}" fill="none" stroke-linecap="round"/>`;
  let flowers = "";
  for (let i = 0; i < 26; i++) {
    const x = 760 + rnd() * 1160, y = 1000 + rnd() * 70;
    flowers += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(5 + rnd() * 5).toFixed(1)}" fill="${rnd() > 0.5 ? "#FF7FB0" : "#FFC2DA"}"/>`;
  }
  svgs.hero = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
<defs>
 ${BLUR("b8", 8)}${BLUR("b30", 30)}
 <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E0E45"/><stop offset="0.28" stop-color="#8E2C78"/><stop offset="0.48" stop-color="#E2578E"/><stop offset="0.65" stop-color="#FF9EA6"/><stop offset="0.75" stop-color="#FFD0A8"/></linearGradient>
 <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF7E0"/><stop offset="0.35" stop-color="#FFD9A0" stop-opacity="0.8"/><stop offset="1" stop-color="#FF9EB5" stop-opacity="0"/></radialGradient>
 <linearGradient id="h1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FA85A"/><stop offset="1" stop-color="#5B8A43"/></linearGradient>
 <linearGradient id="h2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5C8E44"/><stop offset="1" stop-color="#3F6E30"/></linearGradient>
 <linearGradient id="h3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3F6B2E"/><stop offset="1" stop-color="#26461D"/></linearGradient>
 <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B5E37F"/><stop offset="1" stop-color="#5FA347"/></linearGradient>
</defs>
<rect width="1920" height="1080" fill="url(#sky)"/>
${rays}
<circle cx="1350" cy="600" r="420" fill="url(#sun)"/>
<circle cx="1350" cy="600" r="130" fill="#FFF3D6"/>
${cloud(520, 250, 1.3, 0.75)}${cloud(1700, 300, 1.0, 0.7)}${cloud(1050, 170, 0.8, 0.55)}
${bird(980, 300, 1.2)}${bird(1060, 260, 0.9)}${bird(1120, 320, 0.8)}
<ellipse cx="1350" cy="660" rx="700" ry="60" fill="#FFD9C0" opacity="0.5" filter="url(#b30)"/>
<path d="M0 640 C 400 570 800 610 1100 655 S 1700 600 1920 625 L1920 1080 L0 1080Z" fill="url(#h1)"/>
<path d="M0 715 C 500 655 1000 705 1920 690 L1920 1080 L0 1080Z" fill="url(#h2)"/>
<path d="M0 795 C 600 775 1300 790 1920 795 L1920 1080 L0 1080Z" fill="url(#h3)"/>
${rows}${sprouts}${flowers}
</svg>`;
}

// Growth stages in a framed circle
const STAGE_DEFS = `
 <radialGradient id="bgc" cx="0.5" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFF5F9"/><stop offset="1" stop-color="#FBCFE2"/></radialGradient>
 <radialGradient id="sunc" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF4D6"/><stop offset="0.5" stop-color="#FFD48A" stop-opacity="0.7"/><stop offset="1" stop-color="#FFB3C8" stop-opacity="0"/></radialGradient>
 <linearGradient id="soil1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A6A42"/><stop offset="1" stop-color="#7A5032"/></linearGradient>
 <linearGradient id="soil2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E472B"/><stop offset="1" stop-color="#4E311D"/></linearGradient>
 <linearGradient id="stem" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3F7A35"/><stop offset="1" stop-color="#6DB552"/></linearGradient>
 <linearGradient id="leafA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B8E68A"/><stop offset="1" stop-color="#4E9A3C"/></linearGradient>
 <linearGradient id="seedG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBE3A6"/><stop offset="1" stop-color="#C98F35"/></linearGradient>
 <linearGradient id="stalk" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#B98A35"/><stop offset="1" stop-color="#E9BE5C"/></linearGradient>
 <radialGradient id="grain" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFE7A3"/><stop offset="1" stop-color="#D99A2E"/></radialGradient>
 ${BLUR("b4", 4)}`;
function stage(inner) {
  let pebbles = "";
  for (let i = 0; i < 12; i++) pebbles += `<ellipse cx="${(60 + rnd() * 580).toFixed(0)}" cy="${(560 + rnd() * 110).toFixed(0)}" rx="${(5 + rnd() * 9).toFixed(0)}" ry="${(4 + rnd() * 5).toFixed(0)}" fill="#3E2716" opacity="0.45"/>`;
  let grass = "";
  for (let i = 0; i < 16; i++) {
    const x = 30 + i * 42 + rnd() * 10, y = 478 - Math.sin((x / 700) * Math.PI) * 30;
    grass += `<path d="M${x} ${y + 6} q 3 -22 -6 -34 M${x + 6} ${y + 6} q 2 -26 10 -36" stroke="#5FA347" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700">
<defs>${STAGE_DEFS}<clipPath id="c"><circle cx="350" cy="350" r="330"/></clipPath></defs>
<circle cx="350" cy="350" r="345" fill="#FFFFFF"/>
<g clip-path="url(#c)">
 <rect width="700" height="700" fill="url(#bgc)"/>
 <circle cx="540" cy="150" r="120" fill="url(#sunc)"/><circle cx="540" cy="150" r="40" fill="#FFF0C8"/>
 <path d="M0 470 C 200 430 500 430 700 470 L700 700 L0 700Z" fill="url(#soil1)"/>
 <path d="M0 530 C 250 505 450 505 700 530 L700 700 L0 700Z" fill="url(#soil2)"/>
 ${pebbles}${grass}
 ${inner}
</g>
<circle cx="350" cy="350" r="337" fill="none" stroke="#F7B6D2" stroke-width="10"/>
</svg>`;
}
svgs.seed = stage(`
  ${[[250, 250, -20], [330, 190, 10], [420, 270, 30], [300, 350, -10], [390, 380, 20]].map(([x, y, r]) =>
    `<line x1="${x}" y1="${y - 40}" x2="${x}" y2="${y - 14}" stroke="#E9A9C6" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
     <ellipse cx="${x}" cy="${y}" rx="15" ry="10" fill="url(#seedG)" transform="rotate(${r} ${x} ${y})"/>`).join("")}
  <path d="M290 530 Q 350 500 410 530" stroke="#4E311D" stroke-width="6" fill="none" opacity="0.5"/>
  <ellipse cx="350" cy="575" rx="40" ry="27" fill="url(#seedG)"/>
  <ellipse cx="338" cy="566" rx="13" ry="7" fill="#FFF5D6" opacity="0.8"/>`);
svgs.sprout = stage(`
  <ellipse cx="350" cy="575" rx="34" ry="22" fill="url(#seedG)"/>
  <path d="M350 568 C 342 480 360 400 350 300" stroke="#4E9A3C" stroke-width="18" fill="none" stroke-linecap="round"/>
  <path d="M350 305 C 300 220 200 230 165 285 C 230 335 300 330 350 305Z" fill="url(#leafA)"/>
  <path d="M350 305 C 290 280 230 278 180 285" stroke="#3F7A35" stroke-width="4" fill="none" opacity="0.6"/>
  <path d="M352 290 C 410 195 515 205 545 255 C 480 315 410 315 352 290Z" fill="url(#leafA)"/>
  <path d="M352 290 C 420 262 480 255 530 257" stroke="#3F7A35" stroke-width="4" fill="none" opacity="0.6"/>
  <circle cx="455" cy="255" r="9" fill="#FFFFFF" opacity="0.85"/>
  <path d="M330 568 q -30 10 -60 4 M372 568 q 30 12 58 2" stroke="#E9D3B0" stroke-width="5" fill="none" stroke-linecap="round"/>`);
svgs.wheat = stage(`${wheatStalk(300, 590, 380, -70)}${wheatStalk(350, 590, 430, 0)}${wheatStalk(400, 590, 380, 70)}${wheatStalk(250, 590, 300, -130)}${wheatStalk(450, 590, 300, 130)}`);

// City on a hill, glowing at night, with a church at the top
{
  let stars = "";
  for (let i = 0; i < 110; i++) stars += `<circle cx="${(rnd() * 1920).toFixed(0)}" cy="${(rnd() * 600).toFixed(0)}" r="${(1 + rnd() * 2.6).toFixed(1)}" fill="#FFFFFF" opacity="${(0.35 + rnd() * 0.65).toFixed(2)}"/>`;
  for (const [x, y] of [[300, 120], [760, 220], [1180, 90], [1820, 400]]) stars += `<path d="M${x} ${y - 14} L${x + 3} ${y - 3} L${x + 14} ${y} L${x + 3} ${y + 3} L${x} ${y + 14} L${x - 3} ${y + 3} L${x - 14} ${y} L${x - 3} ${y - 3}Z" fill="#FFF0F7"/>`;
  let houses = "", glows = "";
  const spots = [[1180, 650], [1250, 610], [1320, 572], [1540, 590], [1610, 630], [1680, 670], [1290, 690], [1460, 650], [1590, 700], [1365, 625], [1515, 660], [1220, 730], [1660, 730], [1400, 712], [1150, 760], [1720, 760]];
  for (const [x, y] of spots) {
    const w = 52 + rnd() * 30, h = 50 + rnd() * 40;
    const roof = rnd() > 0.5 ? "#2A0F38" : "#331246";
    glows += `<circle cx="${x}" cy="${y - h + 25}" r="34" fill="#FFC86B" opacity="0.35" filter="url(#bw)"/>`;
    houses += `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" fill="#1F0B2E"/>
      <path d="M${x - w / 2 - 6} ${y - h} L${x} ${y - h - 30} L${x + w / 2 + 6} ${y - h}Z" fill="${roof}"/>
      <rect x="${x - 12}" y="${y - h + 14}" width="24" height="22" rx="3" fill="#FFD27A"/>
      <line x1="${x}" y1="${y - h + 14}" x2="${x}" y2="${y - h + 36}" stroke="#1F0B2E" stroke-width="3"/>`;
  }
  // church on top
  const cx = 1430, cy = 545;
  const church = `<circle cx="${cx}" cy="${cy - 90}" r="120" fill="#FFD27A" opacity="0.28" filter="url(#bw)"/>
    <rect x="${cx - 60}" y="${cy - 70}" width="120" height="80" fill="#1F0B2E"/>
    <path d="M${cx - 72} ${cy - 70} L${cx} ${cy - 120} L${cx + 72} ${cy - 70}Z" fill="#331246"/>
    <rect x="${cx - 18}" y="${cy - 170}" width="36" height="60" fill="#1F0B2E"/>
    <path d="M${cx - 26} ${cy - 170} L${cx} ${cy - 205} L${cx + 26} ${cy - 170}Z" fill="#331246"/>
    <rect x="${cx - 3}" y="${cy - 250}" width="6" height="48" fill="#FFE3A0"/><rect x="${cx - 16}" y="${cy - 236}" width="32" height="6" fill="#FFE3A0"/>
    <path d="M${cx - 16} ${cy + 10} L${cx - 16} ${cy - 25} A16 16 0 0 1 ${cx + 16} ${cy - 25} L${cx + 16} ${cy + 10}Z" fill="#FFD27A"/>
    <circle cx="${cx}" cy="${cy - 145}" r="9" fill="#FFD27A"/>`;
  svgs.city = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
<defs>
 ${BLUR("bw", 18)}${BLUR("b60", 60)}
 <linearGradient id="n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E0418"/><stop offset="0.6" stop-color="#2C0E40"/><stop offset="1" stop-color="#6A1F5E"/></linearGradient>
 <radialGradient id="cg" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFB86B" stop-opacity="0.6"/><stop offset="0.5" stop-color="#FF6FA8" stop-opacity="0.2"/><stop offset="1" stop-color="#FF6FA8" stop-opacity="0"/></radialGradient>
 <linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A0F3A"/><stop offset="1" stop-color="#14061E"/></linearGradient>
</defs>
<rect width="1920" height="1080" fill="url(#n)"/>${stars}
<circle cx="1660" cy="170" r="110" fill="#FFE9F2" opacity="0.18" filter="url(#b60)"/>
<circle cx="1660" cy="170" r="62" fill="#FFF3F8"/><circle cx="1688" cy="150" r="58" fill="#130620"/>
<ellipse cx="1430" cy="600" rx="600" ry="380" fill="url(#cg)"/>
<path d="M820 1080 C 1050 820 1250 560 1430 540 C 1620 555 1800 800 1920 900 L1920 1080Z" fill="url(#mtn)"/>
${glows}${church}${houses}
<path d="M0 1000 C 500 960 1100 990 1920 980 L1920 1080 L0 1080Z" fill="#0B0312"/>
</svg>`;
}

module.exports = async function buildArt() {
  for (const [name, svg] of Object.entries(svgs)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, `${name}.png`));
  }
  return OUT;
};
