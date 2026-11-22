import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const PAPER = [0xe6, 0xe7, 0xe2, 255];
const GLAZE = [0x2f, 0x5e, 0x50, 255];
const SLIP = [0xe7, 0xee, 0xe9, 255];
const BROTH = [0xe2, 0xb1, 0x3c, 255];
const WHITE = [255, 255, 255, 255];

function crc32(buffer) {
  let crc = ~0;
  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([length, name, data, crc]);
}

function encodePng(width, height, paint) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixel = sample(x, y, width, height, paint);
      const offset = row + 1 + x * 4;
      raw[offset] = pixel[0];
      raw[offset + 1] = pixel[1];
      raw[offset + 2] = pixel[2];
      raw[offset + 3] = pixel[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function over(dst, src) {
  const sourceAlpha = src[3] / 255;
  const destAlpha = dst[3] / 255;
  const alpha = sourceAlpha + destAlpha * (1 - sourceAlpha);
  if (alpha === 0) {
    return [0, 0, 0, 0];
  }
  return [
    (src[0] * sourceAlpha + dst[0] * destAlpha * (1 - sourceAlpha)) / alpha,
    (src[1] * sourceAlpha + dst[1] * destAlpha * (1 - sourceAlpha)) / alpha,
    (src[2] * sourceAlpha + dst[2] * destAlpha * (1 - sourceAlpha)) / alpha,
    alpha * 255,
  ];
}

function sample(x, y, width, height, paint) {
  const points = [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ];
  let pixel = [0, 0, 0, 0];
  for (const [ox, oy] of points) {
    pixel = over(pixel, paint((x + ox) / width, (y + oy) / height));
  }
  return pixel.map((channel) => Math.max(0, Math.min(255, Math.round(channel))));
}

function bowl(nx, ny) {
  const rim = -0.46;
  const radius = 0.8;
  const dist = Math.hypot(nx, ny - rim);
  const lip = (nx * nx) / (0.74 * 0.74) + ((ny - rim) * (ny - rim)) / (0.085 * 0.085);

  if (ny >= rim && dist <= radius && dist >= radius - 0.095) {
    return GLAZE;
  }
  if (ny >= rim && dist < radius - 0.095) {
    return ny > 0.02 ? BROTH : SLIP;
  }
  if (lip <= 1 && ny <= rim + 0.02) {
    return GLAZE;
  }
  return null;
}

function paint(background, monochrome, scale) {
  return (u, v) => {
    const nx = (u - 0.5) * scale;
    const ny = (v - 0.46) * scale;
    const hit = bowl(nx, ny);
    if (!hit) {
      return background;
    }
    if (monochrome) {
      return WHITE;
    }
    return hit;
  };
}

const assets = [
  ["assets/images/icon.png", 1024, paint(PAPER, false, 2.35)],
  ["assets/images/splash-icon.png", 512, paint([0, 0, 0, 0], false, 2.45)],
  ["assets/images/android-icon-foreground.png", 1024, paint([0, 0, 0, 0], false, 3.05)],
  ["assets/images/android-icon-monochrome.png", 1024, paint([0, 0, 0, 0], true, 3.05)],
  ["assets/images/favicon.png", 48, paint(PAPER, false, 2.2)],
];

for (const [path, size, painter] of assets) {
  writeFileSync(path, encodePng(size, size, painter));
}
