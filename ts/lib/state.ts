import * as events from 'events';
import { BackgroundTask } from './bgtask';
import { StateDb } from './db/statedb'

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

    constructor(options: globalStateOptions) {
        super();
        this._state = GLOBAL_STATE.idle;
        this._options = options;
        this._stateDb = new StateDb({
            name: this._options.stateDbName,
        });

        this._bgTask = new BackgroundTask();
    }

    checkDatabase() {
        return new Promise(async (resolve, reject) => {

            // await的嵌套
            let feedback = await this._stateDb.openDb();
            if (feedback.error !== 'OK') {
                resolve(feedback);
                return;
            }

            feedback = await this._stateDb.openTable();
            if (feedback.error !== 'OK') {
                resolve(feedback);
                return;
            }

            feedback = await this._stateDb.readTable();
            if (feedback.error !== 'OK') {
                // create the table
                feedback = await this._stateDb.insertTable(this._state, new Date().toLocaleString());
            }

            console.log(feedback);
            // 根据从数据库读取出来的值,设置当前的状态
            this._state = feedback.data.current_state;

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
