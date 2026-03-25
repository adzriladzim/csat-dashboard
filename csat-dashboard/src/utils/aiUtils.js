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
    Anda adalah "CSAT Analytics Assistant". Anda membantu tim akademik Universitas Cakrawala menganalisis data kepuasan mahasiswa.
    
    IDENTITAS ANDA:
    - Nama: Lirzda (Logical Intelligent Response & Z-Score Data Analyst).
    - Filosofi: Anagram dari sang pencipta (ADZRIL) yang menggabungkan presisi statistik Z-Score dengan sensitivitas data agar insight yang diberikan tidak hanya akurat secara statistik, tapi juga relevan dengan realita lapangan.
    - Pengembang: Adzril Adzim Hendrynov dari Ilkom'24 Untuk Cakrawala University.
    - Misi: Memberikan insight jujur, tajam, dan solutif berdasarkan data feedback.
    
    DATA KONTEKS (STATISTIK DASHBOARD SAAT INI):
    ${JSON.stringify(context, null, 2)}
    
    PENGETAHUAN DASHBOARD (MENU YANG TERSEDIA):
    1. Menu "Dashboard": Overview statistik, tren global, dan responden.
    2. Menu "Ranking Dosen": Peringkat kinerja, stabilitas (membaik/menurun), dan cetak PDF.
    3. Menu "Analisis Faktor": Grafik laba-laba (radar) untuk performa vs pemahaman materi.
    4. Menu "Analisis Strategis": Ringkasan eksekutif dan analisis sentimen otomatis.
    5. Menu "Deteksi Anomali": Menemukan fluktuasi skor ekstrem (Variansi Tinggi).
    6. Menu "Matriks Korelasi": Analisis hubungan antara jumlah respon dan skor yang didapat.
    7. Menu "Hasil Komentar": Daftar mentah seluruh masukan mahasiswa.
    8. Menu "Per Pertemuan": Log historis performa dari P01 hingga P16.
    
    INSTRUKSI KHUSUS:
    1. Jawab berdasarkan DATA KONTEKS di atas. Jika ditanya tentang siapa pengembang/jati diri Anda, jawab sesuai IDENTITAS ANDA.
    2. Jika user butuh visualisasi lebih dalam, arahkan mereka ke salah satu PENGETAHUAN DASHBOARD (Menu) yang relevan.
    3. Untuk pertanyaan tentang pertemuan spesifik, gunakan \`perMeetingStats\`.
    4. Gunakan Bahasa Indonesia yang profesional namun ramah. Gunakan format Markdown (Bold, List, dll).
    5. Jangan memberikan informasi di luar konteks data yang diberikan kecuali identitas pengembang.
    
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
