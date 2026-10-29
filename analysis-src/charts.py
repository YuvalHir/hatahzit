# Simple HTML/CSS charts (RTL-safe, no images). Each returns an HTML string.
import json, os, html
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
def esc(s): return html.escape(str(s))
def fig(title, body, src, tag):
    return ('<figure class="chart"><figcaption><b>%s</b> <span class="t %s">%s</span></figcaption>%s<p class="small">%s</p></figure>'
            % (esc(title), {'official':'off','media':'med','calc':'calc'}[tag], {'official':'רשמי','media':'תקשורת','calc':'חישוב שלנו'}[tag], body, src))
def pairs(rows, unit='%', maxv=None, a='2022', b='2026'):
    maxv = maxv or max(max(r[1], r[2]) for r in rows)
    out = '<div class="legend"><i class="k a"></i>%s <i class="k b"></i>%s</div>' % (a, b)
    for lab, v1, v2 in rows:
        out += ('<div class="row"><span class="lab">%s</span><span class="bars">'
                '<span class="bar a" style="width:%.1f%%"><em>%s%s</em></span>'
                '<span class="bar b" style="width:%.1f%%"><em>%s%s</em></span></span></div>'
                % (esc(lab), 100*v1/maxv, format(v1, ',') if isinstance(v1, int) else v1, unit, 100*v2/maxv, format(v2, ',') if isinstance(v2, int) else v2, unit))
    return out
def diverge(rows, unit='', scale=None):
    scale = scale or max(abs(r[1]) for r in rows)
    out = ''
    for lab, v, col in rows:
        w = 48*abs(v)/scale
        side = 'pos' if v >= 0 else 'neg'
        out += ('<div class="drow"><span class="lab">%s</span><span class="dz"><span class="dbar %s %s" style="width:%.1f%%"></span></span><span class="dv">%s%s</span></div>'
                % (esc(lab), side, col, w, ('+' if v > 0 else '') + format(v, ',').replace(',', ','), unit))
    return out
def single(rows, unit='', maxv=None, cls='b'):
    maxv = maxv or max(r[1] for r in rows)
    out = ''
    for lab, v in rows:
        out += ('<div class="row"><span class="lab">%s</span><span class="bars"><span class="bar %s" style="width:%.1f%%"><em>%s%s</em></span></span></div>'
                % (esc(lab), cls, 100*v/maxv, format(v, ',') if isinstance(v, int) else v, unit))
    return out
def clusters():
    c = json.load(open(os.path.join(D, 'agg_clusters.json')))
    rows_l, rows_y = [], []
    for k in sorted(c, key=int):
        d = c[k]; f = d['f26']; v = d['valid26']
        rows_l.append((k, round(100*f.get('likud', 0)/v, 1))); rows_y.append((k, round(100*f.get('yasher', 0)/v, 1)))
    out = '<div class="legend"><i class="k a"></i>ליכוד <i class="k b"></i>ישר! (איזנקוט)</div>'
    for (k, l), (_, y) in zip(rows_l, rows_y):
        out += ('<div class="row"><span class="lab">אשכול %s</span><span class="bars"><span class="bar a" style="width:%.1f%%"><em>%s%%</em></span><span class="bar b" style="width:%.1f%%"><em>%s%%</em></span></span></div>'
                % (k, 100*l/40, l, 100*y/40, y))
    return out
CHARTS = {}
def make():
    CHARTS['seats'] = fig('מנדטים לפי גוש: 2022 מול 2026 (ביניים)',
        pairs([('גוש נתניהו', 64, 53), ('אופוזיציה יהודית', 46, 48), ('מפלגות ערביות', 10, 19)], '', 70),
        'מנדטים 2022: תוצאות סופיות של ועדת הבחירות. 2026: חלוקה זמנית לפי הספירה החלקית (טבלה חיה בעמוד "מה קרה"); הסכם עודפים יכול להזיז מנדט.', 'media')
    CHARTS['turnout'] = fig('אחוז הצבעה לפי מגזר (יישובים, בלי מעטפות כפולות)',
        pairs([('ערבי', 54.6, 80.5), ('ערים מעורבות', 59.7, 68.9), ('ערים יהודיות', 63.8, 69.2), ('קיבוצים', 69.9, 74.2), ('מושבים', 74.9, 79.2), ('קהילתיים', 73.7, 77.8), ('התנחלויות', 72.5, 76.4), ('חרדי (13 יישובים)', 79.2, 80.4)], '%', 100),
        'מקור: קובצי ועדת הבחירות לפי יישוב (תמונת מצב 28.10.2026 14:23, כ-91-93% מהקולות) מול 2022. סיווג המגזרים והחישוב: חישוב שלנו (דוח היישובים). חלוקה לפי כללים שקופים, לא הגדרה רשמית.', 'calc')
    CHARTS['bloc_votes'] = fig('שינוי בקולות מוחלטים בין 2022 ל-2026, רשימות גוש נתניהו',
        diverge([('ליכוד', 70994, 'r'), ('ש"ס', -85086, 'r'), ('יהדות התורה', 30448, 'r'), ('הציונות הדתית + עוצמה (2022: רשימה משותפת)', 87911, 'r')], '', 90000),
        'קלפיות רגילות בלבד (כ-93% עד 95% מהקולות), כשרים 4,306,028 ב-2022 ו-5,217,086 ב-2026. חישוב שלנו על קובצי ועדת הבחירות. סך הגוש: 2,077,670 ל-2,181,937 (+104,267), והארבע השורות מסתכמות בדיוק בזה.', 'calc')
    CHARTS['decomp'] = fig('מה מסביר את השינוי בקולות: גודל ההצבעה מול שינוי בנתח',
        single([('קולות ערביים: סה"כ שינוי', 311464), ('מזה: גידול בהיקף ההצבעה', 273312), ('מזה: שינוי בנתח', 38152)], '', 340000, 'a')
        + single([('גוש נתניהו: סה"כ שינוי', 76037), ('מזה: גידול בהיקף ההצבעה', 335786)], '', 340000, 'b')
        + '<p class="small">שינוי בנתח בגוש נתניהו: מינוס 259,749 (מוצג בטקסט, לא בגרף).</p>',
        'חישוב שלנו על קובצי ועדת הבחירות (בסיס של כ-91% מהקולות; הגדרת "גוש נתניהו" כוללת גם רשימות ימין קטנות, ולכן ההפרש מול +104k שבגרף הקודם). הפירוק לא מזהה מצביעים, רק מפרק מספרים.', 'calc')
    CHARTS['locality_type'] = fig('ליכוד: קולות 2022 מול 2026, לפי סוג יישוב (יישובים תואמים)',
        pairs([('עיירות פיתוח (16)', 123219, 143541), ('ערי מרכז (10)', 269650, 270998), ('ירושלים', 50582, 50298), ('התנחלויות (13)', 19195, 19785), ('ערים חרדיות (6)', 12325, 14609)], '', 290000),
        'קולות מוחלטים, קלפיות רגילות. חישוב שלנו על קובצי ועדת הבחירות. מספרי היישובים בסוגריים הם מדגם שנבחר לבדיקה, לא כל הארץ.', 'calc')
    CHARTS['shas'] = fig('ש"ס: קולות 2022 מול 2026, לפי סוג יישוב',
        pairs([('עיירות פיתוח (16)', 47747, 35727), ('ערי מרכז (10)', 61568, 43425), ('ירושלים', 48470, 41731), ('ערים חרדיות (6)', 62630, 57353)], '', 70000),
        'קולות מוחלטים, קלפיות רגילות. חישוב שלנו. ש"ס ירדה בכל סוג יישוב שנבדק, גם כשההצבעה עלתה.', 'calc')
    CHARTS['clusters'] = fig('ליכוד וישר! לפי אשכול חברתי-כלכלי של הלמ"ס (1 = נמוך, 10 = גבוה), אחוז מהכשרים 2026',
        clusters(),
        'חישוב שלנו: קובצי ועדת הבחירות לפי יישוב משויכים לאשכול הלמ"ס 2021. אשכול 10 הוא שלושה יישובים בלבד. ישר! היא רשימה חדשה ולכן אין לה בסיס ל-2022.', 'calc')
    CHARTS['arab_series'] = fig('סך הקולות למפלגות הערביות, 2013 עד 2026',
        single([('2013', 348919), ('2015', 446583), ('אפריל 2019', 337108), ('ספטמבר 2019', 470211), ('2020', 581507), ('2021', 379647), ('2022', 511399), ('2026 (ביניים)', 729855)], '', 740000),
        'מקור: סדרה לפי דיווחי ערוץ 14 על נתוני הוועדה (שיקוף, לא נפתח קובץ ועדה ישיר). מבנה הרשימות משתנה בין השנים (איחוד ופיצול), ולכן הסדרה אינה "אותה מפלגה".', 'media')
    CHARTS['polls'] = fig('הליכוד: מנדטים בסקרים האחרונים מול הספירה החלקית',
        single([('כאן 11', 20), ('מעריב / לזר', 19), ('חדשות 13', 19), ('חדשות 12', 21), ('דיירקט פולס', 26), ('ערוץ 14 / נקסט דאטה', 30)], '', 32, 'a') + single([('תוצאה (ביניים)', 27)], '', 32, 'b'),
        'סקרים: דיווחי התקשורת על הסקר האחרון של כל גוף. תוצאה: הספירה החלקית. פרק זה הוא היחיד באתר שמשתמש במספרי סקרים.', 'media')
