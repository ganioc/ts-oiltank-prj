import * as events from 'events';
import { BackgroundTask } from './task/bgtask';
import { StateDb } from './db/statedb'
import { MeasurementDb } from './db/measurementdb';
import { cl, clerror, clwarn, clinfo } from './formator';
import { Code } from './code';

const FILENAME = '[state.ts]';


export enum GLOBAL_STATE {
    idle = 0,
    ready,
    shortage,
    published,
    filling,
    completed,
}

export interface globalStateOptions {
    stateDbName: string;
    measurmentDbName: string;
    logDbName: string;
    maxMeasurement: number;
    measurePeriod: number;
}

export class GlobalState extends events.EventEmitter {
    private _state: number;
    private _options: globalStateOptions;
    private _stateDb: StateDb;
    private _measurementDb: MeasurementDb;
    private _task: BackgroundTask;

    constructor(options: globalStateOptions) {
        super();
        this._state = GLOBAL_STATE.idle;
        this._options = options;

        this._stateDb = new StateDb({
            name: this._options.stateDbName,
        });
        this._measurementDb = new MeasurementDb({
            name: this._options.measurmentDbName,
            max_id: this._options.maxMeasurement,
        })
        this._task = new BackgroundTask({
            state: this,
            measurePeriod: this._options.measurePeriod,
        });

    }
    public getMeasurementDb(): MeasurementDb {
        return this._measurementDb;
    }
    getState(): GLOBAL_STATE {
        return this._state;
    }
    checkMeasurementDatabase() {
        return new Promise(async (resolve, reject) => {
            let feedback = await this._measurementDb.openDb();
            if (feedback.error !== 'OK') {
                clerror('MeasurementDb opendb fail');
                resolve(feedback);
                return;
            } else {
                clinfo('Measuremnt db open OK');
            }

            feedback = await this._measurementDb.openTable();
            if (feedback.error !== 'OK') {
                clerror('MeasurementDb open table fail');
                resolve(feedback);
                return;
            } else {
                clinfo('MeasuremntDb open table OK')
            }

            feedback = await this._measurementDb.readInfoTable();
            if (feedback.error !== 'OK' && feedback.data === 'empty') {
                // create the table
                feedback = await this._measurementDb.insertInfoTable(0, 0, -1, -1, "");
            } else {
                clinfo('read measurement_info db table OK')
            }

            if (feedback.error !== 'OK') {
                return resolve(feedback);
            }

            resolve(feedback);

        });
    }
    checkStateDatabase() {
        return new Promise<Code>(async (resolve, reject) => {
            // await的嵌套
            // check state db
            let feedback = await this._stateDb.openDb();
            if (feedback.error !== 'OK') {
                return resolve(feedback);

            } else {
                clinfo('open state db OK');
            }

            feedback = await this._stateDb.openTable();
            if (feedback.error !== 'OK') {
                return resolve(feedback);

            } else {
                clinfo('open state db table OK')
            }

            feedback = await this._stateDb.readTable();
            if (feedback.error !== 'OK') {
                // create the table
                feedback = await this._stateDb.insertTable(this._state, new Date().toLocaleString());
            } else {
                clinfo('read state db table OK')
            }

            if (feedback.error !== 'OK') {
                return resolve(feedback);

            }

            cl(feedback);
            // 根据从数据库读取出来的值,设置当前的状态
            this._state = feedback.data.current_state;

            return resolve(feedback);
        });
    }
    checkDatabase() {
        return new Promise(async (resolve, reject) => {

            let feedback: any = await this.checkStateDatabase();

            console.log(feedback)

            // check stateDb
            if (feedback.error !== 'OK') {
                clinfo('State db check fail');
                resolve(feedback);
                return;
            } else {
                clwarn(FILENAME, 'Check state db OK');
            }

            // check measurementDb
            feedback = await this.checkMeasurementDatabase();
            if (feedback.error !== 'OK') {
                clerror(FILENAME, 'Measuremnt db check fail');
                resolve(feedback);
                return;
            } else {
                clwarn(FILENAME, 'Check measurement db OK')
            }

            resolve(feedback);
        });

    }
    checkNetwork() {
        return new Promise((resolve, reject) => {

        });
    }
    checkTime() {
        return new Promise((resolve, reject) => {

        });
    }
    checkReady() {
        let func = async () => {
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                    console.log('idle out');
                }, 5000)
            });
            this.emit('ready');
        };
        func();
    }
    /**
     * 这里需要发布合约，如果发送成功还要反复检查之
     */
    checkShortage() {
        let func = async () => {
            await new Promise(async (resolve, reject) => {
                await this._task.sendOrder();
                resolve();
            });

        }
        func();
    }
    run() {
        clwarn('Running state is:', this._state);

        switch (this._state) {
            case GLOBAL_STATE.idle:
                this.checkReady();
                this._task.switchToIdleTask();
                break;
            case GLOBAL_STATE.ready:
                this._task.switchToReadyTask();
                break;
            case GLOBAL_STATE.shortage:
                this.checkShortage();
                this._task.switchToShortageTask();
                break;
            case GLOBAL_STATE.published:
                this._task.switchToPublishedTask();
                break;
            case GLOBAL_STATE.filling:
                this._task.switchToFillingTask();
                break;
            case GLOBAL_STATE.completed:
                this._task.switchToCompletedTask();
                break;
            default:
                throw new Error(FILENAME + ' Undefine state:' + this._state);
        }
    }
    async switchState(newState: GLOBAL_STATE) {

        clwarn("Switch state from", this._state, 'to ==>', newState);
        this._state = newState;

        // save state to state database
        // 
        await this._stateDb.updateTable(newState, new Date().toLocaleString());

        this.run();

        if (!this._task.getRunEnable()) {
            this._task.run();
        }
    }

}

