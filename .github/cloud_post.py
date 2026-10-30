# -*- coding: utf-8 -*-
"""CLOUD POSTER (Sure Stake 707 and Match Vision) - runs on GitHub, not on the laptop.

Every 5 minutes GitHub runs this file (3.8: also the win tickets, cloud_wins.py) (.github/workflows/post.yml runs .github/cloud_post.py). It reads cloud/<today>.json,
written by the laptop bot, and posts every item that is due and not posted yet, CLOUD GRACE minutes after its time
(so the laptop always goes first when it is on). Then it writes "posted": "cloud" into the file, so the laptop never
posts it again. The bot token is a GitHub SECRET called TG_TOKEN: nobody can read it, not even this file's readers.

Nothing to change here. Python 3 only, no extra parts.
"""
import os
import sys
import json
import glob
import datetime
import urllib.request
import urllib.parse
import uuid
import mimetypes
import time
import subprocess

TOKEN = os.environ.get('TG_TOKEN', '').strip()
BASE = os.environ.get('TG_BASE', 'https://api.telegram.org')
ROOT = os.environ.get('CLOUD_ROOT') or os.getcwd()          # the repository (GitHub runs it from there)


def tg(method, params, files=None):
    url = f'{BASE}/bot{TOKEN}/{method}'
    params = {k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else str(v)) for k, v in params.items()
              if v is not None}
    if files:
        bnd = uuid.uuid4().hex
        body = b''
        for k, v in params.items():
            body += f'--{bnd}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode('utf-8')
        for k, path in files.items():
            with open(path, 'rb') as f:
                data = f.read()
            ct = mimetypes.guess_type(path)[0] or 'image/jpeg'
            body += (f'--{bnd}\r\nContent-Disposition: form-data; name="{k}"; filename="{os.path.basename(path)}"\r\n'
                     f'Content-Type: {ct}\r\n\r\n').encode('utf-8') + data + b'\r\n'
        body += f'--{bnd}--\r\n'.encode()
        req = urllib.request.Request(url, data=body, headers={'Content-Type': f'multipart/form-data; boundary={bnd}'})
    else:
        req = urllib.request.Request(url, data=urllib.parse.urlencode(params).encode('utf-8'))
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            j = json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as ex:
        j = json.loads(ex.read().decode('utf-8') or '{}')
    if not j.get('ok'):
        raise RuntimeError(f'Telegram: {j.get("description")}')
    return j['result']


def post(item):
    chat, text, html = item['chat'], item.get('text') or '', bool(item.get('html'))
    anim = os.path.join(ROOT, item['animation']) if item.get('animation') else ''
    if anim and os.path.isfile(anim):                 # 3.21: the morning GIF (or short video) with its words
        extra = {'parse_mode': 'HTML'} if html else {}
        if anim.lower().endswith(('.gif', '.mp4')):   # 3.24: a silent mp4 plays like a GIF
            return tg('sendAnimation', {'chat_id': chat, 'caption': text[:1000], **extra}, {'animation': anim})
        return tg('sendVideo', {'chat_id': chat, 'caption': text[:1000], **extra}, {'video': anim})
    pics = [os.path.join(ROOT, p) for p in item.get('images') or []]
    pics = [p for p in pics if os.path.isfile(p)]
    extra = {'parse_mode': 'HTML'} if html else {}
    if pics and len(text) <= 1000:
        if len(pics) == 1:
            return tg('sendPhoto', {'chat_id': chat, 'caption': text, **extra}, {'photo': pics[0]})
        media = [{'type': 'photo', 'media': f'attach://p{i}', **({'caption': text, **extra} if i == 0 else {})}
                 for i in range(len(pics))]
        return tg('sendMediaGroup', {'chat_id': chat, 'media': media}, {f'p{i}': p for i, p in enumerate(pics)})
    if pics:
        if len(pics) == 1:
            tg('sendPhoto', {'chat_id': chat}, {'photo': pics[0]})
        else:
            tg('sendMediaGroup', {'chat_id': chat, 'media': [{'type': 'photo', 'media': f'attach://p{i}'} for i in range(len(pics))]},
               {f'p{i}': p for i, p in enumerate(pics)})
    return tg('sendMessage', {'chat_id': chat, 'text': text[:4000], 'disable_web_page_preview': 'true', **extra})


def unlock(enc):
    """3.25: the Vision Premium post is locked in the public file with the bot key; only this job can open it."""
    import base64
    import hashlib
    import hmac
    data = base64.b64decode(enc)
    nonce, tag, ct = data[:16], data[16:48], data[48:]
    key = hashlib.sha256(('mv-premium|' + TOKEN).encode()).digest()
    if not hmac.compare_digest(tag, hmac.new(key, nonce + ct, hashlib.sha256).digest()):
        raise RuntimeError('the Premium post could not be opened (another bot key?)')
    out = bytearray()
    i = 0
    while len(out) < len(ct):
        out += hashlib.sha256(key + nonce + i.to_bytes(8, 'big')).digest()
        i += 1
    return json.loads(bytes(a ^ b for a, b in zip(ct, out)).decode('utf-8'))


def post_locked(item):
    import base64
    import tempfile
    sec = unlock(item['enc'])
    tmp = None
    if sec.get('img'):
        fd, tmp = tempfile.mkstemp(suffix='.jpg')
        with os.fdopen(fd, 'wb') as f:
            f.write(base64.b64decode(sec['img']))
    try:
        extra = {'parse_mode': 'HTML'} if sec.get('html') else {}
        anim = os.path.join(ROOT, sec['anim']) if sec.get('anim') else ''   # 3.28: the VIP morning animation
        if anim and os.path.isfile(anim):
            return tg('sendAnimation', {'chat_id': sec['chat'], 'caption': (sec.get('text') or '')[:1000], **extra},
                      {'animation': anim})
        if tmp:
            return tg('sendPhoto', {'chat_id': sec['chat'], 'caption': (sec.get('text') or '')[:1000], **extra}, {'photo': tmp})
        return tg('sendMessage', {'chat_id': sec['chat'], 'text': sec.get('text') or '', **extra})
    finally:
        if tmp:
            try:
                os.remove(tmp)
            except OSError:
                pass


def sticker(day, kind, chat):
    """3.20.1: the TODAY'S GAMES / NEW VIDEO / RESULTS sticker just before that post, once a day (laptop off too)."""
    path = (day.get('stickers') or {}).get(kind)
    sent = day.setdefault('stickers_sent', [])
    if not path or kind in sent or not chat:
        return
    full = os.path.join(ROOT, path)
    if not os.path.isfile(full):
        return
    try:
        tg('sendSticker', {'chat_id': chat}, {'sticker': full})
        sent.append(kind)
        print(f'{day.get("date")}: {kind} sticker sent by the cloud.')
    except Exception as ex:
        print(f'{day.get("date")}: {kind} sticker not sent ({ex}).')


def gap_wait(day, chat, now):
    """3.25 (Philip): never two channel posts closer than POST GAP minutes (10)."""
    last = (day.get('last_post') or {}).get(str(chat))
    if not last:
        return False
    try:
        return now < datetime.datetime.fromisoformat(last) + datetime.timedelta(minutes=int(day.get('post_gap', 0) or 0))
    except ValueError:
        return False


def gap_mark(day, chat, now):
    day.setdefault('last_post', {})[str(chat)] = now.isoformat(timespec='seconds')


def main():
    if not TOKEN:
        print('No TG_TOKEN secret: nothing posted (see GUIDE.txt, one-time setup).')
        return 0
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)   # Ghana time = GMT
    changed = []
    for path in sorted(glob.glob(os.path.join(ROOT, 'cloud', '*.json'))):
        name = os.path.basename(path)[:10]
        if name not in (now.date().isoformat(), (now - datetime.timedelta(hours=6)).date().isoformat()):
            continue
        with open(path, encoding='utf-8') as f:
            day = json.load(f)
        if day.get('paused'):
            print(f'{name}: paused, nothing posted.')
            continue
        grace = datetime.timedelta(minutes=int(day.get('grace_minutes', 10)))
        dirty = False
        for it in day.get('posts') or []:
            if it.get('posted'):
                continue
            at = datetime.datetime.fromisoformat(it['at'])
            latest = datetime.datetime.fromisoformat(it['latest']) if it.get('latest') else None
            if now < at + grace:
                continue
            if latest and now > latest:
                print(f'{name} {it["id"]}: too late (after {it["latest"]}), not posted.')
                it['posted'] = 'missed'
                dirty = True
                continue
            if gap_wait(day, it.get('chat'), now):
                continue                               # 3.25: 10 minutes after the last post on this channel
            try:
                if it.get('enc'):                      # 3.25: Vision Premium (locked)
                    post_locked(it)
                else:
                    if it.get('id') in ('games', 'video'):
                        sticker(day, it['id'], it.get('chat'))
                    post(it)
                    gap_mark(day, it.get('chat'), now)
                it.pop('enc', None)                    # opened and posted: the locked words leave the file
                it['posted'] = 'cloud'
                it['posted_at'] = now.isoformat(timespec='minutes')
                print(f'{name} {it["id"]}: POSTED by the cloud.')
            except Exception as ex:
                print(f'{name} {it["id"]}: could not post ({ex}). Next run tries again.')
            dirty = True
        if day.get('morning_sent') is None and any(x.get('id') == 'morning' and x.get('posted') for x in day.get('posts') or []):
            day['morning_sent'] = True
            dirty = True
        if os.environ.get('CLOUD_WINS', '1') == '0':
            if dirty:
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(day, f, ensure_ascii=False, indent=1, sort_keys=True)
                changed.append(path)
            continue
        try:                                           # 3.8: win tickets when a match is over (laptop off too)
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            import cloud_wins
            chat_w = day.get('win_chat') or ''

            def tg_r(method, params, files=None):      # 3.20.1: the RESULTS sticker before the first result
                if method in ('sendPhoto', 'sendMediaGroup', 'sendMessage') and str(params.get('chat_id')) == str(chat_w):
                    if gap_wait(day, chat_w, now):         # 3.25: the gap: the next round posts it
                        raise RuntimeError('waiting for the gap between posts')
                    sticker(day, 'results', chat_w)
                    r = tg(method, params, files)
                    gap_mark(day, chat_w, now)
                    return r
                return tg(method, params, files)
            tg_w = tg_r
            if cloud_wins.run(day, now, ROOT, tg_w, print):
                dirty = True
            if cloud_wins.banker(day, now, ROOT, tg_w, print):  # 3.9.3: the banker win at once
                dirty = True
            if cloud_wins.results(day, now, tg_w, print):     # 3.8.1: the end-of-day results too
                dirty = True
            if cloud_wins.day_stats(day, now):               # 3.10: numbers for the weekly recap
                dirty = True
        except Exception as ex:
            print(f'{name}: win tickets problem ({ex}).')
        if dirty:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(day, f, ensure_ascii=False, indent=1, sort_keys=True)
            changed.append(path)
    try:                                               # 3.10: Sunday weekly recap (laptop off)
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import cloud_wins
        if cloud_wins.weekly(ROOT, now, tg, print):
            changed.append('weekly')
    except Exception as ex:
        print(f'Weekly recap problem ({ex}).')
    print('Changed:', changed or 'nothing')
    return 0


def _git(*args):
    return subprocess.run(['git'] + list(args), cwd=ROOT, capture_output=True, text=True)


def wait_loop(minutes):
    """3.21 (Philip: "it posted at 8:40, it should be 7:00"): GitHub starts timed jobs late (often 30 to 60 minutes), so
    ONE job now stays awake for hours and looks every minute: every post goes out on its minute. The next job starts
    as soon as this one ends (one at a time, never two posting together)."""
    end = time.time() + minutes * 60
    _git('config', 'user.name', 'cloud-poster')
    _git('config', 'user.email', 'cloud-poster@users.noreply.github.com')
    loops = 0
    while True:
        _git('pull', '--rebase', '-X', 'theirs', '-q')
        os.environ['CLOUD_WINS'] = '1' if loops % 3 == 0 else '0'    # the scoreboards every 3 minutes
        try:
            main()
        except Exception as ex:
            print(f'Round problem: {ex}')
        if _git('status', '--porcelain', 'cloud').stdout.strip():
            _git('add', 'cloud')
            _git('commit', '-q', '-m', 'cloud: posted')
            for _i in range(5):
                if _git('push', '-q').returncode == 0:
                    break
                _git('pull', '--rebase', '-X', 'theirs', '-q')
                time.sleep(4)
        loops += 1
        if time.time() > end:
            break
        time.sleep(max(5, 60 - time.time() % 60))     # on the minute


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == '--wait':
        wait_loop(float(sys.argv[2]))
        sys.exit(0)
    sys.exit(main())
