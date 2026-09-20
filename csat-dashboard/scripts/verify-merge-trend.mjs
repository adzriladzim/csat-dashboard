// Self-check: merge mode recovery must keep P1,P2,P5,P6 + collapse P3/P4 into "P3-P4".
// Run: node scripts/verify-merge-trend.mjs
import assert from 'node:assert/strict'
import { aggregateByDosen } from '../src/utils/analytics.js'

const mkRow = (pertemuan, csat) => ({
  namaDosen: 'Bu CN',
  pertemuan,
  pertemuanStart: pertemuan,
  pertemuanEnd: pertemuan,
  csatGabungan: csat,
})

const fullRows = [
  mkRow(1, 4.0), mkRow(2, 4.2), mkRow(3, 4.1), mkRow(4, 4.3), mkRow(5, 4.4), mkRow(6, 4.5),
]
const mergeConfig = { active: true, pairs: [{ a: 'P3', b: 'P4' }] }
// rows (merge-active call site) = hanya baris pasangan merge
const rows = fullRows.filter(r => r.pertemuan === 3 || r.pertemuan === 4)

const [merged] = aggregateByDosen(rows, fullRows, Infinity, mergeConfig)
const labels = merged.pertemuanTrend.map(t => t.pertemuan)
const p34 = merged.pertemuanTrend.find(t => t.pertemuan === 'P3-P4')

assert.deepEqual(labels, ['P1', 'P2', 'P3-P4', 'P5', 'P6'],
  `merge trend labels salah: ${JSON.stringify(labels)}`)
assert.ok(!labels.includes('P3'), 'P3 tidak boleh jadi titik terpisah')
assert.ok(!labels.includes('P4'), 'P4 tidak boleh jadi titik terpisah')
assert.ok(p34, 'P3-P4 harus ada')
assert.ok(Math.abs(p34.csat - 4.2) < 1e-9, `rata-rata P3+P4 salah: ${p34.csat}`) // (4.1+4.3)/2
assert.ok(p34.count >= 2, 'P3-P4 harus menggabungkan 2 baris')

// Regresi non-merge: tanpa mergeConfig, label asli harus utuh P1..P6
const [plain] = aggregateByDosen(fullRows, fullRows, Infinity, null)
assert.deepEqual(plain.pertemuanTrend.map(t => t.pertemuan), ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
  `non-merge trend berubah: ${JSON.stringify(plain.pertemuanTrend.map(t => t.pertemuan))}`)

console.log('OK — merge trend =', labels.join(', '), '| P3-P4 avg =', p34.csat)
console.log('OK — non-merge trend tetap P1..P6')