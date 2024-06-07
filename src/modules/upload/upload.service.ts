import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import path from 'path';
import sharp, { AvailableFormatInfo, FitEnum, FormatEnum } from 'sharp';

import { SupabaseService } from '../core/supabase.service';

const COMPRESSION_OPTIONS = {
  width: 1024,
  height: null,
  fit: sharp.fit.inside,
  format: 'jpeg' as keyof FormatEnum,
  formatOptions: { quality: 70 },
};

@Injectable()
export class UploadService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async uploadFranchiseImages(
    files: Express.Multer.File[],
    memberId: number,
  ): Promise<{
    vehicleORImgUrl?: string;
    vehicleCRImgUrl?: string;
    todaAssocMembershipImgUrl?: string;
    ownerDriverLicenseNoImgUrl?: string;
    brgyClearanceImgUrl?: string;
    voterRegRecordImgUrl?: string;
  }> {
    if (!files?.length) {
      throw new BadRequestException('No files selected');
    }

    const baseName = files[0]?.originalname?.split('-').shift();

    const basePath = `${this.configService.get<string>(
      'SUPABASE_BASE_FOLDER_NAME',
    )}/${memberId}/${baseName}`;

    try {
      const transformedFiles = await Promise.all(
        files.map(async ({ buffer, ...moreFile }) => ({
          ...moreFile,
          buffer: await this.resize(
            buffer,
            COMPRESSION_OPTIONS.width,
            COMPRESSION_OPTIONS.height,
            COMPRESSION_OPTIONS.fit,
            COMPRESSION_OPTIONS.format,
            COMPRESSION_OPTIONS.formatOptions,
          ),
        })),
      );

      const results = await Promise.all(
        transformedFiles.map(async ({ buffer, originalname }) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [mv, key, name] = originalname.split('-');
          const filename = path.parse(name).name;
          const targetFilename = `${filename}.${COMPRESSION_OPTIONS.format}`;
          const targetPath = `${basePath}/${targetFilename}`;

          const { data } = await this.supabaseService
            .getClient()
            .storage.from(this.configService.get<string>('SUPABASE_BUCKET_ID'))
            .upload(targetPath, buffer, {
              cacheControl: '3600',
              upsert: true,
            });

          return { [key]: data.path };
        }),
      );

      return Object.assign({}, ...results);
    } catch (error) {
      throw new InternalServerErrorException(
        'An error has occured. Upload failed',
      );
    }
  }

  resize(
    input: Buffer,
    width: number | null,
    height: number | null,
    fit: keyof FitEnum,
    format: keyof FormatEnum | AvailableFormatInfo,
    formatOptions: { quality: number },
  ) {
    return sharp(input)
      .resize(width, height, {
        fit,
        withoutEnlargement: true,
      })
      .toFormat(format, formatOptions)
      .toBuffer();
  }
}
