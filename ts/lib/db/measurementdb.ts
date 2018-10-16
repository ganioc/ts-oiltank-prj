import * as sqlite from 'sqlite3';
import { Db, IfDbOptions } from './db';
import { Code } from '../code'
import { clerror } from '../formator'

export class MeasurementDb extends Db {
    // below should be write to table "measurement_info"
    protected _head_id: number;
    protected _tail_id: number;
    protected _max_id: number;
    protected _last_modified_id: number;
    protected _last_upload_id: number;
    protected _last_network_ok: number; // in time format

    // protected _maxRow: number;

    constructor(options: IfDbOptions) {
        super(options);
        this._head_id = 0;
        this._tail_id = 0;
        this._max_id = 0;
        this._last_modified_id = 0;
        this._last_upload_id = 0;
        this._last_network_ok = 0; // 上一次网络正常的时刻
    }

    openTable(): Promise<Code> {
        return new Promise<Code>((resolve, reject) => {
            // open 1st table "measurement"
            this._db.run(`CREATE TABLE IF NOT EXISTS "measurement" ( "id" INTEGER NOT NULL UNIQUE ,"timestamp" TEXT NOT NULL , "percent" INTEGER NOT NULL);`,
                (err) => {
                    if (err) {
                        clerror('-'.repeat(40))
                        console.log(err);
                        reject({ error: 'NOK', data: err });
                    } else {
                        resolve({ error: 'OK', data: null })
                    }
                }
            );
        }).then((da) => {
            return new Promise<Code>((resolve) => {
                this._db.run(`CREATE TABLE IF NOT EXISTS "measurement_info" ( "head_id" INTEGER NOT NULL ,"tail_id"  INTEGER NOT NULL, "last_modified_id" INTEGER, "last_upload_id" INTEGER, last_network_ok" VARCHAR(20));`,
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

}
