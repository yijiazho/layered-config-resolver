/**
 * Pure merge operations for layered configuration values.
 */

type ConfigObject = Record<string, unknown>;

const KEY_FIELDS = ['id', 'name', 'key', 'uid', 'uuid', '_id'] as const;

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

function _hasUsableKey(item: unknown, keyField: string): item is ConfigObject {
  return (
    _isPlainObject(item) &&
    Object.prototype.hasOwnProperty.call(item, keyField) &&
    item[keyField] !== null &&
    item[keyField] !== undefined
  );
}

function _detectKeyField(base: unknown[], override: unknown[]): string | undefined {
  return KEY_FIELDS.find(
    (candidate) =>
      base.some((item) => _hasUsableKey(item, candidate)) &&
      override.some((item) => _hasUsableKey(item, candidate)),
  );
}

/**
 * Merge two arrays using the first shared identifier field in the documented priority.
 * Matching objects merge recursively, unmatched override items append, and arrays without
 * a shared identifier are replaced by the override.
 *
 * @param base - Lower-precedence array.
 * @param override - Higher-precedence array.
 * @returns A new merged array.
 */
export function mergeArrays(base: unknown[], override: unknown[]): unknown[] {
  if (base.length === 0 || override.length === 0) {
    return _cloneValue(override) as unknown[];
  }

  const keyField = _detectKeyField(base, override);
  if (keyField === undefined) {
    return _cloneValue(override) as unknown[];
  }

  const result = _cloneValue(base) as unknown[];

  for (const overrideItem of override) {
    if (!_hasUsableKey(overrideItem, keyField)) {
      result.push(_cloneValue(overrideItem));
      continue;
    }

    const matchIndex = result.findIndex(
      (baseItem) =>
        _hasUsableKey(baseItem, keyField) &&
        baseItem[keyField] === overrideItem[keyField],
    );

    if (matchIndex === -1) {
      result.push(_cloneValue(overrideItem));
      continue;
    }

    result[matchIndex] = deepMerge(result[matchIndex], overrideItem);
  }

  return result;
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
  if (Array.isArray(base) && Array.isArray(override)) {
    return mergeArrays(base, override);
  }

  if (!_isPlainObject(base) || !_isPlainObject(override)) {
    return _cloneValue(override);
  }

  const result = _cloneValue(base) as ConfigObject;

  for (const [key, overrideValue] of Object.entries(override)) {
    if (overrideValue === null || overrideValue === undefined) {
      delete result[key];
      continue;
    }

    result[key] = deepMerge(base[key], overrideValue);
  }

  return result;
}
