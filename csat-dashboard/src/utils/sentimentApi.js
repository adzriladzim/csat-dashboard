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

// Post-processing sanity check untuk menyaring kesalahan klasifikasi dari model AI
function sanityCheckSentiment(text, aiSentiment) {
    if (!text) return aiSentiment;
    const clean = text.trim().toLowerCase()
        // Bersihkan tanda baca dan huruf berulang yang berlebihan (misal: seruuuu -> seru)
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
        .replace(/(.)\1{2,}/g, "$1$1"); // Batasi huruf berulang max 2
        
    const cleanWords = clean.split(/\s+/);

    // Kumpulan kata positif yang sangat jelas (termasuk slang & variasi)
    const clearPosWords = [
        'baik', 'bagus', 'aman', 'lancar', 'mantap', 'oke', 'ok', 'asik', 'asyik', 
        'seru', 'jelas', 'enjoy', 'hebat', 'keren', 'suka', 'menarik', 'membantu', 
        'terimakasih', 'terima kasih', 'makasih', 'thanks', 'thankyou', 'nice', 'good'
    ];
    
    // Kata yang mengindikasikan keluhan / kritik
    const negativeIndicators = [
        'cepat', 'lambat', 'membosankan', 'monoton', 'bingung', 'pusing', 'kurang', 
        'tidak jelas', 'tdk jelas', 'gak jelas', 'ga jelas', 'sulit', 'susah', 
        'ngantuk', 'boring', 'mendem', 'kecil', 'pecah', 'macet', 'lag', 'kendor'
    ];

    // Deteksi kalimat netral / tidak ada saran
    const isNoComplaint = [
        /^(tidak ada|tidak ada saran|tidak ada masukan|tdk ada|gak ada|ga ada|nothing|nihil|belum ada|blm ada)\s*(untuk hari ini|hari ini|saja)?$/i,
        /^(aman|aman aman saja|sejauh ini aman|sudah aman)\s*(saja|pak|bu|mas|mbak)?$/i,
        /^(lanjut|lanjutkan|next)\s*$/i
    ].some(regex => regex.test(clean));

    if (isNoComplaint) {
        return 'neutral';
    }

    // Jika AI mendeteksi negatif, mari kita periksa apakah ini false negative
    if (aiSentiment === 'negative') {
        // Cek apakah ada kata positif yang jelas
        const hasClearPos = clearPosWords.some(w => cleanWords.some(cw => cw.startsWith(w) || cw.endsWith(w)) || clean.includes(w));
        // Cek apakah ada indikasi keluhan/kritik
        const hasNegativeIndicator = negativeIndicators.some(w => clean.includes(w));

        // Jika ada kata positif, tapi tidak ada keluhan sama sekali, koreksi ke positive
        if (hasClearPos && !hasNegativeIndicator) {
            return 'positive';
        }
    }

    // Jika AI mendeteksi neutral/positive tapi ada kritik yang sangat jelas
    if (aiSentiment !== 'negative') {
        const hasNegativeIndicator = negativeIndicators.some(w => cleanWords.includes(w) || clean.includes(' ' + w));
        const hasClearPos = clearPosWords.some(w => cleanWords.includes(w));
        
        // Jika ada kritik yang jelas, dan tidak didahului kata "tidak" (misal: "tidak membosankan" -> ini positif)
        if (hasNegativeIndicator && !clean.includes('tidak ' + negativeIndicators.find(w => clean.includes(w)))) {
            // Kecuali jika ada kata positif yang lebih dominan
            if (!hasClearPos) {
                return 'negative';
            }
        }
    }

    return aiSentiment;
}

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
        
        // Memformat hasil respon agar seragam (baik format standar Hugging Face maupun format Router baru)
        let predictionsList = [];
        if (Array.isArray(result)) {
            // Format Router Baru: result adalah [[pred_teks1, pred_teks2, ...]]
            if (result.length === 1 && Array.isArray(result[0]) && result[0].length === inputsToSend.length) {
                predictionsList = result[0].map(item => Array.isArray(item) ? item : [item]);
            } 
            // Format Standar: result adalah [[scores_teks1], [scores_teks2], ...]
            else {
                predictionsList = result.map(item => Array.isArray(item) ? item : [item]);
            }
        } else {
            throw new Error("Format respon API tidak valid");
        }

        // Memetakan hasil kembali ke indeks teks asli
        let resultIdx = 0;
        return validTexts.map(t => {
            if (t === '') return 'neutral';
            
            const predictions = predictionsList[resultIdx++];
            if (predictions && Array.isArray(predictions)) {
                const topSentiment = predictions.reduce((prev, current) =>
                    (prev.score > current.score) ? prev : current
                );
                const rawSentiment = labelMap[topSentiment.label] || 'neutral';
                return sanityCheckSentiment(t, rawSentiment);
            }
            return 'neutral';
        });
    } catch (error) {
        console.error("Gagal melakukan analisis batch online:", error);
        return texts.map(() => null); // Kembalikan null agar store bisa fallback ke rule-based
    }
}

