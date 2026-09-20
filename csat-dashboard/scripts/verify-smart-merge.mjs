// Self-check: smart pair validation — "Pa-Pb" merges only if BOTH sides present.
// Run: node scripts/verify-smart-merge.mjs
import assert from 'node:assert/strict'
import { aggregateByDosen, aggregateByDosenKelas, aggregateByDosenSesi, getExistingMeetingNums, pairHasBothSidesPresent, filterMergeConfigByData } from '../src/utils/analytics.js'

const mkRow = (pertemuan, csat, extra = {}) => ({
  namaDosen: 'Bu CN',
  pertemuan,
  pertemuanStart: pertemuan,
  pertemuanEnd: pertemuan,
  csatGabungan: csat,
  ...extra,
})

// helper unit: legacy rows without pertemuanStart/End (IndexedDB lama)
assert.deepEqual(getExistingMeetingNums([{ pertemuan: 5 }, { pertemuanLabel: 'P7-P8' }]), new Set([5, 7, 8]),
  'getExistingMeetingNums harus ambil pertemuan + pertemuanLabel legacy')
assert.equal(pairHasBothSidesPresent({ a: 'P5', b: 'P6' }, new Set([5])), false, 'satu sisi saja → false')
assert.equal(pairHasBothSidesPresent({ a: 'P5', b: 'P6' }, new Set([5, 6])), true, 'dua sisi → true')
assert.equal(pairHasBothSidesPresent({ a: 'P3-P5', b: 'P6' }, new Set([4, 6])), true, 'rentang a menutup 4')

// ── Case 1: hanya P5, pair P5-P6 → label ['P5'] (bukan 'P5-P6') ──────────────
{
  const rows = [mkRow(5, 4.5)]
  const [d] = aggregateByDosen(rows, rows, Infinity, { active: true, pairs: [{ a: 'P5', b: 'P6' }] })
  assert.deepEqual(d.pertemuanTrend.map(t => t.pertemuan), ['P5'], `Case1 salah: ${JSON.stringify(d.pertemuanTrend.map(t => t.pertemuan))}`)
}

// ── Case 2: P5 DAN P6 → label ['P5-P6'] ─────────────────────────────────────
{
  const rows = [mkRow(5, 4.4), mkRow(6, 4.6)]
  const [d] = aggregateByDosen(rows, rows, Infinity, { active: true, pairs: [{ a: 'P5', b: 'P6' }] })
  assert.deepEqual(d.pertemuanTrend.map(t => t.pertemuan), ['P5-P6'], `Case2 salah: ${JSON.stringify(d.pertemuanTrend.map(t => t.pertemuan))}`)
  assert.equal(d.pertemuanTrend[0].count, 2, 'P5-P6 harus gabung 2 baris')
}

// ── Case 3: P1..P5 + pairs {P1,P2},{P3,P4},{P5,P6} → ['P1-P2','P3-P4','P5'] ─
{
  const rows = [1, 2, 3, 4, 5].map(p => mkRow(p, 4.0 + p / 10))
  const [d] = aggregateByDosen(rows, rows, Infinity, {
    active: true, pairs: [{ a: 'P1', b: 'P2' }, { a: 'P3', b: 'P4' }, { a: 'P5', b: 'P6' }],
  })
  assert.deepEqual(d.pertemuanTrend.map(t => t.pertemuan), ['P1-P2', 'P3-P4', 'P5'],
    `Case3 salah: ${JSON.stringify(d.pertemuanTrend.map(t => t.pertemuan))}`)
}

// ── Case 4 per-kelas: kelas A P5+P6, kelas B P5 → A 'P5-P6', B 'P5' ─────────
{
  const rows = [
    mkRow(5, 4.4, { kodeKelas: 'A' }), mkRow(6, 4.6, { kodeKelas: 'A' }),
    mkRow(5, 4.0, { kodeKelas: 'B' }),
  ]
  const kel = aggregateByDosenKelas(rows, rows, Infinity, { active: true, pairs: [{ a: 'P5', b: 'P6' }] })
  const a = kel.find(x => x.kodeKelas === 'A')
  const b = kel.find(x => x.kodeKelas === 'B')
  assert.deepEqual(a.pertemuanTrend.map(t => t.pertemuan), ['P5-P6'], `Case4A salah: ${JSON.stringify(a.pertemuanTrend.map(t => t.pertemuan))}`)
  assert.deepEqual(b.pertemuanTrend.map(t => t.pertemuan), ['P5'], `Case4B salah: ${JSON.stringify(b.pertemuanTrend.map(t => t.pertemuan))}`)
}

// ── Case 5 regression: merge tidak aktif → semua single ─────────────────────
{
  const rows = [1, 2, 3].map(p => mkRow(p, 4.0))
  const [d] = aggregateByDosen(rows, rows, Infinity, null)
  assert.deepEqual(d.pertemuanTrend.map(t => t.pertemuan), ['P1', 'P2', 'P3'], `Case5 salah: ${JSON.stringify(d.pertemuanTrend.map(t => t.pertemuan))}`)
}

// ── Case 6 edge: rows kosong / pair degenerate ──────────────────────────────
{
  // mergeConfig aktif tapi rows kosong → pasangan terfilter, tidak crash
  const mc = filterMergeConfigByData({ active: true, pairs: [{ a: 'P5', b: 'P6' }] }, [])
  assert.deepEqual(mc.pairs, [], 'rows kosong → pairs []')
  assert.equal(mc.active, true, 'active dipertahankan')
  // pair sisi identik {a:'P5', b:'P5'} → degenerate, difilter
  const mc2 = filterMergeConfigByData({ active: true, pairs: [{ a: 'P5', b: 'P5' }] }, [{ pertemuan: 5 }])
  assert.deepEqual(mc2.pairs, [], 'pasangan sisi sama difilter')
  // mergeConfig null → dikembalikan apa adanya
  assert.equal(filterMergeConfigByData(null, [{ pertemuan: 5 }]), null, 'null tetap null')
}

// ── Case 7: aggregateByDosenSesi per-bucket juga valid ──────────────────────
{
  const rows = [
    mkRow(5, 4.4, { kodeKelas: 'A', tanggal: '2026-01-05' }),
    mkRow(5, 4.0, { kodeKelas: 'B', tanggal: '2026-01-05' }),
  ]
  const ses = aggregateByDosenSesi(rows, { active: true, pairs: [{ a: 'P5', b: 'P6' }] })
  assert.deepEqual(ses.map(s => s.pertemuanTrend.map(t => t.pertemuan)), [['P5'], ['P5']],
    `Case7 sesi salah: ${JSON.stringify(ses.map(s => s.pertemuanTrend.map(t => t.pertemuan)))}`)
}

console.log('OK — smart merge: case 1..7 semua lulus')