import path from 'node:path';

import { loadConfigFiles } from '../src/loader';
import {
  parseReferences,
  resolveAllReferences,
  resolveReference,
  type Reference,
} from '../src/references';
import { resolveConfig } from '../src/resolver';

function reference(syntax: string): Reference {
  const parsed = parseReferences(syntax).references[0];
  if (parsed === undefined) {
    throw new Error(`Test reference '${syntax}' did not parse.`);
  }
  return parsed;
}

describe('parseReferences', () => {
  test('parses an absolute path from the document root', () => {
    expect(parseReferences('${outputs.database.endpoint}')).toEqual({
      text: '${outputs.database.endpoint}',
      references: [
        {
          syntax: '${outputs.database.endpoint}',
          scopePrefix: '',
          path: 'outputs.database.endpoint',
          isAbsolute: true,
        },
      ],
    });
  });

  test.each([
    ['${.host}', '.', 'host'],
    ['${..port}', '..', 'port'],
    ['${...key}', '...', 'key'],
  ])('parses relative reference %s', (syntax, scopePrefix, referencePath) => {
    expect(parseReferences(syntax).references).toEqual([
      {
        syntax,
        scopePrefix,
        path: referencePath,
        isAbsolute: false,
      },
    ]);
  });

  test('finds multiple references embedded in one string', () => {
    const value = 'prefix-${.a}-middle-${.b}-suffix';

    expect(parseReferences(value)).toEqual({
      text: value,
      references: [
        {
          syntax: '${.a}',
          scopePrefix: '.',
          path: 'a',
          isAbsolute: false,
        },
        {
          syntax: '${.b}',
          scopePrefix: '.',
          path: 'b',
          isAbsolute: false,
        },
      ],
    });
  });

  test('returns no references for plain text', () => {
    expect(parseReferences('plain string')).toEqual({
      text: 'plain string',
      references: [],
    });
  });

  test('ignores escaped reference syntax', () => {
    expect(parseReferences('literal $${outputs.secret}')).toEqual({
      text: 'literal $${outputs.secret}',
      references: [],
    });
  });

  test.each(['${}', '${.}', '${outputs..endpoint}', '${unterminated'])(
    'rejects malformed reference syntax %s',
    (value) => {
      expect(() => parseReferences(value)).toThrow(`Malformed reference in '${value}'`);
    },
  );
});

describe('resolveReference', () => {
  const config = {
    outputs: {
      database: {
        endpoint: 'prod-db.internal',
      },
    },
    service: {
      port: 8080,
      config: {
        baseTimeout: 30,
        nested: {
          value: 'deep',
        },
      },
    },
    services: [
      {
        name: 'api',
        port: 9090,
        config: {
          timeout: 60,
        },
      },
    ],
  };

  test('resolves an absolute path from the root', () => {
    expect(
      resolveReference(reference('${outputs.database.endpoint}'), config, [
        'service',
        'config',
      ]),
    ).toBe('prod-db.internal');
  });

  test('resolves a relative path from the current object', () => {
    expect(
      resolveReference(reference('${.baseTimeout}'), config, ['service', 'config']),
    ).toBe(30);
  });

  test('resolves a parent path one object above the current context', () => {
    expect(resolveReference(reference('${..port}'), config, ['service', 'config'])).toBe(
      8080,
    );
  });

  test('resolves a grandparent path two objects above the current context', () => {
    expect(
      resolveReference(reference('${...port}'), config, [
        'service',
        'config',
        'nested',
      ]),
    ).toBe(8080);
  });

  test('navigates deep paths and array indices', () => {
    expect(
      resolveReference(reference('${..port}'), config, ['services', '0', 'config']),
    ).toBe(9090);
    expect(
      resolveReference(reference('${service.config.nested.value}'), config, []),
    ).toBe('deep');
  });

  test('reports the missing path and available keys', () => {
    expect(() =>
      resolveReference(reference('${service.config.missing}'), config, []),
    ).toThrow(
      "Reference '${service.config.missing}' could not resolve path " +
        "'service.config.missing'. Missing segment 'missing'. Available keys: baseTimeout, nested.",
    );
  });

  test('rejects relative scopes that walk above the root', () => {
    expect(() => resolveReference(reference('${...value}'), config, ['service'])).toThrow(
      "Reference '${...value}' walks 2 levels above a context only 1 level deep.",
    );
  });
});

describe('resolveAllReferences', () => {
  test('replaces a single whole-value reference with its actual value type', () => {
    expect(
      resolveAllReferences({
        outputs: { database: { port: 5432 } },
        db: { port: '${outputs.database.port}' },
      }),
    ).toEqual({
      outputs: { database: { port: 5432 } },
      db: { port: 5432 },
    });
  });

  test('interpolates multiple references in one string', () => {
    expect(
      resolveAllReferences({
        connection: {
          host: 'db.internal',
          port: 5432,
          url: 'postgres://${.host}:${.port}/app',
        },
      }),
    ).toEqual({
      connection: {
        host: 'db.internal',
        port: 5432,
        url: 'postgres://db.internal:5432/app',
      },
    });
  });

  test('resolves references that point to other references', () => {
    expect(
      resolveAllReferences({
        source: 'resolved-value',
        middle: '${source}',
        final: '${middle}',
      }),
    ).toEqual({
      source: 'resolved-value',
      middle: 'resolved-value',
      final: 'resolved-value',
    });
  });

  test('detects and reports a circular reference path', () => {
    expect(() =>
      resolveAllReferences({
        a: '${b}',
        b: '${c}',
        c: '${a}',
      }),
    ).toThrow('Circular reference detected: a -> b -> c -> a.');
  });

  test('resolves relative references inside nested array items', () => {
    expect(
      resolveAllReferences({
        services: [
          {
            name: 'api',
            port: 8080,
            config: {
              baseTimeout: 30,
              readTimeout: '${.baseTimeout}',
              listenPort: '${..port}',
            },
          },
        ],
      }),
    ).toEqual({
      services: [
        {
          name: 'api',
          port: 8080,
          config: {
            baseTimeout: 30,
            readTimeout: 30,
            listenPort: 8080,
          },
        },
      ],
    });
  });

  test('unescapes literal references without resolving them', () => {
    expect(
      resolveAllReferences({
        outputs: { value: 'secret' },
        literal: '$${outputs.value}',
        mixed: 'literal=$${outputs.value}; real=${outputs.value}',
      }),
    ).toEqual({
      outputs: { value: 'secret' },
      literal: '${outputs.value}',
      mixed: 'literal=${outputs.value}; real=secret',
    });
  });

  test('returns a new tree without mutating the input', () => {
    const input = {
      source: { value: 'resolved' },
      target: '${source}',
    };

    const result = resolveAllReferences(input) as {
      source: { value: string };
      target: { value: string };
    };
    result.source.value = 'changed';

    expect(input).toEqual({
      source: { value: 'resolved' },
      target: '${source}',
    });
  });
});

describe('Tier 2 fixture pipeline', () => {
  test('resolves absolute, relative, nested, and cross-layer starter references', () => {
    const fixtureDirectory = path.join(__dirname, 'fixtures');
    const layers = loadConfigFiles(fixtureDirectory).map((entry) => entry.config);

    expect(resolveConfig(layers)).toMatchObject({
      outputs: {
        database: {
          endpoint: 'prod-db.internal',
          port: 5432,
        },
      },
      db: {
        host: 'prod-db.internal',
        read_host: 'prod-db.internal',
        port: 5432,
      },
      services: [
        {
          name: 'api',
          port: 8080,
          config: {
            base_timeout: 30,
            read_timeout: 30,
            listen_port: 8080,
          },
        },
        {
          name: 'web',
          port: 8081,
          cpu: '2',
        },
        {
          id: 'api',
          cpu: '1',
        },
      ],
    });
  });
});
