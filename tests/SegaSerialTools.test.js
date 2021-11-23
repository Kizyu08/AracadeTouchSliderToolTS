"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SegaSerialTools_1 = require("../src/SegaSerialTools");
describe("index.js", () => {
    test('test calc checksum', () => {
        let data = new SegaSerialTools_1.SegaSerialData(0xff, 0x03, 0x00, [], 0xfe);
        data.calcSum();
        expect(data.myCheckSum).toBe(data.checkSum);
    });
});
