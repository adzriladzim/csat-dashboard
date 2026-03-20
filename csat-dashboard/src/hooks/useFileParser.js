import { useCallback } from 'react'
import * as XLSX from 'xlsx'
import useStore from '@/lib/store'

export function useFileParser() {
  const parseAndDisplay = useStore(s => s.parseAndDisplay)

  const handleFile = useCallback(async (file) => {
    const ext = file.name.split('.').pop().toLowerCase()

    if (['xlsx', 'xls'].includes(ext)) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data    = new Uint8Array(e.target.result)
            const wb      = XLSX.read(data, { type: 'array', cellDates: true })
            const ws      = wb.Sheets[wb.SheetNames[0]]
            const rows    = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' })
            const headers = rows.length > 0 ? Object.keys(rows[0]) : []
            const count   = parseAndDisplay(rows, headers, file.name)
            resolve({ count, fileName: file.name })
          } catch (err) { reject(err) }
        }
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })
    }

    if (ext === 'csv') {
      const { default: Papa } = await import('papaparse')
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: ({ data, meta }) => {
            try {
              const count = parseAndDisplay(data, meta.fields, file.name)
              resolve({ count, fileName: file.name })
            } catch (err) { reject(err) }
          },
          error: reject,
        })
      })
    }

    throw new Error('Format tidak didukung. Gunakan .xlsx, .xls, atau .csv')
  }, [parseAndDisplay])

  return { handleFile }
}
