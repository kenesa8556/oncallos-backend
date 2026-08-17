export interface Diagnosis {
  rootCause: string;
  confidence: "low" | "medium" | "high";
  recommendedAction: string;
}

export function isDiagnosis(value: unknown): value is Diagnosis {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.rootCause === "string" &&
    (obj.confidence === "low" || obj.confidence === "medium" || obj.confidence === "high") &&
    typeof obj.recommendedAction === "string"
  );
}