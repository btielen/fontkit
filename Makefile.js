// https://github.com/shelljs/shelljs#command-reference
// https://devhints.io/shelljs
// https://github.com/shelljs/shelljs/wiki/The-make-utility
require('shelljs/make');

config.fatal = true;
config.verbose = true;

const { execFileSync } = require('child_process');

const packageJson = require('./package.json');

target.all = () => {
  target.clean();
  target.generateTrieJson();
  target.rollupCJS();
};

target.generateTrieJson = () => {
  env.MODULE_TYPE = 'commonjs';
  exec('babel-node src/opentype/shapers/generate-data.js');
  exec('babel-node src/opentype/shapers/gen-use.js');
  exec('babel-node src/opentype/shapers/gen-indic.js');
};

target.rollupCJS = () => {
  target.generateTrieJson();
  env.UGLIFY = false;
  env.MODULE_TYPE = 'cjs';
  exec('rollup -c rollup.config.js -o dist/fontkit.js');
};

target.clean = () => {
  rm(
    '-rf',
    'dist',
    'src/opentype/shapers/trie.json',
    'src/opentype/shapers/trieUse.json',
    'src/opentype/shapers/trieIndic.json',
    'src/opentype/shapers/indic.json',
    'src/opentype/shapers/use.json',
  );
};

/* =============================== Release ================================== */

target.releaseNext = () => {
  const version = `${packageJson.version}@next`;
  console.log('Releasing version', version);

  target.all();

  execFileSync('yarn', ['publish', '--tag', 'next', '--access', 'public'], { stdio: 'inherit' });
};

target.releaseLatest = async () => {
  const currentBranch = exec('git rev-parse --abbrev-ref HEAD').stdout.trim();
  if (currentBranch !== 'master') {
    console.error('Must be on `master` branch to cut an @latest release.');
    return;
  }

  const version = `${packageJson.version}@latest`;
  console.log('Releasing version', version);

  target.all();

  execFileSync('yarn', ['publish', '--tag', 'latest', '--access', 'public'], { stdio: 'inherit' });
};
