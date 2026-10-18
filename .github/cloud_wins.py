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
    if cs_won and c.get('big'):
        lines += [c['big'], '']
    lines += [f'✅ *{m["home"]} {gh}-{ga} {m["away"]}*', '']
    lines += [f'✔️ {p["text"]}' for p in m['picks']]
    if cs_won:
        lines.append(f'🎯 Correct score {gh}-{ga} ✔️')
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
            pic = draw(m, g['gh'], g['ga'], cs_won, root, os.path.join(root, 'cloud', 'wins', f'{d}-{m["n"]}.jpg'),
                       brand=c.get('brand', 'MATCH VISION'))
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
