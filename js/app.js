(function () {
  'use strict';

  const CFG = window.CONFIG;
  const DATA = window.DATA;
  const GLYPHS = window.BRAND_ICONS || {};
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTelegram = !!(tg && tg.initData);
  const tgUser = (inTelegram && tg.initDataUnsafe && tg.initDataUnsafe.user) || null;

  const ORDERS_KEY = 'af-gift-orders-v1';
  const SELECTION_KEY = 'af-gift-apps-v1';
  const REFERRER_KEY = 'af-gift-ref-v1';

  // ── Иконки интерфейса (Phosphor Icons, js/ui-icons.js) ──
  const PH = window.PH || {};
  const UI = {
    chev: 'caret-right', back: 'caret-left', check: 'check', close: 'x', info: 'info',
    search: 'magnifying-glass', bag: 'shopping-bag', gift: 'gift', copy: 'copy', share: 'export',
    send: 'paper-plane-tilt', chat: 'chat-circle-dots', bolt: 'lightning', apple: 'apple-logo',
    cloud: 'cloud', phone: 'device-mobile', gamepad: 'game-controller', help: 'question',
    doc: 'file-text', shield: 'shield-check', seal: 'seal-check', trash: 'trash', plus: 'plus',
    swap: 'arrows-clockwise', package: 'package', tap: 'hand-tap',
  };
  // weight: 'r' — обычная, 'f' — заливка (активное состояние), 'b' — жирная
  const svg = (name, cls = '', weight = 'r') => {
    const icon = PH[name];
    if (!icon) return '';
    return `<svg viewBox="0 0 256 256" class="ph ${cls}" aria-hidden="true"><path d="${icon[weight] || icon.r}"/></svg>`;
  };
  const TAB_ICONS = { catalog: 'squares-four', orders: 'receipt', referrals: 'gift', profile: 'user' };

  // Настоящие иконки приложений (js/app-icons.js) поверх плиток-заглушек
  const APP_ICONS = window.APP_ICONS || {};
  DATA.apps.forEach(a => { if (APP_ICONS[a.name]) a.icon = { ...a.icon, image: APP_ICONS[a.name] }; });

  // ── Хранилище (может быть недоступно — тогда просто не запоминаем) ──
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* недоступно */ } },
  };

  // ── Состояние ───────────────────────────────────
  const state = {
    tab: 'catalog',
    mode: 'codes',
    stack: [],            // навигация внутри «Кодов»: [{ view, pid, rid, scroll }]
    rootScroll: 0,
    option: null,         // выбранный номинал (индекс)
    appQuery: '',
    appCat: 'Все',
    appSel: new Set(store.get(SELECTION_KEY, []).filter(n => DATA.apps.some(a => a.name === n))),
    ordersFilter: 'active',
    sheetOpen: false,
    sheetKind: null,      // 'set' — шторка набора приложений
  };

  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => `${Math.round(n).toLocaleString('ru-RU')} ₽`;
  const plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };
  const appsWord = n => plural(n, 'приложение', 'приложения', 'приложений');
  const round10 = n => Math.round(n / 10) * 10;
  const cleanUsername = s => (s || '').trim().replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '').replace(/^@/, '').replace(/\/+$/, '');

  // ── Реферал: кто пригласил (приходит в start_param) ──
  (function rememberReferrer() {
    const param = inTelegram ? tg.initDataUnsafe.start_param : new URLSearchParams(location.search).get('ref');
    if (!param || !/^ref_\w+$/.test(param)) return;
    if (tgUser && param === `ref_${tgUser.id}`) return;      // сам себя не приглашает
    if (!store.get(REFERRER_KEY, null)) store.set(REFERRER_KEY, param);
  })();

  // ── Плитка-иконка ───────────────────────────────
  function tileHtml(icon, flag) {
    const style = icon.image ? `color:${icon.fg || '#fff'}` : `background:${icon.bg || 'var(--card-2)'};color:${icon.fg || '#fff'}`;
    let inner;
    if (icon.image) inner = `<img src="${esc(icon.image)}" alt="" decoding="async" />`;
    else if (icon.art === 'avito') inner = '<span class="avito"><i style="left:0;top:0;width:52%;height:52%;background:#00AAFF"></i><i style="right:4%;top:6%;width:30%;height:30%;background:#97CF26"></i><i style="left:8%;bottom:4%;width:30%;height:30%;background:#FF6163"></i><i style="right:0;bottom:0;width:44%;height:44%;background:#A169F7"></i></span>';
    else if (icon.glyph && GLYPHS[icon.glyph]) inner = `<svg viewBox="0 0 24 24"><path d="${GLYPHS[icon.glyph]}"/></svg>`;
    else {
      const t = icon.text || '?';
      // Размер буквы — доля ширины плитки (cqw), чтобы текст масштабировался вместе с ней
      const size = icon.size || (t.length >= 3 ? 28 : t.length === 2 ? 36 : 46);
      inner = `<span class="tile-text" style="font-size:${size}cqw">${esc(t)}</span>`;
    }
    return `<div class="tile" style="${style}">${inner}${flag ? `<span class="flag">${flag}</span>` : ''}</div>`;
  }

  // ── Цены ────────────────────────────────────────
  const optionsOf = p => (p.regions ? p.regions.flatMap(r => r.options) : p.options);
  const minPrice = p => Math.min(...optionsOf(p).map(o => o.price));
  const regionMin = r => Math.min(...r.options.map(o => o.price));

  function appsPrice(n) {
    const { pricePerApp, discounts = {}, bundle } = CFG.apps;
    if (!n) return { total: 0, old: 0 };
    const packs = bundle ? Math.floor(n / bundle.count) : 0;
    const rest = bundle ? n % bundle.count : n;
    const restPrice = rest ? round10(rest * pricePerApp * (1 - (discounts[rest] || 0))) : 0;
    const total = packs * (bundle ? bundle.price : 0) + restPrice;
    return { total, old: n * pricePerApp };
  }

  // ── Telegram и окружение ────────────────────────
  function applyTheme() {
    const dark = inTelegram ? tg.colorScheme !== 'light' : !window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const bg = dark ? '#000000' : '#f5f5f7';
    $('meta[name="theme-color"]').content = bg;
    if (inTelegram) {
      try { tg.setHeaderColor(bg); tg.setBackgroundColor(bg); if (tg.setBottomBarColor) tg.setBottomBarColor(bg); } catch (e) { /* старый клиент */ }
    }
  }

  function haptic(kind) {
    if (!inTelegram || !tg.HapticFeedback) return;
    try {
      if (kind === 'select') tg.HapticFeedback.selectionChanged();
      else if (kind === 'success' || kind === 'error') tg.HapticFeedback.notificationOccurred(kind);
      else tg.HapticFeedback.impactOccurred(kind || 'light');
    } catch (e) { /* нет поддержки */ }
  }

  function openLink(url) {
    if (inTelegram && /^https:\/\/t\.me\//.test(url)) tg.openTelegramLink(url);
    else if (inTelegram) tg.openLink(url);
    else window.open(url, '_blank', 'noopener');
  }

  function confirmDialog(text) {
    return new Promise(resolve => {
      if (inTelegram && tg.showConfirm) { try { return tg.showConfirm(text, resolve); } catch (e) { /* старый клиент */ } }
      resolve(window.confirm(text));
    });
  }

  const isNested = () => state.tab === 'catalog' && state.mode === 'codes' && state.stack.length > 0;

  function syncBackButton() {
    if (!inTelegram) return;
    (state.sheetOpen || isNested()) ? tg.BackButton.show() : tg.BackButton.hide();
  }

  function goBack() {
    if (state.sheetOpen) return closeSheet();
    if (!state.stack.length) return;
    state.stack.pop();
    state.option = null;
    const top = state.stack[state.stack.length - 1];
    render();
    window.scrollTo(0, top ? top.scroll || 0 : state.rootScroll);
  }

  // Переход вглубь — запоминаем, где был скролл, чтобы вернуть его по «Назад»
  function pushView(entry) {
    const top = state.stack[state.stack.length - 1];
    if (top) top.scroll = window.scrollY; else state.rootScroll = window.scrollY;
    state.stack.push(entry);
    state.option = entry.view === 'options' ? 0 : null;
    render();
    window.scrollTo(0, 0);
  }

  let toastTimer;
  function toast(text) {
    const t = $('#toast');
    t.textContent = text;
    t.hidden = false;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
  }

  // ── Заказы (хранятся на устройстве) ─────────────
  const loadOrders = () => store.get(ORDERS_KEY, []);
  const saveOrders = list => store.set(ORDERS_KEY, list);

  function newOrderId() {
    const taken = new Set(loadOrders().map(o => o.id));
    let id;
    do { id = String(Math.floor(100000 + Math.random() * 900000)); } while (taken.has(id));
    return id;
  }

  const STATUS = {
    pending: { text: 'Ожидает оплаты', cls: '' },
    done: { text: 'Выполнен', cls: 'done' },
    cancelled: { text: 'Отменён', cls: 'cancelled' },
  };

  // ── Экраны ──────────────────────────────────────
  const TAB_TITLES = { catalog: CFG.tagline, orders: 'Мои заказы', referrals: 'Реферальная программа', profile: 'Профиль' };

  function headerHtml() {
    const back = isNested() && !inTelegram
      ? `<button class="hdr-back" data-back aria-label="Назад">${svg(UI.back)}</button>` : '';
    return `<header class="hdr">
      ${back}
      <img class="hdr-logo" src="img/logo.webp" alt="" width="36" height="36" />
      <div class="hdr-text"><div class="hdr-brand">${esc(CFG.brand)}</div><div class="hdr-tag">${esc(TAB_TITLES[state.tab])}</div></div>
      <button class="hdr-support" data-support aria-label="Поддержка">${svg(UI.chat)}</button>
    </header>`;
  }

  function segmentHtml() {
    const n = state.appSel.size;
    return `<div class="segment">
      <button data-mode="codes" class="${state.mode === 'codes' ? 'is-active' : ''}">Коды</button>
      <button data-mode="apps" class="${state.mode === 'apps' ? 'is-active' : ''}">Приложения<span class="seg-badge" ${n ? '' : 'hidden'}>${n}</span></button>
    </div>`;
  }

  function codesListHtml() {
    const perks = (CFG.perks || []).map(p => `<span class="perk">${svg(UI[p.icon] || UI.check)}${esc(p.text)}</span>`).join('');
    return `${segmentHtml()}
      ${perks ? `<div class="perks">${perks}</div>` : ''}
      <div class="list">${DATA.codes.map(p => `
        <button class="item" data-product="${p.id}">
          ${tileHtml(p.icon)}
          <div class="item-body"><div class="item-title">${esc(p.title)}</div><div class="item-sub">от ${money(minPrice(p))}</div></div>
          ${svg(UI.chev, 'chev')}
        </button>`).join('')}</div>`;
  }

  function regionsHtml(p) {
    return `<div class="head">${tileHtml(p.icon)}<div><div class="head-title">${esc(p.title)}</div><div class="head-sub">Выберите регион аккаунта</div></div></div>
      <div class="list">${p.regions.map(r => `
        <button class="item" data-region="${r.id}">
          ${tileHtml({ text: r.flag, size: 50, bg: 'var(--card-2)' })}
          <div class="item-body"><div class="item-title">${esc(r.name)}</div><div class="item-sub">от ${money(regionMin(r))}</div></div>
          ${svg(UI.chev, 'chev')}
        </button>`).join('')}</div>`;
  }

  function optionsHtml(p, r) {
    const options = r ? r.options : p.options;
    const note = (r && r.note) || p.note;
    const title = r ? `<span class="code">${esc(r.code)}</span>${esc(r.name)}` : esc(p.title);
    return `<div class="head">${tileHtml(p.icon, r && r.flag)}<div><div class="head-title">${title}</div><div class="head-sub">${esc(r ? p.title : 'Выберите вариант')}</div></div></div>
      ${note ? `<div class="note">${svg(UI.info)}<span>${esc(note)}</span></div>` : ''}
      <div class="list">${options.map((o, i) => `
        <button class="option ${state.option === i ? 'is-active' : ''}" data-option="${i}">
          <div class="option-body"><div class="option-title">${esc(o.label)}</div><div class="option-price">${money(o.price)}</div></div>
          <span class="radio">${svg(UI.check, '', 'b')}</span>
        </button>`).join('')}</div>`;
  }

  function filteredApps() {
    const q = state.appQuery.trim().toLowerCase();
    return DATA.apps.filter(a => (state.appCat === 'Все' || a.cat === state.appCat) && (!q || a.name.toLowerCase().includes(q)));
  }

  const appByName = name => DATA.apps.find(x => x.name === name);

  // Карточка набора: пока пусто — акция «5 любых», потом — прогресс и иконки выбранных
  function promoHtml() {
    const b = CFG.apps.bundle;
    if (!b) return '';
    const names = [...state.appSel];
    const n = names.length;
    const full = b.count * CFG.apps.pricePerApp;
    if (!n) {
      return `<button class="promo" data-open-set>
        <span class="promo-icon">${svg(UI.gift, '', 'f')}</span>
        <span class="promo-body"><span class="promo-title">${b.count} любых ${appsWord(b.count)}</span><span class="promo-price">${money(b.price)}<s>${money(full)}</s></span></span>
        <span class="promo-badge">−${Math.round((1 - b.price / full) * 100)}%</span>
      </button>`;
    }
    const per = b.count;
    const complete = n === per;
    const title = n > per ? `Выбрано ${n} ${appsWord(n)}` : complete ? 'Пакет собран' : `Ваш набор: ${n} из ${per}`;
    // Ряд слотов: заполненные — иконка, пустые — пунктир; если выбрано больше пакета — «+N»
    const shown = n > per ? names.slice(0, per - 1) : names;
    const more = n > per ? n - (per - 1) : 0;
    const cells = Array.from({ length: per }, (_, i) => {
      if (shown[i]) return `<span class="mini">${tileHtml(appByName(shown[i]).icon)}</span>`;
      if (i === per - 1 && more) return `<span class="mini more">+${more}</span>`;
      return '<span class="mini is-empty"></span>';
    }).join('');
    return `<button class="promo is-set ${complete ? 'is-complete' : ''}" data-open-set>
      <span class="promo-row">
        <span class="promo-title">${title}</span>
        <span class="promo-edit">Изменить${svg(UI.chev, 'chev')}</span>
      </span>
      <span class="mini-row" style="--n:${per}">${cells}</span>
    </button>`;
  }

  function appsHtml() {
    const cats = ['Все', ...DATA.appCategories];
    return `${segmentHtml()}
      <label class="search">${svg(UI.search)}
        <input id="app-search" type="search" placeholder="Найти приложение" value="${esc(state.appQuery)}" autocomplete="off" enterkeyhint="search" />
        <button class="search-clear" data-clear-search aria-label="Очистить" ${state.appQuery ? '' : 'hidden'}>${svg(UI.close, '', 'b')}</button>
      </label>
      ${promoHtml()}
      <div class="chips">${cats.map(c => `<button class="chip ${state.appCat === c ? 'is-active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div id="apps-grid">${appsGridHtml(filteredApps())}</div>`;
  }

  function appsGridHtml(list) {
    if (!list.length) {
      return `<div class="empty-search">Такого приложения нет в списке.<br/><button class="link" data-support>Спросите менеджера</button> — установим и другие.</div>`;
    }
    return `<div class="apps-grid">${list.map(a => `
      <button class="app ${state.appSel.has(a.name) ? 'is-active' : ''}" data-app="${esc(a.name)}" aria-pressed="${state.appSel.has(a.name)}">
        <span class="app-tile">${tileHtml(a.icon)}<span class="check">${svg(UI.check, '', 'b')}</span></span>
        <span class="app-name">${esc(a.name)}</span>
      </button>`).join('')}</div>`;
  }

  function ordersHtml() {
    const all = loadOrders();
    const list = state.ordersFilter === 'active' ? all.filter(o => o.status === 'pending') : all;
    const pills = `<div class="pills">
      <button class="pill ${state.ordersFilter === 'active' ? 'is-active' : ''}" data-filter="active">Активные</button>
      <button class="pill ${state.ordersFilter === 'all' ? 'is-active' : ''}" data-filter="all">Все</button>
    </div>`;
    if (!list.length) {
      return `${pills}<div class="empty"><div class="empty-icon">${svg(UI.bag)}</div><div class="empty-title">Пока пусто</div>
        <div class="empty-text">${all.length ? 'Активных заказов нет' : 'Здесь появятся ваши заказы'}</div>
        <button class="btn-light" data-goto="catalog">В каталог</button></div>`;
    }
    return `${pills}<div class="list">${list.map(o => {
      const st = STATUS[o.status] || STATUS.pending;
      const date = new Date(o.createdAt);
      return `<div class="order ${o.status === 'cancelled' ? 'is-muted' : ''}">
        <div class="order-top"><span class="order-num">№${esc(o.id)} · ${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span><span class="status ${st.cls}">${st.text}</span></div>
        <div class="order-title">${esc(o.title)}</div>
        ${o.details ? `<div class="order-items">${esc(o.details)}</div>` : ''}
        <div class="order-bottom"><span class="order-sum">${money(o.total)}</span>
          <span class="order-actions">
            ${o.status === 'pending' ? `<button class="btn-ghost" data-order-cancel="${esc(o.id)}">Отменить</button>` : ''}
            <button class="btn-ghost is-primary" data-order-chat="${esc(o.id)}">Менеджер</button>
          </span>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  function referralLink() {
    if (!tgUser) return '';
    const bot = cleanUsername(CFG.botUsername);
    return CFG.appShortName
      ? `https://t.me/${bot}/${CFG.appShortName}?startapp=ref_${tgUser.id}`
      : `https://t.me/${bot}?start=ref_${tgUser.id}`;
  }

  function referralsHtml() {
    const link = referralLink();
    return `<div class="hero-card">
        <div class="big">Приглашайте друзей —<br/>получайте <span>${CFG.referralPercent}%</span></div>
        <p>С каждой покупки приглашённого друга вам начисляются бонусы, которыми можно оплатить свои заказы.</p>
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-value">0</div><div class="stat-label">Приглашено</div></div>
        <div class="stat"><div class="stat-value">0 ₽</div><div class="stat-label">Бонусов</div></div>
      </div>
      ${link ? `<div class="link-box"><span>${esc(link)}</span><button data-copy aria-label="Скопировать">${svg(UI.copy)}</button></div>
        <button class="btn-accent" data-share>${svg(UI.share)} Поделиться ссылкой</button>`
        : '<div class="note">' + svg(UI.info) + '<span>Откройте приложение в Telegram — там появится ваша личная ссылка.</span></div>'}
      <div class="steps">
        <div class="step"><b>1</b><span>Отправьте другу свою ссылку</span></div>
        <div class="step"><b>2</b><span>Друг открывает ${esc(CFG.brand)} по ссылке и делает заказ</span></div>
        <div class="step"><b>3</b><span>Вы получаете ${CFG.referralPercent}% от суммы его покупок на бонусный счёт</span></div>
      </div>`;
  }

  function profileHtml() {
    const name = tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : 'Гость';
    const user = tgUser ? (tgUser.username ? `@${tgUser.username}` : `ID ${tgUser.id}`) : 'Откройте в Telegram';
    const avatar = tgUser && tgUser.photo_url ? `<img src="${esc(tgUser.photo_url)}" alt="" />` : esc(name.charAt(0));
    const rows = list => list.map(g => `<button class="row" data-guide="${g.id}"><span class="row-icon">${svg(UI[g.icon] || UI.info)}</span><span>${esc(g.title)}</span>${svg(UI.chev, 'chev')}</button>`).join('');
    return `<div class="profile">
        <div class="avatar">${avatar}</div>
        <div class="profile-body"><div class="profile-name">${esc(name)}</div><div class="profile-user">${esc(user)}</div></div>
        <button class="support" data-support>Поддержка</button>
      </div>
      <div class="group">${rows(DATA.guides)}</div>
      <div class="section-title">Документы</div>
      <div class="group">${rows(DATA.documents)}</div>
      <div class="brand-foot"><img src="img/logo.webp" alt="" width="28" height="28" /><span>${esc(CFG.brand)}${CFG.since ? ` · с ${CFG.since} года` : ''}</span></div>`;
  }

  // ── Отрисовка ───────────────────────────────────
  function current() {
    const top = state.stack[state.stack.length - 1];
    if (!top) return {};
    const p = DATA.codes.find(x => x.id === top.pid);
    const r = p && p.regions && top.rid ? p.regions.find(x => x.id === top.rid) : null;
    return { top, p, r };
  }

  function render(animate = true) {
    const screen = $('#screen');
    let html;
    if (state.tab === 'catalog') {
      if (state.mode === 'apps') html = appsHtml();
      else {
        const { top, p, r } = current();
        if (!top || !p) { state.stack = []; html = codesListHtml(); }
        else if (top.view === 'regions') html = regionsHtml(p);
        else html = optionsHtml(p, r);
      }
    } else if (state.tab === 'orders') html = ordersHtml();
    else if (state.tab === 'referrals') html = referralsHtml();
    else html = profileHtml();

    screen.innerHTML = headerHtml() + html;
    if (animate) { screen.classList.remove('view-enter'); void screen.offsetWidth; screen.classList.add('view-enter'); }
    document.querySelectorAll('#tabbar button').forEach(b => {
      const active = b.dataset.tab === state.tab;
      b.classList.toggle('is-active', active);
      b.querySelector('.ti').innerHTML = svg(TAB_ICONS[b.dataset.tab], '', active ? 'f' : 'r');
    });
    renderBuybar();
    syncBackButton();
  }

  function renderBuybar() {
    const bar = $('#buybar');
    let show = false;
    if (state.tab === 'catalog' && state.mode === 'codes' && state.option != null) {
      const { p, r } = current();
      const opt = p && (r ? r.options : p.options)[state.option];
      if (opt) {
        $('#buybar-label').textContent = opt.label;
        $('#buybar-price').textContent = money(opt.price);
        $('#buybar-old').textContent = '';
        show = true;
      }
    } else if (state.tab === 'catalog' && state.mode === 'apps' && state.appSel.size) {
      const n = state.appSel.size;
      const { total, old } = appsPrice(n);
      $('#buybar-label').textContent = `${n} ${appsWord(n)}`;
      $('#buybar-price').textContent = money(total);
      $('#buybar-old').textContent = old > total ? money(old) : '';
      show = true;
    }
    bar.hidden = !show;
    $('#screen').classList.toggle('has-buybar', show);

    const badge = document.querySelector('.seg-badge');
    if (badge) { badge.textContent = state.appSel.size; badge.hidden = !state.appSel.size; }
  }

  function saveSelection() { store.set(SELECTION_KEY, [...state.appSel]); }

  // ── Шторка ──────────────────────────────────────
  function openSheet(html, kind = null) {
    state.sheetKind = kind;
    $('#sheet-body').innerHTML = html;
    $('#sheet-body').scrollTop = 0;
    const sheet = $('#sheet'), back = $('#sheet-backdrop');
    sheet.classList.remove('is-closing'); back.classList.remove('is-closing');
    sheet.style.transform = '';
    sheet.hidden = false; back.hidden = false;
    document.body.classList.add('locked');
    state.sheetOpen = true;
    syncBackButton();
  }

  function closeSheet() {
    if (!state.sheetOpen) return;
    state.sheetOpen = false;
    state.sheetKind = null;
    const sheet = $('#sheet'), back = $('#sheet-backdrop');
    sheet.classList.add('is-closing'); back.classList.add('is-closing');
    setTimeout(() => { if (!state.sheetOpen) { sheet.hidden = true; back.hidden = true; sheet.style.transform = ''; } }, 220);
    document.body.classList.remove('locked');
    syncBackButton();
  }

  function guideSheet(id) {
    const g = [...DATA.guides, ...DATA.documents].find(x => x.id === id);
    if (!g) return;
    const numbered = g.steps !== false && DATA.guides.includes(g);
    openSheet(`<h2>${esc(g.title)}</h2><div class="text ${numbered ? 'numbered' : ''}">${g.body.map((p, i) => `<p>${numbered ? `<b>${i + 1}</b>` : ''}<span>${esc(p)}</span></p>`).join('')}</div>
      <button class="btn-secondary" data-support>${svg(UI.chat)} Задать вопрос менеджеру</button>`);
  }

  // ── Набор приложений ────────────────────────────
  const setSlots = () => {
    const per = CFG.apps.bundle ? CFG.apps.bundle.count : 5;
    return Math.max(per, Math.ceil(state.appSel.size / per) * per);
  };

  function setSheetHtml() {
    const b = CFG.apps.bundle;
    const names = [...state.appSel];
    const n = names.length;
    const { total, old } = appsPrice(n);
    const slots = Array.from({ length: setSlots() }, (_, i) => {
      const name = names[i];
      if (!name) return `<button class="slot is-empty" data-slot-add aria-label="Добавить приложение"><span class="slot-tile">${svg(UI.plus, '', 'b')}</span><span class="slot-name">Добавить</span></button>`;
      return `<button class="slot is-filled" data-slot-remove="${esc(name)}" aria-label="Убрать ${esc(name)}">
        <span class="slot-tile">${tileHtml(appByName(name).icon)}<span class="slot-x">${svg(UI.close, '', 'b')}</span></span>
        <span class="slot-name">${esc(name)}</span>
      </button>`;
    }).join('');

    let hint = 'Нажмите на приложение, чтобы убрать его из набора.';
    if (b && n > 0 && n < b.count) {
      hint = `Добавьте ещё ${b.count - n} — и всё будет за ${money(b.price)} вместо ${money(total)}.`;
    }
    const perRow = b ? Math.min(b.count, 5) : 5;
    return `<h2>Ваш набор</h2>
      <div class="set-sub">${n ? `Выбрано ${n} ${appsWord(n)}` : 'Пока ничего не выбрано'}${b ? ` · пакет из ${b.count} — ${money(b.price)}` : ''}</div>
      <div class="slots" style="--cols:${perRow}">${slots}</div>
      <p class="hint">${hint}</p>
      <div class="set-total"><div><div class="set-total-label">К оплате</div><div class="set-total-price">${money(total)}${old > total ? `<s>${money(old)}</s>` : ''}</div></div></div>
      <div class="set-actions">
        <button class="btn-secondary" data-set-clear ${n ? '' : 'disabled'}>Очистить</button>
        <button class="btn-accent" data-set-checkout ${n ? '' : 'disabled'}>Оформить</button>
      </div>`;
  }

  function openSetSheet() { openSheet(setSheetHtml(), 'set'); }
  function refreshSetSheet() { if (state.sheetKind === 'set') $('#sheet-body').innerHTML = setSheetHtml(); }

  // Перерисовать то, что зависит от набора, не трогая скролл и поиск
  function renderGridState() {
    renderBuybar();
    if (state.tab !== 'catalog' || state.mode !== 'apps') return;
    const promo = document.querySelector('.promo');
    if (promo) promo.outerHTML = promoHtml();
    refreshAppsGrid();
  }

  function removeFromSet(name) {
    state.appSel.delete(name);
    saveSelection();
    haptic('light');
    if (!state.appSel.size) { closeSheet(); renderGridState(); return toast('Набор пуст'); }
    refreshSetSheet();
    renderGridState();
  }

  // Черновик заказа: { title, details, total, needsUsername, kind }
  let draft = null;

  function checkoutSheet() {
    if (state.mode === 'codes') {
      const { p, r } = current();
      const opt = p && (r ? r.options : p.options)[state.option];
      if (!opt) return;
      draft = {
        kind: 'code',
        title: opt.label,
        details: r ? `${p.title} · ${r.name}` : p.title,
        total: opt.price,
        needsUsername: !!p.needsUsername,
      };
    } else {
      const names = [...state.appSel];
      if (!names.length) return;
      draft = {
        kind: 'apps',
        title: `Установка: ${names.length} ${appsWord(names.length)}`,
        details: names.join(', '),
        total: appsPrice(names.length).total,
      };
    }
    const username = tgUser && tgUser.username ? `@${tgUser.username}` : '';
    openSheet(`<h2>Оформление заказа</h2>
      <div class="summary">
        <div class="summary-row"><span>${draft.kind === 'apps' ? 'Услуга' : 'Товар'}</span><span>${esc(draft.title)}</span></div>
        <div class="summary-row"><span>${draft.kind === 'apps' ? 'Приложения' : 'Раздел'}</span><span>${esc(draft.details)}</span></div>
        <div class="summary-row summary-total"><span>К оплате</span><span>${money(draft.total)}</span></div>
      </div>
      ${draft.needsUsername ? `<label class="field-label" for="tg-username">Аккаунт для подписки</label>
        <input class="field" id="tg-username" placeholder="@username" value="${esc(username)}" autocomplete="off" autocapitalize="off" spellcheck="false" />` : ''}
      <p class="hint">После оформления откроется чат с менеджером — он пришлёт способ оплаты и выдаст ${draft.kind === 'apps' ? 'доступ и инструкцию' : 'код'} сразу после оплаты.</p>
      <button class="btn-accent" data-place-order>${svg(UI.send)} Оформить заказ</button>`);
  }

  let placing = false;
  function placeOrder() {
    if (!draft || placing) return;
    const field = $('#tg-username');
    let account = '';
    if (draft.needsUsername) {
      account = cleanUsername(field.value);
      if (!/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(account)) {
        haptic('error');
        field.classList.add('is-error');
        field.focus();
        return toast('Проверьте @username: 5–32 символа, латиница, цифры и _');
      }
      account = `@${account}`;
    }

    placing = true;
    const order = {
      id: newOrderId(),
      createdAt: Date.now(),
      title: draft.title,
      details: draft.details + (account ? ` · для ${account}` : ''),
      total: draft.total,
      status: 'pending',
    };
    saveOrders([order, ...loadOrders()]);
    managerChat(order);
    haptic('success');

    closeSheet();
    if (draft.kind === 'apps') { state.appSel.clear(); saveSelection(); }
    // Каталог после заказа возвращаем к началу, чтобы не застревать внутри товара
    state.stack = [];
    state.option = null;
    draft = null;
    state.tab = 'orders';
    state.ordersFilter = 'active';
    render();
    window.scrollTo(0, 0);
    toast(`Заказ №${order.id} создан`);
    setTimeout(() => { placing = false; }, 600);
  }

  function managerChat(order) {
    const ref = store.get(REFERRER_KEY, null);
    const lines = order
      ? [`Здравствуйте! Заказ №${order.id}`, order.title, order.details, `Сумма: ${money(order.total)}`, ref ? `Пригласил: ${ref}` : '']
      : [`Здравствуйте! Вопрос по ${CFG.brand}.`];
    openLink(`https://t.me/${cleanUsername(CFG.managerUsername)}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`);
  }

  async function cancelOrder(id) {
    if (!(await confirmDialog(`Отменить заказ №${id}?`))) return;
    saveOrders(loadOrders().map(o => (o.id === id ? { ...o, status: 'cancelled' } : o)));
    haptic('light');
    render(false);
    toast('Заказ отменён');
  }

  // ── События ─────────────────────────────────────
  function bind() {
    $('#tabbar').addEventListener('click', e => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      if (b.dataset.tab === state.tab) {
        // Повторный тап по вкладке — в её начало
        if (state.tab === 'catalog' && state.stack.length) { state.stack = []; state.option = null; render(); }
        return window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      state.tab = b.dataset.tab;
      haptic('select');
      render();
      window.scrollTo(0, 0);
    });

    $('#screen').addEventListener('click', e => {
      const t = e.target.closest('[data-back],[data-open-set],[data-mode],[data-product],[data-region],[data-option],[data-app],[data-cat],[data-clear-search],[data-filter],[data-goto],[data-order-chat],[data-order-cancel],[data-copy],[data-share],[data-support],[data-guide]');
      if (!t) return;
      const d = t.dataset;

      if (d.back != null) return goBack();
      if (d.openSet != null) { haptic('light'); return openSetSheet(); }
      if (d.mode) {
        if (state.mode === d.mode) return;
        state.mode = d.mode; state.option = null; state.stack = [];
        haptic('select'); render(); return window.scrollTo(0, 0);
      }
      if (d.product) {
        const p = DATA.codes.find(x => x.id === d.product);
        if (!p) return;
        if (p.regions && p.regions.length > 1) return pushView({ view: 'regions', pid: p.id });
        return pushView({ view: 'options', pid: p.id, rid: p.regions ? p.regions[0].id : null });
      }
      if (d.region) {
        const { p } = current();
        return pushView({ view: 'options', pid: p.id, rid: d.region });
      }
      if (d.option != null) {
        const i = Number(d.option);
        state.option = state.option === i ? null : i;   // повторный тап снимает выбор
        haptic('select');
        document.querySelectorAll('.option').forEach((el, n) => el.classList.toggle('is-active', n === state.option));
        return renderBuybar();
      }
      if (d.app) {
        const adding = !state.appSel.has(d.app);
        adding ? state.appSel.add(d.app) : state.appSel.delete(d.app);
        t.classList.toggle('is-active', adding);
        t.setAttribute('aria-pressed', adding);
        saveSelection();
        haptic('select');
        // Подсказка про пакет, когда до него осталось одно приложение
        const b = CFG.apps.bundle;
        if (adding && b && state.appSel.size % b.count === 0) toast(`Пакет собран: ${b.count} ${appsWord(b.count)} за ${money(b.price)}`);
        renderBuybar();
        const promo = document.querySelector('.promo');
        if (promo) promo.outerHTML = promoHtml();
        return;
      }
      if (d.cat) {
        state.appCat = d.cat;
        document.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c.dataset.cat === d.cat));
        t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        haptic('select');
        return refreshAppsGrid();
      }
      if (d.clearSearch != null) {
        e.preventDefault();
        state.appQuery = '';
        const input = $('#app-search');
        input.value = '';
        t.hidden = true;
        refreshAppsGrid();
        return input.focus();
      }
      if (d.filter) { state.ordersFilter = d.filter; return render(false); }
      if (d.goto) { state.tab = d.goto; render(); return window.scrollTo(0, 0); }
      if (d.orderChat) return managerChat(loadOrders().find(o => o.id === d.orderChat));
      if (d.orderCancel) return cancelOrder(d.orderCancel);
      if (d.copy != null) return copyText(referralLink());
      if (d.share != null) {
        const text = `${CFG.brand}: подарочные карты, подписки и установка приложений`;
        return openLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink())}&text=${encodeURIComponent(text)}`);
      }
      if (d.support != null) return managerChat(null);
      if (d.guide) return guideSheet(d.guide);
    });

    $('#screen').addEventListener('input', e => {
      if (e.target.id !== 'app-search') return;
      state.appQuery = e.target.value;
      const clear = document.querySelector('[data-clear-search]');
      if (clear) clear.hidden = !state.appQuery;
      refreshAppsGrid();
    });
    $('#screen').addEventListener('keydown', e => { if (e.target.id === 'app-search' && e.key === 'Enter') e.target.blur(); });

    $('#buybar-clear').addEventListener('click', () => {
      if (state.mode === 'apps') {
        state.appSel.clear();
        saveSelection();
        document.querySelectorAll('.app.is-active').forEach(a => { a.classList.remove('is-active'); a.setAttribute('aria-pressed', false); });
        const promo = document.querySelector('.promo');
        if (promo) promo.outerHTML = promoHtml();
      } else {
        state.option = null;
        document.querySelectorAll('.option.is-active').forEach(a => a.classList.remove('is-active'));
      }
      haptic('light');
      renderBuybar();
    });
    $('#buybar-buy').addEventListener('click', () => { haptic('light'); checkoutSheet(); });
    $('#buybar-info').addEventListener('click', () => { if (state.mode === 'apps' && state.appSel.size) openSetSheet(); });

    const sheet = $('#sheet');
    $('#sheet-backdrop').addEventListener('click', closeSheet);
    sheet.addEventListener('click', e => {
      if (e.target.closest('[data-place-order]')) return placeOrder();
      if (e.target.closest('[data-support]')) return managerChat(null);
      const rm = e.target.closest('[data-slot-remove]');
      if (rm) return removeFromSet(rm.dataset.slotRemove);
      if (e.target.closest('[data-slot-add]')) {
        closeSheet();
        const chips = document.querySelector('.chips');
        if (chips) window.scrollTo({ top: Math.max(0, chips.offsetTop - 70), behavior: 'smooth' });
        return toast('Нажимайте на приложения — они попадут в набор');
      }
      if (e.target.closest('[data-set-clear]')) {
        state.appSel.clear(); saveSelection(); closeSheet(); renderGridState(); haptic('light');
        return toast('Набор очищен');
      }
      if (e.target.closest('[data-set-checkout]')) return checkoutSheet();
    });
    sheet.addEventListener('input', e => { if (e.target.id === 'tg-username') e.target.classList.remove('is-error'); });

    // Закрытие шторки свайпом вниз
    let startY = null;
    sheet.addEventListener('touchstart', e => { startY = $('#sheet-body').scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    sheet.addEventListener('touchmove', e => {
      if (startY == null) return;
      const dy = Math.max(0, e.touches[0].clientY - startY);
      sheet.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    sheet.addEventListener('touchend', e => {
      if (startY == null) return;
      const dy = e.changedTouches[0].clientY - startY;
      startY = null;
      if (dy > 90) closeSheet(); else sheet.style.transform = '';
    }, { passive: true });

    document.addEventListener('keydown', e => { if (e.key === 'Escape') goBack(); });

    if (inTelegram) {
      tg.BackButton.onClick(goBack);
      tg.onEvent('themeChanged', applyTheme);
    } else {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', applyTheme);
    }
  }

  function refreshAppsGrid() {
    $('#apps-grid').innerHTML = appsGridHtml(filteredApps());
  }

  function copyText(text) {
    const done = () => { haptic('light'); toast('Ссылка скопирована'); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Не удалось скопировать'); }
    ta.remove();
  }

  // ── Старт ───────────────────────────────────────
  if (inTelegram) {
    tg.ready();
    tg.expand();
    try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) { /* старый клиент */ }
  }
  document.title = `${CFG.brand} — ${CFG.tagline}`;
  $('#buybar-clear').innerHTML = svg(UI.close, '', 'b');
  applyTheme();
  bind();
  render(false);
})();
