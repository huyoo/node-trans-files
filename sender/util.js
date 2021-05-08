const {readdirSync, statSync} = require("fs");
const {targetFile} = require("./package.json")
const {execSync} = require('child_process')

module.exports = {
  getGitName: () => {
    const name = execSync('git show -s --format=%cn').toString().trim();
    const email = execSync('git show -s --format=%ce').toString().trim();

    return name + ',' + email
  },
  findFileNames: () => {
    const files = [];

    function find(path) {
      const tempFiles = readdirSync(path);

      if (!tempFiles.length) return;

      tempFiles.forEach(item => {
        const stats = statSync(path + "/" + item);

        if (stats.isDirectory()) {
          find(path + "/" + item);
        } else {
          files.push(path.replace(targetFile, '') + "/" + item.split(" ").join(''))
        }
      })
    }

    find(targetFile);

    return files
  },
  progressLog: (queueLength, fileQueueLength) => {
    const percent = (fileQueueLength) / queueLength * 20; // █，░
    let str = ''.padEnd(percent, '█');

    str = str.padEnd(20, '░');
    process.stdout.write('\033[44;30m WAIT \033[40;34m ' + str + ' ' + (queueLength > fileQueueLength ? '\r' : '\n') + '\033[0m');
  },
}

