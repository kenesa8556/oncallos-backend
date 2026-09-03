export type RiskLevel = "low" | "high";

export function classifyRisk(recommendedAction: string, highRiskKeywords: string[]): RiskLevel {
  const lower = recommendedAction.toLowerCase();
  const isHighRisk = highRiskKeywords.some((keyword) => lower.includes(keyword.toLowerCase()));
  return isHighRisk ? "high" : "low";
}

const STATEFUL_ACTION_KEYWORDS = ["delete", "modify", "update", "rollback database", "migrate"];

export function needsSnapshot(recommendedAction: string): boolean {
  const lower = recommendedAction.toLowerCase();
  return STATEFUL_ACTION_KEYWORDS.some((keyword) => lower.includes(keyword));
}