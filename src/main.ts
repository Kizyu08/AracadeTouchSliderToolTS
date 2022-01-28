import SerialPort from "serialport";
import { SegaSerial } from "./SegaSerial";
import { SendInput } from "./send-input";
import keycode from "keycode";
import { VK } from "./virtual-keys";

const sendInput = new SendInput();
const keyCodes = Object.keys(keycode.codes);

const keys = ['8', 'K', 'I', ',', '7', 'J', 'U', 'M', '6', 'H', 'Y', 'N', '5', 'G', 'T', 'B', '4', 'F', 'R', 'V', '3', 'D', 'E', 'C', '2', 'S', 'W', 'X', '1', 'A', 'Q', 'Z']
// const keysVK = ['8', 'K', 'I', 'OEM_COMMA', '7', 'J', 'U', 'M', '6', 'H', 'Y', 'N', '5', 'G', 'T', 'B', '4', 'F', 'R', 'V', '3', 'D', 'E', 'C', '2', 'S', 'W', 'X', '1', 'A', 'Q', 'Z']

// let portList: SerialPort.PortInfo[] = []
// const t = SerialPort.list()
//     .then(list => portList = list)

// Promise.all([t]).then(() =>
//     console.log(portList)
// )
// async function checkSerialPortAsync() {
//     await SerialPort.list();
// }
// ---------------------
const serial = new SegaSerial('COM5');
let lastState = 0;

serial.sliderStateOnChangedObserbable.subscribe(state => {
    const changedMask = lastState ^ state; 
    for (let i = 0; i < 32; i++) {
        if(changedMask & (0b1 << i)){
            const code = keyCodes.find(c => c === keys[i].toLowerCase());
            if (code !== undefined) {
                sendInput.KeyToggle(keycode.codes[code], (state & (0b1 << i)? "down" : "up"));
            }
        }
    }
    lastState = state;
})

serial.run(false);

// 設定生成用
// for(let i = 31; i > -1; i--){
//     const keycode = VK[keysVK[i]].toString(16);
//     console.log(`cell${i+1}=0x${keycode}`);
// }