import path from 'node:path';

import { loadConfigFiles } from '../src/loader';
import { deepMerge, mergeArrays } from '../src/merge';
import { mergeConfigLayers, resolveConfig } from '../src/resolver';

const TIER1_FIXTURE_DIRECTORY = path.join(__dirname, 'fixtures');

describe('deepMerge', () => {
  test('replaces a scalar with the later layer value', () => {
    expect(deepMerge({ port: 8080 }, { port: 9090 })).toEqual({ port: 9090 });
  });

  test('merges nested plain objects recursively', () => {
    expect(
      deepMerge(
        { service: { host: 'localhost', tls: { enabled: false } } },
        { service: { port: 443, tls: { enabled: true } } },
      ),
    ).toEqual({
      service: {
        host: 'localhost',
        port: 443,
        tls: { enabled: true },
      },
    });
  });

  test('removes keys explicitly unset with null or undefined', () => {
    expect(
      deepMerge(
        { keep: true, removeWithNull: 'value', removeWithUndefined: 'value' },
        { removeWithNull: null, removeWithUndefined: undefined },
      ),
    ).toEqual({ keep: true });
  });

  test('merges objects nested more than three levels deep', () => {
    expect(
      deepMerge(
        { level1: { level2: { level3: { level4: { base: true } } } } },
        { level1: { level2: { level3: { level4: { override: true } } } } },
      ),
    ).toEqual({
      level1: {
        level2: {
          level3: {
            level4: { base: true, override: true },
          },
        },
      },
    });
  });

  test('replaces values when the layer types conflict', () => {
    expect(deepMerge({ setting: 'simple' }, { setting: { enabled: true } })).toEqual({
      setting: { enabled: true },
    });
  });

  test('returns a new result without mutating or sharing nested input objects', () => {
    const base = { service: { host: 'localhost' } };
    const override = { service: { port: 8080 } };

    const result = deepMerge(base, override) as {
      service: { host: string; port: number };
    };
    result.service.host = 'changed';

    expect(base).toEqual({ service: { host: 'localhost' } });
    expect(override).toEqual({ service: { port: 8080 } });
  });
});

describe('mergeArrays', () => {
  test('merges matching objects by an identifiable name field', () => {
    expect(
      mergeArrays(
        [{ name: 'api', port: 8080 }],
        [{ name: 'api', cpu: '1' }],
      ),
    ).toEqual([{ name: 'api', port: 8080, cpu: '1' }]);
  });

  test('uses the documented key-field priority', () => {
    expect(
      mergeArrays(
        [{ id: 'service-1', name: 'old-name', port: 8080 }],
        [{ id: 'service-1', name: 'new-name', cpu: '1' }],
      ),
    ).toEqual([
      {
        id: 'service-1',
        name: 'new-name',
        port: 8080,
        cpu: '1',
      },
    ]);
  });

  test('replaces an array entirely when no common key field exists', () => {
    expect(mergeArrays(['/api', '/health'], ['/v2'])).toEqual(['/v2']);
  });

  test('keeps matched items in place and appends unmatched items', () => {
    expect(
      mergeArrays(
        [
          { name: 'api', port: 8080 },
          { name: 'web', port: 8081 },
        ],
        [
          { name: 'web', cpu: '2' },
          { name: 'worker', cpu: '1' },
        ],
      ),
    ).toEqual([
      { name: 'api', port: 8080 },
      { name: 'web', port: 8081, cpu: '2' },
      { name: 'worker', cpu: '1' },
    ]);
  });

  test('merges nested structures inside matching array items', () => {
    expect(
      mergeArrays(
        [{ name: 'api', config: { timeout: 30, retries: 2 } }],
        [{ name: 'api', config: { timeout: 60 } }],
      ),
    ).toEqual([{ name: 'api', config: { timeout: 60, retries: 2 } }]);
  });

  test('appends override items that do not contain the selected key', () => {
    expect(
      mergeArrays(
        [{ name: 'api', port: 8080 }],
        [{ id: 'worker', port: 8082 }],
      ),
    ).toEqual([{ id: 'worker', port: 8082 }]);

    expect(
      mergeArrays(
        [
          { name: 'api', port: 8080 },
          { name: 'web', port: 8081 },
        ],
        [
          { name: 'web', cpu: '2' },
          { id: 'worker', cpu: '1' },
        ],
      ),
    ).toEqual([
      { name: 'api', port: 8080 },
      { name: 'web', port: 8081, cpu: '2' },
      { id: 'worker', cpu: '1' },
    ]);
  });

  test('handles empty base and override arrays', () => {
    expect(mergeArrays([], [{ name: 'api' }])).toEqual([{ name: 'api' }]);
    expect(mergeArrays([{ name: 'api' }], [])).toEqual([]);
    expect(mergeArrays([], [])).toEqual([]);
  });

  test('returns a deep-cloned result without mutating array inputs', () => {
    const base = [{ name: 'api', config: { port: 8080 } }];
    const override = [{ name: 'api', config: { cpu: '1' } }];

    const result = mergeArrays(base, override) as Array<{
      name: string;
      config: { port: number; cpu: string };
    }>;
    result[0].config.port = 9090;

    expect(base).toEqual([{ name: 'api', config: { port: 8080 } }]);
    expect(override).toEqual([{ name: 'api', config: { cpu: '1' } }]);
  });
});

describe('Tier 1 fixture pipeline', () => {
  const loaded = loadConfigFiles(TIER1_FIXTURE_DIRECTORY);

  test('loads the starter layers in numeric precedence order', () => {
    expect(loaded.map((entry) => path.basename(entry.path))).toEqual([
      '00-pulumi-outputs.yaml',
      '10-base.yaml',
      '20-env-prod.yaml',
    ]);
  });

  test('merges layer 0 through layer 1 without resolving references', () => {
    expect(mergeConfigLayers(loaded.slice(0, 2).map((entry) => entry.config))).toEqual({
      outputs: {
        database: {
          endpoint: 'prod-db.internal',
          port: 5432,
        },
      },
      schema_version: 1.1,
      tls: {
        enabled: 'no',
        auto_renew: 'off',
      },
      services: [
        {
          name: 'api',
          port: 8080,
          config: {
            base_timeout: 30,
            read_timeout: '${.base_timeout}',
            listen_port: '${..port}',
          },
        },
        {
          name: 'web',
          port: 8081,
        },
      ],
      db: {
        host: '${outputs.database.endpoint}',
        read_host: '${.host}',
      },
      routes: [
        {
          path: '/api',
          upstream: 'api',
        },
        {
          upstream: 'web',
        },
      ],
    });
  });

  test('merges the complete layer 0 through layer 2 stack', () => {
    const resolved = mergeConfigLayers(loaded.map((entry) => entry.config));

    expect(resolved).toMatchObject({
      outputs: {
        database: {
          endpoint: 'prod-db.internal',
          port: 5432,
        },
      },
      db: {
        host: '${outputs.database.endpoint}',
        read_host: '${.host}',
        port: '${outputs.database.port}',
      },
    });
    expect(resolved.services).toEqual([
      {
        name: 'api',
        port: 8080,
        config: {
          base_timeout: 30,
          read_timeout: '${.base_timeout}',
          listen_port: '${..port}',
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
    ]);
  });

  test('preserves nested objects while overriding nested scalar values', () => {
    expect(
      resolveConfig([
        { service: { config: { timeout: 30, retries: 2 } } },
        { service: { config: { timeout: 60 } } },
      ]),
    ).toEqual({
      service: {
        config: {
          timeout: 60,
          retries: 2,
        },
      },
    });
  });

  test('replaces a fixture-style value when layers change its type', () => {
    expect(
      resolveConfig([
        { tls: { enabled: 'no' } },
        { tls: { enabled: { managed: true } } },
      ]),
    ).toEqual({
      tls: {
        enabled: {
          managed: true,
        },
      },
    });
  });
});
