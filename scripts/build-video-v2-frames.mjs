import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const bundledModules = process.env.CODEX_NODE_MODULES;
const sharp = bundledModules
  ? require(path.join(bundledModules, "sharp"))
  : require("sharp");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const outDir = path.join(root, ".artifacts-build", "video-v2", "frames");

const W = 1920;
const H = 1080;
const colors = {
  bg: "#05100d",
  panel: "#0b1714",
  teal: "#66f2c7",
  text: "#f3f8f6",
  muted: "#a9b7b2",
  amber: "#f4bd4f",
  red: "#ff6b72",
};

await fs.mkdir(outDir, { recursive: true });

await sharp({ create: { width: 1, height: 1, channels: 4, background: "#00000000" } })
  .png()
  .toFile(path.join(root, ".artifacts-build", "video-v2", ".init.png"));

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textLines(lines, { x, y, size, color = colors.text, weight = 700, gap = 1.08, anchor = "start", family = "Arial" }) {
  return lines
    .map((line, index) => `<text x="${x}" y="${y + index * size * gap}" fill="${color}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${esc(line)}</text>`)
    .join("");
}

function svg(content) {
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`);
}

function chrome(label, sceneNumber) {
  return `
    <rect x="0" y="0" width="${W}" height="76" fill="#04100de8"/>
    <circle cx="72" cy="38" r="8" fill="${colors.teal}"/>
    <text x="96" y="48" fill="${colors.teal}" font-family="Arial" font-size="22" font-weight="700" letter-spacing="1.4">MATERIALLOOP AI</text>
    <text x="960" y="48" fill="${colors.muted}" font-family="Arial" font-size="18" text-anchor="middle" letter-spacing="1.2">${esc(label)}</text>
    <text x="1848" y="48" fill="${colors.muted}" font-family="Arial" font-size="18" text-anchor="end">${String(sceneNumber).padStart(2, "0")}</text>
    <rect x="0" y="76" width="${W}" height="2" fill="#1b3932"/>
  `;
}

function titleBlock(kicker, lines, { y = 720, accent = colors.teal, subline = null } = {}) {
  return `
    <rect x="0" y="${y - 92}" width="${W}" height="${H - y + 92}" fill="#030b09dc"/>
    <rect x="72" y="${y - 28}" width="92" height="6" rx="3" fill="${accent}"/>
    <text x="72" y="${y + 28}" fill="${accent}" font-family="Arial" font-size="22" font-weight="700" letter-spacing="2">${esc(kicker)}</text>
    ${textLines(lines, { x: 72, y: y + 112, size: 62, weight: 700, gap: 1.02 })}
    ${subline ? `<text x="72" y="${y + 112 + lines.length * 64 + 30}" fill="${colors.muted}" font-family="Arial" font-size="26">${esc(subline)}</text>` : ""}
  `;
}

async function coverBuffer(input, { brightness = 0.72, saturation = 0.9, blur = 0 } = {}) {
  let pipeline = sharp(input).resize(W, H, { fit: "cover", position: "centre" }).modulate({ brightness, saturation });
  if (blur > 0) pipeline = pipeline.blur(blur);
  return pipeline.png().toBuffer();
}

async function cropBuffer(input, extract, width, height, fit = "cover") {
  return sharp(input)
    .extract(extract)
    .resize(width, height, { fit, position: "north", background: colors.bg })
    .png()
    .toBuffer();
}

async function makeFrame(number, composites) {
  const target = path.join(outDir, `scene-${String(number).padStart(2, "0")}.png`);
  await sharp({ create: { width: W, height: H, channels: 4, background: colors.bg } })
    .composite(composites)
    .png()
    .toFile(target);
  return target;
}

const hero = path.join(root, "public", "video", "materialloop-cinematic-hero-v2.png");
const landing = path.join(root, "tmp", "materialloop-landing.png");
const caseA = path.join(root, "tmp", "materialloop-case-a.png");
const caseB = path.join(root, "tmp", "materialloop-case-b.png");
const caseC = path.join(root, "tmp", "materialloop-case-c.png");
const slide4 = path.join(root, ".artifacts-build", "previews", "slide-4.png");
const slide7 = path.join(root, ".artifacts-build", "previews", "slide-7.png");
const slide8 = path.join(root, ".artifacts-build", "previews", "slide-8.png");

const heroBright = await coverBuffer(hero, { brightness: 0.72, saturation: 0.88 });
const heroDark = await coverBuffer(hero, { brightness: 0.46, saturation: 0.72, blur: 1.2 });

await makeFrame(1, [
  { input: heroBright },
  { input: svg(`
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#020706" stop-opacity="0.96"/><stop offset="0.55" stop-color="#020706" stop-opacity="0.56"/><stop offset="1" stop-color="#020706" stop-opacity="0.04"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="72" y="94" fill="${colors.teal}" font-family="Arial" font-size="22" font-weight="700" letter-spacing="2">GOOGLE CLOUD AI BUILDER CUP 2026</text>
    ${textLines(["500 KG OF ALUMINUM.", "ONE WRONG AI ANSWER."], { x: 72, y: 300, size: 76, gap: 1.04 })}
    <text x="76" y="520" fill="${colors.muted}" font-family="Arial" font-size="30">Reusable material can become value — or risk.</text>
    <rect x="72" y="596" width="190" height="7" rx="3" fill="${colors.teal}"/>
    <text x="72" y="930" fill="${colors.text}" font-family="Arial" font-size="32" font-weight="700">MaterialLoop AI</text>
    <text x="72" y="974" fill="${colors.muted}" font-family="Arial" font-size="23">Evidence-led industrial symbiosis discovery</text>
  `) },
]);

await makeFrame(2, [
  { input: heroDark },
  { input: svg(`
    ${chrome("THE DECISION PROBLEM", 2)}
    <text x="960" y="270" fill="${colors.text}" font-family="Arial" font-size="62" font-weight="700" text-anchor="middle">CONFIDENCE IS NOT THE SAME AS EVIDENCE.</text>
    <rect x="116" y="382" width="786" height="330" rx="28" fill="#111b18e8" stroke="#75462d" stroke-width="2"/>
    <text x="172" y="466" fill="${colors.red}" font-family="Arial" font-size="25" font-weight="700" letter-spacing="1.6">FALSE POSITIVE</text>
    <text x="172" y="552" fill="${colors.text}" font-family="Arial" font-size="50" font-weight="700">Safety and compliance risk</text>
    <text x="172" y="624" fill="${colors.muted}" font-family="Arial" font-size="28">Unsupported claims move forward.</text>
    <rect x="1018" y="382" width="786" height="330" rx="28" fill="#111b18e8" stroke="#275c4f" stroke-width="2"/>
    <text x="1074" y="466" fill="${colors.teal}" font-family="Arial" font-size="25" font-weight="700" letter-spacing="1.6">FALSE NEGATIVE</text>
    <text x="1074" y="552" fill="${colors.text}" font-family="Arial" font-size="50" font-weight="700">Reusable material loses value</text>
    <text x="1074" y="624" fill="${colors.muted}" font-family="Arial" font-size="28">Good evidence never reaches a buyer.</text>
    <text x="960" y="890" fill="${colors.amber}" font-family="Arial" font-size="34" font-weight="700" text-anchor="middle">The system must know when to decide — and when to stop.</text>
  `) },
]);

const landingBg = await coverBuffer(landing, { brightness: 0.34, saturation: 0.72, blur: 16 });
const landingFocus = await cropBuffer(landing, { left: 0, top: 40, width: 1264, height: 760 }, 1500, 900, "contain");
await makeFrame(3, [
  { input: landingBg },
  { input: landingFocus, left: 380, top: 118 },
  { input: svg(`
    ${chrome("THE PRODUCT", 3)}
    <rect x="36" y="190" width="470" height="700" rx="28" fill="#04100df2" stroke="#21483e" stroke-width="2"/>
    <text x="80" y="270" fill="${colors.teal}" font-family="Arial" font-size="24" font-weight="700" letter-spacing="1.6">ONE WORKFLOW</text>
    ${textLines(["EVIDENCE", "↓", "GEMINI", "↓", "RULES", "↓", "DECISION"], { x: 80, y: 366, size: 48, gap: 1.22 })}
    <circle cx="1750" cy="900" r="42" fill="${colors.teal}"/>
    <path d="M1730 880 L1774 900 L1730 920 Z" fill="#05100d"/>
  `) },
]);

const aTop = await cropBuffer(caseA, { left: 0, top: 0, width: 1264, height: 650 }, 1760, 905, "cover");
await makeFrame(4, [
  { input: await coverBuffer(caseA, { brightness: 0.28, saturation: 0.7, blur: 18 }) },
  { input: aTop, left: 80, top: 120 },
  { input: svg(`
    ${chrome("CASE A • EVIDENCE SUPPORTED", 4)}
    <rect x="105" y="804" width="1710" height="188" rx="22" fill="#04100ded" stroke="#2c6f5e" stroke-width="2"/>
    <text x="160" y="872" fill="${colors.teal}" font-family="Arial" font-size="22" font-weight="700" letter-spacing="1.6">DECISION READY</text>
    <text x="160" y="952" fill="${colors.text}" font-family="Arial" font-size="54" font-weight="700">NT$35,500  •  1,600 kg CO2e  •  92 / 100</text>
  `) },
]);

const aBody = await cropBuffer(caseA, { left: 0, top: 310, width: 1264, height: 930 }, 1480, 890, "contain");
await makeFrame(5, [
  { input: await coverBuffer(caseA, { brightness: 0.24, saturation: 0.65, blur: 18 }) },
  { input: aBody, left: 400, top: 120 },
  { input: svg(`
    ${chrome("AUDITABLE, NOT MAGICAL", 5)}
    <rect x="50" y="184" width="490" height="720" rx="28" fill="#04100df0" stroke="#21483e" stroke-width="2"/>
    <text x="94" y="270" fill="${colors.teal}" font-family="Arial" font-size="22" font-weight="700" letter-spacing="1.5">SEPARATION OF DUTIES</text>
    ${textLines(["Gemini observes.", "Code calculates.", "Evidence gates.", "Humans approve."], { x: 94, y: 382, size: 42, gap: 1.48 })}
  `) },
]);

const bTop = await cropBuffer(caseB, { left: 0, top: 0, width: 1264, height: 760 }, 1760, 900, "cover");
await makeFrame(6, [
  { input: await coverBuffer(caseB, { brightness: 0.25, saturation: 0.65, blur: 18 }) },
  { input: bTop, left: 80, top: 120 },
  { input: svg(`
    ${chrome("CASE B • MISSING EVIDENCE", 6)}
    ${titleBlock("VISIBLE REFUSAL", ["NO CERTIFICATE. NO VALUE CLAIM."], { y: 770, accent: colors.amber, subline: "Valuation, CO2e and matching remain blocked." })}
  `) },
]);

const cTop = await cropBuffer(caseC, { left: 0, top: 0, width: 1264, height: 790 }, 1760, 900, "cover");
await makeFrame(7, [
  { input: await coverBuffer(caseC, { brightness: 0.25, saturation: 0.62, blur: 18 }) },
  { input: cTop, left: 80, top: 120 },
  { input: svg(`
    ${chrome("CASE C • EVIDENCE CONFLICT", 7)}
    ${titleBlock("CONFLICT DETECTED", ["102.4% COMPOSITION. STOP."], { y: 770, accent: colors.red, subline: "The model does not invent certainty." })}
  `) },
]);

for (const [number, source, label, headline, accent] of [
  [8, slide4, "GOOGLE-NATIVE ARCHITECTURE", "GEMINI INTERPRETS. RULES DECIDE.", colors.teal],
  [9, slide7, "LIVE TECHNICAL PROOF", "THREE RUNS. THREE CORRECT OUTCOMES.", colors.teal],
  [10, slide8, "COMMERCIAL PATH", "PAID PILOT → SITE LICENSE → NETWORK", colors.amber],
]) {
  const background = await coverBuffer(source, { brightness: 0.72, saturation: 0.9 });
  await makeFrame(number, [
    { input: background },
    { input: svg(`${chrome(label, number)}${titleBlock(label, [headline], { y: 815, accent })}`) },
  ]);
}

await makeFrame(11, [
  { input: heroDark },
  { input: svg(`
    <defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#020706" stop-opacity="0.95"/><stop offset="0.7" stop-color="#020706" stop-opacity="0.45"/><stop offset="1" stop-color="#020706" stop-opacity="0.1"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#c)"/>
    <text x="72" y="102" fill="${colors.teal}" font-family="Arial" font-size="24" font-weight="700" letter-spacing="2">MATERIALLOOP AI</text>
    ${textLines(["EVIDENCE EARNS", "THE DECISION."], { x: 72, y: 330, size: 82, gap: 1.02 })}
    <text x="76" y="560" fill="${colors.muted}" font-family="Arial" font-size="30">Industrial leftovers. Decision-ready value.</text>
    <rect x="72" y="680" width="1220" height="112" rx="24" fill="#071713ea" stroke="#2e7060" stroke-width="2"/>
    <text x="110" y="752" fill="${colors.text}" font-family="Arial" font-size="31" font-weight="700">materialloop-ai-474046076456.asia-east1.run.app</text>
    <text x="72" y="944" fill="${colors.teal}" font-family="Arial" font-size="24" font-weight="700">LIVE ON GOOGLE CLOUD RUN  •  GEMINI 2.5 FLASH</text>
  `) },
]);

console.log(JSON.stringify({ outputDirectory: outDir, frameCount: 11 }, null, 2));
