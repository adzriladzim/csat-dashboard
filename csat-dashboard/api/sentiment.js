export default async function handler(req, res) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { inputs } = req.body;
  const HF_TOKEN = process.env.VITE_HF_API_TOKEN;

  if (!HF_TOKEN) {
    return res.status(500).json({ error: 'Hugging Face API token is not configured on the server.' });
  }

  try {
    // Memanggil endpoint baru Hugging Face Router API
    const response = await fetch('https://router.huggingface.co/hf-inference/models/w11wo/indonesian-roberta-base-sentiment-classifier', {
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({ inputs }),
    });

    if (!response.ok) {
      throw new Error(`HF API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Vercel Serverless function error:", error);
    return res.status(500).json({ error: error.message });
  }
}
