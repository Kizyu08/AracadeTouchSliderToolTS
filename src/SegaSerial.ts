import { cursorTo } from 'readline';
import SerialPort from 'serialport';
import { setInterval } from 'timers';
import { SegaSerialReader, SegaSerialData, SegaSerialCommandType } from './SegaSerialTools'
import { inspect } from 'util'

// const filePath = './dist/input.txt';
export class SegaSerial {
    port: SerialPort

    constructor(portName: string, baudrate = 115200) {
        this.port = new SerialPort(portName, { baudRate: baudrate })
    }

    run() {
        // ポートあけた
        this.port.on('open', () => {
            console.log('開けたぜ。');
        });

        const sega = new SegaSerialReader((i) => { this.arrived(i) })

        console.clear()

        this.port.on('data', data => {
            (data as Buffer).forEach(value => sega.addByte(value))
        })
        setInterval(() => this.port.write([0xFF, 0x03, 0x00, 0xFE]), 2000)
    }

    arrived(packet: SegaSerialData) {
        if (packet.isValid
            && packet.command == SegaSerialCommandType.SLIDER_REPORT
            && packet.data.length == 32) {
                
            // FF02613F
            let ledData: number[] = [0x3f]

            packet.data.forEach(d => {
                if (d > 0x00) ledData.push(0xfc, 0xfc, 0xfc)
                if (d == 0x00) ledData.push(0x00, 0xfe, 0xe6)
            })

            const ledPacket = new SegaSerialData(0xff, SegaSerialCommandType.LED_REPORT, 97, ledData)

            const ledPacketRaw = ledPacket.getPacket()
            cursorTo(process.stdout, 0, 5)
            console.log(inspect(ledPacketRaw, { maxArrayLength: null }))

            this.port.write(ledPacketRaw)
        }
    }
}