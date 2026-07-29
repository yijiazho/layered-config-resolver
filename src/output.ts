/**
 * Serialization helpers for resolved configuration documents.
 */

/**
 * Serialize a configuration value as readable JSON.
 *
 * @param config - JSON-serializable resolved configuration.
 * @returns Valid JSON using two-space indentation.
 * @throws Error when the value cannot be represented as JSON.
 */
export function toJSON(config: unknown): string {
  const serialized = JSON.stringify(config, null, 2);
  if (serialized === undefined) {
    throw new Error('Resolved config cannot be serialized as JSON.');
  }
  return serialized;
}
