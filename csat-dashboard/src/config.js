// ── Konfigurasi terpusat aplikasi ──────────────────────────────────────────
// Default utk SEMUA user (facilitator). Tanpa perlu setup per-device.
// Override per-user tetap mungkin via /sync-settings (disimpan di localStorage
// key "csat-sheets-config"). Reset di halaman settings → balik ke nilai file ini.

export const SHEETS_CONFIG = {
  spreadsheetId: '1dZQcq3TvPh7wkW0z8SF94YExs5jONYf_O3oV09Hk604',
  gid: '162431609',
  sheetName: 'Form Responses 1',
  enabled: true,        // auto-sync ON by default
  autoRefresh: true,    // auto-refresh ON by default
  refreshInterval: 60,  // detik
}
