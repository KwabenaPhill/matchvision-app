# -*- coding: utf-8 -*-
"""MATCH VISION - THE OUTSIDE WATCHDOG (runs on GitHub, never on the laptop).

Philip, 20 Nov 2026 (#1795176233072): "all bots stop ... nobody can subscribe to VIP while this happens ... a separate
monitoring service checks every bot and alerts my phone before customers notice."

The laptop bot writes cloud/alive.json every few minutes (mv_cloud.alive). GitHub runs this file every 10 minutes:
  - the file is older than DOWN minutes  -> ONE message to Philip: the bot is down since <time>.
  - it is fresh again after a down message -> ONE message: the bot is back.
Nothing else: it never posts on the channel and never touches a build. The token is the GitHub secret TG_TOKEN and
the chat is the secret TG_CHAT; neither is ever printed.
"""
import os
import json
import time
import base64
import datetime
import urllib.parse
import urllib.request

TOKEN = os.environ.get('TG_TOKEN', '').strip()
CHAT = os.environ.get('TG_CHAT', '').strip()
GH = os.environ.get('GH_TOKEN', '').strip()
REPO = os.environ.get('GITHUB_REPOSITORY', '').strip()
ROOT = os.environ.get('CLOUD_ROOT') or os.getcwd()
DOWN = int(os.environ.get('DOWN_MINUTES', '30'))
STATE = 'cloud/alive-state.json'


def tg(text):
    if not (TOKEN and CHAT):
        print('no TG_TOKEN or TG_CHAT: nothing sent')
        return False
    data = urllib.parse.urlencode({'chat_id': CHAT, 'text': text, 'parse_mode': 'HTML',
                                   'disable_web_page_preview': 'true'}).encode('utf-8')
    try:
        urllib.request.urlopen(urllib.request.Request('https://api.telegram.org/bot%s/sendMessage' % TOKEN, data=data),
                               timeout=30)
        return True
    except Exception as ex:
        print('telegram: %s' % type(ex).__name__)
        return False


def gh(method, path, body=None):
    req = urllib.request.Request('https://api.github.com' + path, method=method,
                                 data=json.dumps(body).encode('utf-8') if body else None,
                                 headers={'Authorization': 'Bearer %s' % GH, 'Accept': 'application/vnd.github+json',
                                          'User-Agent': 'mv-alive'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode('utf-8') or '{}')
    except Exception as ex:
        return getattr(ex, 'code', 0), {}


def read_state():
    code, j = gh('GET', '/repos/%s/contents/%s' % (REPO, STATE))
    if code == 200 and j.get('content'):
        try:
            return json.loads(base64.b64decode(j['content']).decode('utf-8')), j.get('sha')
        except Exception:
            return {}, j.get('sha')
    return {}, None


def write_state(st, sha):
    body = {'message': 'watchdog state', 'content': base64.b64encode(json.dumps(st).encode('utf-8')).decode('ascii')}
    if sha:
        body['sha'] = sha
    gh('PUT', '/repos/%s/contents/%s' % (REPO, STATE), body)


def main():
    path = os.path.join(ROOT, 'cloud', 'alive.json')
    try:
        with open(path, encoding='utf-8') as f:
            a = json.load(f)
        age = (time.time() - float(a.get('t') or 0)) / 60.0
        ver = str(a.get('v') or '')
        at = str(a.get('at') or '')
    except Exception as ex:
        print('no alive.json (%s): nothing to do yet' % type(ex).__name__)
        return
    st, sha = read_state()
    down = bool(st.get('down'))
    print('heartbeat %.1f min old, already told: %s' % (age, down))
    if age >= DOWN and not down:
        tg('❌ <b>MATCH VISION BOT IS DOWN</b>\n'
           '✅ Last sign of life: %s (%d minutes ago)\n'
           '⏳ The cloud keeps posting today\'s posts on time\n'
           '❌ Needs you: switch the laptop on, the bot starts by itself' % (at or '?', int(age)))
        st['down'] = time.time()
        st['since'] = at
        write_state(st, sha)
    elif age < DOWN and down:
        tg('✅ <b>MATCH VISION BOT IS BACK</b>\n'
           '✅ Running again%s\n'
           '✅ Nothing was posted twice: the bot checks the channel and the cloud first' % (' (%s)' % ver if ver else ''))
        st.pop('down', None)
        write_state(st, sha)


if __name__ == '__main__':
    main()
