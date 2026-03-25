import { Helmet } from "react-helmet-async";

export default function SEO({ title, description, keywords, image }) {
  const siteTitle = "CSAT Dashboard · Cakrawala University";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDesc =
    "Dashboard Analisis Kinerja Dosen Berbasis Feedback Mahasiswa. Pantau skor CSAT, tren, dan anomali secara real-time.";
  const metaDesc = description || defaultDesc;
  const metaImage = image || "/CAKRAWALA LOGOMARK 2A.png"; // Replace with a full URL if deployed
  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={metaImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={metaDesc} />
      <meta property="twitter:image" content={metaImage} />

      {/* Analytics (Optional: Canonical URL) */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
