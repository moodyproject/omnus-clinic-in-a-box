"""Read-only Node payload and protected-host release verification."""
import hashlib
import json
import sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[4]
MANIFEST = ROOT / 'build-evidence-manifest.sha256'
BASELINE = Path('/Users/moud/coding/.worktrees/omnus-clinic-loading-preserve-visuals/docs/evidence/loading-only/deployment/after-public-protected.json')
BEACON = b'<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/'


def fetch(host, path):
    request = Request(f'https://{host}/{path}', headers={'User-Agent': 'JarvisNodeRelease/1.0'})
    with urlopen(request, timeout=90) as response:
        if response.status != 200:
            raise RuntimeError(f'{host}/{path}: HTTP {response.status}')
        data = response.read()
    injected = False
    if path.endswith('.html') and BEACON in data:
        if data.count(BEACON) != 1:
            raise RuntimeError(f'{host}/{path}: unexpected beacon count')
        start = data.index(BEACON)
        end = data.find(b'</script>\n', start)
        if end < 0 or end + len(b'</script>\n') - start != 367:
            raise RuntimeError(f'{host}/{path}: unexpected beacon shape')
        data = data[:start] + data[end + len(b'</script>\n'):]
        injected = True
    return data, injected


def check(host, path, expected, size=None):
    data, injected = fetch(host, path)
    digest = hashlib.sha256(data).hexdigest()
    if digest != expected or (size is not None and len(data) != size):
        raise RuntimeError(f'{host}/{path}: payload mismatch expected {expected} got {digest} bytes {len(data)}')
    return {'host': host, 'path': path, 'bytes': len(data), 'sha256': digest, 'beacon_removed': injected, 'match': True}


def main():
    baseline = json.loads(BASELINE.read_text())
    if len(baseline) != 20 or not all(row['match'] for row in baseline):
        raise RuntimeError('incomplete protected baseline')
    protected = [check(row['host'], row['path'], row['sha256'], row['bytes']) for row in baseline]
    if sys.argv[1:] == ['protected-only']:
        print(f'PASS protected {len(protected)}/20 before activation')
        return
    if sys.argv[1:]:
        raise RuntimeError('usage: verify-public.py [protected-only]')
    rows = []
    for line in MANIFEST.read_text().splitlines():
        digest, path = line.split('  ./', 1)
        rows.append(check('node.omnuslabs.com', path, digest))
    if len(rows) != 27:
        raise RuntimeError('incomplete Node manifest')
    receipt = {'node': rows, 'protected': protected}
    destination = Path(__file__).with_name('public-readback.json')
    destination.write_text(json.dumps(receipt, indent=2) + '\n')
    print(f'PASS Node {len(rows)}/27 protected {len(protected)}/20; receipt {destination}')


if __name__ == '__main__':
    main()
