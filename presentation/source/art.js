// Generates the illustrations (SVG -> PNG) used in the deck.
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "img");
fs.mkdirSync(OUT, { recursive: true });

// deterministic pseudo-random
let seed = 7;
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

function sprout(x, y, s, color) {
  return `<g fill="${color}" stroke="${color}">
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y - s}" stroke-width="${s * 0.12}" stroke-linecap="round"/>
    <ellipse cx="${x - s * 0.42}" cy="${y - s * 0.95}" rx="${s * 0.45}" ry="${s * 0.2}" transform="rotate(-28 ${x - s * 0.42} ${y - s * 0.95})"/>
    <ellipse cx="${x + s * 0.42}" cy="${y - s * 1.1}" rx="${s * 0.45}" ry="${s * 0.2}" transform="rotate(28 ${x + s * 0.42} ${y - s * 1.1})"/>
  </g>`;
}

function wheatStalk(x, y, h, lean, color) {
  const tx = x + lean, ty = y - h;
  let g = `<path d="M${x} ${y} Q ${x + lean * 0.3} ${y - h * 0.5} ${tx} ${ty}" stroke="#B9862E" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 7; i++) {
    const t = i / 7;
    const cx = tx - lean * 0.05 * i, cy = ty + 18 + i * 22;
    g += `<ellipse cx="${cx - 13}" cy="${cy}" rx="12" ry="21" fill="${color}" transform="rotate(-25 ${cx - 13} ${cy})"/>`;
    g += `<ellipse cx="${cx + 13}" cy="${cy}" rx="12" ry="21" fill="${color}" transform="rotate(25 ${cx + 13} ${cy})"/>`;
  }
  g += `<ellipse cx="${tx}" cy="${ty + 4}" rx="11" ry="22" fill="${color}"/>`;
  return g;
}

const svgs = {};

// Dark background: deep green night-field with a soft sunrise glow
svgs.bg_dark = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
<defs>
 <linearGradient id="g" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#0D2618"/><stop offset="1" stop-color="#1E4D2B"/></linearGradient>
 <radialGradient id="glow" cx="0.85" cy="1" r="0.6"><stop offset="0" stop-color="#F2B544" stop-opacity="0.45"/><stop offset="1" stop-color="#F2B544" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1920" height="1080" fill="url(#g)"/>
<rect width="1920" height="1080" fill="url(#glow)"/>
<path d="M0 960 C 420 900 820 930 1200 970 S 1700 940 1920 950 L1920 1080 L0 1080Z" fill="#0A1F13" opacity="0.55"/>
<path d="M0 1010 C 600 960 1200 1000 1920 990 L1920 1080 L0 1080Z" fill="#06160D" opacity="0.7"/>
${[160, 330, 1520, 1700, 1840].map((x, i) => sprout(x, 1000 - (i % 2) * 10, 34 + (i % 3) * 8, "#0A1F13")).join("")}
</svg>`;

// Light background: white with a gentle field wave at the bottom
svgs.bg_light = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
<rect width="1920" height="1080" fill="#FFFFFF"/>
<path d="M0 1010 C 500 975 1100 1000 1920 985 L1920 1080 L0 1080Z" fill="#EEF5EA"/>
<path d="M0 1045 C 700 1020 1300 1050 1920 1035 L1920 1080 L0 1080Z" fill="#DCEBD5"/>
</svg>`;

// Hero: a sown field at sunrise
{
  let rows = "";
  for (let i = -14; i <= 14; i++) rows += `<line x1="${1350 + i * 18}" y1="790" x2="${1350 + i * 240}" y2="1080" stroke="#24461C" stroke-width="7"/>`;
  let sprouts = "";
  for (let i = -6; i <= 6; i++) {
    for (const t of [0.35, 0.6, 0.9]) {
      const x = 1350 + i * 18 + (i * 240 - i * 18) * t;
      const y = 790 + 290 * t;
      sprouts += sprout(x + 22 * t, y, 14 + 40 * t, "#7DBA4F");
    }
  }
  svgs.hero = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
<defs>
 <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22405E"/><stop offset="0.42" stop-color="#E5875A"/><stop offset="0.72" stop-color="#F8CD78"/></linearGradient>
 <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF6CC"/><stop offset="0.45" stop-color="#FFD66B" stop-opacity="0.8"/><stop offset="1" stop-color="#FFD66B" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1920" height="1080" fill="url(#sky)"/>
<circle cx="1350" cy="600" r="380" fill="url(#sun)"/>
<circle cx="1350" cy="600" r="135" fill="#FFF1B8"/>
<path d="M0 640 C 400 570 800 610 1100 655 S 1700 600 1920 625 L1920 1080 L0 1080Z" fill="#5C8A40"/>
<path d="M0 715 C 500 655 1000 705 1920 690 L1920 1080 L0 1080Z" fill="#3E6E2F"/>
<path d="M0 790 C 600 770 1300 785 1920 790 L1920 1080 L0 1080Z" fill="#2E5826"/>
${rows}${sprouts}
</svg>`;
}

// Growth stages in a soft circle
function stage(inner, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700">
<circle cx="350" cy="350" r="345" fill="${bg}"/>
<clipPath id="c"><circle cx="350" cy="350" r="345"/></clipPath>
<g clip-path="url(#c)">
 <path d="M0 470 C 200 430 500 430 700 470 L700 700 L0 700Z" fill="#8C6239"/>
 <path d="M0 520 C 250 500 450 500 700 520 L700 700 L0 700Z" fill="#6E4A2A"/>
 ${inner}
</g></svg>`;
}
svgs.seed = stage(`<ellipse cx="350" cy="560" rx="38" ry="26" fill="#E8C27A" stroke="#B9862E" stroke-width="6"/>
  ${[0, 1, 2].map(i => `<ellipse cx="${270 + i * 80}" cy="${300 + (i % 2) * 40}" rx="14" ry="10" fill="#E8C27A"/>`).join("")}
  <path d="M250 250 L 300 300 M350 230 L350 300 M450 250 L400 300" stroke="#FFFFFF" stroke-width="0" />`, "#FDEFC9");
svgs.sprout = stage(`<ellipse cx="350" cy="560" rx="34" ry="22" fill="#E8C27A"/>
  <path d="M350 560 C 345 470 355 400 350 320" stroke="#4E8B4A" stroke-width="18" fill="none" stroke-linecap="round"/>
  <ellipse cx="275" cy="320" rx="85" ry="36" fill="#6DB35A" transform="rotate(-30 275 320)"/>
  <ellipse cx="428" cy="285" rx="85" ry="36" fill="#7DC468" transform="rotate(30 428 285)"/>`, "#DFF0D8");
svgs.wheat = stage(`${wheatStalk(300, 560, 360, -60, "#E0A93B")}${wheatStalk(350, 560, 400, 0, "#EDBB4F")}${wheatStalk(400, 560, 360, 60, "#E0A93B")}${wheatStalk(255, 560, 280, -110, "#D49A2E")}${wheatStalk(445, 560, 280, 110, "#D49A2E")}`, "#FFE9B8");

// City on a hill, glowing at night
{
  let stars = "";
  for (let i = 0; i < 90; i++) stars += `<circle cx="${(rnd() * 1920).toFixed(0)}" cy="${(rnd() * 560).toFixed(0)}" r="${(1 + rnd() * 2.6).toFixed(1)}" fill="#FFFFFF" opacity="${(0.4 + rnd() * 0.6).toFixed(2)}"/>`;
  let houses = "";
  const spots = [[1180, 640], [1250, 600], [1320, 560], [1395, 530], [1470, 545], [1540, 580], [1610, 620], [1680, 660], [1290, 680], [1440, 640], [1590, 690], [1365, 610], [1515, 650], [1220, 720], [1660, 720], [1400, 700]];
  for (const [x, y] of spots) {
    const w = 52 + rnd() * 30, h = 50 + rnd() * 40;
    houses += `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" fill="#14243F"/>
      <path d="M${x - w / 2 - 6} ${y - h} L${x} ${y - h - 32} L${x + w / 2 + 6} ${y - h}Z" fill="#101C33"/>
      <rect x="${x - 12}" y="${y - h + 14}" width="24" height="22" fill="#FFD66B"/>`;
  }
  svgs.city = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
<defs>
 <linearGradient id="n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#081428"/><stop offset="1" stop-color="#1B3358"/></linearGradient>
 <radialGradient id="cg" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFD66B" stop-opacity="0.55"/><stop offset="1" stop-color="#FFD66B" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1920" height="1080" fill="url(#n)"/>${stars}
<circle cx="1640" cy="170" r="62" fill="#FFF3C4"/><circle cx="1666" cy="152" r="58" fill="#0B1830"/>
<ellipse cx="1430" cy="600" rx="520" ry="330" fill="url(#cg)"/>
<path d="M820 1080 C 1050 820 1250 520 1430 510 C 1620 520 1800 800 1920 900 L1920 1080Z" fill="#0E1B30"/>
${houses}
<path d="M0 1000 C 500 960 1100 990 1920 980 L1920 1080 L0 1080Z" fill="#070F1E"/>
</svg>`;
}

module.exports = async function buildArt() {
  for (const [name, svg] of Object.entries(svgs)) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, `${name}.png`));
  }
  return OUT;
};
