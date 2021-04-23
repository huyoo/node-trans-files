const {findFileNames} = require("./util");
const {readFileSync} = require("fs")
const {targetFile} = require('./package.json');
const emitter = require("./emitter")

let fileQueue = [];
let queueLength = 0;

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

    server.send('createDirs', filePaths);
    console.log('\033[44;30m WAIT \033[40;34m 同步文件夹...\033[0m')
  },
  createDirsResult: (res, server) => {
    if (!res?.success) {
      console.error('\033[41;30m ERROR \033[40;31m 同步文件夹失败: '+  JSON.stringify(res.msg)+'\033[0m')
      server.destroy()
      return;
    }

    console.log('\033[44;30m WAIT \033[40;34m 同步成功，开始传输文件...\033[0m')
    emitter.emit('sendFile', {success: true}, server)
  },
  sendFile(res, server){
    const fileInfo = fileQueue[fileQueue.length - 1];

    const buffer = readFileSync(targetFile + fileInfo.path);
    server.send('sendFile', {
      name: fileInfo.path,
      content: buffer
    })
  },
  sendFileResult: (res, server) => {
    const {path, success, msg} = res || {};

    if (!path) {
      console.error('\033[41;30m ERROR \033[40;31m 无法识别的传输结果 \033[0m');
      return;
    }

    const fileInfo = fileQueue[fileQueue.length - 1]
    if (path === fileInfo.path) {

      if (success) {
        fileQueue.pop();


        const percent = (queueLength - fileQueue.length) / queueLength * 20; // █，░
        let str = ''.padEnd(percent, '█');

        str = str.padEnd(20, '░');
        process.stdout.write('\033[44;30m WAIT \033[40;34m '+ str+ ' '+ fileInfo.path.slice(0, 20)  + (fileQueue.length ? '\r' : '\n')+'\033[0m');
      } else {
        console.error(msg);
        fileInfo.retryTimes++;
      }
    }

    if (fileQueue.length) {
      emitter.emit('sendFile', {success: true}, server)
    } else {
      console.log('\033[42;30m DONE \033[40;32m √ 部署完成\033[0m');
      server.destroy()
    }
  }
}

module.exports = model;
