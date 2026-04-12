// Render source + output SVGs side-by-side at 256px to inspect
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const SRC = 'C:/Users/nofun/Downloads/Images/COUNTRY_LOGOS_wc';
const OUT_BLACK = path.resolve(__dirname, '../frontend/public/logos');
const OUT_WHITE = path.resolve(__dirname, '../frontend/public/logos/white');
const DBG = path.resolve(__dirname, 'debug-out');
fs.mkdirSync(DBG, { recursive: true });

const samples = ['brasil','canada','germany','korea','jordan','saudiarabia','spain_1','mexico','france','japan'];
const NAME_MAP = { brasil:'brazil', canada:'canada', germany:'germany', korea:'south-korea', jordan:'jordan', saudiarabia:'saudi-arabia', spain_1:'spain', mexico:'mexico', france:'france', japan:'japan' };

async function render(svgPath, out, bg) {
  const buf = fs.readFileSync(svgPath);
  await sharp(buf, { density: 400 })
    .resize(256, 256, { fit: 'contain', background: bg })
    .flatten({ background: bg })
    .png().toFile(out);
}

(async () => {
  for (const s of samples) {
    const srcSvg = path.join(SRC, `${s}.svg`);
    if (!fs.existsSync(srcSvg)) continue;
    const slug = NAME_MAP[s];
    await render(srcSvg, path.join(DBG, `${s}-src-onwhite.png`), { r: 255, g: 255, b: 255 });
    await render(srcSvg, path.join(DBG, `${s}-src-onblack.png`), { r: 0, g: 0, b: 0 });
    await render(path.join(OUT_BLACK, `${slug}.svg`), path.join(DBG, `${slug}-out-black.png`), { r: 255, g: 255, b: 255 });
    await render(path.join(OUT_WHITE, `${slug}.svg`), path.join(DBG, `${slug}-out-white.png`), { r: 0, g: 0, b: 0 });
    console.log(`done ${s}`);
  }
})();
