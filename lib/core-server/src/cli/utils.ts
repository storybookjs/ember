import deprecate from 'util-deprecate';
import dedent from 'ts-dedent';
import type { CLIOptions } from '@storybook/core-common';
import type { ProdCliOptions } from './prod';

export function parseList(str: string): string[] {
  return str
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function getEnvConfig(program: Record<string, any>, configEnv: Record<string, any>): void {
  Object.keys(configEnv).forEach((fieldName) => {
    const envVarName = configEnv[fieldName];
    const envVarValue = process.env[envVarName];
    if (envVarValue) {
      program[fieldName] = envVarValue; // eslint-disable-line
    }
  });
}

const warnDeprecatedFlag = (message: string) => {
  return deprecate(() => {}, dedent(message));
};

const warnDLLsDeprecated = warnDeprecatedFlag(
  `
    DLL-related CLI flags are deprecated, see:
    
    https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#deprecated-dll-flags
  `
);

const warnStaticDirDeprecated = warnDeprecatedFlag(
  `
    --static-dir CLI flag is deprecated, see:

    https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#deprecated---static-dir-cli-flag
  `
);

export function checkDeprecatedFlags({
  dll,
  uiDll,
  docsDll,
  staticDir,
}: CLIOptions | ProdCliOptions) {
  if (!dll || uiDll || docsDll) {
    warnDLLsDeprecated();
  }
  if (staticDir) {
    warnStaticDirDeprecated();
  }
}
