#!/usr/bin/env python3
"""Post-process an open-count-model page export for hatahzit deploy.
Usage: python3 scripts/model-postprocess.py DIR  (DIR contains index.html + style.css)
Re-applies what the export drops: Heebo font links, mobile table stacking (data-labels + CSS)."""
import re, sys, pathlib

d = pathlib.Path(sys.argv[1])
hp = d / 'index.html'
cp = d / 'style.css'
h = hp.read_text(encoding='utf-8')
c = cp.read_text(encoding='utf-8')

HEEBO = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">')
if 'family=Heebo' not in h:
    h = h.replace('<link rel="stylesheet" href="style.css">', HEEBO + '<link rel="stylesheet" href="style.css">', 1)

def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s).strip()

def fix_table(m):
    t = m.group(0)
    rows = re.findall(r'<tr>.*?</tr>', t, re.S)
    if not rows:
        return t
    headers = [strip_tags(x) for x in re.findall(r'<th[^>]*>(.*?)</th>', rows[0], re.S)]
    if not headers:
        return t
    parts, last, ri = [], 0, 0
    for rm in re.finditer(r'<tr>.*?</tr>', t, re.S):
        parts.append(t[last:rm.start()])
        row = rm.group(0)
        if ri > 0:
            out, l2 = [], 0
            for i, cm in enumerate(re.finditer(r'<td([^>]*)>', row)):
                attrs = cm.group(1)
                lab = (headers[i] if i < len(headers) else '').replace('"', '&quot;')
                out.append(row[l2:cm.start()])
                out.append('<td%s data-label="%s">' % (attrs, lab) if 'data-label' not in attrs else cm.group(0))
                l2 = cm.end()
            out.append(row[l2:])
            row = ''.join(out)
        parts.append(row)
        last = rm.end()
        ri += 1
    parts.append(t[last:])
    return ''.join(parts)

if 'data-label' not in h:
    h = re.sub(r'<table.*?</table>', fix_table, h, flags=re.S)

MOBILE_CSS = '''
/* mobile: stack table rows as cards, no sideways scroll */
@media(max-width:600px){
  table{display:block;overflow-x:visible;font-size:15px}
  table tbody,table thead{display:block}
  table tr{display:block;margin:0 0 14px;border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:rgba(255,255,255,.02)}
  table tr:first-child{display:none}
  table td{display:block;border:none;padding:3px 0;text-align:right;white-space:normal}
  table td::before{content:attr(data-label);display:block;font-size:12.5px;color:var(--dim);font-weight:600;margin-bottom:1px}
  table td.n{text-align:right;direction:rtl}
  .tw{overflow-x:visible}
  details.more>table{width:auto}
  .ex-tab th,.ex-tab td{padding:3px 0;border:none}
  .ex-tab tr{border:1px solid #1f2a48;border-radius:10px;padding:10px 12px;margin:0 0 14px}
  .ex-tab tr:first-child{display:none}
  .ex-tab td{display:block;text-align:right}
  .ex-tab td::before{content:attr(data-label);display:block;font-size:12.5px;color:var(--dim);font-weight:600;margin-bottom:1px}
}
.ctl select{width:100%;max-width:100%;min-width:0}
.hm-ctl label,.hm-ctl select{min-width:0}
.hm-ctl select{width:100%}
'''
if 'stack table rows as cards' not in c:
    c = c.rstrip() + '\n' + MOBILE_CSS
# ensure existing ctl select rule has min-width even if mobile css already present
if '.ctl select{width:100%;max-width:100%}' in c:
    c = c.replace('.ctl select{width:100%;max-width:100%}', '.ctl select{width:100%;max-width:100%;min-width:0}')

hp.write_text(h, encoding='utf-8')
cp.write_text(c, encoding='utf-8')
print('heebo:', 'family=Heebo' in h, '| data-labels:', h.count('data-label'), '| mobile css:', 'stack table rows as cards' in c)
