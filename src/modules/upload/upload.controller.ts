import { Controller, Post, UploadedFiles } from '@nestjs/common';
import { FastifyFilesInterceptor } from 'nest-fastify-multer';
import { User } from '@supabase/supabase-js';

import { UserRole } from '../user/enums/user.enum';
import { UseAuthGuard } from '../user/guards/auth.guard';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { UploadService } from './upload.service';
import { FileValidationPipe } from './pipes/file-validation.pipe';

const FRANCHISE_URL = 'franchises';

const fileValidationOptions = {
  maxSize: 5242880,
  fileTypes: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
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
    ownerDriverLicenseNoImgUrl?: string;
    brgyClearanceImgUrl?: string;
    voterRegRecordImgUrl?: string;
  }> {
    return this.uploadService.uploadFranchiseImages(files, +user.id);
  }
}
