// Каталог магазина. Цены — ориентиры, правьте под себя.
// Иконка: { glyph: 'slug' } — глиф из js/icons.js, { text: 'А' } — буква,
// { image: 'img/apps/sber.png' } — своя картинка (перекрывает остальное).
// bg — фон плитки (цвет или CSS-градиент), fg — цвет глифа/текста.

window.DATA = {
  // ── Коды и подписки ─────────────────────────────
  codes: [
    {
      id: 'apple',
      title: 'Apple Gift Cards',
      icon: { glyph: 'apple', bg: '#000', fg: '#fff' },
      regions: [
        {
          id: 'us', flag: '🇺🇸', code: 'US', name: 'Америка',
          note: 'Данные коды подойдут для аккаунтов Apple ID, если у вас выбран регион: США',
          options: [
            { label: 'Apple Gift Card $10', price: 1490 },
            { label: 'Apple Gift Card $20', price: 2690 },
            { label: 'Apple Gift Card $25', price: 3290 },
            { label: 'Apple Gift Card $50', price: 6290 },
            { label: 'Apple Gift Card $100', price: 12390 },
          ],
        },
        {
          id: 'tr', flag: '🇹🇷', code: 'TR', name: 'Турция',
          note: 'Данные коды подойдут для аккаунтов Apple ID, если у вас выбран регион: Турция',
          options: [
            { label: 'Apple Gift Card 100 TL', price: 990 },
            { label: 'Apple Gift Card 250 TL', price: 1990 },
            { label: 'Apple Gift Card 500 TL', price: 3690 },
            { label: 'Apple Gift Card 1000 TL', price: 6990 },
          ],
        },
        {
          id: 'ae', flag: '🇦🇪', code: 'AE', name: 'ОАЭ',
          note: 'Данные коды подойдут для аккаунтов Apple ID, если у вас выбран регион: ОАЭ',
          options: [
            { label: 'Apple Gift Card 50 AED', price: 1790 },
            { label: 'Apple Gift Card 100 AED', price: 3390 },
            { label: 'Apple Gift Card 250 AED', price: 8190 },
          ],
        },
      ],
    },
    {
      id: 'tg-premium',
      title: 'Telegram Premium',
      icon: { glyph: 'telegram', bg: '#2AABEE', fg: '#fff' },
      needsUsername: true,
      note: 'Подписку оформим на ваш аккаунт — понадобится только @username. Вход в аккаунт не нужен.',
      options: [
        { label: 'Telegram Premium — 3 месяца', price: 1790 },
        { label: 'Telegram Premium — 6 месяцев', price: 2390 },
        { label: 'Telegram Premium — 12 месяцев', price: 3990 },
      ],
    },
    {
      id: 'playstation',
      title: '🎮 PlayStation',
      icon: { glyph: 'playstation', bg: '#0070D1', fg: '#fff' },
      regions: [
        {
          id: 'tr', flag: '🇹🇷', code: 'TR', name: 'Турция',
          note: 'Коды подойдут для аккаунта PSN с регионом Турция',
          options: [
            { label: 'PSN 250 TL', price: 790 },
            { label: 'PSN 500 TL', price: 1490 },
            { label: 'PSN 1000 TL', price: 2890 },
          ],
        },
        {
          id: 'us', flag: '🇺🇸', code: 'US', name: 'Америка',
          note: 'Коды подойдут для аккаунта PSN с регионом США',
          options: [
            { label: 'PSN $10', price: 1490 },
            { label: 'PSN $25', price: 3390 },
            { label: 'PSN $50', price: 6590 },
          ],
        },
      ],
    },
    {
      id: 'xbox',
      title: 'Xbox Gift Cards',
      icon: { text: 'X', bg: '#107C10', fg: '#fff' },
      regions: [
        {
          id: 'us', flag: '🇺🇸', code: 'US', name: 'Америка',
          note: 'Коды подойдут для аккаунта Microsoft с регионом США',
          options: [
            { label: 'Xbox $10', price: 1290 },
            { label: 'Xbox $15', price: 1890 },
            { label: 'Xbox $25', price: 3090 },
            { label: 'Xbox $50', price: 6090 },
          ],
        },
      ],
    },
    {
      id: 'roblox',
      title: 'Roblox Gift Cards',
      icon: { glyph: 'roblox', bg: '#1d1d1f', fg: '#fff' },
      note: 'Код активируется на roblox.com/redeem — Robux зачисляются сразу.',
      options: [
        { label: 'Roblox $10 — 800 Robux', price: 1190 },
        { label: 'Roblox $25 — 2 000 Robux', price: 2890 },
        { label: 'Roblox $50 — 4 500 Robux', price: 5590 },
      ],
    },
    {
      id: 'fortnite',
      title: 'Fortnite Gift Cards',
      icon: { glyph: 'fortnite', bg: 'linear-gradient(160deg,#4f3bd8,#2a1d8c)', fg: '#fff' },
      note: 'V-Bucks зачисляются на аккаунт Epic Games.',
      options: [
        { label: '2 800 V-Bucks', price: 3990 },
        { label: '5 000 V-Bucks', price: 6490 },
        { label: '13 500 V-Bucks', price: 14990 },
      ],
    },
    {
      id: 'discord',
      title: 'Discord Подписка',
      icon: { glyph: 'discord', bg: '#5865F2', fg: '#fff' },
      note: 'Nitro оформим на ваш аккаунт Discord.',
      options: [
        { label: 'Nitro Basic — 1 месяц', price: 620 },
        { label: 'Nitro — 1 месяц', price: 1290 },
        { label: 'Nitro — 12 месяцев', price: 11990 },
      ],
    },
  ],

  // ── Приложения, удалённые из российского App Store ──
  appCategories: ['Банки', 'Общение', 'AI', 'Сервисы', 'Финансы', 'VPN'],

  apps: [
    { name: 'Макс', cat: 'Общение', icon: { text: 'M', bg: 'linear-gradient(140deg,#3b82f6,#8b5cf6)', fg: '#fff' } },
    { name: 'Вконтакте', cat: 'Общение', icon: { glyph: 'vk', bg: '#0077FF', fg: '#fff' } },
    { name: 'Сбербанк', cat: 'Банки', icon: { text: 'С', bg: '#21A038', fg: '#fff' } },
    { name: 'Авито', cat: 'Сервисы', icon: { art: 'avito', bg: '#fff' } },
    { name: 'Т-Банк', cat: 'Банки', icon: { text: 'Т', bg: '#FFDD2D', fg: '#1d1d1f' } },
    { name: 'Альфа Банк', cat: 'Банки', icon: { text: 'А', bg: '#EF3124', fg: '#fff' } },
    { name: 'ChatGPT', cat: 'AI', icon: { text: 'GPT', bg: '#0d0d0d', fg: '#fff' } },
    { name: 'Одноклассники', cat: 'Общение', icon: { glyph: 'odnoklassniki', bg: '#EE8208', fg: '#fff' } },
    { name: 'VK Мессенджер', cat: 'Общение', icon: { glyph: 'vk', bg: 'linear-gradient(140deg,#2787F5,#5b4bff)', fg: '#fff' } },
    { name: 'Почта Mail', cat: 'Сервисы', icon: { text: '@', bg: '#005FF9', fg: '#fff' } },
    { name: 'VK Видео', cat: 'Сервисы', icon: { text: '▶', bg: 'linear-gradient(140deg,#ff4d6d,#ff2d55)', fg: '#fff', size: 40 } },
    { name: 'Совкомбанк', cat: 'Банки', icon: { text: 'С', bg: '#1E4BD2', fg: '#fff' } },
    { name: 'DeepSeek', cat: 'AI', icon: { glyph: 'deepseek', bg: '#fff', fg: '#4D6BFE' } },
    { name: 'МегаМаркет', cat: 'Сервисы', icon: { text: 'М', bg: '#8654CC', fg: '#fff' } },
    { name: 'Rutube', cat: 'Сервисы', icon: { text: 'R', bg: '#100943', fg: '#fff' } },
    { name: 'VK Музыка', cat: 'Сервисы', icon: { text: '♪', bg: 'linear-gradient(140deg,#ff3985,#a24bff)', fg: '#fff' } },
    { name: 'Яндекс Пэй', cat: 'Финансы', icon: { text: 'Pay', bg: '#000', fg: '#fff' } },
    { name: 'Okko', cat: 'Сервисы', icon: { text: 'O', bg: '#5b1cff', fg: '#fff' } },
    { name: 'Купер', cat: 'Сервисы', icon: { text: 'К', bg: '#2fbf5b', fg: '#fff' } },
    { name: 'Лента', cat: 'Сервисы', icon: { text: 'Л', bg: '#003D96', fg: '#FFD200' } },
    { name: 'Claude', cat: 'AI', icon: { glyph: 'claude', bg: '#F4EEE6', fg: '#D97757' } },
    { name: 'Perplexity', cat: 'AI', icon: { glyph: 'perplexity', bg: '#0f2b2e', fg: '#20b8cd' } },
    { name: 'Grok', cat: 'AI', icon: { text: 'G', bg: '#000', fg: '#fff' } },
    { name: 'Облако Mail', cat: 'Сервисы', icon: { text: '☁', bg: '#005FF9', fg: '#fff' } },
    { name: 'Юла', cat: 'Сервисы', icon: { text: 'Ю', bg: '#7d3cff', fg: '#fff' } },
    { name: 'АЗС Газпром', cat: 'Сервисы', icon: { text: 'Г', bg: '#0079C2', fg: '#fff' } },
    { name: 'S7 Airlines', cat: 'Сервисы', icon: { glyph: 's7airlines', bg: '#C4D600', fg: '#1d1d1f' } },
    { name: 'Сбер Мобайл', cat: 'Общение', icon: { text: 'SIM', bg: '#21A038', fg: '#fff' } },
    { name: 'Газпром Инвестиции', cat: 'Финансы', icon: { text: 'ГИ', bg: '#0079C2', fg: '#fff' } },
    { name: 'v2RayTun', cat: 'VPN', icon: { text: 'V2', bg: '#111', fg: '#fff' } },
    { name: 'Happ Plus', cat: 'VPN', icon: { text: 'H', bg: '#1d1d1f', fg: '#fff' } },
    { name: '2ГИС', cat: 'Сервисы', icon: { text: '2', bg: '#19AA1E', fg: '#fff' } },
    { name: 'Альфа-Страхование', cat: 'Финансы', icon: { text: 'АС', bg: '#EF3124', fg: '#fff' } },
    { name: 'Аптека Апрель', cat: 'Сервисы', icon: { text: 'А', bg: '#E40073', fg: '#fff' } },
    { name: 'Банк Авангард', cat: 'Банки', icon: { text: 'А', bg: '#0B7B3E', fg: '#fff' } },
    { name: 'ВТБ', cat: 'Банки', icon: { text: 'ВТБ', bg: '#0A2896', fg: '#fff' } },
    { name: 'Маруся', cat: 'AI', icon: { text: 'М', bg: 'linear-gradient(140deg,#8a3ffc,#ff4db8)', fg: '#fff' } },
    { name: 'Мой налог', cat: 'Финансы', icon: { text: '%', bg: '#2D6BF6', fg: '#fff' } },
    { name: 'МТС Pay', cat: 'Финансы', icon: { text: 'Pay', bg: '#E30611', fg: '#fff' } },
    { name: 'Новиком', cat: 'Банки', icon: { text: 'Н', bg: '#12245B', fg: '#fff' } },
    { name: 'Премьер', cat: 'Сервисы', icon: { text: 'P', bg: '#000', fg: '#FFD400' } },
    { name: 'Ренессанс', cat: 'Банки', icon: { text: 'Р', bg: '#D6004F', fg: '#fff' } },
    { name: 'Россельхозбанк', cat: 'Банки', icon: { text: 'Р', bg: '#007A3D', fg: '#fff' } },
    { name: 'СБПэй', cat: 'Финансы', icon: { text: 'СБП', bg: 'linear-gradient(140deg,#5b2d90,#1d97d4 55%,#f7a823)', fg: '#fff' } },
    { name: 'СОГАЗ', cat: 'Финансы', icon: { text: 'С', bg: '#0060A9', fg: '#fff' } },
    { name: 'Сургутнефтегазбанк', cat: 'Банки', icon: { text: 'СНГ', bg: '#0057A4', fg: '#fff' } },
    { name: 'Poizon', cat: 'Сервисы', icon: { text: 'PZ', bg: '#000', fg: '#fff' } },
    { name: 'WB Бизнес', cat: 'Сервисы', icon: { text: 'WB', bg: '#CB11AB', fg: '#fff' } },
    { name: 'YOTA', cat: 'Общение', icon: { text: 'Y', bg: '#00AEEF', fg: '#fff' } },
    { name: 'СберЗвук', cat: 'Сервисы', icon: { text: '♪', bg: '#21A038', fg: '#fff' } },
    { name: 'УБРиР', cat: 'Банки', icon: { text: 'У', bg: '#E30613', fg: '#fff' } },
    { name: 'СберКидс', cat: 'Банки', icon: { text: 'K', bg: '#21A038', fg: '#fff' } },
    { name: 'ВТБ Инвестиции', cat: 'Финансы', icon: { text: 'ВИ', bg: '#0A2896', fg: '#fff' } },
  ],

  // ── Профиль: инструкции и документы ─────────────
  guides: [
    {
      id: 'apple-code', title: 'Активация Apple кода', icon: 'apple',
      body: [
        'Откройте App Store и нажмите на свой аватар в правом верхнем углу.',
        'Выберите «Погасить подарочную карту или код».',
        'Введите код вручную или отсканируйте его камерой.',
        'Важно: регион вашего Apple ID должен совпадать с регионом карты — иначе код не активируется.',
      ],
    },
    {
      id: 'icloud', title: 'Оплата iCloud', icon: 'cloud',
      body: [
        'Пополните баланс Apple ID подарочным кодом нужного региона (см. «Активация Apple кода»).',
        'Откройте Настройки → ваше имя → iCloud → Управление хранилищем → Сменить план.',
        'Выберите тариф — оплата спишется с баланса Apple ID.',
        'Если баланса не хватит, подписка не продлится: следите, чтобы на счёте была сумма на следующий месяц.',
      ],
    },
    {
      id: 'install', title: 'Установка приложений', icon: 'phone',
      body: [
        'Выберите приложения во вкладке «Приложения» и оформите заказ — менеджер свяжется с вами в Telegram.',
        'После оплаты пришлём данные учётной записи App Store с уже купленными приложениями и пошаговую инструкцию.',
        'Входите только в App Store (Настройки → ваше имя → Медиаматериалы и покупки), а не в iCloud — так ваши фото и данные останутся на вашем аккаунте.',
        'Скачайте приложения из раздела «Покупки», затем выйдите и войдите обратно в свой Apple ID. Приложения останутся на телефоне.',
      ],
    },
    {
      id: 'ps', title: 'Вход в PS аккаунт', icon: 'gamepad',
      body: [
        'Коды PSN работают только на аккаунте того же региона, что и карта.',
        'Если у вас нет зарубежного аккаунта — менеджер поможет его создать.',
        'Активация: PlayStation Store → ваш аватар → «Активировать код».',
      ],
    },
    {
      id: 'faq', title: 'Вопросы и инструкции', icon: 'help',
      body: [
        'Как быстро придёт код? Обычно в течение 5–15 минут после оплаты, в рабочее время.',
        'Что если код не подошёл? Напишите в поддержку — проверим и заменим, если ошибка на нашей стороне.',
        'Как оплатить? Способ оплаты пришлёт менеджер после оформления заказа.',
      ],
    },
  ],

  documents: [
    { id: 'offer', title: 'Публичная оферта', icon: 'doc', body: ['Текст публичной оферты будет размещён здесь. Замените его в js/data.js.'] },
    { id: 'privacy', title: 'Политика конфиденциальности', icon: 'shield', body: ['Текст политики конфиденциальности будет размещён здесь. Замените его в js/data.js.'] },
    { id: 'about', title: 'О магазине', icon: 'info', body: ['Подарочные карты, подписки и установка приложений, недоступных в российском App Store. Быстро, с поддержкой в Telegram.'] },
  ],
};
