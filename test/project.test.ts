import { PROJECT_NAME } from '../src/index';

describe('project scaffold', () => {
  test('exposes the package identity from the TypeScript entry point', () => {
    expect(PROJECT_NAME).toBe('layered-config-resolver');
  });
});
