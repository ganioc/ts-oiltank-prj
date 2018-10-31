import * as net from 'net';
import { clmark, clerror } from '../formator';

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
                host: 'localhost',
                port: PORT,
            },
            () => {
                clmark('Connected to ', PORT);
            }
        );
        this._client.on('data', (data) => {
            try {
                // console.log('RX <==', data);
                let obj = JSON.parse(data.toString());
                this._percent = obj.data;
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
}
