import { Observable, Subject } from "rxjs";
import { SendInput } from "./send-input";
import keycode from "keycode";

export class KeySender{
    private keyStateOnChangedObserbable: Observable<number>;
    private lastState = 0;


    private static keys = ['8', 'K', 'I', ',', '7', 'J', 'U', 'M', '6', 'H', 'Y', 'N', '5', 'G', 'T', 'B', '4', 'F', 'R', 'V', '3', 'D', 'E', 'C', '2', 'S', 'W', 'X', '1', 'A', 'Q', 'Z']
// const keysVK = ['8', 'K', 'I', 'OEM_COMMA', '7', 'J', 'U', 'M', '6', 'H', 'Y', 'N', '5', 'G', 'T', 'B', '4', 'F', 'R', 'V', '3', 'D', 'E', 'C', '2', 'S', 'W', 'X', '1', 'A', 'Q', 'Z']


    
    constructor(subscriver: Observable<number>){
        const sendInput = new SendInput();
        const keyCodes = Object.keys(keycode.codes);

        this.keyStateOnChangedObserbable = subscriver
        this.keyStateOnChangedObserbable.subscribe(state => {
            const changedMask = this.lastState ^ state;
            for (let i = 0; i < 32; i++) {
                if (changedMask & (0b1 << i)) {
                    const code = keyCodes.find(c => c === KeySender.keys[i].toLowerCase());
                    if (code !== undefined) {
                        sendInput.KeyToggle(keycode.codes[code], (state & (0b1 << i) ? "down" : "up"));
                    }
                }
            }
            this.lastState = state;
        })
    }


}