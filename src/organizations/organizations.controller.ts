import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @UseGuards(SupabaseAuthGuard)
  @Post()
  async create(@Body('name') name: string, @CurrentUser() user) {
    return this.organizationsService.create(name, user.id);
  }
}