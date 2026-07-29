/**
 * Top-level orchestration for stacking configuration layers.
 */

import { deepMerge } from './merge';
import { resolveAllReferences } from './references';

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
 * Merge configuration layers from lowest to highest precedence without resolving references.
 *
 * @param configs - Ordered plain-object layers; the last layer has highest precedence.
 * @returns A new merged plain object.
 * @throws Error when a layer is not a plain object.
 */
export function mergeConfigLayers(configs: unknown[]): ResolvedConfig {
  return configs.reduce<ResolvedConfig>((resolved, layer, index) => {
    if (!_isPlainObject(layer)) {
      throw new Error(
        `Config layer at index ${index} must be a plain object; received ${typeof layer}.`,
      );
    }

    return deepMerge(resolved, layer) as ResolvedConfig;
  }, {});
}

/**
 * Merge configuration layers, then resolve all references against the final merged state.
 *
 * @param configs - Ordered plain-object layers; the last layer has highest precedence.
 * @returns A new, fully resolved plain object.
 * @throws Error for invalid layers or reference resolution failures.
 */
export function resolveConfig(configs: unknown[]): ResolvedConfig {
  return resolveAllReferences(mergeConfigLayers(configs)) as ResolvedConfig;
}
