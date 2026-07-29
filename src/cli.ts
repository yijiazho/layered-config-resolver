#!/usr/bin/env node

/**
 * Command-line entry point and argument parsing for the layered config resolver.
 */

import minimist from 'minimist';

/** Output formats supported by the future resolver pipeline. */
export type OutputFormat = 'json' | 'yaml';

/** Parsed command-line options. */
export interface CliOptions {
  files: string[];
  output: OutputFormat;
  help: boolean;
}

/** Writable streams used by the CLI, injectable for testing. */
export interface CliIO {
  writeOut(message: string): void;
  writeError(message: string): void;
}

/** Help displayed by `resolver --help`. */
export const HELP_TEXT = `Layered Config Resolver

Usage:
  resolver [files...] [--output json|yaml]

Arguments:
  files                 YAML file paths or one directory containing YAML files

Options:
  --output <format>      Output format: json (default) or yaml
  -h, --help             Show this help text
`;

/** An invalid command-line invocation that should be shown without a stack trace. */
export class CliUsageError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'CliUsageError';
  }
}

const DEFAULT_IO: CliIO = {
  writeOut: (message) => process.stdout.write(`${message}\n`),
  writeError: (message) => process.stderr.write(`${message}\n`),
};

/**
 * Parse and validate command-line arguments.
 *
 * @param args - Arguments excluding the Node.js executable and script path.
 * @returns Typed CLI options.
 * @throws CliUsageError when an option value is invalid.
 */
export function parseCliArgs(args: string[]): CliOptions {
  const parsed = minimist(args, {
    alias: { h: 'help' },
    boolean: ['help'],
    string: ['output'],
    default: { output: 'json' },
  });
  const output = parsed.output;

  if (output !== 'json' && output !== 'yaml') {
    throw new CliUsageError(
      `Unsupported output format '${String(output)}'. Expected 'json' or 'yaml'.`,
    );
  }

  return {
    files: parsed._,
    output,
    help: parsed.help,
  };
}

/**
 * Run the CLI skeleton and convert expected errors into concise messages.
 *
 * @param args - Arguments excluding the Node.js executable and script path.
 * @param io - Output streams, injectable for tests.
 * @returns A process exit code.
 */
export function runCli(args: string[], io: CliIO = DEFAULT_IO): number {
  try {
    const options = parseCliArgs(args);

    if (options.help) {
      io.writeOut(HELP_TEXT);
      return 0;
    }

    if (options.files.length === 0) {
      throw new CliUsageError('Provide at least one YAML file or a directory.');
    }

    io.writeError(
      'Error: Config resolution is not implemented yet. Complete the resolver tasks first.',
    );
    return 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    io.writeError(`Error: ${message}\nRun 'resolver --help' for usage.`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2));
}
