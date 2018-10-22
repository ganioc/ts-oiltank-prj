import { clinfo, clmark, clerror, clwarn } from "../formator";
import { GlobalState } from "../state";
import { Device } from '../device/simulator'

const FILENAME = '[bgtask.ts]';

export interface IfBackgroundTaskOptions {
    state: GlobalState;
    measurePeriod: number; // ms
}

export class BackgroundTask {
    private _state: GlobalState;
    private _measurePeriod: number;
    private _device: Device;
    private _bRunEnable: boolean;
    private _task: (percent: number) => void;

    constructor(options: IfBackgroundTaskOptions) {
        this._state = options.state;
        this._measurePeriod = options.measurePeriod;
        this._device = new Device();
        this._device.run();
        this._bRunEnable = false;
        this._task = Object.create(null);
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

            clmark(FILENAME, 'read percent', percent);

            this._task(percent);

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


    }
    taskShortage(percent: number) {


    }
    taskPublished(percent: number) {

    }
    taskConfirmed(percent: number) {

    }
}
