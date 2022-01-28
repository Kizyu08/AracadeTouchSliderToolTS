import { cursorTo } from 'readline';
import { from, Observable, Subject } from 'rxjs';

// https://gist.github.com/dogtopus/b61992cfc383434deac5fab11a458597

export const SegaSerialCommandType = {
    'SLIDER_REPORT': 0x01,
    'LED_REPORT': 0x02,
    'ENABLE_SLIDER_REPORT': 0x03,
    'DISABLE_SLIDER_REPORT_OUT': 0x04,
    'DISABLE_SLIDER_REPORT_IN': 0x05,
    'RESET': 0x10,
    'EXCEPTION': 0xEE,
    'GET_HW_INFO': 0xF0,
} as const

export class SegaSerialData {
    header: number
    command: number
    length: number
    data: number[]
    checkSum: number
    myCheckSum: number
    isValid: boolean

    constructor(header: number, command: number, length: number, data: number[], checkSum?: number) {
        this.header = header
        this.command = command
        this.length = length
        this.data = data
        this.myCheckSum = 0
        this.isValid = false

        if (checkSum) {
            this.checkSum = checkSum
            this.calcSum()
        } else {
            this.checkSum = this.calcSum()
        }
    }

    public getPacket(): number[] {
        return [this.header, this.command, this.length]
            .concat(this.data)
            .concat(
                (this.checkSum == 0xff) ? [0xfd, 0xfe]
                    : (this.checkSum == 0xfd) ? [0xfd, 0xfc]
                        : [this.checkSum]
            )
    }

    public calcSum(): number {
        let tmp = this.header
        tmp += this.command
        tmp += this.length
        this.data.forEach(d => tmp += d)
        this.myCheckSum = 0x100 - (tmp & 0xFF)
        if (this.checkSum != undefined && this.myCheckSum === this.checkSum) this.isValid = true;
        return this.myCheckSum
    }

    public printState() {
        if (this.command == SegaSerialCommandType.SLIDER_REPORT) {
            let topLine: string = ''
            let bottomLine: string = ''

            this.data.filter((_, i) => i % 2 === 0)
                .forEach(b => topLine = (b > 0x00 ? '█' : ' ') + topLine)
            this.data.filter((_, i) => (i % 2 === 1) || (i === 1))
                .forEach(b => bottomLine = (b > 0x00 ? '█' : ' ') + bottomLine)

            console.log(' ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ ')
            console.log('▕' + topLine + '▏')
            console.log('▕' + bottomLine + '▏')
            console.log(' ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ ')
        }
    }
}

export class SegaSerialReader {
    packetBuffer: number[]
    packets: number[][]
    packetObservable: Observable<number[]>
    packetSubject: Subject<number[]>
    onPacketArrived?: (data: SegaSerialData) => void
    escape: boolean = false
    currentData?: SegaSerialData = undefined

    constructor(onPacketArrivedCallBack?: (data: SegaSerialData) => void, logOut: boolean = true) {
        this.packetBuffer = []
        this.packets = []
        this.onPacketArrived = onPacketArrivedCallBack

        this.packetSubject = new Subject()
        this.packetObservable = this.packetSubject
        this.packetObservable.subscribe(input => {
            const tekitou = new SegaSerialData(
                input[0],
                input[1],
                input[2],
                input.slice(3, input.length - 1),
                input[input.length - 1],
            )

            if (this.onPacketArrived) this.onPacketArrived(tekitou)

            if(logOut){
                cursorTo(process.stdout, 0, 0)
                tekitou.printState()
            }

            this.currentData = tekitou
        })
    }

    public addByte(packetBuffer: number): void {
        if (packetBuffer == 0xff) {
            // console.log('header:' + packetBuffer.toString(16))

            // 次のパケットが来たとき
            if (this.packetBuffer.length > 0) {
                this.packetSubject.next(this.packetBuffer)
                this.packets.push(this.packetBuffer)
                this.packetBuffer = []
                this.escape = false
            }

            this.packetBuffer.push(packetBuffer)
        } else if (this.packetBuffer.length > 0) {
            if (packetBuffer == 0xfd)
                this.escape = true
            else if (this.escape && (packetBuffer == 0xfe))
                this.packetBuffer.push(0xff)
            else if (this.escape && (packetBuffer == 0xfc))
                this.packetBuffer.push(0xfd)
            else
                this.packetBuffer.push(packetBuffer)

        } else {
            // console.log('damezo:' + packetBuffer.toString(16))
        }
    }

    public printPackets(): void {
        console.log(this.packets)
    }
}