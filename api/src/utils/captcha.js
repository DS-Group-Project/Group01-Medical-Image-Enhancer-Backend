/**
 * CAPTCHA / Bot-Protection Skeleton
 * 
 * Provides utility functions to verify tokens from Cloudflare Turnstile,
 * Google reCAPTCHA, or hCaptcha.
 */

export async function verifyCaptcha(token, ipAddress) {
  if (!token) {
    return { success: false, error: "Missing CAPTCHA token" };
  }

  // If CAPTCHA is disabled in environment, always return true (useful for local dev/testing)
  if (process.env.ENABLE_CAPTCHA !== "true") {
    return { success: true };
  }

  const secretKey = process.env.CAPTCHA_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CAPTCHA_SECRET_KEY is not configured");
  }

  try {
    // Example using Cloudflare Turnstile (drop-in replacement for reCAPTCHA/hCaptcha)
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ipAddress) {
      formData.append('remoteip', ipAddress);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: data['error-codes']?.join(", ") || "Verification failed" };
    }
  } catch (err) {
    return { success: false, error: "Network error during CAPTCHA verification" };
  }
}

/**
 * Express Middleware to enforce CAPTCHA verification on sensitive routes (e.g. /login, /register).
 */
export async function requireCaptcha(req, res, next) {
  if (process.env.ENABLE_CAPTCHA !== "true") {
    return next();
  }

  const token = req.headers['x-captcha-token'] || req.body.captchaToken;
  
  const result = await verifyCaptcha(token, req.ip);
  if (!result.success) {
    return res.status(403).json({ error: "CAPTCHA_FAILED", details: result.error });
  }

  next();
}
