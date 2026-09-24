import hashlib
import json
import statistics
from pathlib import Path

import numpy as np
from PIL import Image

root = Path('docs/evidence/loading-only')
metrics = json.loads((root / 'metrics.json').read_text())
assert len(metrics) == 24, len(metrics)
summary = []
for width in (390, 1440):
    for cache in ('cold', 'warm'):
        entry = {'width': width, 'cache': cache}
        for label in ('baseline', 'candidate'):
            rows = [r for r in metrics if r['width'] == width and r['cache'] == cache and r['label'] == label]
            assert len(rows) == 3
            model = [next(s['t'] for s in r['samples'] if s['model']) for r in rows]
            reveal = [max(s['duration'] for s in r['renders'] if s['visible']) for r in rows]
            entry[label] = {'model_ms': model, 'median_model_ms': statistics.median(model), 'max_reveal_ms': reveal, 'median_max_reveal_ms': statistics.median(reveal), 'false_ready_frames': [sum(s['ready'] and not s['model'] for s in r['samples']) for r in rows], 'asset_counts': [len(r['resources']) for r in rows], 'asset_start_spread_ms': [max(s['start'] for s in r['resources']) - min(s['start'] for s in r['resources']) for r in rows], 'transferred_bytes': [sum(s['transferred'] for s in r['resources']) for r in rows]}
            assert all(not r['errors'] for r in rows)
            assert entry[label]['asset_counts'] == [5, 5, 5]
            if label == 'candidate':
                assert entry[label]['false_ready_frames'] == [0, 0, 0]
        entry['median_model_delta_ms'] = entry['candidate']['median_model_ms'] - entry['baseline']['median_model_ms']
        entry['median_model_delta_percent'] = 100 * entry['median_model_delta_ms'] / entry['baseline']['median_model_ms']
        summary.append(entry)
(root / 'metrics-summary.json').write_text(json.dumps(summary, indent=2))
print(json.dumps(summary, indent=2))

states = json.loads((root / 'visual-states.json').read_text())
assert len(states) == 64, len(states)
visuals = []
for width in (390, 1440):
    for pref in ('reduce', 'no-preference'):
        for pose in (0, .18, .30, .45, .59, .72, .82, .96):
            key = f'{width}-{pref}-{pose:g}'
            pair = [next(r['state'] for r in states if r['width'] == width and r['preference'] == pref and r['pose'] == pose and r['label'] == label) for label in ('baseline', 'candidate')]
            a, b = [np.asarray(Image.open(root / 'visuals' / f'{key}-{label}.png').convert('RGB')).astype(np.int16) for label in ('baseline', 'candidate')]
            delta = np.abs(a - b)
            assert len(pair[0]['objects']) == len(pair[1]['objects'])
            max_matrix = max(abs(x - y) for p, q in zip(pair[0]['objects'], pair[1]['objects']) for x, y in zip(p['matrix'], q['matrix']))
            same_inventory = all((p['name'], p['type'], p['visible'], p.get('vertices')) == (q['name'], q['type'], q['visible'], q.get('vertices')) for p, q in zip(pair[0]['objects'], pair[1]['objects']))
            row = {'key': key, 'changed_pixels': int(np.any(delta, axis=2).sum()), 'pixel_count': int(a.shape[0] * a.shape[1]), 'max_channel_difference': int(delta.max()), 'mean_channel_difference': float(delta.mean()), 'max_object_matrix_difference': max_matrix, 'same_inventory': same_inventory, 'camera_max_difference': max(abs(x-y) for x,y in zip(pair[0]['camera'],pair[1]['camera'])), 'projection_max_difference': max(abs(x-y) for x,y in zip(pair[0]['projection'],pair[1]['projection']))}
            visuals.append(row)
            if row['changed_pixels']:
                Image.fromarray(np.clip(delta * 8, 0, 255).astype(np.uint8)).save(root / 'visuals' / f'{key}-diff.png')
(root / 'visual-summary.json').write_text(json.dumps(visuals, indent=2))
print(json.dumps(visuals, indent=2))
print('pairs', len(visuals), 'pixel_identical', sum(v['changed_pixels'] == 0 for v in visuals))
