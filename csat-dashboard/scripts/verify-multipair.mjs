// Self-check: mode gabung multi-pasangan. Pasangan P1+P2 & P5+P6 digabung,
// P3 dan P4 tetap tampil individual. Run: node scripts/verify-multipair.mjs
import assert from 'node:assert/strict'
import { aggregateByDosen, rowInMerge, mergedLabelFor, completePairs } from '../src/utils/analytics.js'

const mkRow = (pertemuan, csat) => ({
  namaDosen: 'Bu CN',
  pertemuan,
  pertemuanStart: pertemuan,
  pertemuanEnd: pertemuan,
  pertemuanLabel: `P${pertemuan}`,
  csatGabungan: csat,
})

// P1(4.0,4.2) digabung dg P2(3.0); P5(4.5) dg P6(3.5); P3 & P4 tidak dipasang.
const rows = [
  mkRow(1, 4.0), mkRow(1, 4.2), mkRow(2, 3.0),
  mkRow(3, 5.0), mkRow(3, 4.8), mkRow(4, 2.0),
  mkRow(5, 4.5), mkRow(6, 3.5),
]
const mergeConfig = { active: true, pairs: [{ a: 'P1', b: 'P2' }, { a: 'P5', b: 'P6' }] }

// ── Primitif ────────────────────────────────────────────────────────────────
assert.deepEqual(completePairs(mergeConfig).map(p => `${p.a}-${p.b}`), ['P1-P2', 'P5-P6'])
assert.deepEqual(completePairs({ active: true, pairs: [{ a: 'P1', b: null }, { a: 'P3', b: 'P4' }] }).length, 1,
  'placeholder pair tidak dihitung')
assert.deepEqual(completePairs({ active: true, meeting1: 'P3', meeting2: 'P4' }), [],
  'bentuk lama tanpa pairs → tanpa pasangan lengkap')

assert.equal(rowInMerge(mkRow(1, 4.0), mergeConfig), true, 'P1 masuk pasangan 1')
assert.equal(rowInMerge(mkRow(2, 3.0), mergeConfig), true, 'P2 masuk pasangan 1')
assert.equal(rowInMerge(mkRow(3, 5.0), mergeConfig), false, 'P3 tidak dipasang')
assert.equal(rowInMerge(mkRow(4, 2.0), mergeConfig), false, 'P4 tidak dipasang')
assert.equal(rowInMerge(mkRow(5, 4.5), mergeConfig), true, 'P5 masuk pasangan 2')
assert.equal(rowInMerge(mkRow(6, 3.5), mergeConfig), true, 'P6 masuk pasangan 2')

assert.equal(mergedLabelFor(mkRow(1, 4.0), mergeConfig), 'P1-P2')
assert.equal(mergedLabelFor(mkRow(2, 3.0), mergeConfig), 'P1-P2')
assert.equal(mergedLabelFor(mkRow(3, 5.0), mergeConfig), null, 'P3 tanpa label gabung')
assert.equal(mergedLabelFor(mkRow(4, 2.0), mergeConfig), null, 'P4 tanpa label gabung')
assert.equal(mergedLabelFor(mkRow(5, 4.5), mergeConfig), 'P5-P6')
assert.equal(mergedLabelFor(mkRow(6, 3.5), mergeConfig), 'P5-P6')

// ── Agregasi: dua pasangan hidup berdampingan, yang lain individual ─────────
const [merged] = aggregateByDosen(rows, rows, Infinity, mergeConfig)
const labels = merged.pertemuanTrend.map(t => t.pertemuan)
assert.deepEqual(labels, ['P1-P2', 'P3', 'P4', 'P5-P6'],
  `trend labels salah: ${JSON.stringify(labels)}`)

const p12 = merged.pertemuanTrend.find(t => t.pertemuan === 'P1-P2')
const p3  = merged.pertemuanTrend.find(t => t.pertemuan === 'P3')
const p4  = merged.pertemuanTrend.find(t => t.pertemuan === 'P4')
const p56 = merged.pertemuanTrend.find(t => t.pertemuan === 'P5-P6')

assert.equal(p12.count, 3, 'P1-P2 harus 3 baris')
assert.ok(Math.abs(p12.csat - (4.0 + 4.2 + 3.0) / 3) < 1e-9, `avg P1-P2 salah: ${p12.csat}`)
assert.equal(p3.count, 2, 'P3 harus 2 baris (individual)')
assert.ok(Math.abs(p3.csat - (5.0 + 4.8) / 2) < 1e-9, `avg P3 salah: ${p3.csat}`)
assert.equal(p4.count, 1, 'P4 harus 1 baris (individual)')
assert.ok(Math.abs(p4.csat - 2.0) < 1e-9, `avg P4 salah: ${p4.csat}`)
assert.equal(p56.count, 2, 'P5-P6 harus 2 baris')
assert.ok(Math.abs(p56.csat - (4.5 + 3.5) / 2) < 1e-9, `avg P5-P6 salah: ${p56.csat}`)

// ── Regresi non-merge: tanpa mergeConfig, P1..P6 utuh ──────────────────────
const [plain] = aggregateByDosen(rows, rows, Infinity, null)
assert.deepEqual(plain.pertemuanTrend.map(t => t.pertemuan), ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
  `non-merge trend berubah: ${JSON.stringify(plain.pertemuanTrend.map(t => t.pertemuan))}`)

console.log('OK — trend multi-pasangan =', labels.join(', '))
console.log('OK — P1-P2 avg =', p12.csat, '| P3 avg =', p3.csat, '| P4 avg =', p4.csat, '| P5-P6 avg =', p56.csat)
console.log('OK — non-merge trend tetap P1..P6')