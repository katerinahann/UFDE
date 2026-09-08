import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID, createHash } from 'node:crypto';
import type { Response } from 'express';
import { PrismaService } from '../prisma.service';
import { SessionGuard } from './auth.controller';
import { AdminRequest, requirePermission } from './auth.service';
import { MediaStorage } from '../media/storage.service';
import { prepareImages, purposes, Purpose } from '../media/images';
export { fileType } from '../media/images';
@Injectable()
export class AdminMediaService {
  private processing = 0;
  constructor(
    private readonly db: PrismaService,
    private readonly storage: MediaStorage,
  ) {}
  async upload(
    req: AdminRequest,
    file?: { buffer: Buffer; originalname: string },
    purpose: Purpose = 'GENERAL',
  ) {
    requirePermission(req.admin, 'media:write');
    if (!file?.buffer) throw new BadRequestException('Choose a file');
    if (!purposes.includes(purpose))
      throw new BadRequestException('Invalid image purpose');
    if (this.processing >= 2)
      throw new HttpException(
        'Image processing is busy. Try again shortly.',
        429,
      );
    const location = this.storage.location();
    this.processing++;
    const written: string[] = [];
    try {
      const { renditions, width, height, warnings } = await prepareImages(
        file.buffer,
        purpose,
      );
      const id = randomUUID();
      const variants: {
        name: string;
        format: string;
        storageKey: string;
        url: string;
        mimeType: string;
        width?: number;
        height?: number;
        sizeBytes: number;
      }[] = [];
      for (const item of renditions) {
        if (item.bytes.length > 4 * 1024 * 1024)
          throw new BadRequestException(
            'A generated variant exceeds 4 MB; upload a smaller source',
          );
        const storageKey = `${id}/${item.name}.${item.format}`;
        written.push(storageKey);
        await this.storage.put(location, storageKey, item.bytes, item.mimeType);
        variants.push({
          name: item.name,
          format: item.format,
          storageKey,
          url: `/api/media/${id}?size=${item.name}&format=${item.format}`,
          mimeType: item.mimeType,
          width: item.width,
          height: item.height,
          sizeBytes: item.bytes.length,
        });
      }
      const original = variants[0],
        preferred =
          original.format === 'pdf' || original.format === 'svg'
            ? original
            : variants.find(
                (v) =>
                  v.name === 'large' &&
                  v.format === (purpose === 'LOGO' ? 'png' : 'webp'),
              )!;
      await this.db.$transaction(async (tx) => {
        await tx.media.create({
          data: {
            id,
            slug: id,
            ...location,
            purpose,
            storageKey: original.storageKey,
            url: preferred.url,
            filename:
              file.originalname
                .replace(/[\x00-\x1f\x7f/\\]/g, '')
                .slice(0, 150) || original.storageKey,
            mimeType: original.mimeType,
            sizeBytes: original.sizeBytes,
            width,
            height,
            sha256: createHash('sha256')
              .update(renditions[0].bytes)
              .digest('hex'),
            uploadedById: req.admin.id,
            visibility: 'PRIVATE',
            variants: { create: variants },
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
      return {
        id,
        url: preferred.url,
        mimeType: original.mimeType,
        width,
        height,
        warnings,
        variants: variants.map(({ storageKey, ...variant }) => variant),
      };
    } catch (error) {
      for (const key of written)
        await this.storage
          .remove(location, key)
          .catch(() =>
            Logger.warn(
              'Media rollback left an object requiring cleanup',
              'Media',
            ),
          );
      throw error;
    } finally {
      this.processing--;
    }
  }
  async file(
    id: string,
    res: Response,
    isPublic = false,
    size = 'original',
    format?: string,
  ) {
    if (
      !['original', 'thumbnail', 'medium', 'large'].includes(size) ||
      (format && !['png', 'jpg', 'webp', 'avif', 'svg', 'pdf'].includes(format))
    )
      throw new BadRequestException('Invalid media variant');
    const media = await this.db.media.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (
      !media?.storageKey ||
      (isPublic && (media.visibility !== 'PUBLIC' || media.isDemo))
    )
      throw new NotFoundException();
    const variant = media.variants.find(
      (v) => v.name === size && (!format || v.format === format),
    );
    if (!variant && (size !== 'original' || media.variants.length))
      throw new NotFoundException();
    let bytes: Buffer;
    try {
      bytes = await this.storage.get(
        media,
        variant?.storageKey || media.storageKey,
      );
    } catch (error) {
      if (
        (error as { code?: string }).code === 'ENOENT' ||
        (error as { name?: string }).name === 'NoSuchKey'
      )
        throw new NotFoundException();
      throw error;
    }
    const mime = variant?.mimeType || media.mimeType;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader(
      'Content-Disposition',
      (mime === 'application/pdf' ? 'attachment' : 'inline') +
        '; filename="' +
        (variant?.storageKey || media.storageKey).split('/').pop() +
        '"',
    );
    return res.send(bytes);
  }
}
@Controller('admin/media')
@UseGuards(SessionGuard)
export class AdminMediaController {
  constructor(private readonly media: AdminMediaService) {}
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 4 * 1024 * 1024,
        files: 1,
        fields: 1,
        fieldSize: 100,
      },
    }),
  )
  upload(
    @Req() req: AdminRequest,
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @Body('purpose') purpose?: Purpose,
  ) {
    return this.media.upload(req, file, purpose);
  }
  @Get(':id/file') file(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Res() res: Response,
    @Query('size') size?: string,
    @Query('format') format?: string,
  ) {
    requirePermission(req.admin, 'media:read');
    return this.media.file(id, res, false, size, format);
  }
}
@Controller('media')
export class PublicMediaController {
  constructor(private readonly media: AdminMediaService) {}
  @Get(':id') file(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('size') size?: string,
    @Query('format') format?: string,
  ) {
    return this.media.file(id, res, true, size, format);
  }
}
