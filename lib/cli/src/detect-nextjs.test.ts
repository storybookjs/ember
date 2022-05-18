import { detectNextJS } from './detect-nextjs';

test('detect nothing if it fails', () => {
  const out = detectNextJS({
    type: 'npm',
    executeCommand: () => {
      throw new Error('test error');
    },
  });
  expect(out).toEqual(false);
});

test('detect from npm ls', () => {
  const outputFromCommand = `
/path/to/cwd
└── next@12.0.7 
  `;
  const out = detectNextJS({ type: 'npm', executeCommand: () => outputFromCommand });
  expect(out).toEqual(12);
});

test('detect from npm why', () => {
  const outputFromCommand = `
next@12.0.7
node_modules/next
  next@"^12.0.7" from the root project
  peer next@">=10.2.0" from eslint-config-next@12.0.7
  node_modules/eslint-config-next
    dev eslint-config-next@"^12.0.7" from the root project
`;
  const out = detectNextJS({ type: 'npm', executeCommand: () => outputFromCommand });
  expect(out).toEqual(12);
});

test('detect from yarn why', () => {
  const outputFromCommand = `
yarn why v1.22.18
[1/4] 🤔  Why do we have the module "next"...?
[2/4] 🚚  Initialising dependency graph...
[3/4] 🔍  Finding dependency...
[4/4] 🚡  Calculating file sizes...
=> Found "next@12.0.7"
info Has been hoisted to "next"
info This module exists because it's specified in "dependencies".
info Disk size without dependencies: "XX.XXMB"
info Disk size with unique dependencies: "XX.XXMB"
info Disk size with transitive dependencies: "XX.XXMB"
info Number of shared dependencies: XXX
✨  Done in 0.XXs.
`;
  const out = detectNextJS({ type: 'npm', executeCommand: () => outputFromCommand });
  expect(out).toEqual(12);
});
