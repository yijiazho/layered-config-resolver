import path from 'node:path';

import { loadConfigFiles } from '../src/loader';

const FIXTURE_DIRECTORY = path.join(__dirname, 'fixtures', 'loader');

describe('loadConfigFiles', () => {
  test('discovers and parses YAML files in a directory', () => {
    const sortableDirectory = path.join(FIXTURE_DIRECTORY, 'sortable');
    const loaded = loadConfigFiles(sortableDirectory);

    expect(loaded[0]).toEqual({
      path: path.join(sortableDirectory, '00-base.yaml'),
      config: {
        service: {
          source: 'base',
          port: 8080,
        },
      },
    });
  });

  test('sorts numeric prefixes first, then alphabetically, with unprefixed files last', () => {
    const sortableDirectory = path.join(FIXTURE_DIRECTORY, 'sortable');

    expect(loadConfigFiles(sortableDirectory).map((entry) => path.basename(entry.path))).toEqual([
      '00-base.yaml',
      '10-alpha.yaml',
      '10-zeta.yml',
      'settings.yaml',
    ]);
  });

  test('preserves the order of an explicit file list', () => {
    const settings = path.join(FIXTURE_DIRECTORY, 'sortable', 'settings.yaml');
    const base = path.join(FIXTURE_DIRECTORY, 'sortable', '00-base.yaml');

    expect(loadConfigFiles([settings, base]).map((entry) => path.basename(entry.path))).toEqual([
      'settings.yaml',
      '00-base.yaml',
    ]);
  });

  test('accepts a single YAML file path', () => {
    const base = path.join(FIXTURE_DIRECTORY, 'sortable', '00-base.yaml');

    expect(loadConfigFiles(base)).toEqual([
      {
        path: base,
        config: {
          service: {
            source: 'base',
            port: 8080,
          },
        },
      },
    ]);
  });

  test('throws a contextual error for a missing input', () => {
    const missing = path.join(FIXTURE_DIRECTORY, 'does-not-exist.yaml');

    expect(() => loadConfigFiles(missing)).toThrow(
      `Config input '${missing}' does not exist.`,
    );
  });

  test('throws a contextual error for invalid YAML', () => {
    const invalid = path.join(FIXTURE_DIRECTORY, 'invalid.yaml');

    expect(() => loadConfigFiles(invalid)).toThrow(
      `Failed to parse YAML config '${invalid}':`,
    );
  });
});
