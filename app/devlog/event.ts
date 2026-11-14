// Envelope do canal de devlog e a limpeza de segredos (spec 0005, requisito 6: nenhum dado
// sensível passa — garantido pelo código, não por convenção).
export type Level = "info" | "warning" | "error";

export interface DevlogEvent {
  type: string;
  account: string;
  level: Level;
  timestamp: string;
  payload?: unknown;
}

const SENSITIVE_KEY = /password|token|secret|credential/i;

export function scrub<T>(value: T): T {
  return scrubValue(value) as T;
}

function scrubValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(scrubValue);
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : scrubValue(v);
    }
    return result;
  }
  return value;
}

export function hasRequiredFields(value: unknown): value is DevlogEvent {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.type === "string" &&
    typeof v.account === "string" &&
    (v.level === "info" || v.level === "warning" || v.level === "error") &&
    typeof v.timestamp === "string"
  );
}
