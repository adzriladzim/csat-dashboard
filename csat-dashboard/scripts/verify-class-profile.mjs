// Self-check: profil gabung kelas (classMergeProfiles) + auto-apply.
// Store dibundle via esbuild karena Node tak bisa resolve alias vite "@".
// Run: node scripts/verify-class-profile.mjs
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

const out = path.join(os.tmpdir(), `csat-store-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`)

// Node tanpa IndexedDB: pasang stub yang never-settles supaya persist fallback
// tidak menulis warning "IndexedDB …" lewat async write. Test tetap jalan di
// state in-memory; storage tidak pernah resolve (tak masalah utk assert ini).
globalThis.indexedDB = {
  open() {
    return { result: null, onupgradeneeded: null, onsuccess: null, onerror: null }
  },
}

try {
  await build({
    entryPoints: [path.resolve('src/lib/store.js')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    alias: { '@': path.resolve('src') },
    outfile: out,
    logLevel: 'silent',
  })
  const { default: useStore } = await import(pathToFileURL(out).href)
  const st = useStore

  // Reset state agar test deterministik.
  st.setState({
    classMergeProfiles: {},
    mergeMode: { active: false, pairs: [] },
    filters: { ...st.getState().filters, dosen: 'all', kelas: 'all', modeSesi: 'all' },
  })

  // ── 1. Round-trip saveClassMergeProfile → getClassMergeProfile ─────────────
  // Pasangan tidak lengkap (a/b kosong) dibuang saat simpan.
  st.getState().saveClassMergeProfile('Bu CN', 'K-01', [
    { a: 'P1', b: 'P2' },
    { a: 'P3', b: null },
    { a: null, b: 'P4' },
    { a: 'P5', b: 'P6' },
  ])
  const profile = st.getState().getClassMergeProfile('Bu CN', 'K-01')
  assert.ok(profile, 'profil harus tersimpan')
  assert.deepEqual(profile.pairs.map(p => `${p.a}-${p.b}`), ['P1-P2', 'P5-P6'],
    `hanya pasangan lengkap: ${JSON.stringify(profile.pairs)}`)
  assert.ok(!Number.isNaN(Date.parse(profile.savedAt)), 'savedAt harus ISO date')
  assert.equal(st.getState().getClassMergeProfile('Bu CN', 'K-02'), null, 'combo lain tidak bocor')

  // ── 2. applyClassMergeProfile menyalakan mergeMode + modeSesi='multi' ──────
  st.setState({ mergeMode: { active: false, pairs: [] }, filters: { ...st.getState().filters, modeSesi: 'single' } })
  st.getState().applyClassMergeProfile('Bu CN', 'K-01')
  let s = st.getState()
  assert.equal(s.mergeMode.active, true, 'mergeMode aktif setelah apply')
  assert.deepEqual(s.mergeMode.pairs.map(p => `${p.a}-${p.b}`), ['P1-P2', 'P5-P6'])
  assert.equal(s.filters.modeSesi, 'multi', 'modeSesi jadi multi')

  // apply tanpa profil → no-op (mergeMode tidak berubah).
  const before = JSON.parse(JSON.stringify(s.mergeMode))
  st.getState().applyClassMergeProfile('Bu CN', 'K-02')
  assert.deepEqual(st.getState().mergeMode, before, 'tanpa profil mergeMode tidak berubah')

  // ── 3. Hapus profil tidak throw, getter balik null ─────────────────────────
  assert.doesNotThrow(() => st.getState().removeClassMergeProfile('Bu CN', 'K-01'))
  assert.equal(st.getState().getClassMergeProfile('Bu CN', 'K-01'), null, 'getter null setelah hapus')
  assert.equal(st.getState().listClassMergeProfiles().length, 0, 'list kosong setelah hapus')
  assert.doesNotThrow(() => st.getState().removeClassMergeProfile('X', 'Y'), 'hapus combo tak dikenal aman')

  console.log('OK — round-trip save/get memfilter pasangan lengkap (P1-P2, P5-P6)')
  console.log('OK — applyClassMergeProfile menyalakan mergeMode + modeSesi=multi')
  console.log('OK — apply tanpa profil no-op, hapus profil tidak throw')
} finally {
  try { fs.unlinkSync(out) } catch { /* temp sudah hilang */ }
}