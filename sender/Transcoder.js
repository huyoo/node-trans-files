/**
 *
 */

class Transcoder {
  constructor() {
    this.packageHeaderLen = 8; // 包头长度
    this.serialNumber = 0; // 包的序列号（从0开始）
    this.packageSerialNumberLen = 4; // 包序列号所占用的字节
  }

  /**
   * 编码
   * @param {Object} data 原始的Buffer数据对象
   * @param {Number} serialNumber 包序号，客户端自动生成，服务端解码后在编码需要传入，这样客户端能根据序列号将请求的和收到的包一一对应
   */
  encode(data, serialNumber=1) {
    const body = Buffer.from(data)   // 将原始数据编码成为Buffer对象

    const header = Buffer.alloc(this.packageHeaderLen)    // 约定好整个头占4位
    header.writeUInt32BE(serialNumber || this.serialNumber)  // 包序号占前两位
    header.writeUInt32BE(body.length, this.packageSerialNumberLen) // 数据长度占后两位

    // if (serialNumber === undefined) {
    //   this.serialNumer++
    // }
    return Buffer.concat([header, body])
  }

  /**
   * 解码（前提是参数buffer是一个完整的数据包，包含header和body）
   * @param {Object} buffer 要解码的buffer对象
   */
  decode(buffer) {
    const header = buffer.slice(0, this.packageHeaderLen) // 获取包头
    const body = buffer.slice(this.packageHeaderLen)   // 获取头部以后的数据
    return {
      serialNumber: header.readUInt32BE(),
      bodyLength: header.readUInt32BE(this.packageSerialNumberLen),
      body: body.toString()
    }
  }

  /**
   * 获取当前buffer对象中包含的第一个完整的buffer数据包长度：
   * 1. 如果当前 buffer 长度数据小于包头，肯定不是一个完整的数据包，因此直接返回 0 不做处理（可能数据还未接收完等等）
   * 2. 否则返回这个完整的数据包长度
   * @param buffer
   * @returns {number}
   */
  getPackageLength(buffer) {
    if (buffer.length < this.packageHeaderLen) {
      return 0
    }

    const length = this.packageHeaderLen + buffer.readUInt32BE(this.packageSerialNumberLen) // 包的长度 = 4 + 整个buffer从2到3读出来的数据

    if (length > buffer.length) {
      return 0
    }

    return length
  }
}

module.exports = Transcoder
