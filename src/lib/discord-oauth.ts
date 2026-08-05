import env from "@/env";

export const DISCORD_OAUTH_CONFIG = {
  clientId: env.DISCORD_CLIENT_ID,
  clientSecret: env.DISCORD_CLIENT_SECRET,
  redirectUri: `${env.APP_URL}/api/auth/callback/discord`,
  authorizationUrl: "https://discord.com/api/oauth2/authorize",
  tokenUrl: "https://discord.com/api/oauth2/token",
  userInfoUrl: "https://discord.com/api/users/@me",
};

export type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  email: string | null;
};

export function getDiscordAvatarUrl(
  id: string,
  avatar: string | null,
): string | null {
  if (avatar) {
    const ext = avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${ext}`;
  }

  try {
    const index = Number(BigInt(id) % BigInt(6));
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  } catch {
    return null;
  }
}

export function getDiscordAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: DISCORD_OAUTH_CONFIG.clientId,
    redirect_uri: DISCORD_OAUTH_CONFIG.redirectUri,
    response_type: "code",
    scope: "identify email",
    ...(state && { state }),
  });

  return `${DISCORD_OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
}

export async function exchangeDiscordCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}> {
  const response = await fetch(DISCORD_OAUTH_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: DISCORD_OAUTH_CONFIG.clientId,
      client_secret: DISCORD_OAUTH_CONFIG.clientSecret,
      code,
      redirect_uri: DISCORD_OAUTH_CONFIG.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Discord code for token");
  }

  return response.json();
}

export async function getDiscordUserInfo(
  accessToken: string,
): Promise<DiscordUser | null> {
  const response = await fetch(DISCORD_OAUTH_CONFIG.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;

  return response.json();
}
