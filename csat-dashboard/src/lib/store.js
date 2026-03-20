import { create } from 'zustand'
import { parseRow } from '@/utils/rowParser'

const useStore = create((set, get) => ({
  parsedData:  [],
  isLoaded:    false,
  fileName:    '',
  rawCount:    0,
  mappingAccuracy: 0,
  removedCount: 0,

  parseAndDisplay: (rawRows, headers, fileName) => {
    const rawTotal = rawRows.length
    
    // 1. Map and initial filter (junk removal)
    let processed = rawRows
      .map(r => parseRow(r, headers))
      .filter(r => 
        r.nama_dosen && r.nama_dosen.trim() !== '' && 
        r.nama_dosen.toLowerCase() !== 'nama dosen' &&
        r.csat_gabungan !== null 
      )

    // 2. Simplified Cleaning (Skip Deduplication as it lowers count too much)
    const validRows = processed

    // 3. Transform structure for final parsedData
    const parsed = validRows.map(r => ({
      timestamp:       r.timestamp_response,
      tanggal:         r.tanggal,
      namaMahasiswa:   r.nama_mahasiswa,
      nim:             r.nim,
      angkatan:        r.angkatan,
      semester:        r.semester,
      fakultas:        r.fakultas,
      prodi:           r.prodi,
      mataKuliah:      r.mata_kuliah,
      kodeKelas:       r.kode_kelas,
      namaDosen:       r.nama_dosen,
      pertemuan:       r.pertemuan,
      skorPemahaman:   r.skor_pemahaman,
      skorInteraktif:  r.skor_interaktif,
      skorPerforma:    r.skor_performa,
      csatGabungan:    r.csat_gabungan,
      topikBelumPaham: r.topik_belum_paham,
      feedbackDosen:   r.feedback_dosen,
    }))

    const accuracy = rawTotal > 0 ? (parsed.length / rawTotal) * 100 : 0
    set({ 
      parsedData: parsed, 
      isLoaded: true, 
      fileName, 
      rawCount: rawTotal, 
      mappingAccuracy: accuracy,
      removedCount: (rawTotal - parsed.length)
    })
    return parsed.length
  },

  clearData: () => set({ parsedData: [], isLoaded: false, fileName: '' }),

  filters: {
    search: '', prodi: 'all', dosen: 'all',
    pertemuan: 'all', dateFrom: '', dateTo: '',
  },

  setFilter:    (key, value) => set(s => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: { search: '', prodi: 'all', dosen: 'all', pertemuan: 'all', dateFrom: '', dateTo: '' } }),

  getFiltered: () => {
    const { parsedData, filters } = get()
    return parsedData.filter(r => {
      if (filters.search    && !r.namaDosen?.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.prodi     !== 'all' && r.prodi     !== filters.prodi)    return false
      if (filters.dosen     !== 'all' && r.namaDosen !== filters.dosen)    return false
      if (filters.pertemuan !== 'all' && String(r.pertemuan) !== String(filters.pertemuan)) return false
      if (filters.dateFrom  && r.timestamp && new Date(r.timestamp) < new Date(filters.dateFrom)) return false
      if (filters.dateTo    && r.timestamp && new Date(r.timestamp) > new Date(filters.dateTo))   return false
      return true
    })
  },

  getDosenList:     () => [...new Set(get().parsedData.map(r => r.namaDosen).filter(Boolean))].sort(),
  getProdiList:     () => [...new Set(get().parsedData.map(r => r.prodi).filter(Boolean))].sort(),
  getPertemuanList: () => [...new Set(get().parsedData.map(r => r.pertemuan).filter(Boolean))].sort((a,b)=>a-b),
}))

export default useStore
