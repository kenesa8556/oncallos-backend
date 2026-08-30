import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AgentService } from './agent.service';
import { ApiKeyGuard } from '../api-keys/api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('pending-actions')
  async getPending(@Req() request: any) {
    return this.agentService.getPendingActions(request.organizationId);
  }

  @Post('actions/:id/report')
  async report(
    @Param('id') id: string,
    @Body('status') status: 'completed' | 'failed',
    @Body('result') result: any,
    @Req() request: any,
  ) {
    return this.agentService.reportResult(request.organizationId, id, status, result);
  }
}