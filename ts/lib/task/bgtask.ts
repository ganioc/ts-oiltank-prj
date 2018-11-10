import { clinfo, clmark, clerror, clwarn } from "../formator";
import { GlobalState } from "../state";
// import { Device } from '../device/simulator'
import { Device } from '../device/simulator2'
import { Chain } from "../net/chain";
import { stat } from "fs";


const FILENAME = '[bgtask.ts]';

export interface IfBackgroundTaskOptions {
    state: GlobalState;
    measurePeriod: number; // ms
}

export enum DATA_TYPE {
    start = 0,
    normal = 1,
    end = 2,
}

let percentStack: number[] = [];
let MAX_STACK_LENGTH = 4;

export interface IfCheckFill {
    status: boolean;
    data: number;
}

export class BackgroundTask {
    private _state: GlobalState;
    private _measurePeriod: number;
    private _device: Device;
    private _bRunEnable: boolean;
    private _task: (percent: number) => void;
    private _chain: Chain;
    private _percent: number;
    private _orderWaitCounter: number;
    private _completeCounter: number;

    constructor(options: IfBackgroundTaskOptions) {
        this._state = options.state;
        this._measurePeriod = options.measurePeriod;
        this._device = new Device();
        this._device.run();
        this._bRunEnable = false;
        this._task = Object.create(null);
        this._chain = new Chain();
        this._percent = 0;
        this._orderWaitCounter = 0;
        this._completeCounter = 0;
    }
    switchToIdleTask() {
        this._task = this.taskIdle;
    }
    switchToReadyTask() {
        this._task = this.taskReady;
    }
    switchToShortageTask() {
        this._task = this.taskShortage;
    }
    switchToPublishedTask() {
        this._task = this.taskPublished;
    }
    switchToFillingTask() {
        this._task = this.taskFilling;
    }
    switchToCompletedTask() {
        this._task = this.taskCompleted;
    }
    stop() {
        this._bRunEnable = false;
    }
    getRunEnable(): boolean {
        return this._bRunEnable;
    }
    getChain() {
        return this._chain;
    }
    /**
 *  --++ 判断加油开始, 
 *  + > 0.1
 * 
 * 
 *  ++-- 判断加油结束，此时大于90
 * 
 */
    bCheckFillBegin(): IfCheckFill {
        if (percentStack.length < MAX_STACK_LENGTH) {
            return { status: false, data: 0 };
        }
        let t0 = percentStack[MAX_STACK_LENGTH - 1];
        let t1 = percentStack[MAX_STACK_LENGTH - 2];
        let t2 = percentStack[MAX_STACK_LENGTH - 3];
        let t3 = percentStack[MAX_STACK_LENGTH - 4];

        console.log('t0:', t0);
        console.log('t1', t1);
        console.log('t2', t2);
        console.log('t3', t3);
        if (t2 < 15 && (t1 > 15 || t0 > 15)) {
            clinfo('Fill detected');
            return {
                status: true,
                data: t2
            };
        } else {
            clinfo('Not detected');
            return { status: false, data: 0 };
        }
    }
    bCheckFillEnd(): IfCheckFill {
        if (percentStack.length < MAX_STACK_LENGTH) {
            return { status: false, data: 0 };
        }
        let t0 = percentStack[MAX_STACK_LENGTH - 1];
        let t1 = percentStack[MAX_STACK_LENGTH - 2];
        let t2 = percentStack[MAX_STACK_LENGTH - 3];
        let t3 = percentStack[MAX_STACK_LENGTH - 4];

        console.log('t0:', t0);
        console.log('t1', t1);
        console.log('t2', t2);
        console.log('t3', t3);

        if (t2 > 90 && (t1 - t2) < 0.2 && (t0 - t1) < 0.2) {
            return {
                status: true, data: t2
            };
        } else {
            return { status: false, data: 0 };
        }

    }

    run() {
        if (this._bRunEnable === true) {
            return;
        }
        this._bRunEnable = true;

        let mainTask = async () => {
            clwarn('To wait ------->');
            await new Promise(async (resolve, reject) => {
                setTimeout(() => {
                    clinfo('To delay ', this._measurePeriod / 1000, 'seconds');
                    resolve('OK');
                }, this._measurePeriod);
            });

            let percent = this._device.getPercent();

            clmark(FILENAME, 'read percent', percent.toFixed(2));

            if (percent !== -1) {
                this._percent = percent;
                // 放入 stack
                percentStack.push(percent);
                if (percentStack.length > MAX_STACK_LENGTH) {
                    percentStack.shift();
                }

                // 收到传来的有效数据后，根据状态进行处理
                // 否则不处理，等下一个6秒钟后的数据
                await this._task(percent);
            } else {

            }


            if (this._bRunEnable === true) {
                mainTask();
            } else {
                clwarn('Out of run() task');
            }

        }
        mainTask();
    }
    taskIdle(percent: number) {

    }
    async taskReady(percent: number) {

        return new Promise(async (resolve, reject) => {
            // 1st 判断是否缺油, 这里的判断可以更加复杂一些！
            if (this._device.bShortage()) {
                // clerror('Device shortage of oil');
                this._state.emit('shortage', { percent: percent })
                resolve('OK');
                return;
            }

            // 2nd 将数据存入本地数据库
            let feedback = await this._state.getMeasurementDb().readInfoTable();
            if (feedback.error !== 'OK') {
                clerror('read measuremtn_info table fail');
                resolve('OK');
                return;
            } else {
                clinfo('Save to db done');
            }

            feedback = await this._state.getMeasurementDb().updateMeasurementTableTransaction(feedback.data, percent);

            if (feedback.error !== 'OK') {
                clerror('save measurement table fail')
                resolve('OK');
                return;
            } else {
                clinfo('Save measurement succeed');
            }

            // 3rd 将数据存放在网上
            // 就在这里把数据放在链上的数据合约上面去
            try {
                await this._chain.sendData(1, percent);
            } catch (e) {
                clmark('chain sendData');
                clerror(e);
            }

            clmark('end of save to cloud');
            resolve('OK');
            // await this._chain.readData();
        });
    }
    async taskShortage(percent: number) {
        return new Promise(async (resolve, reject) => {
            // read order
            let result: any;
            try {
                result = await this._chain.readLatestOrder();
            } catch (e) {
                clerror(e);
            }

            if (result.status === 'OK') {
                console.log(result.data);
                // if 如果最新的order的status是confirmed就进入下一个状态
                if (result.data.status !== undefined && result.data.status === 'confirmed') {
                    this._state.emit('published');

                } else {
                    this._orderWaitCounter++;
                }

                // 否则计数器加1
            }
            // 如果计数器大于10，重新进入ready状态
            if (this._orderWaitCounter > 100) {
                this._state.emit('ready', { percent: percent });
                resolve('OK');
                return;
            }

            // 就在这里把数据放在链上的数据合约上面去
            try {
                await this._chain.sendData(DATA_TYPE.normal, percent);
            } catch (e) {
                clmark('Send data to cloud');
                clerror(e);
            }
            // await this._chain.sendOrder(100.0 - percent);

            // delay some time
            resolve('OK');
        });

    }
    async taskPublished(percent: number) {
        return new Promise(async (resolve, reject) => {
            // 就在这里把数据放在链上的数据合约上面去
            try {
                await this._chain.sendData(DATA_TYPE.normal, percent);
            } catch (e) {
                clerror(e);
            }


            let check = this.bCheckFillBegin();
            if (check.status === true) {
                await this._chain.sendData(DATA_TYPE.start, check.data);

                this._state.emit('filling');
            }
            let order: any;
            try {
                order = await this._chain.readLatestOrder();
            } catch (e) {
                clerror(e);
            }

            if (order.status === 'OK') {
                console.log(order.data);
                let status = order.data.status;

                if (status === 'violated') {
                    this._state.emit('completed');
                    this._completeCounter = 0;
                }
            }
            resolve('OK');
        });
    }
    async taskFilling(percent: number) {
        return new Promise(async (resolve, reject) => {
            // 就在这里把数据放在链上的数据合约上面去
            try {
                await this._chain.sendData(DATA_TYPE.normal, percent);
            } catch (e) {
                clerror(e);
            }

            let order: any;
            try {
                order = await this._chain.readLatestOrder();
            } catch (e) {
                clerror(e);
            }

            if (order.status === 'OK') {
                clmark('filling');
                console.log(order.data);

                let status = order.data.status;

                if (status === 'confirmed') {
                    let check = this.bCheckFillEnd();
                    if (check.status === true) {
                        await this._chain.sendData(DATA_TYPE.end, check.data);
                    }

                } else if (status === 'violated') {
                    this._state.emit('completed');
                    this._completeCounter = 0;
                } else if (status === 'completed') {
                    this._state.emit('completed');
                    this._completeCounter = 0;
                } else if (status === 'broken') {
                    this._state.emit('completed');
                    this._completeCounter = 0;
                }
            }
            resolve('OK');
        });
    }
    async taskCompleted(percent: number) {
        return new Promise(async (resolve, reject) => {
            // 判断是否
            this._completeCounter++;
            clerror('Oiltank filling completed successfully!');

            if (this._completeCounter > 2) {
                this._state.emit('ready');
            }
            resolve('OK');
        });
    }
    sendOrder() {
        return new Promise(async (resolve, reject) => {
            await this._chain.sendOrder(100 - this._percent);
            clmark('Send out order:');
            console.log(100 - this._percent);
            this._orderWaitCounter = 0;
            resolve('OK');
        });
    }

}
