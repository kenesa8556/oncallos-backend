import { Module } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import {SnapshotsModule} from '../snapshots/snapshots.module'

@Module({
    imports: [SnapshotsModule],
  providers: [ExecutionService],
  exports: [ExecutionService],
})
export class ExecutionModule {}