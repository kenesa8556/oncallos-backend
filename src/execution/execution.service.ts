import { Injectable } from '@nestjs/common';
import { Diagnosis } from '../diagnosis/diagnosis.types';
import { classifyRisk, needsSnapshot } from './execution.types';
import { SnapshotsService } from '../snapshots/snapshots.service';

@Injectable()
export class ExecutionService {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  async execute(
    diagnosis: Diagnosis,
    serviceName: string,
    incidentId: string | null = null,
  ): Promise<{ status: string; message: string }> {
    const risk = classifyRisk(diagnosis.recommendedAction);

    if (risk === 'low') {
      // Check if this action modifies persistent state before executing
      if (needsSnapshot(diagnosis.recommendedAction)) {
        await this.snapshotsService.createSnapshot(incidentId, serviceName, diagnosis);
      }

      console.log(`[SIMULATED EXECUTION] Auto-executing: ${diagnosis.recommendedAction}`);
      return {
        status: 'auto_executed',
        message: `Low-risk action auto-executed: ${diagnosis.recommendedAction}`,
      };
    }

    console.log(
      `[SIMULATED SLACK ALERT] High-risk action requires approval:\n` +
      `Root cause: ${diagnosis.rootCause}\n` +
      `Recommended action: ${diagnosis.recommendedAction}\n` +
      `Confidence: ${diagnosis.confidence}\n` +
      `--> Awaiting human approval before executing.`,
    );

    return {
      status: 'pending',
      message: `High-risk action flagged for approval: ${diagnosis.recommendedAction}`,
    };
  }
}