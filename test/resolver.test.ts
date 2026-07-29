import { resolveConfig } from '../src/resolver';

describe('resolveConfig', () => {
  test('merges two layers from lower to higher precedence', () => {
    expect(
      resolveConfig([
        { service: { host: 'localhost', port: 8080 } },
        { service: { port: 9090 } },
      ]),
    ).toEqual({
      service: {
        host: 'localhost',
        port: 9090,
      },
    });
  });

  test('processes three or more layers in order', () => {
    expect(
      resolveConfig([
        { value: 'base', baseOnly: true },
        { value: 'environment', environmentOnly: true },
        { value: 'service', serviceOnly: true },
        { value: 'final' },
      ]),
    ).toEqual({
      value: 'final',
      baseOnly: true,
      environmentOnly: true,
      serviceOnly: true,
    });
  });

  test('merges overlapping keys at multiple depths', () => {
    expect(
      resolveConfig([
        { app: { server: { host: 'localhost', port: 8080 }, enabled: false } },
        { app: { server: { port: 443 }, enabled: true } },
      ]),
    ).toEqual({
      app: {
        server: {
          host: 'localhost',
          port: 443,
        },
        enabled: true,
      },
    });
  });

  test('replaces scalar and object values when their types conflict', () => {
    expect(
      resolveConfig([
        { scalarToObject: 'base', objectToScalar: { nested: true } },
        { scalarToObject: { nested: true }, objectToScalar: 'override' },
      ]),
    ).toEqual({
      scalarToObject: { nested: true },
      objectToScalar: 'override',
    });
  });

  test('uses key-based array merging while stacking layers', () => {
    expect(
      resolveConfig([
        { services: [{ name: 'api', port: 8080 }] },
        { services: [{ name: 'api', cpu: '1' }, { name: 'web', port: 8081 }] },
      ]),
    ).toEqual({
      services: [
        { name: 'api', port: 8080, cpu: '1' },
        { name: 'web', port: 8081 },
      ],
    });
  });

  test('returns an empty plain object when no layers are supplied', () => {
    expect(resolveConfig([])).toEqual({});
  });

  test('does not mutate supplied layers', () => {
    const layers = [
      { service: { host: 'localhost' } },
      { service: { port: 8080 } },
    ];

    const result = resolveConfig(layers);
    (result.service as Record<string, unknown>).host = 'changed';

    expect(layers).toEqual([
      { service: { host: 'localhost' } },
      { service: { port: 8080 } },
    ]);
  });

  test('resolves references in a single merged layer', () => {
    expect(
      resolveConfig([
        {
          source: { port: 5432 },
          target: { port: '${source.port}' },
        },
      ]),
    ).toEqual({
      source: { port: 5432 },
      target: { port: 5432 },
    });
  });

  test('resolves references across multiple layers', () => {
    expect(
      resolveConfig([
        { outputs: { endpoint: 'prod-db.internal' } },
        { db: { host: '${outputs.endpoint}' } },
      ]),
    ).toEqual({
      outputs: { endpoint: 'prod-db.internal' },
      db: { host: 'prod-db.internal' },
    });
  });

  test('resolves against the highest-precedence value in the final merge', () => {
    expect(
      resolveConfig([
        { outputs: { endpoint: 'base-db.internal' } },
        { db: { host: '${outputs.endpoint}' } },
        { outputs: { endpoint: 'prod-db.internal' } },
      ]),
    ).toEqual({
      outputs: { endpoint: 'prod-db.internal' },
      db: { host: 'prod-db.internal' },
    });
  });
});
