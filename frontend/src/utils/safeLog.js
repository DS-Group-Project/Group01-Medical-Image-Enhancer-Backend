/**
 * A thin wrapper around console.* (and, later, whatever error-tracking
 * service gets wired in) that strips fields likely to contain PHI before
 * anything leaves the browser's memory for a log sink.
 *
 * Why this exists: it's easy to write `console.error('upload failed', job)`
 * during development and forget that `job` contains a patient-identifying
 * filename, an image URL, or similar — and once that's in a shipped build,
 * every browser console, and every error-tracking service the console gets
 * piped to, has that data. This doesn't try to be a perfect PHI detector; it
 * removes an explicit list of known-sensitive keys and truncates the rest so
 * that "wait, this dashboard has patient identifiers in it" doesn't happen.
 *
 * Use this in place of console.log/console.error for anything that touches
 * job/file/user data. Plain "something broke, no data attached" logs can
 * still use console.* directly.
 */

const SENSITIVE_KEYS = [
  'filename', 'fileName', 'file',
  'originalUrl', 'enhancedUrl', 'url', 'imageUrl', 'src',
  'email', 'name', 'patientName', 'patientId', 'dob', 'dateOfBirth',
  'password', 'token', 'ssn',
];

function scrub(value, depth = 0) {
  if (depth > 4) return '[truncated]';

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((v) => scrub(v, depth + 1));
  }

  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.some((k) => key.toLowerCase() === k.toLowerCase())) {
        out[key] = '[redacted]';
      } else {
        out[key] = scrub(val, depth + 1);
      }
    }
    return out;
  }

  if (typeof value === 'string' && value.length > 300) {
    return `${value.slice(0, 300)}...[truncated]`;
  }

  return value;
}

/**
 * @param {string} message
 * @param {*} [data] - any object/array/value to log alongside the message; sensitive fields are redacted
 */
export const safeLog = {
  info: (message, data) => {
    if (data !== undefined) {
      // eslint-disable-next-line no-console
      console.log(message, scrub(data));
    } else {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  },
  error: (message, data) => {
    if (data !== undefined) {
      console.error(message, scrub(data));
    } else {
      console.error(message);
    }
    // TODO: once an error-tracking service (Sentry, etc.) is wired in,
    // forward `message` + the *scrubbed* data here too — never the raw value.
  },
};

export default safeLog;
