import { Router } from "express";

const router = Router();

function isAllowedHost(hostname) {
  const host = (hostname || "").toLowerCase();
  return (
    host === "imdb.com" ||
    host === "www.imdb.com" ||
    host === "m.imdb.com" ||
    host === "m.media-amazon.com" ||
    host.endsWith(".media-amazon.com") ||
    host === "images-na.ssl-images-amazon.com" ||
    host.endsWith(".ssl-images-amazon.com")
  );
}

function extractOgImage(html) {
  // Very small/robust extractor without adding heavy deps.
  const candidates = [
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']\s*\/?>/i,
    /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']\s*\/?>/i,
    /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']\s*\/?>/i,
    /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']\s*\/?>/i,
  ];

  for (const re of candidates) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

// Resolve a "page URL" (e.g. IMDb viewer) into a direct image URL
router.get("/resolve", async (req, res) => {
  try {
    const rawUrl = String(req.query.url || "").trim();
    if (!rawUrl) return res.status(400).json({ message: "Missing url" });
    if (rawUrl.length > 2048) return res.status(400).json({ message: "URL too long" });

    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      return res.status(400).json({ message: "Invalid URL" });
    }

    if (url.protocol !== "https:") {
      return res.status(400).json({ message: "Only https URLs are allowed" });
    }

    if (!isAllowedHost(url.hostname)) {
      return res.status(400).json({ message: "Host not allowed" });
    }

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 7000);

    const resp = await fetch(url.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // Some CDNs respond differently without a UA.
        "user-agent": "cinema-app/1.0 (poster-resolver)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
      },
    }).finally(() => clearTimeout(t));

    const contentType = (resp.headers.get("content-type") || "").toLowerCase();
    const finalUrl = resp.url || url.toString();

    // If it's already an image, just return the final URL.
    if (contentType.startsWith("image/")) {
      return res.json({ url: finalUrl });
    }

    // If it's HTML, try to parse og:image / twitter:image.
    if (contentType.includes("text/html")) {
      // Limit reading to avoid huge downloads
      const text = await resp.text();
      const og = extractOgImage(text);
      if (!og) return res.status(422).json({ message: "Could not extract og:image" });

      let ogUrl;
      try {
        ogUrl = new URL(og, finalUrl).toString();
      } catch {
        return res.status(422).json({ message: "Invalid og:image URL" });
      }

      // Keep the same allowlist to avoid SSRF escalation.
      const ogParsed = new URL(ogUrl);
      if (!isAllowedHost(ogParsed.hostname)) {
        return res.status(400).json({ message: "Resolved host not allowed" });
      }

      return res.json({ url: ogUrl });
    }

    return res.status(415).json({ message: `Unsupported content-type: ${contentType || "unknown"}` });
  } catch (e) {
    const isAbort = e?.name === "AbortError";
    res.status(isAbort ? 504 : 500).json({ message: "Resolve failed" });
  }
});

export default router;
