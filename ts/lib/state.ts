import * as events from 'events';
import { BackgroundTask } from './bgtask';
import { StateDb } from './db/statedb'
import { MeasurementDb } from './db/measurementdb';
import { cl, clerror, clwarn, clinfo } from './formator';
import { Code } from './code';

const FILENAME = '[state.ts]';

export enum GLOBAL_STATE {
    idle = 0,
    ready,
}

export interface globalStateOptions {
    stateDbName: string;
    measurmentDbName: string;
    logDbName: string;
}

export class GlobalState extends events.EventEmitter {
    private _state: number;
    private _options: globalStateOptions;
    private _bgTask: BackgroundTask;
    private _stateDb: StateDb;
    private _measurementDb: MeasurementDb;

    constructor(options: globalStateOptions) {
        super();
        this._state = GLOBAL_STATE.idle;
        this._options = options;

        this._stateDb = new StateDb({
            name: this._options.stateDbName,
        });
        this._measurementDb = new MeasurementDb({
            name: this._options.measurmentDbName,
        })

        this._bgTask = new BackgroundTask();
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
                clwarn('Check state db OK');
            }

            // check measurementDb
            // feedback = this.checkMeasurementDatabase();
            // if (feedback.error !== 'OK') {
            //     clerror('Measuremnt db check fail');
            //     resolve(feedback);
            //     return;
            // } else {
            //     clwarn('Check state db OK')
            // }


            resolve(feedback);

        });

    }
    checkNetwork() {

    }
    checkTime() {

    }
    run() {

    }
}

export class PersistentState {
    constructor() {

    }
}

export class StateManager {
    constructor() {

    }
}
