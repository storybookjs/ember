import { JsPackageManager } from './js-package-manager';

const regex = /[\s"\n]next.*?(\d+).*/;

export const detectNextJS = (
  packageManager: Pick<JsPackageManager, 'type' | 'executeCommand'>
): number | false => {
  try {
    let out = '';
    if (packageManager.type === 'npm') {
      try {
        // npm <= v7
        out = packageManager.executeCommand('npm', ['ls', 'next']);
      } catch (e2) {
        // npm >= v8
        out = packageManager.executeCommand('npm', ['why', 'next']);
      }
    } else {
      out = packageManager.executeCommand('yarn', ['why', 'next']);
    }

    const [, version] = out.match(regex);

    return version && parseInt(version, 10) ? parseInt(version, 10) : false;
  } catch (err) {
    //
  }

  return false;
};
