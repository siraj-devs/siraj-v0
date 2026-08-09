/** OAuth `state` helpers — plain redirect path, or `link:<path>` for account linking. */

export function encodeOAuthState(options: {
  redirect?: string;
  link?: boolean;
}): string {
  const redirect =
    options.redirect &&
    options.redirect.startsWith("/") &&
    !options.redirect.startsWith("//")
      ? options.redirect
      : "/";
  return encodeURIComponent(
    options.link ? `link:${redirect}` : redirect,
  );
}

export function parseOAuthState(state: string | null | undefined): {
  link: boolean;
  redirect: string;
} {
  if (!state) return { link: false, redirect: "/" };

  let decoded = state;
  try {
    decoded = decodeURIComponent(state);
  } catch {
    decoded = state;
  }

  if (decoded.startsWith("link:")) {
    const path = decoded.slice("link:".length) || "/profile";
    return {
      link: true,
      redirect:
        path.startsWith("/") && !path.startsWith("//") ? path : "/profile",
    };
  }

  return {
    link: false,
    redirect:
      decoded.startsWith("/") && !decoded.startsWith("//") ? decoded : "/",
  };
}

export function profileLinkErrorUrl(
  requestUrl: string,
  code: string,
  redirect = "/profile",
): URL {
  const url = new URL(redirect, requestUrl);
  url.searchParams.set("link_error", code);
  return url;
}

export function profileLinkedUrl(
  requestUrl: string,
  provider: "42" | "discord",
  redirect = "/profile",
): URL {
  const url = new URL(redirect, requestUrl);
  url.searchParams.set("linked", provider);
  return url;
}
