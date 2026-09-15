// Self-check: WIB date derivation for filter boundaries (runs in Node ESM).
// Verdict: WIB 00:00-06:59 rows must map to the SAME WIB calendar date,
// and null/invalid timestamps must yield null (excluded when date filter active).
import assert from 'node:assert/strict'
import { wibDate } from '../src/utils/rowParser.js'

// UTC midnight edge: 2026-09-15T20:00:00Z = 2026-09-16 03:00 WIB (next WIB day)
assert.equal(wibDate('2026-09-15T20:00:00.000Z'), '2026-09-16')
// End of WIB day: 2026-09-15T16:59:59Z = 2026-09-15 23:59 WIB (same day)
assert.equal(wibDate('2026-09-15T16:59:59.999Z'), '2026-09-15')
// Early WIB morning keeps its WIB date even though UTC date rolled back
assert.equal(wibDate('2026-09-15T23:59:59.999Z'), '2026-09-16')
// Missing / placeholder / garbage → null (must NOT pass an active date filter)
assert.equal(wibDate(null), null)
assert.equal(wibDate('-'), null)
assert.equal(wibDate('not-a-date'), null)

console.log('verify-date-wib OK: WIB boundary + null-timestamp checks pass')