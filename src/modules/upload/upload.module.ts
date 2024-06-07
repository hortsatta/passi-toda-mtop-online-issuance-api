import { Module } from '@nestjs/common';
import { SupabaseService } from '../core/supabase.service';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  providers: [UploadService, SupabaseService],
  controllers: [UploadController],
})
export class UploadModule {}
