import { create } from 'zustand'
import { parseRow } from '@/utils/rowParser'
import { supabase } from '@/lib/supabase'

const useStore = create((set, get) => ({
  parsedData:  [],
  mappingIssues: [], // New state for diagnostic tracking
  isLoaded:    false,
  fileName:    '',
  rawCount:    0,
  mappingAccuracy: 0,
  removedCount: 0,
  version: '1.5.0 (Full Data Recovery)',

  parseAndDisplay: (rawRows, headers, fileName) => {
    const rawTotal = rawRows.length
    const issues = []
    
    const processed = rawRows
      .map((r, idx) => {
        const parsed = parseRow(r, headers)
        const rowNum = idx + 2 // Typical 1-indexed + header row

        // Identify Mapping Issues
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

        // Return the parsed object but also include a transient flag to filter junk
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

    const currentData = get().parsedData
    const currentIssues = get().mappingIssues
    
    // Deduplication (Append new only)
    const combined = [...currentData]
    let dupCount = 0
    newParsed.forEach(nr => {
      const exists = currentData.some(cr => 
        cr.namaDosen === nr.namaDosen && 
        cr.mataKuliah === nr.mataKuliah && 
        cr.pertemuan === nr.pertemuan && 
        cr.nim === nr.nim && 
        cr.timestamp === nr.timestamp
      )
      if (!exists) combined.push(nr)
      else dupCount++
    })

    const combinedIssues = [...currentIssues]
    issues.forEach(ni => {
      const exists = currentIssues.some(ci => ci.row === ni.row && ci.timestamp === ni.timestamp && ci.alasan === ni.alasan)
      if (!exists) combinedIssues.push(ni)
    })

    const finalCount = combined.length
    
    set({ 
      parsedData: combined, 
      mappingIssues: combinedIssues,
      isLoaded: true, 
      fileName: fileName === get().fileName ? fileName : (get().fileName ? 'Multiple Files' : fileName), 
      rawCount: finalCount,
      mappingAccuracy: 100,
      removedCount: 0
    })
    return finalCount
  },

  clearData: () => set({ parsedData: [], mappingIssues: [], isLoaded: false, fileName: '' }),

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
      if (filters.dateTo    && r.timestamp && r.timestamp !== '-' && new Date(r.timestamp) > new Date(filters.dateTo))   return false
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

  // ── SUPABASE CLOUD SYNC ───────────────────────────────────────────────────
  isLoading: false,
  
  loadInitialData: async () => {
    if (!supabase) return
    set({ isLoading: true })
    try {
      // 1. Fetch Lecturers & Subjects to resolve IDs
      const { data: lecturers } = await supabase.from('lecturers').select('*')
      const { data: subjects } = await supabase.from('subjects').select('*')
      
      // 2. Fetch main CSAT data
      const { data: cloudData, error } = await supabase
        .from('csat_data')
        .select('*')
        .order('timestamp_response', { ascending: false })

      if (error) throw error
      if (cloudData && cloudData.length > 0) {
        // Map cloud data back to frontend format
        const mapped = cloudData.map(c => ({
          timestamp:        c.timestamp_response,
          tanggal:          c.tanggal,
          namaMahasiswa:    c.nama_mahasiswa,
          nim:              c.nim,
          angkatan:         c.angkatan,
          semester:         c.semester,
          fakultas:         c.fakultas,
          prodi:            c.prodi,
          mataKuliah:       subjects?.find(s => s.id === c.subject_id)?.name || '-',
          kodeKelas:        c.kode_kelas,
          namaDosen:        lecturers?.find(l => l.id === c.lecturer_id)?.name || '-',
          pertemuan:        c.pertemuan,
          skorPemahaman:    c.skor_pemahaman,
          skorInteraktif:   c.skor_interaktif,
          skorPerforma:     c.skor_performa,
          csatGabungan:     c.csat_gabungan,
          topikBelumPaham:  c.topik_belum_paham,
          feedbackDosen:    c.feedback_dosen,
          faktorPerforma:   c.faktor_performa,
          faktorInteraktif: c.faktor_interaktif,
          moda:             c.moda,
          sesi:             c.sesi,
          semesterConflict: false
        }))
        set({ parsedData: mapped, isLoaded: true, fileName: 'Cloud Storage', rawCount: mapped.length })
      }
    } catch (err) {
      console.error('Failed to load from Supabase:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  syncToCloud: async (newRows) => {
    if (!supabase || !newRows.length) return
    
    try {
      // 1. Upsert Lecturers
      const uniqueDosen = [...new Set(newRows.map(r => r.namaDosen))].filter(Boolean)
      console.log(`Syncing ${uniqueDosen.length} lecturers...`)
      const { data: lecturers, error: lErr } = await supabase
        .from('lecturers')
        .upsert(uniqueDosen.map(name => ({ name })), { onConflict: 'name' })
        .select()
      if (lErr) throw new Error(`Lecturer sync failed: ${lErr.message}`)

      // 2. Upsert Subjects
      const uniqueMK = [...new Set(newRows.map(r => r.mataKuliah))].filter(Boolean)
      console.log(`Syncing ${uniqueMK.length} subjects...`)
      const { data: subjects, error: sErr } = await supabase
        .from('subjects')
        .upsert(uniqueMK.map(name => ({ name, code: name })), { onConflict: 'code' })
        .select()
      if (sErr) throw new Error(`Subject sync failed: ${sErr.message}`)

      console.log(`Preparing ${newRows.length} rows for cloud...`)

      // 3. Prepare CSAT Rows
      const cloudRows = newRows.map(r => {
        const lId = lecturers?.find(l => l.name === r.namaDosen)?.id
        const sId = subjects?.find(s => s.name === r.mataKuliah)?.id
        
        // Logical unique ID to prevent duplicates (NIM + MK + Pertemuan + TS)
        const compositeId = `${r.nim || 'anon'}_${sId || 'no-mk'}_${r.pertemuan || 0}_${r.timestamp || Date.now()}`
        
        return {
          id: compositeId,
          timestamp_response: r.timestamp,
          tanggal:            r.tanggal,
          nim:                r.nim,
          nama_mahasiswa:     r.namaMahasiswa,
          lecturer_id:        lId,
          subject_id:         sId,
          pertemuan:          r.pertemuan,
          semester:           r.semester,
          angkatan:           r.angkatan,
          fakultas:           r.fakultas,
          prodi:              r.prodi,
          skor_pemahaman:     r.skorPemahaman,
          skor_interaktif:    r.skorInteraktif,
          skor_performa:      r.skorPerforma,
          csat_gabungan:      r.csatGabungan,
          skor_disiplin:      r.skorDisiplin,
          skor_kejelasan:     r.skorKejelasan,
          skor_penguasaan:    r.skorPenguasaan,
          skor_ketuntasan:    r.skorKetuntasan,
          skor_interaksi:     r.skorInteraksi,
          topik_belum_paham:  r.topikBelumPaham,
          feedback_dosen:     r.feedbackDosen,
          faktor_performa:    r.faktorPerforma,
          faktor_interaktif:  r.faktorInteraktif,
          moda:               r.moda,
          sesi:               r.sesi
        }
      })

      // 4. Batch Upsert to Supabase (500 rows per chunk to avoid payload limits)
      const CHUNK_SIZE = 500
      for (let i = 0; i < cloudRows.length; i += CHUNK_SIZE) {
        const chunk = cloudRows.slice(i, i + CHUNK_SIZE)
        const { error: upsertError } = await supabase.from('csat_data').upsert(chunk, { onConflict: 'id' })
        if (upsertError) {
          console.error(`Sync chunk ${i/CHUNK_SIZE} failed:`, upsertError)
          throw upsertError
        }
      }
      console.log(`Successfully synced ${cloudRows.length} rows to Supabase.`)
    } catch (err) {
      console.error('CRITICAL: Sync to Supabase failed!', err)
      alert('Gagal sinkronisasi ke Cloud. Cek koneksi atau kuota Supabase Anda.')
    }
  }
}))

export default useStore
