/**
 * Top-level orchestration for stacking configuration layers.
 */

import { deepMerge } from './merge';

/** A resolved configuration document. */
export type ResolvedConfig = Record<string, unknown>;

function _isPlainObject(value: unknown): value is ResolvedConfig {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Merge configuration layers from lowest to highest precedence.
 *
 * @param configs - Ordered plain-object layers; the last layer has highest precedence.
 * @returns A new resolved plain object.
 * @throws Error when a layer is not a plain object.
 */
export function resolveConfig(configs: unknown[]): ResolvedConfig {
  return configs.reduce<ResolvedConfig>((resolved, layer, index) => {
    if (!_isPlainObject(layer)) {
      throw new Error(
        `Config layer at index ${index} must be a plain object; received ${typeof layer}.`,
      );
    }

    return deepMerge(resolved, layer) as ResolvedConfig;
  }, {});
}
