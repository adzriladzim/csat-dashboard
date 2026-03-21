import { create } from 'zustand'
import { parseRow } from '@/utils/rowParser'

const useStore = create((set, get) => ({
  parsedData:  [],
  isLoaded:    false,
  fileName:    '',
  rawCount:    0,
  mappingAccuracy: 0,
  removedCount: 0,
  version: '1.5.0 (Full Data Recovery)',

  parseAndDisplay: (rawRows, headers, fileName) => {
    const rawTotal = rawRows.length
    
    const removedRows = []
    let processed = rawRows
      .map(r => parseRow(r, headers))
      .filter((r, idx) => {
        const dName = (r.namaDosen || '').toLowerCase()
        const isHeader = dName.includes('nama dosen') || dName === 'dosen'
        if (isHeader || (r.csatGabungan === null)) {
          removedRows.push({ row: idx + 2, reason: isHeader ? 'Header' : 'Empty Scores' })
          return false
        }
        return true
      })
    
    if (removedRows.length > 0) {
      console.log(`[DATA] Filtered ${removedRows.length} junk/empty rows. Remaining: ${processed.length}`)
    }

    // 2. Transmit cleaned data to state (Cumulative Merge + Deduplication)
    const newParsed = processed.map(r => ({
      timestamp:        r.timestampResponse,
      tanggal:          r.tanggal,
      namaMahasiswa:    r.namaMahasiswa,
      nim:              r.nim,
      angkatan:         r.angkatan,
      semester:         r.semester,
      fakultas:         r.fakultas,
      prodi:            r.prodi,
      mataKuliah:       r.mataKuliah,
      kodeKelas:        r.kodeKelas,
      namaDosen:        r.namaDosen,
      pertemuan:        r.pertemuan,
      skorPemahaman:    r.skorPemahaman,
      skorInteraktif:   r.skorInteraktif,
      skorPerforma:     r.skorPerforma,
      csatGabungan:     r.csatGabungan,
      topikBelumPaham:  r.topikBelumPaham,
      feedbackDosen:    r.feedbackDosen,
      faktorPerforma:   r.faktorPerforma,
      faktorInteraktif: r.faktorInteraktif,
      moda:             r.moda,
      sesi:             r.sesi,
      semesterConflict: r.semesterConflict
    }))

    const currentData = get().parsedData
    // Simple deduplication - match Dosen, MK, Pertemuan, NIM/Name, and Score
    const combined = [...currentData]
    let dupCount = 0
    
    newParsed.forEach(nr => {
      const exists = currentData.some(cr => 
        cr.namaDosen === nr.namaDosen && 
        cr.mataKuliah === nr.mataKuliah && 
        cr.pertemuan === nr.pertemuan && 
        cr.nim === nr.nim && 
        cr.csatGabungan === nr.csatGabungan
      )
      if (!exists) combined.push(nr)
      else dupCount++
    })

    const finalCount = combined.length
    if (dupCount > 0) console.log(`[DATA] Ignored ${dupCount} duplicate rows.`)

    set({ 
      parsedData: combined, 
      isLoaded: true, 
      fileName: fileName === get().fileName ? fileName : (get().fileName ? 'Multiple Files' : fileName), 
      rawCount: finalCount,
      mappingAccuracy: 100,
      removedCount: 0
    })
    return finalCount
  },

  clearData: () => set({ parsedData: [], isLoaded: false, fileName: '' }),

  filters: {
    matkul: 'all', prodi: 'all', dosen: 'all',
    pertemuan: 'all', dateFrom: '', dateTo: '',
  },

  setFilter:    (key, value) => set(s => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: { matkul: 'all', prodi: 'all', dosen: 'all', pertemuan: 'all', dateFrom: '', dateTo: '' } }),

  getFiltered: () => {
    const { parsedData, filters } = get()
    return parsedData.filter(r => {
      if (filters.matkul    !== 'all' && r.mataKuliah !== filters.matkul) return false
      if (filters.prodi     !== 'all' && r.prodi     !== filters.prodi)    return false
      if (filters.dosen     !== 'all' && r.namaDosen !== filters.dosen)    return false
      if (filters.pertemuan !== 'all' && String(r.pertemuan) !== String(filters.pertemuan)) return false
      if (filters.dateFrom  && r.timestamp && new Date(r.timestamp) < new Date(filters.dateFrom)) return false
      if (filters.dateTo    && r.timestamp && new Date(r.timestamp) > new Date(filters.dateTo))   return false
      return true
    })
  },

  getDosenList: () => {
    const { parsedData, filters } = get()
    const subset = parsedData.filter(r => {
      if (filters.matkul !== 'all' && r.mataKuliah !== filters.matkul) return false
      if (filters.prodi !== 'all' && r.prodi !== filters.prodi) return false
      return true
    })
    return [...new Set(subset.map(r => r.namaDosen).filter(Boolean))].sort()
  },
  getProdiList: () => {
    const { parsedData, filters } = get()
    const subset = parsedData.filter(r => {
      if (filters.matkul !== 'all' && r.mataKuliah !== filters.matkul) return false
      if (filters.dosen !== 'all' && r.namaDosen !== filters.dosen) return false
      return true
    })
    return [...new Set(subset.map(r => r.prodi).filter(Boolean))].sort()
  },
  getMatkulList: () => {
    const { parsedData, filters } = get()
    const subset = parsedData.filter(r => {
      if (filters.dosen !== 'all' && r.namaDosen !== filters.dosen) return false
      if (filters.prodi !== 'all' && r.prodi !== filters.prodi) return false
      return true
    })
    return [...new Set(subset.map(r => r.mataKuliah).filter(Boolean))].sort()
  },
  getPertemuanList: () => {
    const { parsedData, filters } = get()
    const subset = parsedData.filter(r => {
      if (filters.matkul !== 'all' && r.mataKuliah !== filters.matkul) return false
      if (filters.dosen !== 'all' && r.namaDosen !== filters.dosen) return false
      if (filters.prodi !== 'all' && r.prodi !== filters.prodi) return false
      return true
    })
    return [...new Set(subset.map(r => r.pertemuan).filter(Boolean))].sort((a,b)=>a-b)
  },
}))

export default useStore
