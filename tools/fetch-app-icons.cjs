// Скачивает оригинальные иконки приложений:
//  1) из App Store (по найденным id, tools/.candidates.json);
//  2) для приложений, которых в сторе нет, — иконку с официального сайта (apple-touch-icon).
// Сырые файлы кладёт в RAW_DIR, дальше их приводит к единому виду tools/normalize-app-icons.py.
// Запуск: node tools/fetch-app-icons.cjs <папка-для-сырых-файлов>
const fs = require('fs');
const path = require('path');

const RAW_DIR = process.argv[2];
if (!RAW_DIR) { console.error('Укажите папку для сырых файлов'); process.exit(1); }
fs.mkdirSync(RAW_DIR, { recursive: true });

const candidates = require('./.candidates.json');
const byId = new Map();
Object.values(candidates).flat().forEach(c => byId.set(c.id, c));

// Приложения, найденные в App Store: имя в каталоге -> trackId
const APPSTORE = {
  'ChatGPT': 6448311069, 'DeepSeek': 6737597349, 'Perplexity': 1668000334, 'Claude': 6473753684, 'Grok': 6670324846,
  'МегаМаркет': 1438856489, '2ГИС': 481627348, 'Мой налог': 1437518854, 'Poizon': 6742818619, 'WB Бизнес': 1661093227,
  'Happ Plus': 6504287215, 'Авито': 1484617778, 'Альфа-Страхование': 1123945755,
  'Ренессанс': 1456449980,
};

// Остальные — официальные сайты
const SITES = {
  'Т-Банк': ['tbank.ru', 'www.tbank.ru'],
  'Макс': ['max.ru'], 'Вконтакте': ['vk.com'], 'Сбербанк': ['sberbank.ru', 'online.sberbank.ru'],
  'Альфа Банк': ['alfabank.ru'], 'Одноклассники': ['ok.ru'], 'VK Мессенджер': ['vk.me', 'vk.com'],
  'Почта Mail': ['mail.ru'], 'VK Видео': ['vkvideo.ru'], 'Совкомбанк': ['sovcombank.ru'], 'Rutube': ['rutube.ru'],
  'VK Музыка': ['music.vk.com', 'vk.com'], 'Яндекс Пэй': ['pay.yandex.ru'], 'Okko': ['okko.tv'], 'Купер': ['kuper.ru'],
  'Лента': ['lenta.com', 'www.lenta.com', 'lentacom.ru'], 'Облако Mail': ['cloud.mail.ru'], 'Юла': ['youla.ru'], 'АЗС Газпром': ['gpnbonus.ru'],
  'S7 Airlines': ['s7.ru'], 'Сбер Мобайл': ['sbermobile.ru'], 'Газпром Инвестиции': ['gazprombank.investments'],
  'v2RayTun': ['v2raytun.com'], 'Аптека Апрель': ['apteka-april.ru'], 'Банк Авангард': ['www.avangard.ru', 'avangard.ru'],
  'ВТБ': ['www.vtb.ru', 'online.vtb.ru', 'vtb.ru'], 'Маруся': ['marusia.mail.ru'], 'МТС Pay': ['mts.ru', 'pay.mts.ru'], 'Новиком': ['www.novikom.ru', 'novikom.ru'],
  'Премьер': ['premier.one'], 'Россельхозбанк': ['www.rshb.ru', 'rshb.ru'], 'СБПэй': ['sbp.nspk.ru'], 'СОГАЗ': ['www.sogaz.ru', 'sogaz.ru'],
  'Сургутнефтегазбанк': ['www.sngb.ru', 'sngb.ru'], 'YOTA': ['yota.ru'], 'СберЗвук': ['zvuk.com'], 'УБРиР': ['ubrr.ru'],
  'СберКидс': ['sberkids.ru', 'kids.sberbank.ru', 'sberbank.ru'], 'ВТБ Инвестиции': ['broker.vtb.ru', 'vtb.ru'],
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
// Имя файла — латиницей (транслит), чтобы не ломались пути
const TR = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
const slug = name => name.toLowerCase().split('').map(ch => TR[ch] !== undefined ? TR[ch] : ch).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
if (require.main !== module) module.exports = { slug };

async function get(url, asText) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 12000);
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow', signal: ctl.signal });
    if (!res.ok) return null;
    return asText ? await res.text() : Buffer.from(await res.arrayBuffer());
  } catch (e) { return null; } finally { clearTimeout(t); }
}

// Находит самую крупную иконку страницы
async function siteIcon(domain) {
  const base = `https://${domain}/`;
  const html = await get(base, true);
  const found = [];
  if (html) {
    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      const tag = m[0];
      const rel = (tag.match(/rel=["']([^"']+)["']/i) || [])[1] || '';
      const href = (tag.match(/href=["']([^"']+)["']/i) || [])[1];
      if (!href || !/icon/i.test(rel)) continue;
      const sizes = (tag.match(/sizes=["'](\d+)x\d+["']/i) || [])[1];
      const touch = /apple-touch-icon/i.test(rel);
      let size = Number(sizes) || (touch ? 180 : 32);
      if (/\.svg(\?|$)/i.test(href)) size = 0;      // svg не берём — нужен растр
      try { found.push({ url: new URL(href, base).href, size, touch }); } catch (e) { /* битая ссылка */ }
    }
  }
  ['apple-touch-icon.png', 'apple-touch-icon-precomposed.png', 'apple-touch-icon-180x180.png'].forEach(f => found.push({ url: base + f, size: 100, touch: true }));
  found.sort((a, b) => (b.touch - a.touch) || (b.size - a.size));
  for (const f of found) {
    if (!f.size) continue;
    const buf = await get(f.url);
    if (buf && buf.length > 800) return { buf, url: f.url, ext: (f.url.match(/\.(png|jpg|jpeg|webp|ico)(\?|$)/i) || [, 'png'])[1].toLowerCase() };
  }
  return null;
}

(async () => {
  const report = {};
  for (const [name, id] of Object.entries(APPSTORE)) {
    const c = byId.get(id);
    const buf = c && await get(c.icon.replace('512x512bb', '512x512bb'));
    if (!buf) { report[name] = 'нет в сторе'; continue; }
    fs.writeFileSync(path.join(RAW_DIR, `${slug(name)}.jpg`), buf);
    report[name] = `appstore: ${c.n} / ${c.s}`;
    console.log('✓', name, '←', c.n);
  }
  for (const [name, domains] of Object.entries(SITES)) {
    let done = null;
    for (const d of domains) { done = await siteIcon(d); if (done) { done.domain = d; break; } }
    if (!done) {
      // Запасной вариант: favicon-сервис Google (может быть небольшого размера)
      for (const d of domains) {
        const buf = await get(`https://www.google.com/s2/favicons?domain=${d}&sz=256`);
        if (buf && buf.length > 600) { done = { buf, url: `google-favicon:${d}`, ext: 'png' }; break; }
      }
    }
    if (!done) { report[name] = 'не найдено'; console.log('✗', name); continue; }
    fs.writeFileSync(path.join(RAW_DIR, `${slug(name)}.${done.ext}`), done.buf);
    report[name] = `сайт: ${done.url}`;
    console.log('✓', name, '←', done.url);
  }
  fs.writeFileSync(path.join(RAW_DIR, '_report.json'), JSON.stringify(report, null, 2));
})();
