import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-incidents')
  async testIncidents() {
    const { data, error } = await this.supabaseService.client
      .from('incidents')
      .select('*')
      .limit(3);

    if (error) {
      return { error: error.message };
    }

    return { count: data.length, incidents: data };
  }
}