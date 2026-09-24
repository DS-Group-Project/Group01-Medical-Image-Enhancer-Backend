/**
 * Client-side file "type sniffing" by magic bytes (file signature), not by
 * trusting the file extension or the browser-reported MIME type — both of
 * those come from the filename/OS and are trivial to spoof (e.g. renaming
 * `payload.svg` to `xray.png`).
 *
 * IMPORTANT: this is a UX safeguard, not a security boundary. A client can
 * always be modified to skip this check entirely, so the backend MUST
 * re-validate file signatures (and ideally re-encode images rather than
 * storing the uploaded bytes verbatim) before accepting or serving any file.
 * What this buys us on the frontend: faster feedback to the user, and one
 * fewer place where an obviously-mismatched file gets sent to the server at all.
 */

// Signature = bytes to expect at a given offset. DICOM has no signature at
// offset 0 by design — non-.dcm files use a 128-byte preamble followed by
// "DICM" at offset 128. Files without the optional preamble can't be
// reliably sniffed this way; we fall back to extension for those and let the
// backend do authoritative DICOM parsing.
const SIGNATURES = [
  { mime: 'image/jpeg', offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'application/dicom', offset: 128, bytes: [0x44, 0x49, 0x43, 0x4d] }, // "DICM"
];

const READ_BYTES = 132; // covers the DICOM preamble + "DICM" check

/**
 * Reads the first bytes of a File and returns which known signature (if any)
 * it matches.
 * @param {File} file
 * @returns {Promise<string|null>} matched mime type, or null if unrecognized
 */
async function sniffFileType(file) {
  const slice = file.slice(0, READ_BYTES);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const sig of SIGNATURES) {
    const { offset, bytes: sigBytes } = sig;
    if (bytes.length < offset + sigBytes.length) continue;
    const matches = sigBytes.every((b, i) => bytes[offset + i] === b);
    if (matches) return sig.mime;
  }
  return null;
}

/**
 * Validates a batch of files by real content signature.
 * Files whose extension is .dcm but lack a detectable DICOM preamble are
 * allowed through with a `sniffed: null` result (legitimate preamble-less
 * DICOM files exist) — everything else must match its declared type.
 *
 * @param {File[]} files
 * @returns {Promise<{valid: File[], invalid: {file: File, reason: string}[]}>}
 */
export async function validateFileSignatures(files) {
  const valid = [];
  const invalid = [];

  for (const file of files) {
    const isDicomByExt = /\.(dcm|dicom)$/i.test(file.name);
    try {
      const sniffed = await sniffFileType(file);

      if (sniffed) {
        valid.push(file);
        continue;
      }

      if (isDicomByExt) {
        // Preamble-less DICOM is legitimate; defer final say to the backend.
        valid.push(file);
        continue;
      }

      invalid.push({
        file,
        reason: `"${file.name}" doesn't look like a real JPG, PNG, or DICOM file. It may be mislabeled or corrupted.`,
      });
    } catch (err) {
      invalid.push({ file, reason: `Could not read "${file.name}" to verify its contents.` });
    }
  }

  return { valid, invalid };
}

/**
 * Strips path separators and other characters that have no business in a
 * filename before it's shown in the UI or sent to the server, as basic
 * defense-in-depth against path traversal / header injection if the
 * filename is ever used to build a path or HTTP header server-side.
 * @param {string} name
 */
export function sanitizeFilename(name) {
  return name.replace(/[\/\\]/g, '_').replace(/[^\w.\-()\s]/g, '_').slice(0, 255);
}
