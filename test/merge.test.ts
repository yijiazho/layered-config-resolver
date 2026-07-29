import { deepMerge } from '../src/merge';

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
