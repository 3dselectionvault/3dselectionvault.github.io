"""Regenerate the vault's attribute-review sheet.
Usage: python3 make_review.py <repo> <previous.xlsx> <out.xlsx>
Techniques missing from the previous sheet get pink names. Corrections and comments
already typed into the previous sheet are carried over by (id, attribute)."""
import json, glob, sys, os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

repo, prev, out = sys.argv[1:4]
schema = json.load(open(f'{repo}/schema/attributes.json'))
attrs = schema['attributes'] if isinstance(schema, dict) else schema
version = schema.get('version', '1.0') if isinstance(schema, dict) else '1.0'
pubs = {}
for f in glob.glob(f'{repo}/data/publications/*.json'):
    p = json.load(open(f)); pubs[p['id']] = p
techs = [json.load(open(f)) for f in glob.glob(f'{repo}/data/techniques/*.json')]
techs.sort(key=lambda t: t['name'].lower())

wb = openpyxl.load_workbook(prev)
old = wb['Review']
old_ids, kept = set(), {}
for r in range(8, old.max_row + 1):
    tid, attr = old.cell(r, 8).value, old.cell(r, 3).value
    if tid: old_ids.add(tid)
    f, g = old.cell(r, 6).value, old.cell(r, 7).value
    if tid and (f or g): kept[(tid, attr)] = (f, g)
idx = wb.sheetnames.index('Review')
wb.remove(old)
ws = wb.create_sheet('Review', idx)
wb.active = idx

def authors(p):
    a = p.get('authors') or []
    if not a: return 'Unknown authors'
    if len(a) == 1: return a[0]
    if len(a) == 2: return f'{a[0]} and {a[1]}'
    return f'{a[0]} et al.'
def paper(t):
    links = [l for l in t['publications'] if l['role'] == 'introduced'] or t['publications']
    p = pubs.get(links[0]['publication']) if links else None
    if not p: return ''
    pre = ' [preprint]' if p.get('type') == 'preprint' else ''
    return f"{authors(p)} ({p.get('year') or 'n.d.'}). {p['title']}{pre}"

thin = Side(style='thin', color='D9D9D9')
B = Border(bottom=thin)
top = Alignment(wrap_text=True, vertical='top')
yellow, input_fill = PatternFill('solid', fgColor='FFF2CC'), PatternFill('solid', fgColor='EAF4F2')
pink, head = PatternFill('solid', fgColor='F4E1E2'), PatternFill('solid', fgColor='1F5E57')
grey = Font(size=10, color='BFBFBF')

rows = []
for t in techs:
    unc = set(t.get('review', {}).get('uncertain', []))
    rows.append((t, 'Year', str(t['year']) if t.get('year') is not None else 'unknown', False))
    for a in attrs:
        labels = {v['id']: v['label'] for v in a['values']}
        vals = t['attributes'].get(a['id']) or []
        rows.append((t, a['label'], ', '.join(labels.get(v, v) for v in vals) if vals else '(not coded)', a['id'] in unc or not vals))
last = 7 + len(rows)
new = [t for t in techs if t['id'] not in old_ids]

ws['A1'] = f'3D Selection Vault: attribute review (scheme {version})'; ws['A1'].font = Font(size=13, bold=True)
ws['A2'] = ('Check each value against the paper. If it is wrong, type the right value(s) in "Correction" (separate several with commas, '
            'use the names on the "Allowed values" sheet). Leave "Correction" empty if the value is right. Yellow rows are best guesses that most need checking.')
ws.merge_cells('A2:G2'); ws['A2'].alignment = top; ws['A2'].font = Font(size=10); ws.row_dimensions[2].height = 42
ws['A3'] = 'Best guesses to check:'; ws['B3'] = f'=COUNTIF(E8:E{last},"yes")'
ws['A4'] = 'Corrections so far:'; ws['B4'] = f'=COUNTA(F8:F{last})'
for c in ('A3', 'B3', 'A4', 'B4'): ws[c].font = Font(size=10, bold=True)
ws['A5'] = f'New in this version (pink names): {len(new)} technique{"" if len(new) == 1 else "s"} added since the last sheet. Papers marked [preprint] are not peer reviewed yet.'
ws['A5'].font = Font(size=10, italic=True)
for i, h in enumerate(['Technique', 'Paper', 'Attribute', 'Current value', 'Best guess?', 'Correction', 'Comment', 'id (do not edit)'], 1):
    c = ws.cell(7, i, h); c.font = Font(size=10, bold=True, color='FFFFFF'); c.fill = head; c.alignment = top
r, prev_id = 8, None
for t, attr, val, guess in rows:
    first = t['id'] != prev_id; prev_id = t['id']
    f, g = kept.get((t['id'], attr), (None, None))
    vals = [t['name'], paper(t) if first else None, attr, val, 'yes' if guess else None, f, g]
    for i, v in enumerate(vals, 1):
        c = ws.cell(r, i, v); c.alignment = top; c.border = B; c.font = Font(size=10)
        if i in (6, 7): c.fill = input_fill
        if guess and i in (3, 4, 5): c.fill = yellow
    a = ws.cell(r, 1)
    if first:
        a.font = Font(size=10, bold=True)
        if t['id'] not in old_ids: a.fill = pink
    else: a.font = grey
    h = ws.cell(r, 8, t['id']); h.font = Font(size=8, color='A6A6A6')
    r += 1
for col, w in zip('ABCDEFGH', [24, 34, 22, 30, 11, 30, 34, 18]): ws.column_dimensions[col].width = w
ws.freeze_panes = 'A8'; ws.auto_filter.ref = f'A7:H{last}'
wb.save(out)
print(f'{len(techs)} techniques, {len(rows)} rows, new: {[t["name"] for t in new]}, carried over {len(kept)} corrections')
