/**
 * Serialization helpers for resolved configuration documents.
 */

import { dump as dumpYaml } from 'js-yaml';

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

/**
 * Serialize a configuration value as readable YAML.
 *
 * @param config - Resolved configuration value.
 * @returns Valid YAML using two-space indentation.
 */
export function toYAML(config: unknown): string {
  return dumpYaml(config, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
  });
}
