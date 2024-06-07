import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { CoreService } from './core.service';
import { CoreController } from './core.controller';

@Module({
  providers: [CoreService, SupabaseService],
  controllers: [CoreController],
  exports: [SupabaseService],
})
export class CoreModule {}
