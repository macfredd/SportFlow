import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

function parseEnvList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function matchesImageMagic(mimetype: string, buffer: Buffer): boolean {
  if (!buffer?.length) return false;
  const fn = MAGIC_CHECKERS[mimetype];
  if (fn) return fn(buffer);
  return true;
}

/** Reject bodies that only contain text (e.g. failed file path in REST Client). */
const MAGIC_CHECKERS: Record<string, (b: Buffer) => boolean> = {
  'image/png': (b) =>
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a,
  'image/jpeg': (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/gif': (b) =>
    b.length >= 6 &&
    (b.subarray(0, 6).toString('ascii') === 'GIF87a' ||
      b.subarray(0, 6).toString('ascii') === 'GIF89a'),
  'image/webp': (b) =>
    b.length >= 12 &&
    b.subarray(0, 4).toString('ascii') === 'RIFF' &&
    b.subarray(8, 12).toString('ascii') === 'WEBP',
  'image/bmp': (b) => b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d,
  'image/tiff': (b) =>
    b.length >= 4 &&
    ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00) ||
      (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a)),
  'image/x-icon': (b) =>
    b.length >= 4 && b.readUInt16LE(0) === 0 && [1, 2].includes(b.readUInt16LE(2)),
  'image/ico': (b) =>
    b.length >= 4 && b.readUInt16LE(0) === 0 && [1, 2].includes(b.readUInt16LE(2)),
};

@Injectable()
export class ImageFileValidatorPipe implements PipeTransform<
  Express.Multer.File | undefined,
  Express.Multer.File
> {
  constructor(private readonly configService: ConfigService) {}

  transform(
    value: Express.Multer.File | undefined,
  ): Express.Multer.File {
    if (!value) {
      throw new BadRequestException('No file uploaded');
    }

    const maxSize = parseInt(
      this.configService.get<string>('IMAGES_MAX_SIZE') ?? '10485760',
      10,
    );
    if (Number.isNaN(maxSize) || value.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds the maximum allowed size of ${maxSize} bytes`,
      );
    }

    const allowedMimeTypes = parseEnvList(
      this.configService.get<string>('IMAGES_ALLOWED_MIME_TYPES'),
    );
    const mime = (value.mimetype ?? '').toLowerCase();
    const originalName = value.originalname ?? '';
    const ext = path.extname(originalName).slice(1).toLowerCase();
    const extLabel = ext ? `.${ext}` : '(no extension)';

    if (allowedMimeTypes.length && !allowedMimeTypes.includes(mime)) {
      throw new BadRequestException(
        `Type "${mime}" is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    const allowedExtensions = parseEnvList(
      this.configService.get<string>('IMAGES_ALLOWED_EXTENSIONS'),
    );
    if (allowedExtensions.length && !allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Type "${extLabel}" is not allowed. Allowed extensions: .${allowedExtensions.join(', .')}`,
      );
    }

    const buf = value.buffer as Buffer | undefined;
    if (!buf?.length) {
      throw new BadRequestException('File payload is empty');
    }
    if (!matchesImageMagic(mime, buf)) {
      throw new BadRequestException(
        `File content does not match declared image type "${mime}" for ${extLabel}${originalName ? ` ("${originalName}")` : ''}`,
      );
    }

    return value;
  }
}
