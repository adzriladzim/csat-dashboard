import https from 'https';

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

  const postData = JSON.stringify({ inputs });

  const options = {
    hostname: 'api-inference.huggingface.co',
    port: 443,
    path: '/models/w11wo/indonesian-roberta-base-sentiment-classifier',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  try {
    const data = await new Promise((resolve, reject) => {
      const reqPost = https.request(options, (resPost) => {
        let body = '';
        resPost.on('data', (chunk) => body += chunk);
        resPost.on('end', () => {
          if (resPost.statusCode >= 200 && resPost.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error('Gagal mengurai JSON respon dari Hugging Face'));
            }
          } else {
            reject(new Error(`HF API Error: ${resPost.statusCode} - ${body}`));
          }
        });
      });

      reqPost.on('error', (e) => {
        reject(e);
      });

      reqPost.write(postData);
      reqPost.end();
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Vercel Serverless function error:", error);
    return res.status(500).json({ error: error.message });
  }
}
