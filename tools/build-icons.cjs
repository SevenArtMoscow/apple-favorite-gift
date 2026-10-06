// Скачивает глифы брендов из Simple Icons (CC0) и собирает js/icons.js.
// Запуск: node tools/build-icons.cjs
const fs = require('fs');
const path = require('path');

const SLUGS = [
  'apple', 'telegram', 'playstation', 'roblox', 'fortnite', 'discord',
  'vk', 'odnoklassniki', 'deepseek', 'claude', 'perplexity', 's7airlines', 'googlegemini',
];

(async () => {
  const out = {};
  for (const slug of SLUGS) {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`);
    if (!res.ok) { console.warn('нет иконки', slug); continue; }
    const svg = await res.text();
    const d = (svg.match(/<path d="([^"]+)"/) || [])[1];
    if (d) out[slug] = d;
  }
  const js = `// Сгенерировано tools/build-icons.cjs из Simple Icons (CC0). Не править руками.\nwindow.BRAND_ICONS = ${JSON.stringify(out, null, 0)};\n`;
  fs.writeFileSync(path.join(__dirname, '..', 'js', 'icons.js'), js);
  console.log('иконок:', Object.keys(out).length);
})();
