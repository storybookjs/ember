import path from 'path';
import { execSync } from 'child_process';
import { oneWayHash } from './one-way-hash';

export const getProjectRoot = () => {
  let projectRoot;
  try {
    const projectRootBuffer = execSync(`git rev-parse --show-toplevel`, {
      timeout: 1000,
      stdio: `pipe`,
    });
    projectRoot = String(projectRootBuffer).trimEnd();
    // eslint-disable-next-line no-empty
  } catch (_) {}

  return projectRoot;
};

let anonymousProjectId: string;
export const getAnonymousProjectId = () => {
  if (anonymousProjectId) {
    return anonymousProjectId;
  }

  let unhashedProjectId;
  try {
    const projectRoot = getProjectRoot();

    const projectRootPath = path.relative(projectRoot, process.cwd());

    const originBuffer = execSync(`git config --local --get remote.origin.url`, {
      timeout: 1000,
      stdio: `pipe`,
    });

    // we use a combination of remoteUrl and working directory
    // to separate multiple storybooks from the same project (e.g. monorepo)
    unhashedProjectId = `${String(originBuffer).trim()}${projectRootPath}`;
    // eslint-disable-next-line no-empty
  } catch (_) {}

  anonymousProjectId = oneWayHash(unhashedProjectId);
  return anonymousProjectId;
};
