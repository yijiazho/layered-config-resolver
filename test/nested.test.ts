import { resolveConfig } from '../src/resolver';

describe('Tier 3 nested structures', () => {
  test('merges plain objects more than five levels deep', () => {
    expect(
      resolveConfig([
        {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    level6: {
                      base: true,
                      shared: 'base',
                    },
                  },
                },
              },
            },
          },
        },
        {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    level6: {
                      override: true,
                      shared: 'override',
                    },
                  },
                },
              },
            },
          },
        },
      ]),
    ).toEqual({
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                level6: {
                  base: true,
                  override: true,
                  shared: 'override',
                },
              },
            },
          },
        },
      },
    });
  });

  test('resolves absolute references from deeply nested objects', () => {
    expect(
      resolveConfig([
        {
          outputs: {
            database: {
              endpoint: 'prod-db.internal',
            },
          },
          application: {
            service: {
              component: {
                runtime: {
                  connection: {
                    host: '${outputs.database.endpoint}',
                  },
                },
              },
            },
          },
        },
      ]),
    ).toMatchObject({
      application: {
        service: {
          component: {
            runtime: {
              connection: {
                host: 'prod-db.internal',
              },
            },
          },
        },
      },
    });
  });

  test('calculates current and ancestor scopes correctly at depth', () => {
    expect(
      resolveConfig([
        {
          platform: {
            region: 'us-west-2',
            service: {
              port: 8080,
              config: {
                timeout: 30,
                nested: {
                  local: 'value',
                  localCopy: '${.local}',
                  timeoutCopy: '${..timeout}',
                  portCopy: '${...port}',
                  regionCopy: '${....region}',
                },
              },
            },
          },
        },
      ]),
    ).toMatchObject({
      platform: {
        service: {
          config: {
            nested: {
              localCopy: 'value',
              timeoutCopy: 30,
              portCopy: 8080,
              regionCopy: 'us-west-2',
            },
          },
        },
      },
    });
  });

  test('merges keyed arrays recursively inside nested objects and array items', () => {
    expect(
      resolveConfig([
        {
          applications: [
            {
              name: 'storefront',
              components: [
                {
                  name: 'api',
                  config: {
                    port: 8080,
                    retries: 2,
                  },
                },
              ],
            },
          ],
        },
        {
          applications: [
            {
              name: 'storefront',
              components: [
                {
                  name: 'api',
                  config: {
                    port: 9090,
                    cpu: '1',
                  },
                },
                {
                  name: 'web',
                  config: {
                    port: 3000,
                  },
                },
              ],
            },
          ],
        },
      ]),
    ).toEqual({
      applications: [
        {
          name: 'storefront',
          components: [
            {
              name: 'api',
              config: {
                port: 9090,
                retries: 2,
                cpu: '1',
              },
            },
            {
              name: 'web',
              config: {
                port: 3000,
              },
            },
          ],
        },
      ],
    });
  });

  test('resolves references inside nested arrays after all recursive merges', () => {
    expect(
      resolveConfig([
        {
          defaults: {
            timeout: 30,
          },
          applications: [
            {
              name: 'storefront',
              components: [
                {
                  name: 'api',
                  port: 8080,
                  config: {
                    timeout: '${defaults.timeout}',
                    listenPort: '${..port}',
                  },
                },
              ],
            },
          ],
        },
        {
          defaults: {
            timeout: 60,
          },
          applications: [
            {
              name: 'storefront',
              components: [
                {
                  name: 'api',
                  config: {
                    protocol: 'https',
                    endpoint: '${.protocol}://${..name}:${..port}',
                  },
                },
              ],
            },
          ],
        },
      ]),
    ).toMatchObject({
      applications: [
        {
          components: [
            {
              name: 'api',
              port: 8080,
              config: {
                timeout: 60,
                listenPort: 8080,
                protocol: 'https',
                endpoint: 'https://api:8080',
              },
            },
          ],
        },
      ],
    });
  });
});
