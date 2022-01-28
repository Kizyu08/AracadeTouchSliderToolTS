import { cursorTo } from 'readline';
import SerialPort from 'serialport';
import { setInterval } from 'timers';
import { SegaSerialReader, SegaSerialData, SegaSerialCommandType } from './SegaSerialTools'
import { inspect } from 'util'
import { Observable, Subject } from 'rxjs';

// const filePath = './dist/input.txt';
export class SegaSerial {
    port: SerialPort;
    sliderStateOnChangedSubject: Subject<number>;
    sliderStateOnChangedObserbable: Observable<number>;
    state;
    threshold = 0x00;
    isLogOutEnabled = true;

    constructor(portName: string, baudrate = 115200) {
        this.port = new SerialPort(portName, { baudRate: baudrate });
        this.state = 0;
        this.sliderStateOnChangedSubject = new Subject();
        this.sliderStateOnChangedObserbable = this.sliderStateOnChangedSubject;
    }

    run(log = true) {
        this.isLogOutEnabled = log;
        // ポートあけた
        this.port.on('open', () => {
            console.log('開けたぜ。');
        });

        const sega = new SegaSerialReader((i) => { this.arrived(i) }, this.isLogOutEnabled);

        console.clear();

        this.port.on('data', data => {
            (data as Buffer).forEach(value => sega.addByte(value));
        })
        setInterval(() => this.port.write([0xFF, 0x03, 0x00, 0xFE]), 2000);
    }

    arrived(packet: SegaSerialData) {
        if (packet.isValid
            && packet.command == SegaSerialCommandType.SLIDER_REPORT
            && packet.data.length == 32) {

            const lastState = this.state;

            // FF02613F
            let ledData: number[] = [0x3f];

            packet.data.forEach((d, i) => {
                if (d > 0x00) {
                    ledData.push(0xfc, 0xfc, 0xfc);
                    this.state |= (1 << i);
                }
                if (d == 0x00) {
                    ledData.push(0x00, 0xfe, 0xe6);
                    this.state &= ~(1 << i);
                }
            })

            // packet.data.forEach((b, i) => {
            //     if (i % 2 === 0 && b > 0x00) this.stateTop |= (1 << (i / 2))
            //     if (i % 2 === 0 && b == 0x00) this.stateTop &= ~(1 << (i / 2))
            //     if (i % 2 === 1 && b > 0x00) this.stateBottom |= (1 << ((i / 2)))
            //     if (i % 2 === 1 && b == 0x00) this.stateBottom &= ~(1 << ((i / 2)))
            // })

            if (lastState !== this.state) this.sliderStateOnChangedSubject.next(this.state);

            const ledPacket = new SegaSerialData(0xff, SegaSerialCommandType.LED_REPORT, 97, ledData);

            const ledPacketRaw = ledPacket.getPacket();

            if (this.isLogOutEnabled){
                cursorTo(process.stdout, 0, 5);
                console.log(this.state.toString(2).padStart(32, '0'));
                // console.log(this.stateTop.toString(2).padStart(16, '0'))
                // console.log(this.stateBottom.toString(2).padStart(16, '0'))
            }

            this.port.write(ledPacketRaw);
        }
    }
}