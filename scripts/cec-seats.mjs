#!/usr/bin/env node
// המרת ספירה רשמית חלקית (ועדת הבחירות המרכזית) לחלוקת מנדטים זמנית —
// אותו מימוש בדר-עופר + הסכמי העודפים כמו במודל (src/mc.mjs).
// קלט: פלט scripts/cec-extract.js דרך stdin. פלט: data/cec.json + שורת סיכום.
// זהירות: זו המרה אריתמטית של ספירה חלקית בלבד — לא תוצאות סופיות ולא תחזית,
// ואינה כוללת מעטפות כפולות.
import { baderOfer, SURPLUS_PAIRS } from '../src/mc.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const LETTER2ID = {
  'מחל':'likud','שס':'shas','ג':'yahadut','ט':'tziyonut','ב':'otzma',
  'דרך':'yashar','רק':'beyahad','אמת':'democratim','ל':'beiteinu',
  'ודם':'meshutefet','עם':'raam','די':'miluim','ך':'winter','ני':'noam','זך':'haredi',
};
const HEB = {
  likud:'הליכוד', yashar:'ישר!', beyahad:'ביחד', democratim:'הדמוקרטים',
  meshutefet:'המשותפת', shas:'ש"ס', yahadut:'יהדות התורה',
  tziyonut:'הציונות הדתית-זהות', otzma:'עוצמה יהודית', beiteinu:'ישראל ביתנו',
  raam:'רע"ם', miluim:'המילואימניקים', winter:'עמך ישראל', noam:'נעם', haredi:'הציבור החרדי',
};
const BLOCMAP = {
  right:['likud','shas','yahadut','tziyonut','otzma','noam','winter'],
  center:['yashar','beyahad','democratim','beiteinu'],
  arab:['meshutefet','raam'],
};

const snap = JSON.parse(readFileSync(0, 'utf8'));
if (!snap || !Array.isArray(snap.rows) || !snap.rows.length || !snap.valid || !snap.as_of)
  throw new Error('bad CEC snapshot');
const votes = {}; let known = 0;
for (const r of snap.rows) {
  const id = LETTER2ID[r.letters];
  if (id) { votes[id] = (votes[id] || 0) + r.votes; known += r.votes; }
}
votes.others = Math.max(0, snap.valid - known); // רשימות זעירות — נכללות במכנה של אחוז החסימה
const seats = baderOfer(votes, SURPLUS_PAIRS);
const sum = Object.values(seats).reduce((a, b) => a + b, 0);
if (sum !== 120) throw new Error('seat sum ' + sum);
const blocs = { right: 0, center: 0, arab: 0, other: 0 };
for (const [p, n] of Object.entries(seats)) {
  const b = BLOCMAP.right.includes(p) ? 'right' : BLOCMAP.center.includes(p) ? 'center'
          : BLOCMAP.arab.includes(p) ? 'arab' : 'other';
  blocs[b] += n;
}
const thresh = 0.0325 * snap.valid;
const below = Object.entries(votes)
  .filter(([p, v]) => p !== 'others' && v < thresh && v / snap.valid >= 0.005)
  .sort((a, b) => b[1] - a[1])
  .map(([p, v]) => ({ id: p, name: HEB[p], pct: +(100 * v / snap.valid).toFixed(2) }));
const out = {
  as_of: snap.as_of,
  updated_at: new Date().toISOString(),
  source: 'ועדת הבחירות המרכזית — תוצאות ארציות (ספירה חלקית)',
  url: 'https://votes26.bechirot.gov.il/nationalresults?lang=he',
  ballots: snap.ballots, valid: snap.valid, eligible: snap.eligible,
  pct_of_eligible: +(100 * snap.valid / snap.eligible).toFixed(1),
  seats, blocs, below_threshold: below, heb: HEB,
};
writeFileSync(new URL('../data/cec.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log('as_of', out.as_of, '| valid', out.valid, '| blocs',
  `right ${blocs.right} center ${blocs.center} arab ${blocs.arab} other ${blocs.other}`,
  '| seats', JSON.stringify(seats));
