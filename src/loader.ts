/**
 * YAML configuration loading and precedence ordering.
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import path from 'node:path';

import { load as loadYaml } from 'js-yaml';

/** A parsed configuration paired with its source path. */
export interface LoadedConfig {
  path: string;
  config: unknown;
}

const YAML_EXTENSION = /\.ya?ml$/i;
const NUMERIC_PREFIX = /^(\d+)-/;

function _numericPrefix(filePath: string): number | undefined {
  const match = NUMERIC_PREFIX.exec(path.basename(filePath));
  return match === null ? undefined : Number(match[1]);
}

function _compareConfigPaths(left: string, right: string): number {
  const leftPrefix = _numericPrefix(left);
  const rightPrefix = _numericPrefix(right);

  if (leftPrefix !== undefined && rightPrefix === undefined) {
    return -1;
  }
  if (leftPrefix === undefined && rightPrefix !== undefined) {
    return 1;
  }
  if (leftPrefix !== undefined && rightPrefix !== undefined && leftPrefix !== rightPrefix) {
    return leftPrefix - rightPrefix;
  }

  return path.basename(left).localeCompare(path.basename(right));
}

function _discoverDirectory(directoryPath: string): string[] {
  return readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && YAML_EXTENSION.test(entry.name))
    .map((entry) => path.join(directoryPath, entry.name))
    .sort(_compareConfigPaths);
}

function _validateFile(filePath: string): void {
  if (!existsSync(filePath)) {
    throw new Error(`Config input '${filePath}' does not exist.`);
  }
  if (!statSync(filePath).isFile()) {
    throw new Error(`Config input '${filePath}' is not a file.`);
  }
  if (!YAML_EXTENSION.test(filePath)) {
    throw new Error(`Config input '${filePath}' must use a .yaml or .yml extension.`);
  }
}

function _loadConfigFile(filePath: string): LoadedConfig {
  _validateFile(filePath);

  try {
    return {
      path: filePath,
      config: loadYaml(readFileSync(filePath, 'utf8')),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse YAML config '${filePath}': ${message}`);
  }
}

/**
 * Load YAML configuration files from one directory, one file, or an explicit file list.
 * Directory contents use numeric-prefix precedence; explicit lists retain caller order.
 *
 * @param input - Directory path, file path, or explicitly ordered file paths.
 * @returns Parsed configurations paired with their source paths.
 * @throws Error when an input is missing, invalid, or cannot be parsed as YAML.
 */
export function loadConfigFiles(input: string | string[]): LoadedConfig[] {
  if (Array.isArray(input)) {
    return input.map(_loadConfigFile);
  }

  if (!existsSync(input)) {
    throw new Error(`Config input '${input}' does not exist.`);
  }

  const paths = statSync(input).isDirectory() ? _discoverDirectory(input) : [input];
  return paths.map(_loadConfigFile);
}
