import * as sqlite from 'sqlite3';
import { Db, IfDbOptions } from './db';
import { Code } from '../code'
import { clerror, clinfo, cl } from '../formator'

const FILENAME = '[measurementdb.ts]'

export type IfMeasurementDbOptions = IfDbOptions & {
    max_id: number;
};

export interface IfMeasurementDbFb {

    head_id: number;
    tail_id: number;
    max_id: number;
    last_modified_id: number;
    last_upload_id: number;
    last_network_ok: string;
    id: number;
    overflow: number;

}

export class MeasurementDb extends Db {
    // below should be write to table "measurement_info"
    // table id, min=0, max = max_id
    // id = -1 is abnormal
    // protected _head_id: number;
    // protected _tail_id: number;
    protected _max_id: number;
    // protected _last_modified_id: number;
    // protected _last_upload_id: number;
    // protected _last_network_ok: number; // in time format

    // protected _maxRow: number;

    constructor(options: IfMeasurementDbOptions) {
        super(options as IfDbOptions);
        // this._head_id = 0;
        // this._tail_id = 0;
        this._max_id = options.max_id;

        // this._last_modified_id = 0;
        // this._last_upload_id = 0;
        // this._last_network_ok = 0; // 上一次网络正常的时刻

    }

    openTable(): Promise<Code> {
        return new Promise<Code>((resolve, reject) => {
            // open 1st table "measurement"
            this._db.run(`CREATE TABLE IF NOT EXISTS "measurement" ( "id" INTEGER NOT NULL UNIQUE ,"timestamp" VARCHAR(20) NOT NULL , "percent" INTEGER NOT NULL);`,
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
                this._db.run(`CREATE TABLE IF NOT EXISTS "measurement_info" ( "head_id" INTEGER NOT NULL ,"tail_id"  INTEGER NOT NULL,"max_id"  INTEGER NOT NULL, "last_modified_id" INTEGER, "last_upload_id" INTEGER, "last_network_ok" VARCHAR(20) ,"id" INTEGER, "overflow" INTEGER);`,
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
    readInfoTable(): Promise<Code> {
        return new Promise<Code>((resolve, reject) => {
            this._db.get(`SELECT * FROM "measurement_info";`, (err, row: any) => {
                if (err) {
                    clerror('Read table from measurement info db fail');
                    resolve({ error: 'NOK', data: null });
                }
                else if (row !== undefined) {
                    clinfo('Read row from table measurement_info succeed');
                    cl(row);
                    resolve({
                        error: 'OK', data: {
                            head_id: row.head_id,
                            tail_id: row.tail_id,
                            max_id: row.max_id,
                            last_modified_id: row.last_modified_id,
                            last_upload_id: row.last_upload_id,
                            last_network_ok: row.last_network_ok,
                            id: row.id,
                            overflow: row.overflow,
                        }
                    })
                } else {
                    clerror('Undefined row, measuremnt_info table is empty');
                    resolve({ error: 'NOK', data: 'empty' });
                }
            });
        });
    }
    insertInfoTable(head: number, tail: number, last_modified: number, last_upload: number, last_network: string): Promise<Code> {
        return new Promise<Code>((resolve, reject) => {
            let max = this._max_id;

            this._db.run(`INSERT INTO "measurement_info" (head_id,tail_id,max_id, last_modified_id, last_upload_id, last_network_ok ,id ,overflow) VALUES (${head} , ${tail},${max}, ${last_modified}, ${last_upload}, "${last_network}", 60, 0);`, (err) => {
                if (err) {
                    resolve({ error: 'NOK', data: null })
                } else {
                    resolve({
                        error: 'OK', data: {

                        }
                    })
                }
            });
        });
    }
    updateInfoTable(head: number, tail: number, last_modified: number, last_upload: number, last_network: string) {
        return new Promise<Code>((resolve, reject) => {
            let max = this._max_id;

            this._db.run(`UPDATE TABLE SET "measurement_info" (head_id,tail_id,max_id, last_modified_id, last_upload_id, last_network_ok ) VALUES (${head} , ${tail},${max}, ${last_modified}, ${last_upload}, "${last_network}");`, (err) => {
                if (err) {
                    resolve({ error: 'NOK', data: null })
                } else {
                    resolve({
                        error: 'OK', data: {

                        }
                    })
                }
            });
        });
    }
    insertMeasurementTable(id: number, timestamp: string, percent: number) {
        return new Promise<Code>((resolve, reject) => {
            let max = this._max_id;

            this._db.run(`INSERT INTO "measurement" (id, timestamp, percent ) VALUES (${id} , ${timestamp},${percent});`, (err) => {
                if (err) {
                    resolve({ error: 'NOK', data: null })
                } else {
                    resolve({
                        error: 'OK', data: {

                        }
                    })
                }
            });
        });
    }
    updateMeasurementTableTransaction(info: IfMeasurementDbFb, percent: number) {
        return new Promise<Code>((resolve, reject) => {
            let head_id = info.head_id;
            let tail_id = info.tail_id;
            let max_id = info.max_id;
            let overflow = info.overflow + 1;

            if (overflow > max_id) {
                overflow = max_id + 1;
            }

            let new_tail_id: number;
            let new_header_id = head_id;

            new_tail_id = (tail_id + 1) % max_id;

            if (new_tail_id === head_id) {
                new_header_id = new_tail_id + 1;
                if (new_header_id >= max_id) {
                    new_header_id = 0;
                }
            }

            // 将数据写在 tail_id里面
            // 更新measurement_info, head_id= new_header_id
            // tail_id = new_tail_id
            let timestamp = new Date().getTime().toString();

            if (overflow > max_id) {
                // update
                clinfo('update');
                this._db.serialize(() => {
                    this._db.run(`UPDATE  "measurement" SET "timestamp"=${timestamp}, "percent"=${percent} WHERE id=${tail_id};`, (err) => {
                        if (err) {
                            console.log(err);
                            resolve({ error: 'NOK', data: null })
                        } else {
                            resolve({
                                error: 'OK', data: {}
                            })
                        }
                    });
                    this._db.run(`UPDATE "measurement_info" SET "head_id"=${new_header_id},"tail_id"=${new_tail_id}, "overflow"=${overflow}  WHERE id=60;`, (err) => {
                        if (err) {
                            console.log(err);
                            resolve({ error: 'NOK', data: null })
                        } else {
                            resolve({
                                error: 'OK', data: {}
                            });
                        }
                    });
                });

            } else {
                // continue to insert
                clinfo('insert');
                this._db.serialize(() => {
                    this._db.run(`INSERT INTO "measurement" ( "id","timestamp","percent" ) VALUES (${tail_id}, "${timestamp}", ${percent});`, (err) => {
                        if (err) {
                            console.log(err);
                            resolve({ error: 'NOK', data: null })
                        } else {
                            resolve({
                                error: 'OK', data: {}
                            })
                        }
                    });
                    this._db.run(`UPDATE "measurement_info" SET "head_id"=${new_header_id},"tail_id"=${new_tail_id} ,"overflow"=${overflow}  WHERE id=60;`, (err) => {
                        if (err) {
                            console.log(err);
                            resolve({ error: 'NOK', data: null })
                        } else {
                            resolve({
                                error: 'OK', data: {}
                            });
                        }
                    });
                });


            }


        });
    }
}
