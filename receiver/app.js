const net = require('net');
const emitter = require("./emitter");
const model = require("./index");
const {port} = require("./package.json");

const listenPort = port || 7334;

const server = net.createServer();
server.listen(listenPort);

let bufferCache = '';

server.on('connection', (socket) => {
  /**
   *
   * @param path string
   * @param data any
   * @param callback
   */
  socket.send = (path, data, callback) => {
    socket.write(JSON.stringify({
      path,
      content: data
    }), callback)
  }

  socket.on('data', buffer => {

    bufferCache += buffer.toString()

    let req;

    try {
      req = JSON.parse(bufferCache);
    } catch (e) {
      if (e.message === 'Unexpected end of JSON input') {
        return;
      } else {
        throw e;
      }
    }

    const path = req?.path;
    const content = req?.content;

    emitter.emit(path, content, socket);
    bufferCache = '';
  })

  socket.on('error', (error) => {
    // console.log(error)
    socket.destroy();
  });

  socket.on('close', (error) => {
    if (error) {
      console.log('异常断开')
    } else {
      console.log('\033[47;30m INFO \033[40;0m 连接已断开\033[0m')
    }
  })
})

server.on('close', () => {
  console.error('\033[41;30m ERROR \033[40;31m sever closed \033[0m')
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('\033[47;30m ERROR \033[40;0m 地址正被使用，重试中...');

    setTimeout(() => {
      server.close();
      server.listen(listenPort);
    }, 1000)
  } else {
    console.error('\033[41;30m ERROR \033[40;31m 服务器异常: ' + error + '\033[0m')
  }
})

// 事件注册
Object.keys(model).forEach(event => {
  if (event === 'entry') {
    return;
  }
  emitter.addListener(event, model[event])
})
model.entry && model.entry();
