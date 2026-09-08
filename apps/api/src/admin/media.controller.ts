import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Response } from 'express';
import { PrismaService } from '../prisma.service';
import { SessionGuard } from './auth.controller';
import { AdminRequest, requirePermission } from './auth.service';
export function fileType(bytes: Buffer) {
  if (bytes.length > 4 * 1024 * 1024 || bytes.length < 12)
    throw new BadRequestException('Upload a PNG, JPEG, WebP or PDF up to 4 MB');
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return { mime: 'image/png', ext: 'png' };
  if (
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255 &&
    bytes[bytes.length - 2] === 255 &&
    bytes[bytes.length - 1] === 217
  )
    return { mime: 'image/jpeg', ext: 'jpg' };
  if (
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP' &&
    bytes.readUInt32LE(4) + 8 === bytes.length
  )
    return { mime: 'image/webp', ext: 'webp' };
  if (
    bytes.toString('ascii', 0, 5) === '%PDF-' &&
    bytes.subarray(-2048).includes(Buffer.from('%%EOF'))
  )
    return { mime: 'application/pdf', ext: 'pdf' };
  throw new BadRequestException(
    'Unsupported file. SVG, HTML and executables are not accepted',
  );
}
@Injectable()
export class AdminMediaService {
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}
  private directory() {
    const directory = this.config.get<string>('MEDIA_DIRECTORY');
    if (!directory)
      throw new ServiceUnavailableException(
        'Persistent media storage is not configured',
      );
    return resolve(directory);
  }
  async upload(
    req: AdminRequest,
    file?: { buffer: Buffer; originalname: string },
  ) {
    requirePermission(req.admin, 'media:write');
    if (!file?.buffer) throw new BadRequestException('Choose a file');
    const type = fileType(file.buffer);
    const directory = this.directory(),
      id = randomUUID(),
      storageKey = id + '.' + type.ext;
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(resolve(directory, storageKey), file.buffer, {
      flag: 'wx',
      mode: 0o600,
    });
    try {
      await this.db.$transaction(async (tx) => {
        await tx.media.create({
          data: {
            id,
            slug: id,
            storageKey,
            url: '/api/media/' + id,
            filename:
              file.originalname
                .replace(/[\x00-\x1f\x7f/\\]/g, '')
                .slice(0, 150) || storageKey,
            mimeType: type.mime,
            sizeBytes: file.buffer.length,
            uploadedById: req.admin.id,
            visibility: 'PRIVATE',
            translations: {
              create: {
                locale: 'EN',
                altText: 'Uploaded file — add descriptive alt text',
              },
            },
          },
        });
        await tx.adminAuditLog.create({
          data: {
            userId: req.admin.id,
            module: 'media',
            action: 'upload',
            recordId: id,
          },
        });
      });
      return { id, mimeType: type.mime };
    } catch (error) {
      await unlink(resolve(directory, storageKey)).catch(() => {});
      throw error;
    }
  }
  async file(id: string, res: Response, isPublic = false) {
    const media = await this.db.media.findUnique({ where: { id } });
    if (
      !media ||
      !media.storageKey ||
      !/^[a-f0-9-]+\.(png|jpg|webp|pdf)$/.test(media.storageKey) ||
      (isPublic && (media.visibility !== 'PUBLIC' || media.isDemo))
    )
      throw new NotFoundException();
    const path = resolve(this.directory(), media.storageKey);
    await access(path).catch(() => {
      throw new NotFoundException();
    });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader(
      'Content-Disposition',
      (media.mimeType === 'application/pdf' ? 'attachment' : 'inline') +
        '; filename="' +
        media.storageKey +
        '"',
    );
    return res.sendFile(path);
  }
}
@Controller('admin/media')
@UseGuards(SessionGuard)
export class AdminMediaController {
  constructor(private readonly media: AdminMediaService) {}
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 4 * 1024 * 1024, files: 1, fields: 0 },
    }),
  )
  upload(
    @Req() req: AdminRequest,
    @UploadedFile() file: { buffer: Buffer; originalname: string },
  ) {
    return this.media.upload(req, file);
  }
  @Get(':id/file') file(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    requirePermission(req.admin, 'media:read');
    return this.media.file(id, res);
  }
}
@Controller('media')
export class PublicMediaController {
  constructor(private readonly media: AdminMediaService) {}
  @Get(':id') file(@Param('id') id: string, @Res() res: Response) {
    return this.media.file(id, res, true);
  }
}
