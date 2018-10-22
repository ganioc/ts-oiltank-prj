import * as sqlite from 'sqlite3';
sqlite.verbose();
import { IfDbOptions, Db } from './db'
import { Code } from '../code'
import { clerror, cl, clinfo } from '../formator';
import { GLOBAL_STATE } from '../state'


export class StateDb extends Db {
    // private _state: number;

    constructor(options: IfDbOptions) {
        super(options);
        // this._state = GLOBAL_STATE.idle;
    }

    closeDb(): Promise<Code> {
        return new Promise<Code>((resolve, reject) => {
            this._db.close((err) => {
                if (err) {
                    resolve({ error: 'NOK', data: err })
                } else {
                    resolve({ error: 'OK', data: null })
                }
            });
        })
    }
    openTable(): Promise<Code> {
        return new Promise<Code>((resolve, reject) => {
            this._db.run(`CREATE TABLE IF NOT EXISTS "state" ( "current_state" INTEGER NOT NULL UNIQUE ,"timestamp" VARCHAR(20) NOT NULL );`,
                (err) => {
                    if (err) {
                        clerror('-'.repeat(40))
                        console.log(err);
                        resolve({ error: 'NOK', data: err });
                    } else {
                        resolve({ error: 'OK', data: null });
                    }
                });
        }).then((da) => {
            return new Promise<Code>((resolve) => {
                this._db.run(`CREATE TABLE IF NOT EXISTS "contract" ( "index" INTEGER NOT NULL ,"id"  INTEGER NOT NULL UNIQUE,"timestamp"  VARCHAR(20) NOT NULL, "account" VARCHAR(20), "type" VARCHAR(64), "finished" INTEGER NOT NULL ,"device" VARCHAR(64), "location" TEXT, "content" TEXT);`,
                    (err) => {
                        if (err) {
                            clerror('-'.repeat(40))
                            console.log(err);
                            resolve({ error: 'NOK', data: err });
                        } else {
                            resolve({ error: 'OK', data: null })
                        }
                    });
            });
        }, (dae) => {
            return new Promise<Code>((resolve) => {
                resolve(dae);
            });
        });
    }
    readTable(): Promise<Code> {
        return new Promise<Code>((resolve, reject) => {
            this._db.get(`SELECT * FROM "state";`, (err, row: any) => {
                if (err) {
                    clerror('Read table from state db fail');
                    resolve({ error: 'NOK', data: null });
                }
                else if (row !== undefined) {
                    clinfo('Read row from table succeed');
                    cl(row);
                    resolve({
                        error: 'OK', data: {
                            current_state: row.current_state,
                            timestamp: row.timestamp
                        }
                    })
                } else {
                    clerror('Undefined row, state table is empty');
                    resolve({ error: 'NOK', data: 'empty' });
                }
            });
        });
    }
    insertTable(state: GLOBAL_STATE, time: string): Promise<Code> {
        return new Promise<Code>((resolve, reject) => {
            this._db.run(`INSERT INTO "state" (current_state,timestamp ) VALUES (${state} ,"${time}");`, (err) => {
                if (err) {
                    resolve({ error: 'NOK', data: null })
                } else {
                    resolve({
                        error: 'OK', data: {
                            current_state: state,
                            timestamp: time
                        }
                    })
                }
            });
        });
    }
    updateTable(state: GLOBAL_STATE, time: string): Promise<Code> {
        return new Promise<Code>((resolve, reject) => {
            this._db.run(`UPDATE "state" SET current_state=${state},timestamp="${time}";`, (err) => {
                if (err) {
                    resolve({ error: 'NOK', data: null })
                } else {
                    resolve({
                        error: 'OK', data: {
                            current_state: state,
                            timestamp: time
                        }
                    })
                }
            });
        });
    }
    readContract() {

    }
    insertContract() {

    }
    updateContract() {

    }
}
