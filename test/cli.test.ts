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

describe('CLI skeleton', () => {
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

  test('reports that resolution is intentionally deferred beyond the skeleton', () => {
    const { io, stdout, stderr } = createIO();

    expect(runCli(['config/'], io)).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr).toEqual([
      'Error: Config resolution is not implemented yet. Complete the resolver tasks first.',
    ]);
  });
});
