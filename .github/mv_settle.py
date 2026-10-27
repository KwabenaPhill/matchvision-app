# -*- coding: utf-8 -*-
"""MATCH VISION 3.25 (Philip, 27 Oct 2026): "it should understand any result ... Benfica -1 ... it shouldn't ask me".

settle(text, gh, ga, home, away, hh=None, ha=None) -> 'won' / 'lost' / 'void' / None (cannot tell: corners, cards,
goal minutes, or words it does not know). Used by the laptop results, the live FULL TIME messages, the cloud poster and
(the same rules in JavaScript) the phone app. No other module is needed, so the cloud can use this file on its own.

Rules (Asian handicap, like SportyBet's "Handicap" with a whole number = money back on the exact line):
  Benfica -1: wins by 2 or more = won, wins by exactly 1 = void, draw or loss = lost.  -1.5: wins by 2 = won.
  Draw no bet: draw = void.   Combos ("Roma to win & over 1.5", "win and BTTS"): every part must win.
"""
import re
import unicodedata

COMMON = {'fc', 'cf', 'sc', 'ac', 'as', 'afc', 'club', 'de', 'la', 'le', 'the', 'real', 'city', 'united', 'utd',
          'sporting', 'athletic', 'atletico', 'inter', 'cd', 'ud', 'rc', 'sv', 'vfb', 'vfl', 'fk', 'sk', 'if', 'bk',
          'town', 'county', 'rovers', 'wanderers', 'albion', 'hotspur', 'olympique', 'stade', 'saint', 'st', 'san',
          'santa', 'deportivo', 'racing', 'dynamo', 'dinamo', 'young', 'boys', 'and', 'of', 'al', 'el', 'cp', 'ss'}


def _plain(s):
    s = unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'\s+', ' ', s).strip()


def _tag_teams(q, home, away):
    """Team names (full or one telling word, "Roma" for "AS Roma") become 'home' / 'away'."""
    h, a = _plain(home), _plain(away)
    names = [(h, 'home'), (a, 'away')]
    hw = [w for w in re.findall(r'[a-z0-9]+', h) if len(w) >= 3 and w not in COMMON]
    aw = [w for w in re.findall(r'[a-z0-9]+', a) if len(w) >= 3 and w not in COMMON]
    names += [(w, 'home') for w in hw if w not in aw] + [(w, 'away') for w in aw if w not in hw]
    for name, tag in sorted(names, key=lambda x: -len(x[0])):
        if len(name) >= 3:
            q = re.sub(r'(?<![a-z0-9])' + re.escape(name) + r'(?![a-z0-9])', tag, q)
    q = re.sub(r'\b(home|away)( (home|away))+\b', lambda m: m.group(1), q)      # "as home" leftovers
    return re.sub(r'\b(?:as|fc|ac|sc|cf|afc)\s+(home|away)\b', r'\1', q)


def _clean(text, home, away):
    q = _plain(text)
    q = re.sub(r'@\s*\d+(?:\.\d+)?', ' ', q)                     # "@1.62"
    q = re.sub(r'\(\s*\d+\.\d+\s*\)', ' ', q)                    # "(1.62)" odds, never "(-1)"
    q = q.replace('(', ' ').replace(')', ' ')
    q = _tag_teams(q, home, away)
    q = re.sub(r'\b(asian handicap|european handicap|handicap|hcap|ah)\b', ' ', q)
    q = re.sub(r'\b(goals?|full ?time|ft|match result|1x2|total|the match|in the match)\b', ' ', q)
    q = re.sub(r'\bboth teams to score\b|\bboth teams score\b|\bgg\b', ' btts ', q)
    q = re.sub(r'\bbtts\s*[-:]?\s*yes\b', 'btts', q)
    q = re.sub(r'\bbtts\s*[-:]?\s*no\b|\bng\b|\bno goal goal\b', 'btts_no', q)
    q = re.sub(r'\b(home|away) team\b', r'\1', q)
    q = re.sub(r'\bto win\b|\bwins?\b|\bvictory\b', ' win ', q)
    q = re.sub(r'\bdraw no bet\b|\bdnb\b', ' dnb ', q)
    q = re.sub(r'[|:;,]', ' ', q)
    return re.sub(r'\s+', ' ', q).strip()


def _ah(margin, line):
    def one(l):
        v = margin + l
        return 'won' if v > 0 else ('lost' if v < 0 else 'void')
    if abs((line * 4) % 2 - 1) < 1e-9:                          # quarter lines -0.25, -0.75: half on each side
        x, y = one(line - 0.25), one(line + 0.25)
        if x == y:
            return x
        return 'won' if 'won' in (x, y) else 'lost'
    return one(line)


def _one(q, gh, ga, hh, ha):
    """One condition. 'home' / 'away' are already in place of the team names."""
    tot = gh + ga
    q = q.strip()
    if not q:
        return None
    if re.search(r'corner|card|booking|offside|shot|foul|throw', q):
        return None
    # --- 2nd half / 1st half: judge the same words on that half's score
    if re.search(r'\b(2nd half|second half|2h)\b', q):
        if hh is None or ha is None:
            return None
        r = re.sub(r'\b(2nd half|second half|2h)\b', ' ', q)
        return _one(r, gh - hh, ga - ha, None, None)
    if re.search(r'\b(1st half|first half|half ?time|ht|1h)\b', q) and not re.search(r'\bht ?/ ?ft\b|half ?time ?/ ?full', q):
        if hh is None or ha is None:
            return None
        r = re.sub(r'\b(1st half|first half|half ?time|ht|1h)\b', ' ', q)
        return _one(r, hh, ha, None, None)
    # --- correct score
    m = re.search(r'(?:correct score\s*)?\b(\d{1,2})\s*[-:]\s*(\d{1,2})\b', q)
    if m and not re.search(r'[+-]\d', q.replace(m.group(0), '')):
        if 'correct score' in q or re.fullmatch(r'\s*(?:correct score\s*)?\d{1,2}\s*[-:]\s*\d{1,2}\s*', q):
            return 'won' if (gh, ga) == (int(m.group(1)), int(m.group(2))) else 'lost'
    # --- draw no bet
    m = re.search(r'\b(home|away)\s*dnb\b|\bdnb\s*(home|away)\b', q)
    if m:
        side = m.group(1) or m.group(2)
        if gh == ga:
            return 'void'
        return 'won' if (gh > ga) == (side == 'home') else 'lost'
    # --- handicap: "home -1", "away +1.5", "-1 home"
    m = re.search(r'\b(home|away)\s*([+-]\s*\d+(?:\.\d+)?)', q) or re.search(r'([+-]\s*\d+(?:\.\d+)?)\s*(home|away)\b', q)
    if m:
        side, line = (m.group(1), m.group(2)) if m.group(1) in ('home', 'away') else (m.group(2), m.group(1))
        line = float(line.replace(' ', ''))
        margin = gh - ga if side == 'home' else ga - gh
        return _ah(margin, line)
    # --- win to nil / clean sheet / to score / team over-under
    m = re.search(r'\b(home|away)\s*win to nil\b', q)
    if m:
        a, b = (gh, ga) if m.group(1) == 'home' else (ga, gh)
        return 'won' if a > b and b == 0 else 'lost'
    m = re.search(r'\b(home|away)\s*clean sheet\b', q)
    if m:
        return 'won' if (ga if m.group(1) == 'home' else gh) == 0 else 'lost'
    m = re.search(r'\b(home|away)\s*(?:to )?score\b', q)
    if m and 'not' not in q:
        return 'won' if (gh if m.group(1) == 'home' else ga) > 0 else 'lost'
    m = re.search(r'\b(home|away)\s*(?:not to score|no score)\b', q)
    if m:
        return 'won' if (gh if m.group(1) == 'home' else ga) == 0 else 'lost'
    m = re.search(r'\b(home|away)\s*(over|under)\s*(\d+(?:\.\d+)?)', q)
    if m:
        tg = gh if m.group(1) == 'home' else ga
        L = float(m.group(3))
        return ('won' if tg > L else 'lost') if m.group(2) == 'over' else ('won' if tg < L else 'lost')
    m = re.search(r'\b(home|away)\s*win (?:either|any) half\b', q)
    if m:
        if hh is None:
            return None
        s1 = (hh - ha) if m.group(1) == 'home' else (ha - hh)
        s2 = ((gh - hh) - (ga - ha)) if m.group(1) == 'home' else ((ga - ha) - (gh - hh))
        return 'won' if s1 > 0 or s2 > 0 else 'lost'
    m = re.search(r'\b(home|away)\s*win both halves\b', q)
    if m:
        if hh is None:
            return None
        s1 = (hh - ha) if m.group(1) == 'home' else (ha - hh)
        s2 = ((gh - hh) - (ga - ha)) if m.group(1) == 'home' else ((ga - ha) - (gh - hh))
        return 'won' if s1 > 0 and s2 > 0 else 'lost'
    m = re.search(r'\bwin by (\d+)\b', q)
    if m and re.search(r'\b(home|away)\b', q):
        side = re.search(r'\b(home|away)\b', q).group(1)
        mg = gh - ga if side == 'home' else ga - gh
        return 'won' if mg >= int(m.group(1)) else 'lost'
    # --- total goals
    m = re.search(r'\b(over|under)\s*(\d+(?:\.\d+)?)', q)
    if m:
        L = float(m.group(2))
        return ('won' if tot > L else 'lost') if m.group(1) == 'over' else ('won' if tot < L else 'lost')
    m = re.search(r'\bexactly (\d+)\b|\bexact (\d+)\b', q)
    if m:
        return 'won' if tot == int(m.group(1) or m.group(2)) else 'lost'
    if re.search(r'\bodd\b', q):
        return 'won' if tot % 2 == 1 else 'lost'
    if re.search(r'\beven\b', q):
        return 'won' if tot % 2 == 0 else 'lost'
    if 'btts_no' in q:
        return 'lost' if gh > 0 and ga > 0 else 'won'
    if re.search(r'\bbtts\b', q):
        return 'won' if gh > 0 and ga > 0 else 'lost'
    if re.search(r'\bno goals?\b|^0\s*-\s*0$', q):
        return 'won' if tot == 0 else 'lost'
    # --- double chance and 1X2
    if re.search(r'\b(1x|home or draw|draw or home|home x)\b', q):
        return 'won' if gh >= ga else 'lost'
    if re.search(r'\b(x2|draw or away|away or draw)\b', q):
        return 'won' if ga >= gh else 'lost'
    if re.search(r'\b(12|home or away|away or home|no draw|either team win)\b', q):
        return 'won' if gh != ga else 'lost'
    if re.fullmatch(r'(draw|x)', q) or re.fullmatch(r'draw\s*', q):
        return 'won' if gh == ga else 'lost'
    if re.fullmatch(r'(home|1)( win)?', q) or (re.search(r'\bhome\b', q) and re.search(r'\bwin\b', q)):
        return 'won' if gh > ga else 'lost'
    if re.fullmatch(r'(away|2)( win)?', q) or (re.search(r'\baway\b', q) and re.search(r'\bwin\b', q)):
        return 'won' if ga > gh else 'lost'
    if re.fullmatch(r'home', q):
        return 'won' if gh > ga else 'lost'
    if re.fullmatch(r'away', q):
        return 'won' if ga > gh else 'lost'
    return None


def settle(text, gh, ga, home, away, hh=None, ha=None):
    """'won' / 'lost' / 'void' / None for a FINISHED match (gh, ga = full time goals; hh, ha = half time)."""
    try:
        gh, ga = int(gh), int(ga)
    except (TypeError, ValueError):
        return None
    try:
        hh = int(hh) if hh is not None else None
        ha = int(ha) if ha is not None else None
    except (TypeError, ValueError):
        hh = ha = None
    q = _clean(text, home, away)
    if not q:
        return None
    # combos: every part must win ("home win & over 1.5", "win and btts", "home or draw + under 3.5")
    parts = [p.strip() for p in re.split(r'\s(?:&|and|\+|with)\s', ' ' + q + ' ') if p.strip()]
    if len(parts) > 1 and not re.search(r'\bwin both halves\b', q):
        rs = [_one(p, gh, ga, hh, ha) for p in parts]
        if any(r == 'lost' for r in rs):
            return 'lost'
        if any(r is None for r in rs):
            return None
        return 'void' if any(r == 'void' for r in rs) else 'won'
    # "or" between two different picks (not a double chance): one of them is enough
    if re.search(r'\bor\b', q) and not re.search(r'(home or draw|draw or home|draw or away|away or draw|home or away|away or home)', q):
        rs = [_one(p, gh, ga, hh, ha) for p in re.split(r'\bor\b', q) if p.strip()]
        if 'won' in rs:
            return 'won'
        if rs and all(r == 'lost' for r in rs):
            return 'lost'
        return None
    return _one(q, gh, ga, hh, ha)


def won_bool(text, gh, ga, home, away, hh=None, ha=None):
    """True / False / None for the old callers. A VOID (money back) counts as won: the slip goes on."""
    r = settle(text, gh, ga, home, away, hh, ha)
    return {'won': True, 'void': True, 'lost': False}.get(r)
