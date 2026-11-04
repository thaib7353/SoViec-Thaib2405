import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  chunk.writeUInt32BE(crc32(crcTarget), 8 + len);
  return chunk;
}

function generateIcon(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));
  
  const cx = width / 2;
  const cy = height / 2;
  const r = (width / 2) * (isMaskable ? 1.0 : 0.88);
  const cornerR = size * 0.22;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      // Rounded rect boundary check
      let inBounds = true;
      let alpha = 255;
      
      if (!isMaskable) {
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);
        const half = size * 0.44;
        if (dx > half || dy > half) {
          inBounds = false;
        } else if (dx > half - cornerR && dy > half - cornerR) {
          const cornerDist = Math.hypot(dx - (half - cornerR), dy - (half - cornerR));
          if (cornerDist > cornerR) inBounds = false;
        }
      }

      if (!inBounds) {
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        continue;
      }

      // Gradient from Vibrant Blue #2563EB (37, 99, 235) to Deep Indigo #1D4ED8 (29, 78, 216)
      const gradRatio = (x + y) / (width + height);
      let red = Math.round(37 * (1 - gradRatio) + 29 * gradRatio);
      let green = Math.round(99 * (1 - gradRatio) + 78 * gradRatio);
      let blue = Math.round(235 * (1 - gradRatio) + 216 * gradRatio);

      // Inner checklist sheet shape
      const sheetX = size * 0.24;
      const sheetY = size * 0.22;
      const sheetW = size * 0.52;
      const sheetH = size * 0.56;
      const sheetR = size * 0.08;

      const inSheet = (x >= sheetX && x <= sheetX + sheetW && y >= sheetY && y <= sheetY + sheetH);
      if (inSheet) {
        // White notepad sheet
        red = 255;
        green = 255;
        blue = 255;

        // Checkmark drawing in sheet center
        const checkX = size * 0.38;
        const checkY = size * 0.44;
        const distToCheckStem = Math.abs((y - checkY) - (x - checkX));
        const distToCheckLong = Math.abs((y - (checkY + size*0.1)) + (x - (checkX + size*0.1)));
        
        // Draw blue checkmark
        if (
          (x >= size * 0.35 && x <= size * 0.45 && y >= size * 0.45 && y <= size * 0.55 && Math.abs((x - size * 0.40) - (y - size * 0.50)) < size * 0.03) ||
          (x >= size * 0.42 && x <= size * 0.65 && y >= size * 0.35 && y <= size * 0.55 && Math.abs((x - size * 0.40) + (y - size * 0.55) - (size * 0.55)) < size * 0.035)
        ) {
          red = 37;
          green = 99;
          blue = 235;
        }

        // Checklist line below checkmark
        if (y >= size * 0.62 && y <= size * 0.65 && x >= size * 0.34 && x <= size * 0.66) {
          red = 147;
          green = 197;
          blue = 253;
        }
      }

      rawData[offset++] = red;
      rawData[offset++] = green;
      rawData[offset++] = blue;
      rawData[offset++] = alpha;
    }
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateIcon(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateIcon(512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateIcon(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateIcon(180));
console.log('PWA icons created successfully in public/');
