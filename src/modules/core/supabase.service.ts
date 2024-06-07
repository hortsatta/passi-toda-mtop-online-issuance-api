import { Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
  private supabaseClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  getClient() {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }

    this.supabaseClient = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_API_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );

    return this.supabaseClient;
  }
}
