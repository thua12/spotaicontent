/**
 * Validates a user-supplied URL to prevent SSRF attacks.
 * Blocks private/internal networks, loopback, link-local, and non-HTTP(S) schemes.
 */
export function validateUrl(rawUrl: string): URL {
  if (!rawUrl || rawUrl.length > 2048) {
    throw new Error("Invalid URL");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block loopback
  if (hostname === "localhost" || hostname === "::1") {
    throw new Error("URL not allowed");
  }

  // Block IPv4 private/reserved ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 10 ||                          // 10.0.0.0/8
      (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
      (a === 192 && b === 168) ||          // 192.168.0.0/16
      (a === 127) ||                       // 127.0.0.0/8 loopback
      (a === 169 && b === 254) ||          // 169.254.0.0/16 link-local (AWS metadata)
      a === 0                              // 0.0.0.0/8
    ) {
      throw new Error("URL not allowed");
    }
  }

  return parsed;
}
