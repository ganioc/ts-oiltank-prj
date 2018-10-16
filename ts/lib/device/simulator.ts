import { resolve } from "dns";
import { clinfo } from "../formator";

const FILENAME = '[simulator.ts]';
const MIN_PERCENT = 0;
const MAX_PERCENT = 100;

export class Device {
    private _percent: number;
    private _decreaseRate: number;
    private _shortageLimit: number;
    constructor() {
        this._percent = 65;
        this._decreaseRate = 1 / 60; // 1分钟下降 1 percent
        // 1秒钟下降 1/60
        this._shortageLimit = 10;
    }
    async run() {
        let oldTime: number = new Date().getTime();
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve('OK');
            }, 1000);
        })
        let newTime: number = new Date().getTime();
        this.subtract((newTime - oldTime) * this._decreaseRate / (1000));
        // clinfo(FILENAME, this.getPercent());
        this.run();
    }
    getPercent(): number {
        return this._percent;
    }
    add(percent: number) {
        if (percent < 0) {
            return;
        }
        this._percent += percent;
        if (this._percent >= MAX_PERCENT) {
            this._percent = MAX_PERCENT;
        }
    }
    subtract(percent: number) {
        if (percent <= 0) {
            return;
        }
        this._percent -= percent;
        if (this._percent <= MIN_PERCENT) {
            this._percent = MIN_PERCENT;
        }
    }
    bShortage(): boolean {
        if (this._percent <= this._shortageLimit) {
            return true;
        }
        return false;
    }
}
