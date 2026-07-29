import { load as loadYaml } from 'js-yaml';

import { toJSON, toYAML } from '../src/output';

describe('toJSON', () => {
  test.each([
    ['text', '"text"'],
    [42, '42'],
    [true, 'true'],
    [null, 'null'],
  ])('serializes scalar value %p', (value, expected) => {
    expect(toJSON(value)).toBe(expected);
  });

  test('pretty-prints objects with two-space indentation', () => {
    expect(
      toJSON({
        enabled: true,
        port: 8080,
      }),
    ).toBe('{\n  "enabled": true,\n  "port": 8080\n}');
  });

  test('serializes arrays and nested structures as valid JSON', () => {
    const config = {
      services: [
        {
          name: 'api',
          config: {
            timeout: 30,
          },
        },
      ],
    };
    const output = toJSON(config);

    expect(JSON.parse(output)).toEqual(config);
    expect(output).toContain('\n      "name": "api"');
  });
});

describe('toYAML', () => {
  test.each(['text', 42, true, null])('serializes scalar value %p', (value) => {
    expect(loadYaml(toYAML(value))).toEqual(value);
  });

  test('produces readable YAML for objects', () => {
    expect(
      toYAML({
        enabled: true,
        port: 8080,
      }),
    ).toBe('enabled: true\nport: 8080\n');
  });

  test('round-trips arrays and nested structures', () => {
    const config = {
      services: [
        {
          name: 'api',
          config: {
            timeout: 30,
            features: ['metrics', 'tracing'],
          },
        },
      ],
    };
    const output = toYAML(config);

    expect(loadYaml(output)).toEqual(config);
    expect(output).toContain('services:\n  - name: api');
    expect(output).toContain('    config:\n      timeout: 30');
  });
});
