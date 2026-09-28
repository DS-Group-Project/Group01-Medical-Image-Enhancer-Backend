import fs from "fs";

export async function validateFileSignature(filePath) {
  const fd = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(132); // Read enough for DICOM (128 preamble + 4 DICM)
    const { bytesRead } = await fd.read(buffer, 0, 132, 0);

    if (bytesRead >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }

    if (bytesRead >= 8 &&
        buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
        buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a) {
      return "image/png";
    }

    if (bytesRead >= 12) {
      const riff = buffer.toString('ascii', 0, 4);
      const webp = buffer.toString('ascii', 8, 12);
      if (riff === "RIFF" && webp === "WEBP") {
        return "image/webp";
      }
    }

    if (bytesRead >= 132) {
      const dicm = buffer.toString('ascii', 128, 132);
      if (dicm === "DICM") {
        return "image/dicom"; // Standardize to image/dicom internally if we want, or just return true
      }
    }

    return null;
  } finally {
    await fd.close();
  }
}
