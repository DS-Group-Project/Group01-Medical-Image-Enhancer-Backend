import { URL } from "url";

/**
 * Validates and sanitizes a URL to prevent SSRF and external redirects.
 * Only permits standard HTTP/HTTPS protocols and optionally blocks internal IPs/domains.
 *
 * @param {string} urlString The URL to check
 * @param {object} options Additional options (e.g., allowLocalhost)
 * @returns {string} The sanitized URL string, or throws an Error if invalid.
 */
export function sanitizeUrl(urlString, options = { allowLocalhost: false }) {
  if (!urlString) throw new Error("URL is required");

  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch (err) {
    throw new Error("Invalid URL format");
  }

  // Enforce HTTP(S) only (prevent file://, ftp://, gopher://, javascript:, data:)
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(`Unsupported protocol: ${parsedUrl.protocol}`);
  }

  // SSRF Protection: Block metadata IP, localhost, and internal ranges
  const hostname = parsedUrl.hostname.toLowerCase();

  // AWS Instance Metadata Service IP
  if (hostname === "169.254.169.254" || hostname === "[::ffff:169.254.169.254]") {
    throw new Error("Access to AWS metadata service is forbidden");
  }

  if (!options.allowLocalhost) {
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local")
    ) {
      throw new Error("Access to internal networks is forbidden");
    }

    // Basic regex for RFC 1918 private IPv4 ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    const privateIpRegex = /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)/;
    if (privateIpRegex.test(hostname)) {
      throw new Error("Access to private IP ranges is forbidden");
    }
  }

  return parsedUrl.toString();
}
