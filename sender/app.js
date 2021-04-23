const net = require('net');
const emitter = require("./emitter");
const model = require('./index')
const {server} = require("./package.json")

const client = net.createConnection(server)
const dateStarted = Date.now();

/**
 * 自定义发送数据方法
 * @param path string
 * @param data any
 * @param callback
 */
client.send = (path, data, callback) => {
  client.write(JSON.stringify({
    path,
    content: data
  }), callback)
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


client.on('data', (buffer) => {
  const req = JSON.parse(buffer.toString());
  const event = req?.path;
  const content = req?.content;

  // console.log(`path: ${event}, data: ${JSON.stringify(content)}`)

  if (!event) {
    console.error('\033[41;30m ERROR \033[40;31m 接收到无法识别的socket请求，path不能为 null/undefined/空字符，请检查服务端代码 \033[0m')
  }

  emitter.emit(event, content, client);
})

client.on("close", () => {
  const consume = (Date.now() - dateStarted) / 1000;
  console.log('\033[90m部署耗时: ' + consume + 's\033[0m')

})
