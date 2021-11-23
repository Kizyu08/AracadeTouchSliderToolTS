import { SegaSerialData, SegaSerialReader } from "../src/SegaSerialTools";

test('test calc checksum', () => {
    const data = new SegaSerialData(0xff, 0x03, 0x00, [], 0xfe)
    data.calcSum()

    expect(data.myCheckSum).toBe(data.checkSum)
})

test('test escaped checksum', () => {
    const data = [0xff, 0x01, 0x20, 0xbd, 0x26, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xfd, 0xfc, 0xff]
    const reader = new SegaSerialReader()

    data.forEach(d => reader.addByte(d))

    expect(reader.currentData!.myCheckSum).toBe(reader.currentData!.checkSum)
})




// var serial = new SegaSerialReader
// // ファイルをUTF-8として非同期で読み込む
// const file = fs.readFileSync(
//     filePath,
//     { encoding: "utf8" }
// );

// file.split(' ').map(hex => serial.addByte(parseInt(hex, 16)));
// // serial.printPackets()