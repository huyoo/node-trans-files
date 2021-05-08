const net = require('net');
const emitter = require("./emitter");
const model = require('./index')
const Transcoder = require("./Transcoder");
const {server} = require("./package.json")

const client = net.createConnection(server)
const dateStarted = Date.now();

const transcoder = new Transcoder();

/**
 * 自定义发送数据方法
 * @param path string
 * @param data any
 * @param callback
 */
client.send = (path, data, callback) => {
  client.write(
    transcoder.encode(
      JSON.stringify({
        path,
        content: data
      })
    ),
    callback
  )
}


client.on('connect', () => {
  Object.keys(model).forEach(event => {
    if (event === 'entry') {
      return;
    }

    emitter.addListener(event, model[event])
  })

  model.entry(client);
})

let bufferCache = '';

client.on('data', (buffer) => {
  if (bufferCache) {
    buffer = Buffer.concat([bufferCache, buffer])
  }

  let packageLength = 0;

  while (packageLength = transcoder.getPackageLength(buffer)) {
    const bufferPackage = buffer.slice(0, packageLength) // 取出最前面一个完整的包
    buffer = buffer.slice(packageLength)  // 截取出剩下的所有数据

    const result = transcoder.decode(bufferPackage) // 对一个完整的包解码

    let req = JSON.parse(result.body)

    const event = req?.path;
    const content = req?.content;

    if (!event) {
      console.error('\033[41;30m ERROR \033[40;31m 接收到无法识别的socket请求，path不能为 null/undefined/空字符，请检查服务端代码 \033[0m')
    }
    emitter.emit(event, content, client);
  }


  bufferCache = buffer;


  // const req = JSON.parse(buffer.toString());
  // const event = req?.path;
  // const content = req?.content;
  //
  //
  //
  // if (!event) {
  //   console.error('\033[41;30m ERROR \033[40;31m 接收到无法识别的socket请求，path不能为 null/undefined/空字符，请检查服务端代码 \033[0m')
  // }
  //
  // emitter.emit(event, content, client);
})

client.on("close", () => {
  const consume = (Date.now() - dateStarted) / 1000;
  console.log('\033[90m部署耗时: ' + consume + 's\033[0m')

})
