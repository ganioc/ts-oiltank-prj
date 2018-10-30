import { clinfo, clmark, clerror, clwarn } from "../formator";
import { GlobalState } from "../state";
// import { Device } from '../device/simulator'
import { Device } from '../device/simulator2'
import { Chain } from "../net/chain";


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

export class BackgroundTask {
    private _state: GlobalState;
    private _measurePeriod: number;
    private _device: Device;
    private _bRunEnable: boolean;
    private _task: (percent: number) => void;
    private _chain: Chain;
    private _percent: number;
    private _orderWaitCounter: number;

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
    switchToConfirmedTask() {
        this._task = this.taskConfirmed;
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

    run() {
        if (this._bRunEnable === true) {
            return;
        }
        this._bRunEnable = true;

        let mainTask = async () => {
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
                // 收到传来的有效数据后，根据状态进行处理
                // 否则不处理，等下一个6秒钟后的数据
                this._task(percent);
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
        // 1st 判断是否缺油, 这里的判断可以更加复杂一些！
        if (this._device.bShortage()) {
            // clerror('Device shortage of oil');
            this._state.emit('shortage', { percent: percent })
            return;
        }

        // 2nd 将数据存入本地数据库
        let feedback = await this._state.getMeasurementDb().readInfoTable();
        if (feedback.error !== 'OK') {
            clerror('read measuremtn_info table fail')
            return;
        }

        feedback = await this._state.getMeasurementDb().updateMeasurementTableTransaction(feedback.data, percent);

        if (feedback.error !== 'OK') {
            clerror('save measurement table fail')
            return;
        } else {
            clinfo('Save measurement succeed');
        }

        // 3rd 将数据存放在网上
        // 就在这里把数据放在链上的数据合约上面去
        await this._chain.sendData(1, percent);

        // await this._chain.readData();

    }
    async taskShortage(percent: number) {


        // read order
        let result = await this._chain.readOrder();

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
        if (this._orderWaitCounter > 10) {
            this._state.emit('ready', { percent: percent })
            return;
        }

        // 就在这里把数据放在链上的数据合约上面去
        await this._chain.sendData(DATA_TYPE.normal, percent);

        // await this._chain.sendOrder(100.0 - percent);

        // delay some time


    }
    async taskPublished(percent: number) {
        // 就在这里把数据放在链上的数据合约上面去
        await this._chain.sendData(DATA_TYPE.normal, percent);

    }
    async taskConfirmed(percent: number) {



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
