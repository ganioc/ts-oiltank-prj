import * as net from 'net';
import { clmark, clerror, STX, ETX, clinfo } from '../formator';

const FILENAME = '[simulator2.ts]';
const IP = '192.168.1.100';
const PORT = 39000;

export class Device {
    private _client: net.Socket;
    private _percent: number;
    private _shortageLimit: number;
    private _overLimit: number;
    constructor() {
        this._client = Object.create(null);
        this._percent = -1;
        this._shortageLimit = 15;
        this._overLimit = 90;
    }
    run() {
        this._client = net.connect(
            {
                host: IP,
                port: PORT,
            },
            () => {
                clmark('Connected to ', PORT);
            }
        );
        this._client.on('data', (data) => {
            // console.log(FILENAME, data);
            try {
                // console.log('RX <==', data);
                // let obj = JSON.parse(data.toString());
                // 获取收到的多个jsonobject里面的最后一个，就可以了
                let obj = this._parseData(data);

                if (obj) {
                    this._percent = obj.data;
                }

            } catch (e) {
                clerror('RX <==', e);
                this._percent = -1;
            }
        });
        this._client.on('error', (err) => {
            clerror(err);
        });
        this._client.on('close', () => {
            clerror('closed');
            setTimeout(() => {
                this.run();
            }, 2000);
            this._percent = -1;
        });
    }
    getPercent(): number {
        return this._percent;
    }
    bShortage(): boolean {
        if (this._percent <= this._shortageLimit) {
            return true;
        }
        return false;
    }
    bOver(): boolean {
        if (this._percent >= this._overLimit) {
            return true;
        }
        return false;
    }
    _parseData(d: Buffer): undefined | any {
        // STX打头，ETX结尾，
        // 抽出一个来就够了，而且要是后面那个
        let index = 0;
        let out = [];
        let state = 0;
        let localBuffer = new Buffer(256);
        //clinfo('d <= ');
        //console.log(d);

        for (let i = 0; i < d.length; i++) {
            // console.log(d[i]);

            if (d[i] === STX && state === 0) {
                //clmark('STX');
                state = 1;
            }
            else if (d[i] === ETX && state === 1) {
                //clmark('ETX');
                out.push(localBuffer.toString('ascii', 0, index));
                state = 0;
                index = 0;
                localBuffer = new Buffer(256);
            } else if (state === 1) {
                localBuffer[index++] = d[i];
            }
        }
        //console.log('out[]');
        //console.log(out);

        if (out.length === 0) {
            return undefined;
        }
        let obj: any;
        try {
            //console.log(out[out.length - 1]);
            let str = out[out.length - 1]
            obj = JSON.parse(str);
        } catch (e) {
            clerror(e);
            return undefined;
        }
        return obj;
    }
}
