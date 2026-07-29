#!/usr/bin/env node

/**
 * Command-line entry point and argument parsing for the layered config resolver.
 */

import minimist from 'minimist';

import { loadConfigFiles } from './loader';
import { toJSON, toYAML } from './output';
import { resolveConfig } from './resolver';

/** Output formats supported by the resolver pipeline. */
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
  writeOut: (message) =>
    process.stdout.write(message.endsWith('\n') ? message : `${message}\n`),
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
 * Load, resolve, and format configuration inputs, converting errors into concise messages.
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

    const input = options.files.length === 1 ? options.files[0] : options.files;
    const layers = loadConfigFiles(input).map((entry) => entry.config);
    const resolved = resolveConfig(layers);
    io.writeOut(options.output === 'json' ? toJSON(resolved) : toYAML(resolved));
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const help = error instanceof CliUsageError ? "\nRun 'resolver --help' for usage." : '';
    io.writeError(`Error: ${message}${help}`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2));
}
