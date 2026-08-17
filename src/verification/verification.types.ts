export function verifyAction(): boolean {
  // TODO: replace with real health check / metric check once
  // real monitoring infrastructure exists.
  const ran = Math.random();
  return ran > 0.3;
}