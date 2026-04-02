import { create } from 'zustand'
import { parseRow } from '@/utils/rowParser'

// Unified ID Logic for stable matching
const generateID = (r) => {
  const fb = (r.feedbackDosen || '').slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')
  const sc = `${r.skorPemahaman || 0}${r.skorInteraktif || 0}${r.skorPerforma || 0}`
  const base = `${r.nim || 'N'}-${r.namaDosen || 'D'}-${r.mataKuliah || 'M'}-${r.pertemuan || 0}-${r.timestamp || '0'}-${sc}-${fb}`
  return base.slice(0, 150)
}

const useStore = create((set, get) => ({
  parsedData:  [],
  mappingIssues: [], 
  isLoaded:    false,
  fileName:    '',
  rawCount:    0,
  mappingAccuracy: 0,
  removedCount: 0,
  lastUpdated: null,
  version:     '1.1.0',

  parseAndDisplay: (rawRows, headers, fileName) => {
    const issues = []
    
    const processed = rawRows
      .map((r, idx) => {
        const parsed = parseRow(r, headers)
        const rowNum = idx + 2
        const reasons = []
        if (!parsed.namaDosen) reasons.push('Dosen Kosong')
        if (!parsed.mataKuliah) reasons.push('Mata Kuliah Kosong')
        if (!parsed.prodi) reasons.push('Prodi Kosong')
        if (parsed.csatGabungan === null) reasons.push('Skor Tidak Valid')

        if (reasons.length > 0) {
          issues.push({
            row: rowNum,
            alasan: reasons.join(', '),
            timestamp: parsed.timestampResponse || '-',
            dosenRaw: (r['Nama Dosen'] || r['Dosen'] || '-').toString().trim(),
            mkRaw: (r['Mata Kuliah'] || r['Matakuliah'] || r['MK'] || '-').toString().trim(),
            fakultas: parsed.fakultas || '-',
            prodi: parsed.prodi || '-',
            isDosenEmpty: !parsed.namaDosen,
            isMKEmpty: !parsed.mataKuliah
          })
        }

        return { 
          ...parsed, 
          _rowNum: rowNum,
          _isJunk: (parsed.namaDosen?.toLowerCase().includes('nama dosen')) || 
                   (parsed.csatGabungan === null && !parsed.feedbackDosen && !parsed.topikBelumPaham)
        }
      })
      .filter(p => !p._isJunk)

    const newParsed = processed.map(r => {
      const { _rowNum, _isJunk, ...clean } = r
      return {
        timestamp:        clean.timestampResponse,
        tanggal:          clean.tanggal,
        namaMahasiswa:    clean.namaMahasiswa,
        nim:              clean.nim,
        angkatan:         clean.angkatan,
        semester:         clean.semester,
        fakultas:         clean.fakultas,
        prodi:            clean.prodi,
        mataKuliah:       clean.mataKuliah,
        kodeKelas:        clean.kodeKelas,
        namaDosen:        clean.namaDosen,
        pertemuan:        clean.pertemuan,
        skorPemahaman:    clean.skorPemahaman,
        skorInteraktif:   clean.skorInteraktif,
        skorPerforma:     clean.skorPerforma,
        csatGabungan:     clean.csatGabungan,
        topikBelumPaham:  clean.topikBelumPaham,
        feedbackDosen:    clean.feedbackDosen,
        faktorPerforma:   clean.faktorPerforma,
        faktorInteraktif: clean.faktorInteraktif,
        moda:             clean.moda,
        sesi:             clean.sesi,
        semesterConflict: clean.semesterConflict
      }
    })

    set({ 
      parsedData: newParsed, 
      mappingIssues: issues,
      isLoaded: true, 
      fileName: fileName,
      rawCount: newParsed.length,
      mappingAccuracy: 100,
      removedCount: 0
    })
    return newParsed.length
  },

  clearData: () => set({ parsedData: [], mappingIssues: [], isLoaded: false, fileName: '' }),

  filters: {
    matkul: 'all', prodi: 'all', dosen: 'all', kelas: 'all',
    pertemuan: 'all', dateFrom: '', dateTo: '',
  },

  setFilter:    (key, value) => set(s => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: { matkul: 'all', prodi: 'all', dosen: 'all', kelas: 'all', pertemuan: 'all', dateFrom: '', dateTo: '' } }),

  getFiltered: () => {
    const { parsedData, filters } = get()
    return parsedData.filter(r => {
      if (filters.matkul    !== 'all' && r.mataKuliah !== filters.matkul) return false
      if (filters.prodi     !== 'all' && r.prodi     !== filters.prodi)    return false
      if (filters.dosen     !== 'all' && r.namaDosen !== filters.dosen)    return false
      if (filters.kelas     !== 'all' && r.kodeKelas !== filters.kelas)    return false
      if (filters.pertemuan !== 'all' && String(r.pertemuan) !== String(filters.pertemuan)) return false
      if (filters.dateFrom  && r.timestamp && new Date(r.timestamp) < new Date(filters.dateFrom)) return false
      if (filters.dateTo    && r.timestamp && r.timestamp !== '-' && new Date(r.timestamp) > new Date(filters.dateTo))   return false
      return true
    })
  },

  getDosenList: () => {
    const { parsedData, filters } = get()
    const subset = parsedData.filter(r => {
      if (filters.matkul !== 'all' && r.mataKuliah !== filters.matkul) return false
      if (filters.prodi !== 'all' && r.prodi !== filters.prodi) return false
      if (filters.kelas !== 'all' && r.kodeKelas !== filters.kelas) return false
      if (filters.pertemuan !== 'all' && String(r.pertemuan) !== String(filters.pertemuan)) return false
      return true
    })
    return [...new Set(subset.map(r => r.namaDosen).filter(Boolean))].sort()
  },
  getProdiList: () => {
    const { parsedData, filters } = get()
    const subset = parsedData.filter(r => {
      if (filters.matkul !== 'all' && r.mataKuliah !== filters.matkul) return false
      if (filters.dosen !== 'all' && r.namaDosen !== filters.dosen) return false
      if (filters.kelas !== 'all' && r.kodeKelas !== filters.kelas) return false
      if (filters.pertemuan !== 'all' && String(r.pertemuan) !== String(filters.pertemuan)) return false
      return true
    })
    return [...new Set(subset.map(r => r.prodi).filter(Boolean))].sort()
  },
  getMatkulList: () => {
    const { parsedData, filters } = get()
    const subset = parsedData.filter(r => {
      if (filters.dosen !== 'all' && r.namaDosen !== filters.dosen) return false
      if (filters.prodi !== 'all' && r.prodi !== filters.prodi) return false
      if (filters.kelas !== 'all' && r.kodeKelas !== filters.kelas) return false
      if (filters.pertemuan !== 'all' && String(r.pertemuan) !== String(filters.pertemuan)) return false
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
      if (filters.kelas !== 'all' && r.kodeKelas !== filters.kelas) return false
      return true
    })
    return [...new Set(subset.map(r => r.pertemuan).filter(Boolean))].sort((a,b)=>a-b)
  },
  getKelasList: () => {
    const { parsedData, filters } = get()
    const subset = parsedData.filter(r => {
      if (filters.matkul !== 'all' && r.mataKuliah !== filters.matkul) return false
      if (filters.dosen !== 'all' && r.namaDosen !== filters.dosen) return false
      if (filters.prodi !== 'all' && r.prodi !== filters.prodi) return false
      if (filters.pertemuan !== 'all' && String(r.pertemuan) !== String(filters.pertemuan)) return false
      return true
    })
    return [...new Set(subset.map(r => r.kodeKelas).filter(Boolean))].sort()
  }
}))

export default useStore
