import { toJSON } from '../src/output';

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
