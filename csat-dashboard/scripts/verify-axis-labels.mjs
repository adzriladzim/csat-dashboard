// Self-check: phantom "P2" x-axis label must NOT appear for merged P1-P2 / P3-P4.
// Simulates the axis loop in src/utils/exportUtils.js.
// Run: node scripts/verify-axis-labels.mjs
import assert from 'node:assert/strict'
import { labelStart } from '../src/utils/analytics.js'

// ── members of src/utils/exportUtils.js (kept in sync manually) ────────────
const axisLabels = (pertemuanTrend) => {
  const slotLabelOf = {}
  pertemuanTrend.forEach(t => {
    const s = labelStart(t.pertemuan)
    if (s >= 1) slotLabelOf[s] = t.pertemuan
  })
  const coveredSlots = new Set()
  pertemuanTrend.forEach(t => {
    const nums = String(t.pertemuan).match(/\d+/g)
    if (nums && nums.length >= 2) {
      const start = +nums[0], end = +nums[1]
      for (let s = start + 1; s <= end; s++) coveredSlots.add(s)
    }
  })
  const timelineLen = Math.max(1, ...pertemuanTrend.map(t => labelStart(t.pertemuan)))
  const labels = []
  for (let i = 0; i < timelineLen; i++) {
    labels.push(slotLabelOf[i + 1] || (coveredSlots.has(i + 1) ? null : `P${i + 1}`))
  }
  return labels
}
// ───────────────────────────────────────────────────────────────────────────

// Kasus bug: 2 entri merge, slot 2 adalah interior "P1-P2"
const merged = axisLabels([
  { pertemuan: 'P1-P2', csat: 4.9 },
  { pertemuan: 'P3-P4', csat: 5 },
])
assert.deepEqual(merged, ['P1-P2', null, 'P3-P4'],
  `axis labels salah (phantom P2 muncul): ${JSON.stringify(merged)}`)
assert.ok(!merged.includes('P2'), 'P2 tidak boleh jadi label sumbu')

// Regresi single-mode: tanpa rentang gabungan → fallback P{i+1} tetap utuh
const single = axisLabels([
  { pertemuan: 'P1', csat: 4.9 },
  { pertemuan: 'P2', csat: 5 },
  { pertemuan: 'P3', csat: 5 },
])
assert.deepEqual(single, ['P1', 'P2', 'P3'],
  `single-mode axis labels berubah: ${JSON.stringify(single)}`)

// Rentang panjang: "P3-P6" menutup slot 4,5,6 — hanya slot start yang dilabeli
const wide = axisLabels([
  { pertemuan: 'P1', csat: 4.9 },
  { pertemuan: 'P3-P6', csat: 5 },
  { pertemuan: 'P7', csat: 5 },
])
assert.deepEqual(wide, ['P1', 'P2', 'P3-P6', null, null, null, 'P7'],
  `wide-range labels salah: ${JSON.stringify(wide)}`)

console.log(`OK — merged axis labels = ${JSON.stringify(merged)} (phantom P2 ditutup)`)
console.log('OK — single-mode axis labels tetap P1,P2,P3')
console.log(`OK — wide range P3-P6 = ${JSON.stringify(wide)}`)