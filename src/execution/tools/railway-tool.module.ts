import { Module } from '@nestjs/common';
import { RailwayTool } from './railway.tool';

@Module({
  providers: [RailwayTool],
  exports: [RailwayTool],
})
export class RailwayToolModule {}