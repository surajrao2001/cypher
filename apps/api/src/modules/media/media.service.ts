import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { Env } from '../../config/env.validation';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class MediaService {
  private readonly postersDir: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.postersDir = join(process.cwd(), 'storage', 'posters');
    if (!existsSync(this.postersDir)) {
      mkdirSync(this.postersDir, { recursive: true });
    }
  }

  postersAbsoluteDir(): string {
    return this.postersDir;
  }

  publicUrlForPoster(filename: string): string {
    const base = this.config.get('PUBLIC_API_URL', { infer: true }).replace(/\/$/, '');
    const prefix = this.config.get('API_PREFIX', { infer: true }).replace(/^\/|\/$/g, '');
    return `${base}/${prefix}/media/posters/${encodeURIComponent(filename)}`;
  }

  resolvePosterPath(filename: string): string | null {
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return null;
    }
    const full = join(this.postersDir, filename);
    if (!full.startsWith(this.postersDir) || !existsSync(full)) {
      return null;
    }
    return full;
  }

  async savePosterFromUpload(file: {
    mimetype: string;
    filename?: string;
    file: NodeJS.ReadableStream;
  }): Promise<{ url: string; filename: string }> {
    const mime = file.mimetype.toLowerCase();
    if (!ALLOWED_MIME.has(mime)) {
      throw new BadRequestException('Poster must be JPEG, PNG, WebP, or GIF');
    }
    const ext = EXT_BY_MIME[mime] ?? 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const dest = join(this.postersDir, filename);
    await pipeline(file.file, createWriteStream(dest));
    return { filename, url: this.publicUrlForPoster(filename) };
  }

  async deletePosterFile(filename: string): Promise<void> {
    const path = this.resolvePosterPath(filename);
    if (path) {
      await unlink(path).catch(() => undefined);
    }
  }
}
