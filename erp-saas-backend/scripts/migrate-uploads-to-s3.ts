/**
 * Migra ficheros locales de ./uploads a S3.
 * Uso: STORAGE_DRIVER=s3 S3_BUCKET=... npx ts-node scripts/migrate-uploads-to-s3.ts
 */
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { S3StorageDriver } from '../src/common/storage/drivers/s3.storage';

async function main() {
  const config = new ConfigService();
  if (config.get('STORAGE_DRIVER', 'local') !== 's3') {
    console.error('Define STORAGE_DRIVER=s3 antes de ejecutar la migración.');
    process.exit(1);
  }

  const driver = new S3StorageDriver(config);
  const uploadDir = join(process.cwd(), 'uploads');
  const prisma = new PrismaClient();

  const files = await readdir(uploadDir);
  let uploaded = 0;
  let skipped = 0;

  const mimeByExt: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf',
  };

  for (const filename of files) {
    if (filename.startsWith('.')) continue;
    const key = filename;
    const exists = await driver.exists(key);
    if (exists) {
      skipped += 1;
      continue;
    }
    const buffer = await readFile(join(uploadDir, filename));
    const ext = extname(filename).toLowerCase();
    const contentType = mimeByExt[ext] || 'application/octet-stream';
    await driver.upload(buffer, key, contentType);
    uploaded += 1;
    console.log(`Subido: ${key}`);
  }

  const pathPrefix = '/uploads/';
  const attachments = await prisma.attachment.findMany({
    where: { fileUrl: { startsWith: pathPrefix } },
    select: { id: true, fileUrl: true },
  });
  console.log(`Adjuntos referenciados: ${attachments.length}`);

  const products = await prisma.product.count({
    where: { imageUrl: { startsWith: pathPrefix } },
  });
  console.log(`Productos con imagen local: ${products}`);

  console.log(`Migración completada. Subidos: ${uploaded}, omitidos (ya en S3): ${skipped}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
