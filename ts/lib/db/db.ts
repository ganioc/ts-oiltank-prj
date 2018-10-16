import * as sqlite from 'sqlite3';
sqlite.verbose();
import { Code } from '../code';

/**
 * 259200, 每个月的记录条数，大于这个数量，则对记录进行覆盖
 * 想一个算法进行覆盖;
 */
const MAX_ROW = 30 * 24 * 60 * 6;

export interface IfTable {
    numMaxRow: number;
    name: string;
}

export interface IfDbOptions {
    name: string;
}

export abstract class Db {
    
    protected _dbName: string;
    protected _db: sqlite.Database;

    constructor(options: IfDbOptions) {
        // this._maxRow = MAX_ROW;
        this._dbName = options.name;
        this._db = Object.create(null);
    }
    // abstract openDb(): Promise<Code>;
    openDb(): Promise<Code> {
        return new Promise<Code>((resolve, reject) => {
            this._db = new sqlite.Database(this._dbName, (err) => {
                if (err) {
                    resolve({ error: 'NOK', data: err })
                } else {
                    resolve({ error: 'OK', data: null })
                }
            });
        })
    }
}


