// Собирает js/ui-icons.js из Phosphor Icons (MIT): regular + fill + bold для каждой иконки.
// Запуск: node tools/build-ui-icons.cjs
const fs = require('fs');
const path = require('path');

const NAMES = [
  'squares-four', 'receipt', 'gift', 'user', 'chat-circle-dots', 'caret-right', 'caret-left',
  'check', 'x', 'info', 'magnifying-glass', 'shopping-bag', 'copy', 'export', 'paper-plane-tilt',
  'lightning', 'apple-logo', 'cloud', 'device-mobile', 'game-controller', 'question', 'file-text',
  'shield-check', 'seal-check', 'headset', 'trash', 'plus', 'arrows-clockwise', 'sparkle', 'package',
  'check-circle', 'hand-tap',
];

const BASE = 'https://cdn.jsdelivr.net/npm/@phosphor-icons/core@latest/assets';
const pathOf = svg => [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1]).join('');

(async () => {
  const out = {};
  for (const name of NAMES) {
    const reg = await fetch(`${BASE}/regular/${name}.svg`);
    const fil = await fetch(`${BASE}/fill/${name}-fill.svg`);
    const bld = await fetch(`${BASE}/bold/${name}-bold.svg`);
    if (!reg.ok) { console.warn('нет иконки', name); continue; }
    out[name] = {
      r: pathOf(await reg.text()),
      f: fil.ok ? pathOf(await fil.text()) : null,   // заливка — для активных состояний
      b: bld.ok ? pathOf(await bld.text()) : null,   // жирная — для галочек и крестиков
    };
  }
  fs.writeFileSync(path.join(__dirname, '..', 'js', 'ui-icons.js'),
    `// Сгенерировано tools/build-ui-icons.cjs из Phosphor Icons (MIT). Не править руками.\nwindow.PH = ${JSON.stringify(out)};\n`);
  console.log('иконок:', Object.keys(out).length);
})();
