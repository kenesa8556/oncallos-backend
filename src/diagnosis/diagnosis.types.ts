export interface Diagnosis {
  rootCause: string;
  confidence: 'low' | 'medium' | 'high';
  recommendedAction: string;
  toolName: 'restart_service' | 'scale_replicas' | 'rollback_deployment' | 'clear_cache' | 'none';
  toolArgs: { service: string; numReplicas?: number } | null;
}

export function isDiagnosis(obj: unknown): obj is Diagnosis {
  if (typeof obj !== 'object' || obj === null) return false;
  const d = obj as any;
  return (
    typeof d.rootCause === 'string' &&
    ['low', 'medium', 'high'].includes(d.confidence) &&
    typeof d.recommendedAction === 'string' &&
    ['restart_service', 'scale_replicas', 'rollback_deployment', 'clear_cache', 'none'].includes(d.toolName)
  );
}