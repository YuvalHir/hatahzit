#!/usr/bin/env python3
"""Builds static analysis pages: analysis-src/*.html fragments -> public/analysis/*.html"""
import os, re, html
SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, '..', 'public', 'analysis')
STAMP = open(os.path.join(SRC, 'STAMP.txt'), encoding='utf-8').read().strip()
PAGES = [
 ('index', 'סיכום', 'הניתוח: מה קרה בבחירות 26'),
 ('results', 'מה קרה', 'מה קרה: המספרים'),
 ('polls', 'הסקרים', 'למה הסקרים טעו (ומי לא)'),
 ('right', 'הימין', 'הליכוד, נתניהו וגוש הימין'),
 ('opposition', 'האופוזיציה', 'איזנקוט וגוש השינוי'),
 ('blocs', 'מעבר בין גושים', 'האם אפשר לשכנע לעבור גוש? מה אומר המחקר'),
 ('issues', 'הבטחות וגיוס', 'הבטחות בחירות וגיוס החרדים'),
 ('next', 'מה עכשיו', 'מה עכשיו: תרחישים, בחירות חוזרות, 61'),
 ('qa', 'שאלות ותשובות', 'כל השאלות, תשובה קצרה לכל אחת'),
 ('judgment', 'מי צודק', 'מה אנחנו מפספסים, מי צודק, ומה ישנה את דעתי'),
 ('sources', 'מקורות', 'רשימת מקורות וקישורים'),
]
TEMPLATE = '''<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} | התחזית</title>
<meta name="description" content="ניתוח מאוזן של מערכת הבחירות לכנסת ה-26, עם מקורות משני הצדדים. התוצאות אינן סופיות.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="wrap">
<header class="top"><a class="logo" href="/"><b>התחזית</b> · כנסת 26</a><span class="stamp">{stamp}</span></header>
<nav class="nav">{nav}</nav>
<div class="banner">הסקרים שלפני הבחירות פספסו את התוצאה ב-5 עד 7 מנדטים, ולכן אנחנו לא משתמשים בהם כראיה לתנועת מצביעים בין מפלגות וגושים או לפרופיל הבוחרים. נתוני סקרים מוצגים רק כ"מה נאמר לפני הבחירות", עם סימון. הראיות שלנו הן תוצאות בפועל (ספירה חלקית), אחוזי הצבעה וניתוחים של תוצאות לפי יישוב. תנועת מצביעים בפועל תתברר רק מסקר או מחקר אחרי הבחירות.<br>התוצאות עדיין אינן סופיות (נספרו כ-90% מהקולות; המעטפות הכפולות נספרות). כל מסקנה שתלויה בספירה הסופית מסומנת. {stampshort}</div>
<main>
<h1>{h1}</h1>
{body}
</main>
<div class="pager">{pager}</div>
<footer>
<p><b>איך לקרוא את הדף הזה:</b> כל נתון מסומן לפי סוגו: <span class="t off">רשמי</span> ועדת הבחירות או מקור ממשלתי, <span class="t med">תקשורת</span> דיווח של כלי תקשורת או מכון סקרים, <span class="t calc">חישוב שלנו</span> חישוב שמבוסס על נתונים פומביים ואפשר לבדוק אותו, <span class="t op">דעה</span> עמדה של פרשן או מחבר, <span class="t jud">הערכה שלנו</span> שיפוט שלנו, שאינו עובדה.</p>
<p>זה ניתוח עצמאי ולא סקר, לא תעמולה ולא ייעוץ. הוא נכתב כך שגם מי שמצביע לגוש הימין וגם מי שמצביע לגוש השינוי יוכלו לבדוק כל טענה במקור שלה. <a href="sources.html">רשימת המקורות המלאה</a>.</p>
</footer>
</div>
</body>
</html>
'''
def build():
    os.makedirs(OUT, exist_ok=True)
    stampshort = ''
    for i, (slug, label, h1) in enumerate(PAGES):
        frag = open(os.path.join(SRC, slug + '.html'), encoding='utf-8').read()
        nav = ''.join('<a href="%s"%s>%s</a>' % ('./' if s == 'index' else s + '.html', ' class="on"' if s == slug else '', l) for s, l, _ in PAGES)
        pager = ''
        if i > 0:
            ps = PAGES[i-1]; pager += '<a class="prev" href="%s">→ %s</a>' % ('./' if ps[0]=='index' else ps[0]+'.html', ps[1])
        if i < len(PAGES)-1:
            ns = PAGES[i+1]; pager += '<a class="next" href="%s.html">%s ←</a>' % (ns[0], ns[1])
        out = TEMPLATE.format(title=html.escape(h1), h1=html.escape(h1), nav=nav, body=frag, pager=pager, stamp=html.escape(STAMP), stampshort='')
        fn = 'index.html' if slug == 'index' else slug + '.html'
        open(os.path.join(OUT, fn), 'w', encoding='utf-8').write(out)
    print('built', len(PAGES), 'pages')
if __name__ == '__main__':
    build()
