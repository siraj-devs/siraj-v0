import { getClientCredentialsToken } from "@/lib/ft-api";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl || !imageUrl.startsWith("https://cdn.intra.42.fr/")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const token = await getClientCredentialsToken();
    const response = await fetch(imageUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://profile.intra.42.fr/",
      },
      cache: "force-cache",
    });

    if (!response.ok) {
      console.error(
        "[avatar] 42 CDN fetch failed:",
        response.status,
        imageUrl,
      );
      return new NextResponse("Image fetch failed", { status: response.status });
    }

    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error("[avatar] proxy error:", error);
    return new NextResponse("Image proxy failed", { status: 502 });
  }
}
