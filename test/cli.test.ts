import path from 'node:path';

import { load as loadYaml } from 'js-yaml';

import {
  CliUsageError,
  HELP_TEXT,
  parseCliArgs,
  runCli,
  type CliIO,
} from '../src/cli';

function createIO(): {
  io: CliIO;
  stdout: string[];
  stderr: string[];
} {
  const stdout: string[] = [];
  const stderr: string[] = [];

  return {
    io: {
      writeOut: (message) => stdout.push(message),
      writeError: (message) => stderr.push(message),
    },
    stdout,
    stderr,
  };
}

const FIXTURE_DIRECTORY = path.join(__dirname, 'fixtures');

describe('CLI', () => {
  test('parses file inputs and defaults output to JSON', () => {
    expect(parseCliArgs(['00-base.yaml', '10-prod.yaml'])).toEqual({
      files: ['00-base.yaml', '10-prod.yaml'],
      output: 'json',
      help: false,
    });
  });

  test('parses the YAML output option', () => {
    expect(parseCliArgs(['config/', '--output', 'yaml'])).toEqual({
      files: ['config/'],
      output: 'yaml',
      help: false,
    });
  });

  test('help text documents the required usage', () => {
    expect(HELP_TEXT).toContain('resolver [files...] [--output json|yaml]');
    expect(HELP_TEXT).toContain('YAML file paths or one directory');
  });

  test('rejects unsupported output formats with a usage error', () => {
    expect(() => parseCliArgs(['config/', '--output', 'toml'])).toThrow(
      new CliUsageError("Unsupported output format 'toml'. Expected 'json' or 'yaml'."),
    );
  });

  test('prints help without requiring an input', () => {
    const { io, stdout, stderr } = createIO();

    expect(runCli(['--help'], io)).toBe(0);
    expect(stdout).toEqual([HELP_TEXT]);
    expect(stderr).toEqual([]);
  });

  test('reports missing input cleanly', () => {
    const { io, stdout, stderr } = createIO();

    expect(runCli([], io)).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr[0]).toContain('Error: Provide at least one YAML file or a directory.');
    expect(stderr[0]).toContain('resolver --help');
  });

  test('resolves a fixture directory and emits JSON by default', () => {
    const { io, stdout, stderr } = createIO();

    expect(runCli([FIXTURE_DIRECTORY], io)).toBe(0);
    expect(stderr).toEqual([]);
    expect(JSON.parse(stdout[0])).toMatchObject({
      db: {
        host: 'prod-db.internal',
        read_host: 'prod-db.internal',
        port: 5432,
      },
    });
  });

  test('accepts an explicit file list and emits YAML', () => {
    const { io, stdout, stderr } = createIO();
    const files = [
      path.join(FIXTURE_DIRECTORY, '00-pulumi-outputs.yaml'),
      path.join(FIXTURE_DIRECTORY, '10-base.yaml'),
      path.join(FIXTURE_DIRECTORY, '20-env-prod.yaml'),
    ];

    expect(runCli([...files, '--output', 'yaml'], io)).toBe(0);
    expect(stderr).toEqual([]);
    expect(loadYaml(stdout[0])).toMatchObject({
      outputs: {
        database: {
          endpoint: 'prod-db.internal',
          port: 5432,
        },
      },
      db: {
        host: 'prod-db.internal',
        port: 5432,
      },
    });
  });

  test('reports missing files without a stack trace', () => {
    const { io, stdout, stderr } = createIO();
    const missing = path.join(FIXTURE_DIRECTORY, 'missing.yaml');

    expect(runCli([missing], io)).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr).toEqual([`Error: Config input '${missing}' does not exist.`]);
  });

  test('reports YAML parse errors with the source path', () => {
    const { io, stdout, stderr } = createIO();
    const invalid = path.join(FIXTURE_DIRECTORY, 'loader', 'invalid.yaml');

    expect(runCli([invalid], io)).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr[0]).toContain(`Error: Failed to parse YAML config '${invalid}':`);
  });

  test('reports reference resolution errors cleanly', () => {
    const { io, stdout, stderr } = createIO();
    const baseOnly = path.join(FIXTURE_DIRECTORY, '10-base.yaml');

    expect(runCli([baseOnly], io)).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr[0]).toContain(
      "Error: Reference '${outputs.database.endpoint}' could not resolve path",
    );
  });
});
