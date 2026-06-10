import { fetch, Agent } from 'undici';
import dns from 'dns';

// Resolver DNS kustom menggunakan Cloudflare DNS (1.1.1.1) dan Google DNS (8.8.8.8)
const dnsResolver = new dns.Resolver();
dnsResolver.setServers(['1.1.1.1', '8.8.8.8']);

function customLookup(hostname, options, callback) {
  dnsResolver.resolve4(hostname, (err, addresses) => {
    if (err || !addresses.length) {
      // Fallback ke resolver sistem jika Cloudflare/Google gagal
      return dns.lookup(hostname, options, callback);
    }
    // Kirim IP pertama yang didapatkan
    callback(null, addresses[0], 4);
  });
}

// Konfigurasi Agent undici kustom dengan lookup resolver eksternal kita
const customAgent = new Agent({
  connect: {
    lookup: customLookup
  }
});

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
    // Memanggil domain lama api-inference.huggingface.co menggunakan undici dengan Custom Agent DNS
    const response = await fetch('https://api-inference.huggingface.co/models/w11wo/indonesian-roberta-base-sentiment-classifier', {
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({ inputs }),
      dispatcher: customAgent // Pasangkan customAgent undici di sini
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
