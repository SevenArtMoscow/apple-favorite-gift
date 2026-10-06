// Ищет оригинальные иконки приложений в App Store (разные страны) и собирает кандидатов.
// Запуск: node tools/find-app-icons.cjs  → tools/.candidates.json
const fs = require('fs');
const path = require('path');

const QUERIES = {
  'Макс': 'MAX мессенджер', 'Вконтакте': 'VK социальная сеть', 'Сбербанк': 'СберБанк Онлайн', 'Авито': 'Авито',
  'Т-Банк': 'Т-Банк', 'Альфа Банк': 'Альфа-Банк', 'ChatGPT': 'ChatGPT', 'Одноклассники': 'Одноклассники',
  'VK Мессенджер': 'VK Мессенджер', 'Почта Mail': 'Почта Mail', 'VK Видео': 'VK Видео', 'Совкомбанк': 'Халва Совкомбанк',
  'DeepSeek': 'DeepSeek', 'МегаМаркет': 'Мегамаркет', 'Rutube': 'Rutube', 'VK Музыка': 'VK Музыка',
  'Яндекс Пэй': 'Яндекс Пэй', 'Okko': 'Okko', 'Купер': 'Купер', 'Лента': 'Лента', 'Claude': 'Claude Anthropic',
  'Perplexity': 'Perplexity', 'Grok': 'Grok', 'Облако Mail': 'Облако Mail', 'Юла': 'Юла', 'АЗС Газпром': 'Газпромнефть АЗС',
  'S7 Airlines': 'S7 Airlines', 'Сбер Мобайл': 'СберМобайл', 'Газпром Инвестиции': 'Газпром Инвестиции',
  'v2RayTun': 'v2RayTun', 'Happ Plus': 'Happ Proxy Utility', '2ГИС': '2ГИС', 'Альфа-Страхование': 'Альфа-Страхование',
  'Аптека Апрель': 'Аптека Апрель', 'Банк Авангард': 'Банк Авангард', 'ВТБ': 'ВТБ Онлайн', 'Маруся': 'Маруся',
  'Мой налог': 'Мой налог', 'МТС Pay': 'МТС Pay', 'Новиком': 'НовикомБанк', 'Премьер': 'PREMIER Премьер',
  'Ренессанс': 'Ренессанс', 'Россельхозбанк': 'Россельхозбанк', 'СБПэй': 'СБПэй', 'СОГАЗ': 'СОГАЗ',
  'Сургутнефтегазбанк': 'Сургутнефтегазбанк', 'Poizon': 'POIZON', 'WB Бизнес': 'WB Бизнес', 'YOTA': 'Yota',
  'СберЗвук': 'СберЗвук', 'УБРиР': 'УБРиР', 'СберКидс': 'СберКидс', 'ВТБ Инвестиции': 'ВТБ Мои Инвестиции',
};
const COUNTRIES = ['ru', 'kz', 'by', 'us'];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function search(term, country) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=software&limit=4`);
    if (res.ok) return (await res.json()).results || [];
    await sleep(1500 * (attempt + 1));
  }
  return [];
}

(async () => {
  const out = {};
  for (const [name, term] of Object.entries(QUERIES)) {
    out[name] = [];
    const seen = new Set();
    for (const c of COUNTRIES) {
      for (const r of await search(term, c)) {
        if (seen.has(r.trackId)) continue;
        seen.add(r.trackId);
        out[name].push({ c, id: r.trackId, n: r.trackName, s: r.sellerName, icon: r.artworkUrl512 });
      }
      await sleep(250);
    }
    console.log(`${name}: ${out[name].length}`);
  }
  fs.writeFileSync(path.join(__dirname, '.candidates.json'), JSON.stringify(out));
})();
