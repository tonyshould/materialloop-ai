export function logEvent(severity: "INFO" | "WARNING" | "ERROR", event: string, details: Record<string, unknown>) {
  const payload = {
    severity,
    event,
    service: "materialloop-ai",
    timestamp: new Date().toISOString(),
    ...details
  };
  const output = JSON.stringify(payload);
  if (severity === "ERROR") console.error(output);
  else if (severity === "WARNING") console.warn(output);
  else console.log(output);
}
