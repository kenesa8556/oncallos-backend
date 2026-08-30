import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('organizations/:orgId/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async list(@Param('orgId') orgId: string) {
    return this.apiKeysService.list(orgId);
  }

  @Post()
  async create(@Param('orgId') orgId: string, @Body('name') name: string) {
    return this.apiKeysService.create(orgId, name);
  }

  @Delete(':keyId')
  async revoke(@Param('orgId') orgId: string, @Param('keyId') keyId: string) {
    return this.apiKeysService.revoke(orgId, keyId);
  }
}