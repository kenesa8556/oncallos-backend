export type RiskLevel = "low" | "high";

const HIGH_RISK_KEYWORDS = ["delete", "drop", "rollback database", "modify billing", "remove"];

export function classifyRisk(recommendedAction: string): RiskLevel {
  const lower = recommendedAction.toLowerCase();
  const isHighRisk = HIGH_RISK_KEYWORDS.some((keyword) => lower.includes(keyword));
  return isHighRisk ? "high" : "low";
}
const STATEFUL_ACTION_KEYWORDS = ["delete", "modify", "update", "rollback database", "migrate"];

export function needsSnapshot(recommendedAction: string): boolean {
  const lower = recommendedAction.toLowerCase();
  return STATEFUL_ACTION_KEYWORDS.some((keyword) => lower.includes(keyword));
}