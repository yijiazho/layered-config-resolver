/**
 * Pure merge operations for layered configuration values.
 */

type ConfigObject = Record<string, unknown>;

function _isPlainObject(value: unknown): value is ConfigObject {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function _cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(_cloneValue);
  }

  if (_isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, _cloneValue(nestedValue)]),
    );
  }

  return value;
}

/**
 * Deeply merge two configuration values without mutating either input.
 * Plain objects merge recursively; later values replace earlier values on conflicts.
 * A `null` or `undefined` object property in the override removes that property.
 *
 * @param base - Lower-precedence configuration value.
 * @param override - Higher-precedence configuration value.
 * @returns A new merged value.
 */
export function deepMerge(base: unknown, override: unknown): unknown {
  if (!_isPlainObject(base) || !_isPlainObject(override)) {
    return _cloneValue(override);
  }

  const result = _cloneValue(base) as ConfigObject;

  for (const [key, overrideValue] of Object.entries(override)) {
    if (overrideValue === null || overrideValue === undefined) {
      delete result[key];
      continue;
    }

    const baseValue = base[key];
    result[key] =
      _isPlainObject(baseValue) && _isPlainObject(overrideValue)
        ? deepMerge(baseValue, overrideValue)
        : _cloneValue(overrideValue);
  }

  return result;
}
