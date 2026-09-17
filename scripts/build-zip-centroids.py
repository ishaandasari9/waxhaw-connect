"""Rebuilds src/zipCentroids.js. Requires: pip install zipcodes"""
import math
from pathlib import Path

import zipcodes

RADIUS_MILES = 45
center_record = zipcodes.matching('28173')[0]
center = (float(center_record['lat']), float(center_record['long']))


def miles(a, b):
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 3958.8 * math.asin(math.sqrt(h))


rows = []
for z in zipcodes.list_all():
    if z['state'] not in ('NC', 'SC') or not z['lat'] or not z['active'] or z['zip_code_type'] != 'STANDARD':
        continue
    point = (float(z['lat']), float(z['long']))
    if miles(center, point) <= RADIUS_MILES:
        rows.append((z['zip_code'], round(point[0], 4), round(point[1], 4), z['city'], z['state']))
rows.sort()

target = Path(__file__).resolve().parent.parent / 'src' / 'zipCentroids.js'
header, _, _ = target.read_text().partition('export const ZIP_CENTROIDS')
body = ',\n'.join(f"  '{r[0]}': [{r[1]}, {r[2]}, '{r[3]}, {r[4]}']" for r in rows)
target.write_text(f"{header}export const ZIP_CENTROIDS = {{\n{body},\n}}\n")
print(f'Wrote {len(rows)} ZIP codes to {target}')
