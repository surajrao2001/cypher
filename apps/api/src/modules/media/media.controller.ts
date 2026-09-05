import { createReadStream } from 'node:fs';
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from '../../common/auth/public.decorator';
import { MediaService } from './media.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('posters')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload an event poster image (auth required)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  async uploadPoster(@Req() request: FastifyRequest) {
    const file = await request.file();
    if (!file) {
      throw new BadRequestException('Expected multipart field "file"');
    }
    return this.media.savePosterFromUpload(file);
  }

  @Get('posters/:filename')
  @Public()
  @ApiOperation({ summary: 'Serve a stored poster image' })
  async getPoster(
    @Param('filename') filename: string,
    @Res({ passthrough: false }) reply: FastifyReply,
  ) {
    const path = this.media.resolvePosterPath(filename);
    if (!path) {
      throw new NotFoundException('Poster not found');
    }
    const stream = createReadStream(path);
    const ext = filename.split('.').pop()?.toLowerCase();
    const type =
      ext === 'png'
        ? 'image/png'
        : ext === 'webp'
          ? 'image/webp'
          : ext === 'gif'
            ? 'image/gif'
            : 'image/jpeg';
    return reply.type(type).header('Cache-Control', 'public, max-age=86400').send(stream);
  }
}
