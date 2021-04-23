const {writeFile} = require("fs/promises")
const createFileAndDir = require("./file");
const {port, targetDir} = require("./package.json");

const model = {
  sendFile: (data, server) => {
    const {name, content} = data;

    const file = new Buffer(content).toString();
    writeFile(targetDir + name, file)
      .then(() => {
        server.send('sendFileResult', {path: name, success: true})
      })
      .catch(err => {
        server.send('sendFileResult', {path: name, success: false, msg: err})
      })
  },
  createDirs: (data, server) => {
    createFileAndDir(data)
      .then(() => {
        server.send('createDirsResult', {success: true});
      })
      .catch(err => {
        server.send('createDirsResult', {success: false, msg: err})
      })
  },
  entry: () => {
    console.log(`server listening on ${port || 7334}`)
  }
}

module.exports = model;
