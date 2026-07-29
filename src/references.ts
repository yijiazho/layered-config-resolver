/**
 * Parsing and resolution primitives for `${...}` configuration references.
 */

/** A parsed reference expression. */
export interface Reference {
  syntax: string;
  scopePrefix: string;
  path: string;
  isAbsolute: boolean;
}

/** Reference parsing result for one string value. */
export interface ParsedReferences {
  text: string;
  references: Reference[];
}

interface ReferenceToken {
  reference: Reference;
  start: number;
  end: number;
}

function _malformed(value: string, reason: string): Error {
  return new Error(`Malformed reference in '${value}': ${reason}`);
}

function _parseReferenceSyntax(syntax: string, value: string): Reference {
  const content = syntax.slice(2, -1);
  const scopeMatch = /^(\.+)(.*)$/.exec(content);
  const scopePrefix = scopeMatch?.[1] ?? '';
  const referencePath = scopeMatch?.[2] ?? content;
  const segments = referencePath.split('.');

  if (
    referencePath.length === 0 ||
    referencePath !== referencePath.trim() ||
    segments.some((segment) => segment.length === 0)
  ) {
    throw _malformed(value, `invalid path in '${syntax}'.`);
  }

  return {
    syntax,
    scopePrefix,
    path: referencePath,
    isAbsolute: scopePrefix.length === 0,
  };
}

function _scanReferenceTokens(value: string): ReferenceToken[] {
  const tokens: ReferenceToken[] = [];

  for (let index = 0; index < value.length - 1; index += 1) {
    const startsReference = value[index] === '$' && value[index + 1] === '{';
    const isEscaped = index > 0 && value[index - 1] === '$';
    if (!startsReference || isEscaped) {
      continue;
    }

    const closingBrace = value.indexOf('}', index + 2);
    if (closingBrace === -1) {
      throw _malformed(value, 'missing closing brace.');
    }

    const syntax = value.slice(index, closingBrace + 1);
    if (syntax.includes('{', 2)) {
      throw _malformed(value, `nested opening brace in '${syntax}'.`);
    }

    tokens.push({
      reference: _parseReferenceSyntax(syntax, value),
      start: index,
      end: closingBrace + 1,
    });
    index = closingBrace;
  }

  return tokens;
}

/**
 * Find unescaped references in a string and parse their scope and path.
 *
 * @param value - String that may contain `${...}` expressions.
 * @returns The original text and all parsed, unescaped references.
 * @throws Error when an unescaped reference is malformed.
 */
export function parseReferences(value: string): ParsedReferences {
  return {
    text: value,
    references: _scanReferenceTokens(value).map((token) => token.reference),
  };
}

function _targetPath(ref: Reference, contextPath: string[]): string[] {
  const referenceSegments = ref.path.split('.');
  if (ref.isAbsolute) {
    return referenceSegments;
  }

  const levelsUp = ref.scopePrefix.length - 1;
  if (levelsUp > contextPath.length) {
    throw new Error(
      `Reference '${ref.syntax}' walks ${levelsUp} levels above a context only ` +
        `${contextPath.length} level${contextPath.length === 1 ? '' : 's'} deep.`,
    );
  }

  return [...contextPath.slice(0, contextPath.length - levelsUp), ...referenceSegments];
}

function _availableKeys(value: unknown): string[] {
  return value !== null && typeof value === 'object' ? Object.keys(value) : [];
}

/**
 * Resolve one parsed reference against a configuration document.
 *
 * @param ref - Parsed absolute or relative reference.
 * @param config - Final merged configuration document.
 * @param contextPath - Path to the object containing the reference.
 * @returns The referenced value.
 * @throws Error when relative scope escapes the root or a path segment is missing.
 */
export function resolveReference(
  ref: Reference,
  config: unknown,
  contextPath: string[],
): unknown {
  const targetPath = _targetPath(ref, contextPath);
  let current: unknown = config;

  for (const segment of targetPath) {
    const canNavigate = current !== null && typeof current === 'object';
    if (!canNavigate || !Object.prototype.hasOwnProperty.call(current, segment)) {
      const availableKeys = _availableKeys(current);
      const available = availableKeys.length === 0 ? '(none)' : availableKeys.join(', ');
      throw new Error(
        `Reference '${ref.syntax}' could not resolve path '${targetPath.join('.')}'. ` +
          `Missing segment '${segment}'. Available keys: ${available}.`,
      );
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function _readPath(config: unknown, targetPath: string[]): unknown {
  let current = config;
  for (const segment of targetPath) {
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function _pathKey(targetPath: string[]): string {
  return JSON.stringify(targetPath);
}

function _pathLabel(targetPath: string[]): string {
  return targetPath.length === 0 ? '<root>' : targetPath.join('.');
}

function _unescapeReferences(value: string): string {
  return value.replace(/\$\$\{/g, '${');
}

/**
 * Resolve every reference in a merged configuration tree against its final state.
 *
 * @param config - Final merged configuration.
 * @param parentPath - Optional compatibility parameter; traversal context is managed internally.
 * @returns A new tree containing resolved values.
 * @throws Error for missing paths, malformed references, or reference cycles.
 */
export function resolveAllReferences(config: unknown, parentPath: string[] = []): unknown {
  void parentPath;
  const cache = new Map<string, unknown>();
  const resolutionStack: Array<{ key: string; label: string }> = [];

  const resolvePath = (targetPath: string[]): unknown => {
    const key = _pathKey(targetPath);
    if (cache.has(key)) {
      return cache.get(key);
    }

    const cycleStart = resolutionStack.findIndex((entry) => entry.key === key);
    if (cycleStart !== -1) {
      const cycle = [
        ...resolutionStack.slice(cycleStart).map((entry) => entry.label),
        _pathLabel(targetPath),
      ];
      throw new Error(`Circular reference detected: ${cycle.join(' -> ')}.`);
    }

    resolutionStack.push({ key, label: _pathLabel(targetPath) });
    try {
      const resolved = resolveValue(_readPath(config, targetPath), targetPath);
      cache.set(key, resolved);
      return resolved;
    } finally {
      resolutionStack.pop();
    }
  };

  const resolveString = (value: string, contextPath: string[]): unknown => {
    const tokens = _scanReferenceTokens(value);
    if (tokens.length === 0) {
      return _unescapeReferences(value);
    }

    const resolveToken = (token: ReferenceToken): unknown => {
      resolveReference(token.reference, config, contextPath);
      return resolvePath(_targetPath(token.reference, contextPath));
    };

    const onlyToken = tokens.length === 1 && tokens[0].start === 0 && tokens[0].end === value.length;
    if (onlyToken) {
      return resolveToken(tokens[0]);
    }

    let result = '';
    let cursor = 0;
    for (const token of tokens) {
      result += _unescapeReferences(value.slice(cursor, token.start));
      result += String(resolveToken(token));
      cursor = token.end;
    }
    return result + _unescapeReferences(value.slice(cursor));
  };

  function resolveValue(value: unknown, currentPath: string[]): unknown {
    if (typeof value === 'string') {
      return resolveString(value, currentPath.slice(0, -1));
    }
    if (Array.isArray(value)) {
      return value.map((_item, index) => resolvePath([...currentPath, String(index)]));
    }
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.keys(value).map((key) => [key, resolvePath([...currentPath, key])]),
      );
    }
    return value;
  }

  return resolveValue(config, []);
}
