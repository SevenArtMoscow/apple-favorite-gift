// Собирает js/app-icons.js: имя приложения из каталога -> путь к иконке в img/apps/.
// Запускать после fetch-app-icons.cjs + normalize-app-icons.py. Запуск: node tools/apply-app-icons.cjs
const fs = require('fs');
const path = require('path');

const TR = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
const slug = name => name.toLowerCase().split('').map(ch => (TR[ch] !== undefined ? TR[ch] : ch)).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const root = path.join(__dirname, '..');
const win = {};
new Function('window', fs.readFileSync(path.join(root, 'js', 'data.js'), 'utf8'))(win);

const map = {};
const missing = [];
for (const app of win.DATA.apps) {
  const file = `img/apps/${slug(app.name)}.webp`;
  if (fs.existsSync(path.join(root, file))) map[app.name] = file; else missing.push(app.name);
}
fs.writeFileSync(path.join(root, 'js', 'app-icons.js'),
  `// Сгенерировано tools/apply-app-icons.cjs. Не править руками.\nwindow.APP_ICONS = ${JSON.stringify(map, null, 1)};\n`);
console.log(`иконок: ${Object.keys(map).length} из ${win.DATA.apps.length}`);
console.log('остались плитками:', missing.join(', '));
