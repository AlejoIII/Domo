import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { extname } from 'path';
import type { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import {
  getMaxUploadBytes,
  getMaxUploadMb,
  isAllowedAttachmentFile,
} from './upload.config';
import { StorageService } from '../storage/storage.service';
import { generateStorageKey } from '../storage/storage.utils';

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_MIME = /^image\/(jpeg|jpg|png|webp|gif|pjpeg|x-png)$/i;

type UploadFileMeta = Pick<Express.Multer.File, 'mimetype' | 'originalname'>;

function isAllowedImage(file: UploadFileMeta) {
  if (ALLOWED_MIME.test(file.mimetype)) return true;
  return ALLOWED_EXT.has(extname(file.originalname).toLowerCase());
}

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Get('signed-url')
  async getSignedUrl(@Query('path') path: string) {
    if (!path) throw new BadRequestException('path es obligatorio');
    await this.storage.assertExistsByPath(path);
    const url = await this.storage.getSignedDownloadUrlByPath(path);
    const expiresAt = new Date(Date.now() + this.storage.getSignedUrlTtl() * 1000).toISOString();
    return {
      url,
      expiresAt,
      driver: this.storage.getDriver(),
    };
  }

  @Get('download')
  async download(@Query('path') path: string, @Res() res: Response) {
    if (!path) throw new BadRequestException('path es obligatorio');
    await this.storage.assertExistsByPath(path);
    const url = await this.storage.getSignedDownloadUrlByPath(path);
    return res.redirect(url);
  }

  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!isAllowedImage(file)) {
          cb(new BadRequestException('Solo imágenes JPEG, PNG, WebP o GIF') as unknown as Error, false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ninguna imagen');
    const key = generateStorageKey(file.originalname);
    const stored = await this.storage.upload(file.buffer, key, file.mimetype);
    return { url: stored.url, driver: this.storage.getDriver() };
  }

  @Post('file')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!isAllowedAttachmentFile(file)) {
          cb(
            new BadRequestException(
              'Tipo no permitido. Usa PDF, imágenes, Word, Excel, TXT o CSV',
            ) as unknown as Error,
            false,
          );
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: getMaxUploadBytes() },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const maxMb = getMaxUploadMb();
    if (file.size > getMaxUploadBytes()) {
      throw new BadRequestException(`El archivo supera el límite de ${maxMb} MB`);
    }
    const key = generateStorageKey(file.originalname);
    const stored = await this.storage.upload(file.buffer, key, file.mimetype);
    return {
      url: stored.url,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      driver: this.storage.getDriver(),
    };
  }
}
