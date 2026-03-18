import { mode, Mode } from "app";

/**
 * Safe JSON stringify that handles Symbols in development mode
 * In production, uses standard JSON.stringify
 * In development, filters out Symbol values that React dev tools might inject
 */
export function safeJsonStringify(obj: any): string {
  if (mode === Mode.DEV) {
    // In development, filter out symbols to prevent "Cannot convert a Symbol value to a string" errors
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'symbol') {
        return undefined;
      }
      return value;
    });
  }
  
  // In production, use standard JSON.stringify
  return JSON.stringify(obj);
}
