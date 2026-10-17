# -*- coding: utf-8 -*-
"""CLOUD POSTER (Sure Stake 707 and Match Vision) - runs on GitHub, not on the laptop.

Every 10 minutes in the morning GitHub runs this file (.github/workflows/post.yml runs .github/cloud_post.py). It reads cloud/<today>.json,
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
            try:
                post(it)
                it['posted'] = 'cloud'
                it['posted_at'] = now.isoformat(timespec='minutes')
                print(f'{name} {it["id"]}: POSTED by the cloud.')
            except Exception as ex:
                print(f'{name} {it["id"]}: could not post ({ex}). Next run tries again.')
            dirty = True
        if dirty:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(day, f, ensure_ascii=False, indent=1, sort_keys=True)
            changed.append(path)
    print('Changed:', changed or 'nothing')
    return 0


if __name__ == '__main__':
    sys.exit(main())
