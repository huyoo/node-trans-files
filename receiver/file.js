const {mkdir, readdir, unlink, rmdir} = require('fs/promises');
const {statSync} = require('fs');
const path = require('path')
const {targetDir} = require("./package.json")

async function bulkCreateDir(list) {
  await Promise.all(list.map(item => mkdir(targetDir + item, {recursive: true})));
  return true
}

// 清空文件夹
async function rmdirAsync(filePath) {
  let stat = statSync(filePath)

  if (stat.isFile()) {
    await unlink(filePath)
    return
  }

  let dirs = await readdir(filePath);
  dirs = dirs.map(dir => rmdirAsync(path.join(filePath, dir)));
  await Promise.all(dirs);
  await rmdir(filePath);
}

async function createFileAndDir(fileArr) {

  console.log('\033[44;30m WAIT \033[40;34m 开始清理文件...\033[0m')
  await rmdirAsync(targetDir)
  console.log('\033[44;30m WAIT \033[40;34m 开始同步文件夹...\033[0m')
  const dirs = [];
  fileArr.forEach(item => {
    const dir = item.slice(0, item.lastIndexOf('/'));
    if (!dirs.includes(dir)) {
      dirs.push(dir);
    }
  })

  await bulkCreateDir(dirs);
}

module.exports = createFileAndDir;
