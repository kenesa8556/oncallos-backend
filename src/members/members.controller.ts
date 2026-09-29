import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('organizations/:orgId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async list(@Param('orgId') orgId: string) {
    return this.membersService.listWithEmails(orgId);
  }

  @Post()
  async add(@Param('orgId') orgId: string, @Body('email') email: string) {
    return this.membersService.addByEmail(orgId, email);
  }

  @Delete(':userId')
  async remove(@Param('orgId') orgId: string, @Param('userId') userId: string) {
    return this.membersService.remove(orgId, userId);
  }
}