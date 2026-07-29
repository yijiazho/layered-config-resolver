import path from 'node:path';

import { load as loadYaml } from 'js-yaml';

import { loadConfigFiles } from '../src/loader';
import { toJSON, toYAML } from '../src/output';
import { resolveConfig } from '../src/resolver';

const FIXTURE_DIRECTORY = path.join(__dirname, 'fixtures');

describe('starter-pack integration', () => {
  test('loads, merges, and resolves the complete configuration pipeline', () => {
    const layers = loadConfigFiles(FIXTURE_DIRECTORY).map((entry) => entry.config);

    // Expected contract:
    // - Pulumi outputs remain available at the root.
    // - `web` merges by name, while heterogeneous `id: api` appends.
    // - Absolute and relative references resolve to their final value types.
    expect(resolveConfig(layers)).toEqual({
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
      db: {
        host: 'prod-db.internal',
        read_host: 'prod-db.internal',
        port: 5432,
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

  test('serializes the integrated result to equivalent JSON and YAML documents', () => {
    const layers = loadConfigFiles(FIXTURE_DIRECTORY).map((entry) => entry.config);
    const resolved = resolveConfig(layers);

    expect(JSON.parse(toJSON(resolved))).toEqual(resolved);
    expect(loadYaml(toYAML(resolved))).toEqual(resolved);
  });
});
