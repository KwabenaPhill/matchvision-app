# -*- coding: utf-8 -*-
"""CLOUD WIN TICKETS (Match Vision 3.8) - runs on GitHub, also when the laptop AND the phone are off.

The laptop puts today's matches in cloud/<date>.json ("wins"). Every few minutes this looks at ESPN's free scoreboard.
When a match is over and ALL 3 predictions won, it draws the win ticket (Philip's old card style) and posts it on the
Telegram channel with his caption. The laptop goes first when it is on (WIN_CLOUD_WAIT minutes after full time); whoever
posts writes "posted", so a ticket never goes out twice. Picks the scoreboard cannot decide (corners, cards) are left
for the laptop. Vision Premium is never in this public file.
"""
import os
import re
import json
import html
import datetime
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, 'fonts')
ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates={}&limit=1000'


# ------------------------------------------------------------------------------------------------ scores
def espn_day(date_iso):
    req = urllib.request.Request(ESPN.format(date_iso.replace('-', '')), headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        j = json.loads(r.read().decode('utf-8'))
    out = []
    for ev in j.get('events') or []:
        try:
            comp = (ev.get('competitions') or [{}])[0]
            typ = ((comp.get('status') or ev.get('status') or {}).get('type') or {})
            name = str(typ.get('name', ''))
            done = typ.get('state') == 'post' and not re.search(r'POSTPONED|CANCEL|ABANDON|SUSPEND|DELAYED', name, re.I)
            cs = {c.get('homeAway'): c for c in comp.get('competitors') or []}
            h, a = cs.get('home') or {}, cs.get('away') or {}

            def gi(v):
                try:
                    return int(float(v))
                except (TypeError, ValueError):
                    return None

            def fh(c):
                ls = c.get('linescores') or []
                return gi(ls[0].get('value')) if ls and isinstance(ls[0], dict) else None
            out.append({'id': str(ev.get('id')), 'home': (h.get('team') or {}).get('displayName', ''),
                        'away': (a.get('team') or {}).get('displayName', ''), 'done': done,
                        'gh': gi(h.get('score')), 'ga': gi(a.get('score')), 'hh': fh(h), 'ha': fh(a)})
        except Exception:
            continue
    return out


STOP = {'fc', 'cf', 'afc', 'sc', 'ac', 'as', 'ssc', 'club', 'de', 'the', 'cd', 'ud', 'rc', 'sv', 'vfl', 'vfb', 'tsg', '1.',
        'fk', 'sk', 'if', 'bk', 'calcio', 'united', 'city', 'real'}


def _toks(name):
    t = re.sub(r'[^a-z0-9 ]', ' ', str(name).lower().replace('ü', 'u').replace('é', 'e').replace('ö', 'o').replace('ç', 'c')
               .replace('ş', 's').replace('ı', 'i').replace('á', 'a').replace('í', 'i'))
    return {w for w in t.split() if len(w) > 2 and w not in STOP} or set(t.split())


def _same(a, b):
    ta, tb = _toks(a), _toks(b)
    return bool(ta & tb) or a.lower() in b.lower() or b.lower() in a.lower()


def find(games, m):
    if m.get('espn'):
        g = next((x for x in games if x['id'] == str(m['espn'])), None)
        if g:
            return g
    for g in games:
        if _same(m['home'], g['home']) and _same(m['away'], g['away']):
            return g
    return None


def won(rule, gh, ga, hh, ha):
    """True / False / None (cannot decide here) - the same rules as the app and the laptop."""
    if not rule:
        return None
    t = rule.get('t')
    if t == 'g':
        return gh + ga > rule['v'] if rule['o'] == 'o' else gh + ga < rule['v']
    if t == 'g1':
        if hh is None or ha is None:
            return None
        return hh + ha > rule['v'] if rule['o'] == 'o' else hh + ha < rule['v']
    if t == 'btts':
        return (gh > 0 and ga > 0) == bool(rule.get('y'))
    if t == 'draw':
        return gh == ga
    if t == 'win':
        return gh > ga if rule['s'] == 'h' else ga > gh
    if t == 'dc':
        return gh >= ga if rule['s'] == 'h' else ga >= gh
    if t == 'ts':
        return (gh if rule['s'] == 'h' else ga) > rule.get('v', 0.5)
    return None


# ------------------------------------------------------------------------------------------------ caption
def caption(m, gh, ga, cs_won, c):
    n = len(m['picks']) + (1 if cs_won else 0)
    lines = []
    if cs_won:
        lines += [c.get('cs_head') or '💰 *CORRECT SCORE WIN · BIG WIN* 💰', '']
    lines.append(f'✅ {m["home"]} {gh}-{ga} {m["away"]}' if cs_won else f'✅ *{m["home"]} {gh}-{ga} {m["away"]}*')
    if cs_won:
        lines.append(f'🎯 *Correct Score: {gh}-{ga}*')
    lines.append('')
    lines += [f'✔️ {p["text"]}' for p in m['picks']]
    lines += ['', str(c.get('end') or '🔥 *{WON} Of {TOTAL} Won*').replace('{WON}', str(n)).replace('{TOTAL}', str(n))]
    if c.get('extra'):
        lines += ['', c['extra']]
    txt = '\n'.join(lines)
    if c.get('bold', True):
        return re.sub(r'\*([^*\n]+)\*', lambda x: f'<b>{x.group(1)}</b>', html.escape(txt, quote=False)), True
    return txt.replace('*', ''), False


# ------------------------------------------------------------------------------------------------ the picture (old card)
def draw(m, gh, ga, cs_won, root, out, fonts=FONTS, brand='MATCH VISION'):
    """Philip's old card (the app's share card), short: MV badge, FULL TIME 1-1, the 3 picks with crests and green ticks,
    "3 OF 3 WON · MATCH VISION" at the bottom."""
    from PIL import Image, ImageDraw
    rows = [p['text'] for p in m['picks']] + ([f'CORRECT SCORE {gh}-{ga}'] if cs_won else [])
    W, rh, gap, top = 1080, 165, 22, 265
    H = min(1350, top + len(rows) * (rh + gap) + 178)
    A, A2 = (223, 251, 81), (142, 163, 52)
    im = Image.new('RGB', (W, H), (6, 6, 6))
    d = ImageDraw.Draw(im)
    for y in range(H):
        k = y / (H - 1)
        d.line([(0, y), (W, y)], fill=(int(16 + (6 - 16) * k), int(20 + (6 - 20) * k), int(10 + (6 - 10) * k)))

    def F(name, px):
        from PIL import ImageFont
        for n in ([name] if isinstance(name, str) else name):
            p = os.path.join(fonts, n)
            if os.path.isfile(p):
                return ImageFont.truetype(p, px)
        return ImageFont.load_default()
    BLK, MED, SEMI = ('InterDisplay-Black.otf', 'Inter-Black.otf'), ('Inter-Medium.otf',), ('Inter-SemiBold.otf', 'Inter-Medium.otf')

    def fit(t, name, px, maxw):
        while px > 14 and d.textlength(t, font=F(name, px)) > maxw:
            px -= 2
        return F(name, px)
    d.rounded_rectangle((30, 30, W - 30, H - 30), radius=46, outline=(110, 125, 45), width=4)
    d.ellipse((100, 105, 188, 193), fill=A)
    f = F(BLK, 38)
    d.text((144 - d.textlength('MV', font=f) / 2, 128), 'MV', font=f, fill=(11, 11, 11))
    title = f'{"BIG WIN" if cs_won else "FULL TIME"} {gh}-{ga}'
    d.text((215, 92), title, font=fit(title, BLK, 66, 760), fill=A)
    sub = f'{m["home"]} vs {m["away"]}' + (f' · {m["league"]}' if m.get('league') else '')
    d.text((217, 172), sub, font=fit(sub, MED, 32, 780), fill=(189, 189, 189))

    def crest(path, cx, cy, s, name):
        p = os.path.join(root, path) if path else ''
        if p and os.path.isfile(p):
            c = Image.open(p).convert('RGBA')
            c.thumbnail((s, s))
            im.paste(c, (int(cx + (s - c.width) / 2), int(cy - c.height / 2)), c)
        else:
            d.ellipse((cx, cy - s / 2, cx + s, cy + s / 2), fill=(38, 38, 38))
            ini = ''.join(w[0] for w in str(name).split()[:2]).upper()
            ff = F(BLK, int(s * 0.34))
            d.text((cx + s / 2 - d.textlength(ini, font=ff) / 2, cy - s * 0.2), ini, font=ff, fill=(221, 221, 221))
    for i, r in enumerate(rows):
        is_cs = cs_won and i == len(rows) - 1
        y, X, Wd = top + i * (rh + gap), 70, W - 140
        cy = y + rh / 2
        d.rounded_rectangle((X, y, X + Wd, y + rh), radius=26, fill=(20, 22, 18), outline=(70, 80, 35), width=2)
        d.rounded_rectangle((X, y, X + 10, y + rh), radius=5, fill=(236, 196, 98) if is_cs else A)
        d.ellipse((X + 32, cy - 30, X + 92, cy + 30), fill=(236, 196, 98) if is_cs else A)
        ff = F(BLK, 32)
        num = '★' if is_cs else str(i + 1)
        d.text((X + 62 - d.textlength(num, font=ff) / 2, cy - 20), num, font=ff, fill=(17, 17, 17))
        cs = 78
        crest(m.get('hc'), X + 112, cy, cs, m['home'])
        crest(m.get('ac'), X + 112 + cs + 12, cy, cs, m['away'])
        tx = X + 112 + cs * 2 + 40
        tw = X + Wd - 90 - tx
        t = r if is_cs else str(r).upper()
        d.text((tx, cy - 50), t, font=fit(t, BLK, 40, tw), fill=(236, 196, 98) if is_cs else (255, 255, 255))
        vs = f'{m["home"]} vs {m["away"]}'
        d.text((tx, cy + 10), vs, font=fit(vs, MED, 27, tw), fill=(169, 169, 169))
        t2 = X + Wd - 60
        d.ellipse((t2 - 30, cy - 30, t2 + 30, cy + 30), fill=(34, 197, 94))
        d.line([(t2 - 13, cy + 1), (t2 - 3, cy + 11), (t2 + 14, cy - 10)], fill=(255, 255, 255), width=7, joint='curve')
    n = len(rows)
    foot = f'{n} OF {n} WON' + (f' · {brand}' if brand else '')
    ff = F(BLK, 30)
    d.text((W / 2 - d.textlength(foot, font=ff) / 2, H - 82), foot, font=ff, fill=A2)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, quality=92)
    return out


# ------------------------------------------------------------------------------------------------ one day
def run(day, now, root, tg, log=print):
    """Posts the wins that are due. Returns True when the day file changed."""
    wins = day.get('wins') or []
    if not wins or day.get('paused'):
        return False
    c = day.get('win_caption') or {}
    wait = datetime.timedelta(minutes=int(day.get('win_cloud_wait', 25)))
    games = {}
    dirty = False
    for m in wins:
        if m.get('posted'):
            continue
        try:
            ko = datetime.datetime.fromisoformat(m['ko'])
        except Exception:
            continue
        if now < ko + datetime.timedelta(minutes=105) + wait:
            continue                                   # not over yet, or the laptop still has its turn
        if now > ko + datetime.timedelta(hours=10):
            m['posted'] = 'missed'
            dirty = True
            continue
        d = m['ko'][:10]
        if d not in games:
            try:
                games[d] = espn_day(d)
            except Exception as ex:
                log(f'ESPN did not answer ({ex}).')
                games[d] = []
        g = find(games[d], m)
        if not g or not g['done'] or g['gh'] is None or g['ga'] is None:
            continue
        res = [won(p.get('rule'), g['gh'], g['ga'], g['hh'], g['ha']) for p in m['picks']]
        if any(r is False for r in res):
            m['posted'] = 'lost'
            dirty = True
            continue
        if not res or not all(r is True for r in res):
            continue                                   # corners or cards: the laptop decides
        cs_won = bool(m.get('score')) and m['score'] == f'{g["gh"]}-{g["ga"]}'
        text, is_html = caption(m, g['gh'], g['ga'], cs_won, c)
        pic = None
        try:
            out = os.path.join(root, 'cloud', 'wins', f'{d}-{m["n"]}.jpg')
            if cs_won:
                pic = draw_cs(m, g['gh'], g['ga'], root, out, style=c.get('cs_style', 'gold'), brand=c.get('brand', 'MATCH VISION'))
            else:
                pic = draw(m, g['gh'], g['ga'], cs_won, root, out, brand=c.get('brand', 'MATCH VISION'))
        except Exception as ex:
            log(f'Win ticket picture not drawn ({ex}); the text goes alone.')
        try:
            extra = {'parse_mode': 'HTML'} if is_html else {}
            if pic:
                tg('sendPhoto', {'chat_id': day['win_chat'], 'caption': text[:1024], **extra}, {'photo': pic})
            else:
                tg('sendMessage', {'chat_id': day['win_chat'], 'text': text, **extra})
            m['posted'] = 'cloud'
            m['posted_at'] = now.isoformat(timespec='minutes')
            log(f'{m["home"]} vs {m["away"]}: WIN TICKET POSTED by the cloud.')
        except Exception as ex:
            log(f'{m["home"]} vs {m["away"]}: could not post ({ex}). Next run tries again.')
        dirty = True
    return dirty


# ------------------------------------------------------------------------------------------------ 3.8.1: end of day
DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November',
          'December']


def results(day, now, tg, log=print):
    """When every match is over and the laptop did not post the results: one post with every slip that won today."""
    wins = day.get('wins') or []
    if not wins or day.get('paused') or day.get('results_posted') or not day.get('results_on', True):
        return False
    kos = []
    for m in wins:
        try:
            kos.append(datetime.datetime.fromisoformat(m['ko']))
        except Exception:
            pass
    if not kos or now < max(kos) + datetime.timedelta(minutes=105 + int(day.get('results_cloud_wait', 60))):
        return False
    games, won_list, w, n = {}, [], 0, 0
    for m in wins:
        d = m['ko'][:10]
        if d not in games:
            try:
                games[d] = espn_day(d)
            except Exception as ex:
                log(f'ESPN did not answer ({ex}).')
                return False
        g = find(games[d], m)
        if not g or not g['done'] or g['gh'] is None:
            continue
        res = [won(p.get('rule'), g['gh'], g['ga'], g['hh'], g['ha']) for p in m['picks']]
        w += sum(1 for r in res if r is True)
        n += sum(1 for r in res if r is not None)
        if res and all(r is True for r in res):
            won_list.append(f'✅ {m["home"]} {g["gh"]}-{g["ga"]} {m["away"]}')
    bk_line = ''
    bk = day.get('banker') or {}
    if bk.get('games'):                                  # 3.9.1: the 2 odds banker in the results post
        rs = []
        for bg in bk['games']:
            m = next((x for x in wins if x.get('n') == bg.get('n')), None)
            p = next((q for q in (m or {}).get('picks') or [] if q.get('text') == bg.get('text')), None)
            g = find(games.get(m['ko'][:10]) or [], m) if m else None
            rs.append(won(p.get('rule'), g['gh'], g['ga'], g['hh'], g['ha']) if (p and g and g['done']) else None)
        if all(r is True for r in rs) and not str(bk.get('posted') or '').startswith(('cloud', 'laptop')):
            bk_line = f'💰 *{float(bk.get("total") or 0):.2f} Odds Banker WON* ✅'
    if not won_list and not bk_line:
        day['results_posted'] = 'cloud: no full wins'
        return True
    dd = datetime.date.fromisoformat(day['date'])
    c = day.get('results_caption') or {}
    head = str(c.get('head') or "🔥 *Today's Winning Slips*")
    end = str(c.get('end') or '📊 *{WON} Of {TOTAL} Predictions Won*').replace('{WON}', str(w)).replace('{TOTAL}', str(n))
    txt = '\n'.join([head, f'{DAYS[dd.weekday()]} {dd.day} {MONTHS[dd.month - 1]}', ''] + won_list +
                    (['', bk_line] if bk_line else []) + ['', end] +
                    ([f'\n{c["extra"]}'] if c.get('extra') else []))
    try:
        if (day.get('win_caption') or {}).get('bold', True):
            tg('sendMessage', {'chat_id': day['win_chat'], 'parse_mode': 'HTML', 'disable_web_page_preview': 'true',
                               'text': re.sub(r'\*([^*\n]+)\*', lambda x: f'<b>{x.group(1)}</b>', html.escape(txt, quote=False))})
        else:
            tg('sendMessage', {'chat_id': day['win_chat'], 'text': txt.replace('*', '')})
        day['results_posted'] = 'cloud'
        day['results_posted_at'] = now.isoformat(timespec='minutes')
        log(f'{day["date"]}: END OF DAY RESULTS POSTED by the cloud.')
    except Exception as ex:
        log(f'{day["date"]}: results not posted ({ex}). Next run tries again.')
    return True


# ------------------------------------------------------------------------------------------------ 3.9: correct score win card
CS_STYLES = {'gold': ((236, 196, 98), (29, 22, 7), (7, 6, 5)), 'diamond': ((125, 211, 252), (7, 24, 39), (4, 8, 13)),
             'emerald': ((52, 211, 153), (5, 36, 26), (3, 10, 7)), 'royal': ((192, 132, 252), (26, 12, 43), (7, 4, 12)),
             'fire': ((251, 146, 60), (42, 17, 5), (10, 5, 3))}


def draw_cs(m, gh, ga, root, out, fonts=FONTS, style='gold', brand='MATCH VISION'):
    """CORRECT SCORE WIN - a big VIP-like card: crown, BIG WIN, both crests and the score big, then the picks."""
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    A, B1, B2 = CS_STYLES.get(str(style).split()[-1].lower(), CS_STYLES['gold'])
    picks = [p['text'] for p in m['picks']][:3]
    W = 1080
    H = 640 + len(picks) * 130 + 120
    im = Image.new('RGB', (W, H), B2)
    d = ImageDraw.Draw(im)
    for y in range(H):
        k = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(int(B1[i] + (B2[i] - B1[i]) * k) for i in range(3)))
    glow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(glow).ellipse((W / 2 - 420, 120, W / 2 + 420, 640), fill=90)
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    im.paste(Image.new('RGB', (W, H), A), (0, 0), glow)
    d = ImageDraw.Draw(im)

    def F(names, px):
        for n in names:
            p = os.path.join(fonts, n)
            if os.path.isfile(p):
                return ImageFont.truetype(p, px)
        return ImageFont.load_default()
    BLK, MED = ('InterDisplay-Black.otf', 'Inter-Black.otf'), ('Inter-Medium.otf',)

    def ctext(t, y, f, fill, maxw=W - 160):
        px = f.size if hasattr(f, 'size') else 30
        ff = f
        while px > 14 and d.textlength(t, font=ff) > maxw:
            px -= 2
            ff = F(BLK, px)
        d.text((W / 2 - d.textlength(t, font=ff) / 2, y), t, font=ff, fill=fill)
    d.rounded_rectangle((26, 26, W - 26, H - 26), radius=48, outline=A, width=6)
    d.rounded_rectangle((44, 44, W - 44, H - 44), radius=38, outline=tuple(int(v * .45) for v in A), width=2)
    cx = W / 2
    d.polygon([(cx - 43, 148), (cx - 49, 88), (cx - 21, 116), (cx, 78), (cx + 21, 116), (cx + 49, 88), (cx + 43, 148)], fill=A)
    d.rectangle((cx - 43, 154, cx + 43, 166), fill=A)
    ctext('CORRECT SCORE WIN', 176, F(BLK, 64), A)
    d.rounded_rectangle((cx - 120, 256, cx + 120, 318), radius=31, fill=A)
    ctext('BIG WIN', 266, F(BLK, 36), (17, 17, 17))

    def crest(path, x, name):
        s, cy = 170, 440
        p = os.path.join(root, path) if path else ''
        if p and os.path.isfile(p):
            c = Image.open(p).convert('RGBA')
            c.thumbnail((s, s))
            im.paste(c, (int(x - c.width / 2), int(cy - c.height / 2)), c)
        else:
            d.ellipse((x - s / 2, cy - s / 2, x + s / 2, cy + s / 2), fill=(38, 38, 38))
            ini = ''.join(w[0] for w in str(name).split()[:2]).upper()
            f = F(BLK, 56)
            d.text((x - d.textlength(ini, font=f) / 2, cy - 34), ini, font=f, fill=(221, 221, 221))
        nm = str(name).upper()
        f = F(BLK, 30)
        while d.textlength(nm, font=f) > 280 and f.size > 16:
            f = F(BLK, f.size - 2)
        d.text((x - d.textlength(nm, font=f) / 2, 545), nm, font=f, fill=(255, 255, 255))
    crest(m.get('hc'), 210, m['home'])
    crest(m.get('ac'), W - 210, m['away'])
    sc = f'{gh}-{ga}'
    f = F(BLK, 150)
    d.text((cx - d.textlength(sc, font=f) / 2, 350), sc, font=f, fill=(255, 255, 255))
    f = F(BLK, 24)
    t = 'FULL TIME · PREDICTED RIGHT'
    d.text((cx - d.textlength(t, font=f) / 2, 518), t, font=f, fill=A)
    lg = str(m.get('league') or '')
    if lg:
        f = F(MED, 26)
        d.text((cx - d.textlength(lg, font=f) / 2, 585), lg, font=f, fill=(189, 189, 189))
    for i, pk in enumerate(picks):
        y, X, Wd, rh = 630 + i * 130, 80, W - 160, 112
        cy = y + rh / 2
        d.rounded_rectangle((X, y, X + Wd, y + rh), radius=24, fill=tuple(int(v * .55) + 10 for v in B1),
                            outline=tuple(int(v * .5) for v in A), width=2)
        d.ellipse((X + 24, cy - 26, X + 76, cy + 26), fill=A)
        f = F(BLK, 28)
        d.text((X + 50 - d.textlength(str(i + 1), font=f) / 2, cy - 18), str(i + 1), font=f, fill=(17, 17, 17))
        t = pk.upper()
        f = F(BLK, 36)
        while d.textlength(t, font=f) > Wd - 200 and f.size > 16:
            f = F(BLK, f.size - 2)
        d.text((X + 100, cy - 22), t, font=f, fill=(255, 255, 255))
        t2 = X + Wd - 50
        d.ellipse((t2 - 26, cy - 26, t2 + 26, cy + 26), fill=(34, 197, 94))
        d.line([(t2 - 11, cy + 1), (t2 - 2, cy + 10), (t2 + 12, cy - 9)], fill=(255, 255, 255), width=6, joint='curve')
    n = len(picks) + 1
    foot = f'{n} OF {n} WON' + (f' · {brand}' if brand else '')
    f = F(BLK, 32)
    d.text((cx - d.textlength(foot, font=f) / 2, H - 100), foot, font=f, fill=A)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, quality=92)
    return out


# ------------------------------------------------------------------------------------------------ 3.9.3: banker win at once
def banker_caption(legs, total, c=None):
    """legs: [{home, away, gh, ga, text, odds}]. Bold only the WON line and the total."""
    c = c or {}
    T = f'{float(total or 0):.2f}'
    head = str(c.get('banker_head') or '💰 *{ODDS} ODDS BANKER WON* 💰').replace('{ODDS}', T)
    lines = [head, '']
    for g in legs:
        lines.append(f'✅ {g["home"]} {g["gh"]}-{g["ga"]} {g["away"]}')
        lines.append(f'✔️ {g["text"]}' + (f' @ {float(g["odds"]):.2f}' if g.get('odds') else ''))
        lines.append('')
    lines.append(str(c.get('banker_end') or '🔥 *Total Odds {ODDS}*').replace('{ODDS}', T))
    return '\n'.join(lines)


def to_html(txt):
    return re.sub(r'\*([^*\n]+)\*', lambda x: f'<b>{x.group(1)}</b>', html.escape(txt, quote=False))


def draw_banker(legs, total, date_label, root, out, fonts=FONTS, brand='MATCH VISION'):
    """The old card for the banker: MV badge, 2.00 ODDS BANKER WON, each leg with crests, score and a green tick."""
    from PIL import Image, ImageDraw, ImageFont
    W, rh, gap, top = 1080, 165, 22, 265
    H = min(1350, top + len(legs) * (rh + gap) + 178)
    A, A2 = (236, 196, 98), (156, 130, 64)
    im = Image.new('RGB', (W, H), (6, 6, 6))
    d = ImageDraw.Draw(im)
    for y in range(H):
        k = y / (H - 1)
        d.line([(0, y), (W, y)], fill=(int(21 + (6 - 21) * k), int(18 + (6 - 18) * k), int(10 + (6 - 10) * k)))

    def F(names, px):
        for n in names:
            p = os.path.join(fonts, n)
            if os.path.isfile(p):
                return ImageFont.truetype(p, px)
        return ImageFont.load_default()
    BLK, MED = ('InterDisplay-Black.otf', 'Inter-Black.otf'), ('Inter-Medium.otf',)

    def fit(t, names, px, maxw):
        while px > 14 and d.textlength(t, font=F(names, px)) > maxw:
            px -= 2
        return F(names, px)
    d.rounded_rectangle((30, 30, W - 30, H - 30), radius=46, outline=A, width=4)
    d.ellipse((100, 105, 188, 193), fill=A)
    f = F(BLK, 38)
    d.text((144 - d.textlength('MV', font=f) / 2, 128), 'MV', font=f, fill=(11, 11, 11))
    title = f'{float(total or 0):.2f} ODDS BANKER WON'
    d.text((215, 92), title, font=fit(title, BLK, 62, 780), fill=A)
    d.text((217, 172), date_label, font=fit(date_label, MED, 32, 780), fill=(189, 189, 189))

    def crest(path, cx, cy, s, name):
        p = os.path.join(root, path) if path else ''
        if p and os.path.isfile(p):
            cc = Image.open(p).convert('RGBA')
            cc.thumbnail((s, s))
            im.paste(cc, (int(cx + (s - cc.width) / 2), int(cy - cc.height / 2)), cc)
        else:
            d.ellipse((cx, cy - s / 2, cx + s, cy + s / 2), fill=(38, 38, 38))
    for i, g in enumerate(legs):
        y, X, Wd = top + i * (rh + gap), 70, W - 140
        cy = y + rh / 2
        d.rounded_rectangle((X, y, X + Wd, y + rh), radius=26, fill=(22, 20, 14), outline=(90, 76, 40), width=2)
        d.rounded_rectangle((X, y, X + 10, y + rh), radius=5, fill=A)
        d.ellipse((X + 32, cy - 30, X + 92, cy + 30), fill=A)
        ff = F(BLK, 32)
        d.text((X + 62 - d.textlength(str(i + 1), font=ff) / 2, cy - 20), str(i + 1), font=ff, fill=(17, 17, 17))
        cs = 78
        crest(g.get('hc'), X + 112, cy, cs, g['home'])
        crest(g.get('ac'), X + 112 + cs + 12, cy, cs, g['away'])
        tx = X + 112 + cs * 2 + 40
        tw = X + Wd - 200 - tx
        t = str(g['text']).upper()
        d.text((tx, cy - 50), t, font=fit(t, BLK, 40, tw), fill=(255, 255, 255))
        vs = f'{g["home"]} {g["gh"]}-{g["ga"]} {g["away"]}'
        d.text((tx, cy + 10), vs, font=fit(vs, MED, 27, tw), fill=(169, 169, 169))
        if g.get('odds'):
            o = f'{float(g["odds"]):.2f}'
            fo = F(BLK, 40)
            d.text((X + Wd - 110 - d.textlength(o, font=fo), cy - 24), o, font=fo, fill=A)
        t2 = X + Wd - 50
        d.ellipse((t2 - 28, cy - 28, t2 + 28, cy + 28), fill=(34, 197, 94))
        d.line([(t2 - 12, cy + 1), (t2 - 3, cy + 10), (t2 + 13, cy - 9)], fill=(255, 255, 255), width=7, joint='curve')
    foot = f'TOTAL ODDS {float(total or 0):.2f}' + (f' · {brand}' if brand else '')
    ff = F(BLK, 30)
    d.text((W / 2 - d.textlength(foot, font=ff) / 2, H - 82), foot, font=ff, fill=A2)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, quality=92)
    return out


def banker(day, now, root, tg, log=print):
    """The banker win on the channel as soon as its last game is over and every leg won (when the laptop did not)."""
    bk = day.get('banker') or {}
    if not bk.get('games') or bk.get('posted') or day.get('paused') or not day.get('banker_on', True):
        return False
    wins = day.get('wins') or []
    legs, kos = [], []
    for bg in bk['games']:
        m = next((x for x in wins if x.get('n') == bg.get('n')), None)
        if not m:
            return False
        kos.append(datetime.datetime.fromisoformat(m['ko']))
        legs.append((m, next((q for q in m.get('picks') or [] if q.get('text') == bg.get('text')), None), bg))
    wait = datetime.timedelta(minutes=int(day.get('win_cloud_wait', 25)))
    if now < max(kos) + datetime.timedelta(minutes=105) + wait:
        return False
    if now > max(kos) + datetime.timedelta(hours=10):
        bk['posted'] = 'missed'
        return True
    games, out = {}, []
    for m, p, bg in legs:
        dd = m['ko'][:10]
        if dd not in games:
            try:
                games[dd] = espn_day(dd)
            except Exception:
                return False
        g = find(games[dd], m)
        if not g or not g['done'] or not p:
            return False
        r = won(p.get('rule'), g['gh'], g['ga'], g['hh'], g['ha'])
        if r is False:
            bk['posted'] = 'lost'
            return True
        if r is not True:
            return False
        out.append({'home': m['home'], 'away': m['away'], 'gh': g['gh'], 'ga': g['ga'], 'text': p['text'],
                    'odds': bg.get('odds'), 'hc': m.get('hc'), 'ac': m.get('ac')})
    c = day.get('win_caption') or {}
    txt = banker_caption(out, bk.get('total'), c)
    dd = datetime.date.fromisoformat(day['date'])
    pic = None
    try:
        pic = draw_banker(out, bk.get('total'), f'{DAYS[dd.weekday()]} {dd.day} {MONTHS[dd.month - 1]}', root,
                          os.path.join(root, 'cloud', 'wins', f'{day["date"]}-banker.jpg'), brand=c.get('brand', 'MATCH VISION'))
    except Exception as ex:
        log(f'Banker picture not drawn ({ex}).')
    try:
        bold = c.get('bold', True)
        body = to_html(txt) if bold else txt.replace('*', '')
        extra = {'parse_mode': 'HTML'} if bold else {}
        if pic:
            tg('sendPhoto', {'chat_id': day['win_chat'], 'caption': body[:1024], **extra}, {'photo': pic})
        else:
            tg('sendMessage', {'chat_id': day['win_chat'], 'text': body, **extra})
        bk['posted'] = 'cloud'
        log(f'{day["date"]}: BANKER WIN POSTED by the cloud.')
    except Exception as ex:
        log(f'Banker win not posted ({ex}). Next run tries again.')
    return True
