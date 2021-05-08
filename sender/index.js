const {findFileNames, progressLog} = require("./util");
const {readFileSync} = require("fs")
const {targetFile} = require('./package.json');
const emitter = require("./emitter")

let fileQueue = [];
let queueLength = 0;
let sendIndex = 0;
let resultCount = 0;

const model = {
  entry: (server) => {
    const filePaths = findFileNames();

    if (!filePaths.length) {
      console.log('\033[43;30m ERROR \033[40;33m 无可部署的文件 \033[0m')
      server.destroy();
      return;
    }

    fileQueue = filePaths.map(path => {
      return {
        path,
        success: false,
        retryTimes: 0,
      }
    })
    queueLength = fileQueue.length;
    sendIndex = fileQueue.length;

    server.send('createDirs', filePaths);
    console.log('\033[44;30m WAIT \033[40;34m 同步文件夹...\033[0m')
  },
  createDirsResult: (res, server) => {
    if (!res?.success) {
      console.error('\033[41;30m ERROR \033[40;31m 同步文件夹失败: ' + JSON.stringify(res.msg) + '\033[0m')
      server.destroy()
      return;
    }

    console.log('\033[44;30m WAIT \033[40;34m 同步成功，开始传输文件...\033[0m')
    emitter.emit('sendFile', {success: true}, server)
  },
  sendFile(res, server) {
    sendIndex--;
    const fileInfo = fileQueue[sendIndex];
    const buffer = readFileSync(targetFile + fileInfo.path);

    server.send('sendFile', {
      name: fileInfo.path,
      content: buffer
    }, () => {
      if (sendIndex > 0) {
        emitter.emit('sendFile', null, server)
      }
    })
  },
  sendFileResult: (res, server) => {
    const {path, success, msg} = res || {};

    if (!path) {
      console.error('\033[41;30m ERROR \033[40;31m 无法识别的传输结果 \033[0m');
      return;
    }

    const resultIndex = fileQueue.findIndex(item => item.path === path);
    if (resultIndex === -1) {
      return;
    }

    const fileInfo = fileQueue[resultIndex];
    if (success) {
      fileInfo.success = true;
    } else {
      fileInfo.retryTimes++;
    }
    resultCount++;

    progressLog(queueLength, resultCount);
    if (resultCount < fileQueue.length) {
      return;
    }

    fileQueue = fileQueue.filter(item => !item.success);

    if (!fileQueue.length) {
      console.log('\033[42;30m DONE \033[40;32m √ 部署完成\033[0m');
      server.destroy()
      return;
    }

    resultCount = 0;
    sendIndex = fileQueue.length;

    emitter.emit('sendFile', null, server)
  }
}

module.exports = model;
