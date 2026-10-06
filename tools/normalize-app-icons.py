# Приводит сырые иконки к единому виду: квадрат 192x192, webp -> img/apps/<slug>.webp.
# Запуск: python tools/normalize-app-icons.py <папка-с-сырыми-файлами> [--sheet файл.png]
import os, sys, re, json
from PIL import Image, ImageDraw, ImageFont

raw_dir = sys.argv[1]
sheet_path = sys.argv[sys.argv.index('--sheet') + 1] if '--sheet' in sys.argv else None
out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img', 'apps')
os.makedirs(out_dir, exist_ok=True)

SIZE = 192

# На сайте логотип лежит на белом фоне, а в приложении — цветная плитка с белым знаком.
# Для таких иконок перекрашиваем: цвет бренда как фон, знак — белым.
RECOLOR = {
    'sberbank': (33, 160, 56),
    'vkontakte': (0, 119, 255),
    'odnoklassniki': (238, 130, 8),
    'alfa-bank': (239, 49, 36),
}
# Эти оставляем нарисованными плитками (на сайте — не тот вид, что в приложении)
EXCLUDE = {'vk-messendzher', 'vk-muzyka', 'sberkids', 'lenta', 'vtb-investicii', 'vk-video'}
done = {}
for fn in sorted(os.listdir(raw_dir)):
    if fn.startswith('_') or not re.search(r'\.(png|jpg|jpeg|webp|ico)$', fn, re.I):
        continue
    slug = os.path.splitext(fn)[0]
    if slug in EXCLUDE:
        continue
    try:
        im = Image.open(os.path.join(raw_dir, fn))
        im.load()
    except Exception as e:
        print('не открылось', fn, e)
        continue
    w, h = im.size
    im = im.convert('RGBA')
    # Квадрат по центру; прозрачность — на белый фон
    side = min(w, h)
    left, top = (w - side) // 2, (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    im = bg.convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)
    if slug in RECOLOR:
        r, g, b = RECOLOR[slug]
        # прозрачность знака = насколько пиксель темнее белого
        mask = im.point(lambda v: v).convert('RGB')
        px = im.load()
        out = Image.new('RGB', im.size, (r, g, b))
        op = out.load()
        for y in range(im.size[1]):
            for x in range(im.size[0]):
                lo = min(px[x, y])
                a = max(0.0, min(1.0, (255 - lo) / 200.0))
                op[x, y] = (int(r + (255 - r) * a), int(g + (255 - g) * a), int(b + (255 - b) * a))
        im = out
    im.save(os.path.join(out_dir, slug + '.webp'), 'WEBP', quality=90, method=6)
    done[slug] = (w, h)

print(json.dumps(done, ensure_ascii=False))

if sheet_path:
    cols = 8
    cell = 120
    names = sorted(done)
    rows = (len(names) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell, rows * (cell + 22)), (245, 245, 247))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('arial.ttf', 11)
    except Exception:
        font = ImageFont.load_default()
    for i, slug in enumerate(names):
        im = Image.open(os.path.join(out_dir, slug + '.webp')).resize((96, 96))
        x, y = (i % cols) * cell + 12, (i // cols) * (cell + 22) + 6
        sheet.paste(im, (x, y))
        d.text((x, y + 100), slug[:16], fill=(20, 20, 20), font=font)
        d.text((x, y + 111), '%dx%d' % done[slug], fill=(120, 120, 120), font=font)
    sheet.save(sheet_path)
    print('лист:', sheet_path, sheet.size)
