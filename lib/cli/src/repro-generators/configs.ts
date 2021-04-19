import { SupportedFrameworks } from '../project_types';

export interface Parameters {
  framework: SupportedFrameworks;
  /** E2E configuration name */
  name: string;
  /** framework version */
  version: string;
  /** CLI to bootstrap the project */
  generator: string;
  /** Use storybook framework detection */
  autoDetect?: boolean;
  /** Pre-build hook */
  preBuildCommand?: string;
  /** When cli complains when folder already exists */
  ensureDir?: boolean;
  /** Dependencies to add before building Storybook */
  additionalDeps?: string[];
  /** Add typescript dependency and creates a tsconfig.json file */
  typescript?: boolean;
}

export const cra: Parameters = {
  framework: 'react',
  name: 'cra',
  version: 'latest',
  generator: [
    '{{installer}} create-react-app@{{version}} {{appName}}',
    'cd {{appName}}',
    'echo "FAST_REFRESH=true" > .env',
  ].join(' && '),
};

export const cra_typescript: Parameters = {
  framework: 'react',
  name: 'cra_typescript',
  version: 'latest',
  generator: '{{installer}} create-react-app@{{version}} {{appName}} --template typescript',
};
