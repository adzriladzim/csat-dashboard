/**
 * AI Utility for Feedback Analysis
 * Supports Gemini API (Google)
 * With Robust Model Fallback Logic
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

import { supabase } from '@/lib/supabase'

// Try these models in order until one works
const MODELS_TO_TRY = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-3-flash-preview',
  'gemini-2.0-flash',
  'gemini-pro',
  'gemini-1.0-pro'
];

/**
 * Generic helper to call Gemini with a prompt and handle various models.
 */
async function callGemini(prompt, history = []) {
  if (!GEMINI_API_KEY) {
    return { error: true, code: 'NO_KEY', message: 'API Key belum dikonfigurasi.' };
  }

  // Combine history for chat prompt structure
  const contents = [...history];
  contents.push({ role: 'user', parts: [{ text: prompt }] });

  // Try each model until one doesn't return 404
  for (const modelName of MODELS_TO_TRY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      const data = await response.json();
      
      // If model not found (404), try the next one
      if (data.error?.code === 404 || data.error?.status === 'NOT_FOUND') {
        console.warn(`Model ${modelName} not found, trying next...`);
        continue;
      }

      // Handle Quota or other errors
      if (data.error) {
        return { error: true, code: data.error.code, message: data.error.message };
      }

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) return { success: true, content, modelUsed: modelName };
      
      // Handle blocked content
      const blockReason = data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason;
      if (blockReason) return { error: true, code: 'BLOCKED', message: `Respons terblokir (${blockReason}).` };

    } catch (err) {
      console.error(`Fetch error with model ${modelName}:`, err);
      // If network error, don't retry models immediately, just fail
      return { error: true, code: 'FETCH_ERROR', message: 'Gagal menghubungi server AI.' };
    }
  }

  return { error: true, code: 'ALL_MODELS_FAILED', message: 'Tidak ada model Gemini yang tersedia untuk API Key Anda.' };
}

/**
 * Analyzes qualitative feedback.
 */
export async function analyzeFeedback(feedbacks = [], topics = []) {
  if (!GEMINI_API_KEY) return mockAnalysis(feedbacks, topics);

  const cleanFeedbacks = feedbacks.filter(f => f && f.trim().length > 2);
  const cleanTopics = topics.filter(t => t && t.trim().length > 2);

  const contextHash = `FB_AN_v1_${cleanFeedbacks.length}_${cleanTopics.length}_${cleanFeedbacks.slice(0,5).join('')}`;

  // 1. Check Cache
  if (supabase) {
    try {
      const { data: cached } = await supabase
        .from('ai_cache')
        .select('result_text')
        .eq('context_hash', contextHash)
        .single()
      
      if (cached) {
        const parsed = JSON.parse(cached.result_text)
        return { ...parsed, _cached: true }
      }
    } catch (e) { /* skip */ }
  }

  const prompt = `
    Analisis data feedback akademik berikut dan berikan JSON murni tanpa markdown:
    FEEDBACK: ${cleanFeedbacks.slice(0, 30).join('\n')}
    TOPIK: ${cleanTopics.slice(0, 30).join('\n')}
    JSON FORMAT: { "sentiment": 0-100, "highlights": [], "painPoints": [], "topicClusters": [], "summary": "" }
  `;

  const res = await callGemini(prompt);
  if (res.error) return { error: true, message: res.message };

  try {
    const jsonStr = res.content.replace(/```json|```/gi, '').trim();
    const result = JSON.parse(jsonStr);

    // 2. Save to Cache
    if (supabase && result) {
      await supabase.from('ai_cache').upsert({
        context_hash: contextHash,
        result_text: JSON.stringify(result)
      }, { onConflict: 'context_hash' })
    }

    return result;
  } catch (err) {
    return { error: true, message: 'Format data AI tidak sesuai.' };
  }
}

/**
 * Interactive chat with AI.
 */
export async function askAI(query, context = {}, history = []) {
  if (!GEMINI_API_KEY) {
    return { role: 'assistant', content: 'API Key belum ada di .env.' };
  }

  const contextStr = JSON.stringify(context);
  const contextHash = `${query}_${contextStr.length}_${contextStr.slice(-50)}`; // Simple unique identifier

  // 1. Check Cache
  if (supabase) {
    try {
      const { data: cached } = await supabase
        .from('ai_cache')
        .select('result_text')
        .eq('context_hash', contextHash)
        .single()
      
      if (cached) return { role: 'assistant', content: cached.result_text, cached: true }
    } catch (e) { /* ignore cache miss */ }
  }

    const prompt = `
    Anda adalah "CSAT Analytics Assistant" bernama Lirzda yang sangat cerdas, detail, dan proaktif.
    
    IDENTITAS & FILOSOFI:
    - Nama: Lirzda (Logical Intelligent Response & Z-Score Data Analyst).
    - Anagram: ADZRIL (Adzril Adzim Hendrynov, Ilkom'24).
    - Karakter: Analis yang mampu melakukan "Deep Search" ke database jika nama dosen disebutkan.
    
    DATA KONTEKS (UTAMA):
    - Sumber Data (Nama File): ${context.fileName || 'Data dari Supabase'}
    - Temuan Khusus (Deep Search): ${JSON.stringify(context.deepSearch || [])}
    - Rangkuman data terfilter: ${JSON.stringify(context.summary, null, 2)}
    
    DATA PENGETAHUAN GLOBAL:
    - Katalog Dosen (Top 50 saja): ${JSON.stringify(context.globalCatalog?.daftarDosen || [])}
    - Juara per Pertemuan: ${JSON.stringify(context.globalCatalog?.juaraPerPertemuan || {})}
    - Statistik per Pertemuan: ${JSON.stringify(context.perMeetingStats, null, 2)}

    INSTRUKSI KHUSUS:
    1. PRIORITAS DEEP SEARCH: Jika \`deepSearch\` memiliki isi, itu adalah data PALING AKURAT untuk dosen yang ditanyakan. Gunakan data tersebut untuk menjawab prodi, matakuliah, dan skor mereka secara detail. Jangan bilang "Tidak ketemu" jika data ada di \`deepSearch\`.
    2. MENGENAI "BELAJAR": Jika user bertanya bagaimana Anda belajar, jelaskan bahwa Anda saat ini belajar melalui Konteks Data Real-time (RAG) yang diberikan sistem. Anda siap merekam pola komunikasi dan feedback user untuk disimpan di "Lirzda Memory" (Supabase) agar semakin pintar setiap hari.
    3. PENGETIKAN: Jawaban Anda mengalir secara real-time. Gunakan gaya bahasa yang menunjukkan Anda sedang membedah database saat itu juga.
    
    4. PROTOKOL AKSI (CANGGIH):
       - Anda memiliki kemampuan memicu unduhan laporan PDF secara spesifik.
       - Jika user meminta untuk "Unduh", "Download", atau "Cetak laporan" dosen tertentu, Anda WAJIB menyertakan tag di akhir jawaban: [ACTION:DOWNLOAD:Nama Dosen|{"kodeKelas":"...", "pertemuan":...}]
       - Gunakan filter jika diminta (misal: "pertemuan 3" atau "kelas BuCn3"). Jika tidak ada filter, gunakan [ACTION:DOWNLOAD:Nama Dosen|{}]
       - PENTING: Jangan bertanya "Apakah Anda ingin saya mencetaknya?". Jadilah PROAKTIF. Katakan "Saya sedang memproses dan mengunduh laporan PDF [Nama Dosen] untuk Anda..." atau "Laporan detail sudah saya siapkan dan sedang diunduh secara otomatis."
       - Nama dosen HARUS sesuai katalog (sama persis).
    
    Format jawaban: Markdown professional, gunakan List, Bold, dan Emoji yang tepat.
    
    PERTANYAAN USER: "${query}"
  `;

  // Map history to Gemini format (role: user/model)
  const formattedHistory = history.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }]
  }));

  const res = await callGemini(prompt, formattedHistory);
  
  if (res.error) {
    return { role: 'assistant', content: `**⚠️ Gagal (${res.code}):** ${res.message}` };
  }

  // 2. Save to Cache
  if (supabase && res.content) {
    await supabase.from('ai_cache').upsert({
      context_hash: contextHash,
      result_text: res.content
    }, { onConflict: 'context_hash' })
  }

  return { role: 'assistant', content: res.content };
}

function mockAnalysis(f, t) {
  return new Promise(resolve => setTimeout(() => resolve({
    sentiment: 78,
    highlights: ['Penyampaian terstruktur', 'Interaktif'],
    painPoints: ['Tugas terlalu berat'],
    topicClusters: ['Redux', 'Async-Await'],
    summary: 'Kinerja umum sangat baik.'
  }), 1000));
}
