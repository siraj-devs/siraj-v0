const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** Extract a YouTube video id from common URL shapes, or null if invalid. */
export function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    const v = url.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;

    const parts = url.pathname.split("/").filter(Boolean);
    const embedIndex = parts.findIndex(
      (p) => p === "embed" || p === "shorts" || p === "live" || p === "v",
    );
    if (embedIndex !== -1) {
      const id = parts[embedIndex + 1];
      if (id && /^[\w-]{11}$/.test(id)) return id;
    }

    return null;
  } catch {
    return null;
  }
}

export function isYoutubeUrl(input: string): boolean {
  return extractYoutubeVideoId(input) != null;
}

export function youtubeEmbedUrl(input: string): string | null {
  const id = extractYoutubeVideoId(input);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
