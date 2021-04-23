const {readdirSync, statSync, readFileSync} = require("fs");
const {targetFile} = require("./package.json")

module.exports = {
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
  }
}

