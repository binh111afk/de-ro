// Gametes of a linked parent: parent haplotypes h1,h2 (e.g. 'AB','ab'), recombination f
function gam(h1, h2, f) {
  const r = {};
  const add = (k, v) => (r[k] = (r[k] || 0) + v);
  add(h1, (1 - f) / 2); add(h2, (1 - f) / 2);
  add(h1[0] + h2[1], f / 2); add(h2[0] + h1[1], f / 2);
  return r;
}
// offspring probability: pred(gameteFromMother, gameteFromFather)
function P(G1, G2, pred) { let s = 0; for (const a in G1) for (const b in G2) if (pred(a, b)) s += G1[a] * G2[b]; return s; }
const hasA = (a, b) => a[0] === 'A' || b[0] === 'A';   // at least one A
const hasB = (a, b) => a[1] === 'B' || b[1] === 'B';
const f = 0.2;
const out = {};
// TN4: AB/ab x AB/ab, P(AB/AB)
let G = gam('AB', 'ab', f);
out.TN4_ABAB = P(G, G, (a, b) => a === 'AB' && b === 'AB');
// TN10: AB/ab x ab/ab, P(A-B-)
out.TN10_AB = P(G, { ab: 1 }, (a, b) => hasA(a, b) && hasB(a, b));
// TLN8: AB/ab x Ab/aB (both f=0.2), P(A-B-)
let Gf = gam('AB', 'ab', f), Gm = gam('Ab', 'aB', f);
out.TLN8_AB = P(Gf, Gm, (a, b) => hasA(a, b) && hasB(a, b));
// DS2: Ab/aB x Ab/aB  phenotype probs
let Gx = gam('Ab', 'aB', f);
out.DS2_AB = P(Gx, Gx, (a, b) => hasA(a, b) && hasB(a, b));
out.DS2_Abb = P(Gx, Gx, (a, b) => hasA(a, b) && !hasB(a, b));
out.DS2_aaB = P(Gx, Gx, (a, b) => !hasA(a, b) && hasB(a, b));
out.DS2_aabb = P(Gx, Gx, (a, b) => !hasA(a, b) && !hasB(a, b));
// DS2 genotype count: distinct unordered pairs of gametes
out.DS2_gametes = Object.keys(Gx).length;
// DS8 9:6:1 check with 112,75,13 of 200
out.DS8_expect = [9 / 16 * 200, 6 / 16 * 200, 1 / 16 * 200];
// Aabb self => white fraction
out.DS8_Aabb_white = 0.25;
// TN12: AaBb x AaBb, red = A-B- (9/16), AABB =1/16
out.TN12 = (1 / 16) / (9 / 16);
// DS3: population 36,48,16 of 100
const pA = (2 * 36 + 48) / 200; out.DS3_pA = pA; out.DS3_selfAa = 48 / 2 / 100;
out.DS3_random_white = (1 - (1 - pA) ** 2) ** 0; out.DS3_white_random = (1 - pA) ** 2;
// DS5 selection
const q0 = 0.4; const q1 = q0 / (1 + q0); const q2 = q1 / (1 + q1);
out.DS5 = { q1, q2, AAsurv: 0.36 / 0.84, AAsurvRatio: 0.36 / 0.48 };
// DS6 logistic: y = x(1-x/1000)/2
const y = (x) => (x * (1 - x / 1000)) / 2;
out.DS6 = { y200: y(200), y500: y(500), y800: y(800), y1000: y(1000) };
// DS7: HW 1/10000
const qq = 0.01, pp = 0.99; const het = 2 * pp * qq; const carrierNormal = het / (1 - qq * qq);
out.DS7 = { het, carrierNormal, bothCarrierChildDiseased: carrierNormal ** 2 / 4, bothC_pct: carrierNormal ** 2 / 4 * 100 };
// TLN3
out.TLN3 = (2 * 0.8 * 0.2) / 0.96 * 100;
// TLN4
out.TLN4 = 3 / 4 * 1 / 4 * 3 / 4 * 100;
// TLN5
out.TLN5 = 200 * 1.2 ** 2;
// TLN6
out.TLN6 = 10000 * 0.12 * 0.08; out.TLN6_chim = 1200 * 0.08;
// TLN2
out.TLN2_a = (420 + 2 * 90) / 2000; out.TLN2_check = (490 + 420 / 2 + 90) / 1000; // p check
// TLN7
out.TLN7 = (10 + 1) / 2;
// TLN9 (X-linked; wife normal, mother carrier)
out.TLN9 = (1 / 2) * (1 / 2) * (1 / 2) * 100;
// TLN10
let qn = 0.2; for (let i = 0; i < 2; i++) qn = qn / (1 + qn); out.TLN10 = qn;
// TN11/DS wife/husband carriers: 2/3 each
out.TN11_son = (2 / 3) * (2 / 3) * (1 / 4) * (1 / 2);
// TN6: mother X^A X^a x father X^a Y: son diseased
out.TN6 = 1 / 2;
// TN9: AaBbDd self 1/8
out.TN9 = (1 / 2) ** 3;
// TN8 self F1 Aa
out.TN8 = 0.5 / 2;
// DS4 pedigree: son diseased, daughters carrier, any diseased child
out.DS4 = { sonDiseased: 1 / 4, carrierDaughters: 1 / 2, anyChildDiseased: 1 / 4 };
console.log(JSON.stringify(out, null, 1));
