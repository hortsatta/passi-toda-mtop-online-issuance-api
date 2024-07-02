import { Controller, Post, UploadedFiles } from '@nestjs/common';
import { FastifyFilesInterceptor } from 'nest-fastify-multer';
import { User } from '@supabase/supabase-js';

import { UserRole } from '../user/enums/user.enum';
import { UseAuthGuard } from '../user/guards/auth.guard';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { UploadService } from './upload.service';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import dayjs from '#/common/config/dayjs.config';

const FRANCHISE_URL = 'franchises';
const FRANCHISE_RENEWAL_URL = 'franchise-renewals';

const fileValidationOptions = {
  maxSize: 5242880,
  fileTypes: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'pdf'],
};

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(`/${FRANCHISE_URL}/docs`)
  @UseAuthGuard(UserRole.Member)
  @FastifyFilesInterceptor('files')
  async uploadFranchiseFiles(
    @UploadedFiles(new FileValidationPipe(fileValidationOptions))
    files: Express.Multer.File[],
    @CurrentUser() user: User,
  ): Promise<{
    vehicleORImgUrl?: string;
    vehicleCRImgUrl?: string;
    todaAssocMembershipImgUrl?: string;
    driverLicenseNoImgUrl?: string;
    brgyClearanceImgUrl?: string;
    voterRegRecordImgUrl?: string;
  }> {
    return this.uploadService.uploadFranchiseImages(files, +user.id);
  }

  @Post(`/${FRANCHISE_RENEWAL_URL}/docs`)
  @UseAuthGuard(UserRole.Member)
  @FastifyFilesInterceptor('files')
  async uploadFranchiseRenewalFiles(
    @UploadedFiles(new FileValidationPipe(fileValidationOptions))
    files: Express.Multer.File[],
    @CurrentUser() user: User,
  ): Promise<{
    vehicleORImgUrl?: string;
    vehicleCRImgUrl?: string;
    todaAssocMembershipImgUrl?: string;
    driverLicenseNoImgUrl?: string;
    brgyClearanceImgUrl?: string;
    voterRegRecordImgUrl?: string;
  }> {
    return this.uploadService.uploadFranchiseImages(
      files,
      +user.id,
      dayjs().format('YYYYMMDD'),
    );
  }
}
