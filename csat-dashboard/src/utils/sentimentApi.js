const HF_TOKEN = import.meta.env.VITE_HF_API_TOKEN;
const MODEL_URL = "https://router.huggingface.co/hf-inference/models/w11wo/indonesian-roberta-base-sentiment-classifier";

const labelMap = {
    'LABEL_0': 'negative',
    'LABEL_1': 'neutral',
    'LABEL_2': 'positive',
    'negative': 'negative',
    'neutral': 'neutral',
    'positive': 'positive'
};

/**
 * Menganalisis sentimen untuk satu teks secara online (Inference API).
 * Menggunakan batch di belakang layar untuk efisiensi jika dipanggil berulang.
 */
export async function analyzeSentimentOnline(text) {
    if (!text || text.trim().length < 4) return 'neutral';
    const results = await analyzeSentimentOnlineBatch([text]);
    return results[0] || null;
}

/**
 * Menganalisis sentimen untuk kumpulan teks secara berkelompok (batch).
 * Mengirimkan array teks ke Hugging Face Inference API dalam satu request.
 */
export async function analyzeSentimentOnlineBatch(texts) {
    if (!texts || texts.length === 0) return [];

    // Filter teks kosong atau terlalu pendek sebelum dikirim
    const validTexts = texts.map(t => (t && t.trim().length >= 4) ? t.trim() : '');
    const inputsToSend = validTexts.filter(t => t !== '');

    if (inputsToSend.length === 0) {
        return texts.map(() => 'neutral');
    }

    try {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let response;

        if (isLocalhost) {
            // Panggilan langsung di local (memerlukan DNS/koneksi aktif)
            response = await fetch(MODEL_URL, {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ inputs: inputsToSend }),
            });
        } else {
            // Panggilan lewat Serverless Proxy di production Vercel
            response = await fetch('/api/sentiment', {
                headers: {
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ inputs: inputsToSend }),
            });
        }

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        // Memetakan hasil kembali ke indeks teks asli
        let resultIdx = 0;
        return validTexts.map(t => {
            if (t === '') return 'neutral';
            
            const predictions = result[resultIdx++];
            if (predictions && Array.isArray(predictions)) {
                const topSentiment = predictions.reduce((prev, current) =>
                    (prev.score > current.score) ? prev : current
                );
                return labelMap[topSentiment.label] || 'neutral';
            }
            return 'neutral';
        });
    } catch (error) {
        console.error("Gagal melakukan analisis batch online:", error);
        return texts.map(() => null); // Kembalikan null agar store bisa fallback ke rule-based
    }
}

