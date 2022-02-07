import { run } from './bundle-package';

const flags = process.argv.slice(2);
const cwd = process.cwd();

run({ cwd, flags }).catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
