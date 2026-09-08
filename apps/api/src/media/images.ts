import sharp, { type Metadata } from 'sharp';
import { SaxesParser } from 'saxes';
import { BadRequestException } from '@nestjs/common';
export const purposes = [
  'GENERAL',
  'HERO',
  'ACTIVITY_PROJECT',
  'PORTRAIT',
  'LOGO',
  'DOCUMENT',
] as const;
export type Purpose = (typeof purposes)[number];
export type Rendition = {
  name: string;
  format: string;
  mimeType: string;
  bytes: Buffer;
  width?: number;
  height?: number;
};
const allowedTags = new Set(
  'svg g defs path rect circle ellipse line polyline polygon title desc text tspan linearGradient radialGradient stop clipPath mask symbol use'.split(
    ' ',
  ),
);
const allowedAttributes = new Set(
  'xmlns xmlns:xlink id viewBox width height x y x1 y1 x2 y2 cx cy r rx ry d points fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity transform gradientTransform gradientUnits spreadMethod offset stop-color stop-opacity clip-path clip-rule mask maskUnits maskContentUnits preserveAspectRatio href xlink:href font-family font-size font-weight text-anchor dominant-baseline dx dy'.split(
    ' ',
  ),
);
const escape = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
export function safeSvg(bytes: Buffer) {
  if (bytes.length > 1024 * 1024)
    throw new BadRequestException('SVG logos must be smaller than 1 MB');
  let input: string;
  try {
    input = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new BadRequestException('Invalid SVG encoding');
  }
  const output: string[] = [];
  let root = false,
    nodes = 0,
    depth = 0;
  const reject = () => {
    throw new BadRequestException(
      'SVG must contain static vector artwork only; remove scripts, styles, embedded images and external resources',
    );
  };
  const parser = new SaxesParser();
  parser.on('doctype', reject);
  parser.on('processinginstruction', reject);
  parser.on('error', reject);
  parser.on('opentag', (tag) => {
    if (++nodes > 10000 || ++depth > 64 || !allowedTags.has(tag.name)) reject();
    if (!root) {
      if (tag.name !== 'svg') reject();
      root = true;
    }
    output.push('<' + tag.name);
    for (const [name, value] of Object.entries(tag.attributes)) {
      if (!allowedAttributes.has(name)) reject();
      const v = String(value);
      if (
        /(?:javascript:|data:|https?:|\/\/)/i.test(v) &&
        !name.startsWith('xmlns')
      )
        reject();
      if (
        name.startsWith('xmlns') &&
        ![
          'http://www.w3.org/2000/svg',
          'http://www.w3.org/1999/xlink',
        ].includes(v)
      )
        reject();
      if ((name === 'href' || name === 'xlink:href') && !/^#[\w.-]+$/.test(v))
        reject();
      if (/url\s*\(/i.test(v) && !/^url\(\s*#[\w.-]+\s*\)$/.test(v)) reject();
      output.push(' ' + name + '="' + escape(v) + '"');
    }
    output.push('>');
  });
  parser.on('closetag', (tag) => {
    depth--;
    output.push('</' + tag.name + '>');
  });
  parser.on('text', (text) => output.push(escape(text)));
  parser.on('cdata', reject);
  try {
    parser.write(input).close();
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    reject();
  }
  if (!root) reject();
  return Buffer.from(output.join(''));
}
export function fileType(bytes: Buffer) {
  if (bytes.length > 4 * 1024 * 1024 || bytes.length < 12)
    throw new BadRequestException('Upload an image or PDF up to 4 MB');
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return { mime: 'image/png', ext: 'png' };
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return { mime: 'image/jpeg', ext: 'jpg' };
  if (
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  )
    return { mime: 'image/webp', ext: 'webp' };
  if (
    bytes.toString('ascii', 4, 8) === 'ftyp' &&
    /avif|avis/.test(bytes.toString('ascii', 8, 32))
  )
    return { mime: 'image/avif', ext: 'avif' };
  if (
    bytes.toString('ascii', 0, 5) === '%PDF-' &&
    bytes.subarray(-2048).includes(Buffer.from('%%EOF'))
  )
    return { mime: 'application/pdf', ext: 'pdf' };
  if (
    /^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[^]*?-->\s*)?<svg[\s>]/.test(
      bytes.toString('utf8', 0, 4096),
    )
  ) {
    safeSvg(bytes);
    return { mime: 'image/svg+xml', ext: 'svg' };
  }
  throw new BadRequestException('Unsupported file type');
}
export async function prepareImages(bytes: Buffer, purpose: Purpose) {
  const type = fileType(bytes);
  if (type.ext === 'pdf') {
    if (purpose !== 'DOCUMENT' && purpose !== 'GENERAL')
      throw new BadRequestException('Choose an image for this use');
    return {
      renditions: [
        { name: 'original', format: 'pdf', mimeType: type.mime, bytes },
      ] as Rendition[],
      width: undefined,
      height: undefined,
      warnings: [] as string[],
    };
  }
  if (type.ext === 'svg' && purpose !== 'LOGO')
    throw new BadRequestException(
      'SVG uploads are reserved for official logos',
    );
  if (purpose === 'DOCUMENT')
    throw new BadRequestException('Choose a PDF document');
  const source = type.ext === 'svg' ? safeSvg(bytes) : bytes;
  const options = { limitInputPixels: 40_000_000, failOn: 'warning' as const };
  let metadata: Metadata;
  try {
    metadata = await sharp(source, options).metadata();
  } catch {
    throw new BadRequestException(
      'Image cannot be decoded or exceeds 40 megapixels',
    );
  }
  if ((metadata.pages || 1) > 1)
    throw new BadRequestException('Use a still image, not an animation');
  const rotated = [5, 6, 7, 8].includes(metadata.orientation || 0);
  const width = rotated ? metadata.height : metadata.width,
    height = rotated ? metadata.width : metadata.height;
  if (!width || !height)
    throw new BadRequestException('Image dimensions could not be read');
  if (purpose === 'HERO' && (width < 1920 || height < 800)) throw new BadRequestException('Hero sources must be at least 1920 × 800 pixels; upload a larger original');
  const recommendation =
    purpose === 'HERO'
      ? [1920, 800]
      : purpose === 'ACTIVITY_PROJECT'
        ? [1600, 1000]
        : purpose === 'PORTRAIT'
          ? [1000, 1200]
          : null;
  const warnings =
    recommendation && (width < recommendation[0] || height < recommendation[1])
      ? [
          `Source is ${width}×${height}; ${recommendation[0]}×${recommendation[1]} or larger is preferred. No upscaling was applied.`,
        ]
      : [];
  const renditions: Rendition[] = [
    {
      name: 'original',
      format: type.ext,
      mimeType: type.mime,
      bytes: source,
      width,
      height,
    },
  ];
  for (const [name, bound] of [
    ['thumbnail', 320],
    ['medium', 960],
    ['large', 2400],
  ] as const) {
    for (const format of purpose === 'LOGO'
      ? (['webp', 'png'] as const)
      : (['webp', 'avif'] as const)) {
      try {
        let pipeline = sharp(source, options)
          .rotate()
          .resize({
            width: bound,
            height: bound,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .timeout({ seconds: 15 });
        pipeline =
          format === 'png'
            ? pipeline.png({ compressionLevel: 9 })
            : format === 'webp'
              ? pipeline.webp(
                  purpose === 'LOGO' ? { lossless: true } : { quality: 82 },
                )
              : pipeline.avif({ quality: 55, effort: 3 });
        const result = await pipeline.toBuffer({ resolveWithObject: true });
        renditions.push({
          name,
          format,
          mimeType: 'image/' + format,
          bytes: result.data,
          width: result.info.width,
          height: result.info.height,
        });
      } catch {
        throw new BadRequestException(
          'Image optimisation failed; check the uploaded source',
        );
      }
    }
  }
  return { renditions, width, height, warnings };
}
