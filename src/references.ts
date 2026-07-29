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

/**
 * Find unescaped references in a string and parse their scope and path.
 *
 * @param value - String that may contain `${...}` expressions.
 * @returns The original text and all parsed, unescaped references.
 * @throws Error when an unescaped reference is malformed.
 */
export function parseReferences(value: string): ParsedReferences {
  const references: Reference[] = [];

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

    references.push(_parseReferenceSyntax(syntax, value));
    index = closingBrace;
  }

  return { text: value, references };
}
