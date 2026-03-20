-- ============================================================
-- CSAT Dashboard · Cakrawala University
-- Database Schema v1.0
-- Cara pakai: Supabase Dashboard → SQL Editor → Paste & Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. UPLOAD SESSIONS ────────────────────────────────────────────────────
-- Setiap kali admin upload file atau sync GSheets, dicatat di sini
CREATE TABLE IF NOT EXISTS public.upload_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name     TEXT NOT NULL,
  source        TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google_sheets')),
  semester      TEXT,                        -- e.g. "Genap 2025/2026"
  total_rows    INTEGER DEFAULT 0,
  mapped_rows   INTEGER DEFAULT 0,
  failed_rows   INTEGER DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. FEEDBACK RESPONSES (tabel utama) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback_responses (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id            UUID REFERENCES public.upload_sessions(id) ON DELETE CASCADE,

  -- Waktu & metadata
  timestamp_response    TIMESTAMPTZ,
  semester              TEXT,
  angkatan              TEXT,
  fakultas              TEXT,

  -- Identitas (opsional, bisa dikosongkan kalau privasi)
  nama_mahasiswa        TEXT,
  nim                   TEXT,

  -- Kelas
  prodi                 TEXT,
  mata_kuliah           TEXT,
  kode_kelas            TEXT,
  nama_dosen            TEXT NOT NULL,
  pertemuan             INTEGER,
  mode_kelas            TEXT CHECK (mode_kelas IN ('online', 'onsite', NULL)),

  -- Skor (skala 1-5)
  skor_pemahaman        NUMERIC(3,2) CHECK (skor_pemahaman BETWEEN 1 AND 5),
  skor_interaktif       NUMERIC(3,2) CHECK (skor_interaktif BETWEEN 1 AND 5),
  skor_performa         NUMERIC(3,2) CHECK (skor_performa BETWEEN 1 AND 5),
  csat_gabungan         NUMERIC(3,2) CHECK (csat_gabungan BETWEEN 1 AND 5),

  -- Teks kualitatif
  topik_belum_paham     TEXT,
  feedback_dosen        TEXT,

  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. DOSEN SNAPSHOTS (agregasi per dosen per sesi) ─────────────────────
-- Di-generate otomatis via trigger setiap ada insert feedback
CREATE TABLE IF NOT EXISTS public.dosen_snapshots (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id        UUID REFERENCES public.upload_sessions(id) ON DELETE CASCADE,
  nama_dosen        TEXT NOT NULL,
  prodi             TEXT,
  mata_kuliah       TEXT,

  -- Agregat
  total_respon      INTEGER DEFAULT 0,
  avg_csat          NUMERIC(4,2),
  avg_pemahaman     NUMERIC(4,2),
  avg_interaktif    NUMERIC(4,2),
  avg_performa      NUMERIC(4,2),

  -- Trend JSON: [{ pertemuan: 1, csat: 4.5, count: 10 }, ...]
  pertemuan_trend   JSONB DEFAULT '[]',

  -- Sentimen counts
  sentiment_positive INTEGER DEFAULT 0,
  sentiment_neutral  INTEGER DEFAULT 0,
  sentiment_negative INTEGER DEFAULT 0,

  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, nama_dosen)
);

-- ── 4. GOOGLE SHEETS SYNC CONFIG ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gsheets_config (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_name      TEXT NOT NULL,
  spreadsheet_id  TEXT NOT NULL,
  tab_name        TEXT DEFAULT 'Form Responses 1',
  semester        TEXT,
  is_active       BOOLEAN DEFAULT true,
  last_synced_at  TIMESTAMPTZ,
  last_row_synced INTEGER DEFAULT 1,  -- bookmark baris terakhir yang sudah disync
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_feedback_dosen     ON public.feedback_responses(nama_dosen);
CREATE INDEX IF NOT EXISTS idx_feedback_session   ON public.feedback_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_prodi     ON public.feedback_responses(prodi);
CREATE INDEX IF NOT EXISTS idx_feedback_pertemuan ON public.feedback_responses(pertemuan);
CREATE INDEX IF NOT EXISTS idx_feedback_ts        ON public.feedback_responses(timestamp_response);
CREATE INDEX IF NOT EXISTS idx_snapshot_dosen     ON public.dosen_snapshots(nama_dosen);

-- ── ROW LEVEL SECURITY (public read, no login needed) ─────────────────────
ALTER TABLE public.upload_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dosen_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsheets_config     ENABLE ROW LEVEL SECURITY;

-- Public dapat read semua (tidak perlu login)
CREATE POLICY "public_read_sessions"   ON public.upload_sessions    FOR SELECT USING (true);
CREATE POLICY "public_read_feedback"   ON public.feedback_responses FOR SELECT USING (true);
CREATE POLICY "public_read_snapshots"  ON public.dosen_snapshots    FOR SELECT USING (true);
CREATE POLICY "public_read_config"     ON public.gsheets_config     FOR SELECT USING (true);

-- Hanya service_role (backend) yang bisa insert/update/delete
CREATE POLICY "service_insert_sessions"   ON public.upload_sessions    FOR INSERT WITH CHECK (true);
CREATE POLICY "service_insert_feedback"   ON public.feedback_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "service_upsert_snapshots"  ON public.dosen_snapshots    FOR ALL    USING (true);
CREATE POLICY "service_manage_config"     ON public.gsheets_config     FOR ALL    USING (true);

-- ── HELPER FUNCTION: Recalculate snapshot for a dosen+session ─────────────
CREATE OR REPLACE FUNCTION public.refresh_dosen_snapshot(
  p_session_id UUID,
  p_nama_dosen TEXT
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_trend JSONB;
BEGIN
  -- Build pertemuan trend JSON
  SELECT jsonb_agg(
    jsonb_build_object(
      'pertemuan', pertemuan,
      'csat',      ROUND(AVG(csat_gabungan)::NUMERIC, 2),
      'count',     COUNT(*)
    ) ORDER BY pertemuan
  )
  INTO v_trend
  FROM public.feedback_responses
  WHERE session_id = p_session_id
    AND nama_dosen = p_nama_dosen
    AND pertemuan IS NOT NULL
  GROUP BY pertemuan;

  INSERT INTO public.dosen_snapshots (
    session_id, nama_dosen, prodi, mata_kuliah,
    total_respon, avg_csat, avg_pemahaman, avg_interaktif, avg_performa,
    pertemuan_trend, updated_at
  )
  SELECT
    p_session_id,
    p_nama_dosen,
    MODE() WITHIN GROUP (ORDER BY prodi),
    string_agg(DISTINCT mata_kuliah, ', '),
    COUNT(*),
    ROUND(AVG(csat_gabungan)::NUMERIC, 2),
    ROUND(AVG(skor_pemahaman)::NUMERIC, 2),
    ROUND(AVG(skor_interaktif)::NUMERIC, 2),
    ROUND(AVG(skor_performa)::NUMERIC, 2),
    COALESCE(v_trend, '[]'::JSONB),
    NOW()
  FROM public.feedback_responses
  WHERE session_id = p_session_id
    AND nama_dosen = p_nama_dosen
  ON CONFLICT (session_id, nama_dosen) DO UPDATE SET
    prodi            = EXCLUDED.prodi,
    mata_kuliah      = EXCLUDED.mata_kuliah,
    total_respon     = EXCLUDED.total_respon,
    avg_csat         = EXCLUDED.avg_csat,
    avg_pemahaman    = EXCLUDED.avg_pemahaman,
    avg_interaktif   = EXCLUDED.avg_interaktif,
    avg_performa     = EXCLUDED.avg_performa,
    pertemuan_trend  = EXCLUDED.pertemuan_trend,
    updated_at       = NOW();
END;
$$;
