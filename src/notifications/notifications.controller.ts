import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('organizations/:orgId/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@Param('orgId') orgId: string) {
    return this.notificationsService.list(orgId);
  }

  @Patch(':id/read')
  async markRead(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.notificationsService.markRead(orgId, id);
  }

  @Patch('read-all')
  async markAllRead(@Param('orgId') orgId: string) {
    return this.notificationsService.markAllRead(orgId);
  }
}