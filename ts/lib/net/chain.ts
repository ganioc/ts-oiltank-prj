import * as config from '../../config/config.json';
import * as events from 'events';
import { clmark, cl } from '../formator';

const Eos = require('eosjs');

const myconfig = (<any>config);

export class Chain extends events.EventEmitter {
    private _devId: number;
    private _eos: any;
    constructor() {
        super();
        this._devId = myconfig.id;
        this._eos = Eos({
            httpEndpoint: myconfig.chain_config.httpEndpoint,
            chainId: myconfig.chain_config.chainId,
            keyProvider: myconfig.chain_config.keyProvider
        });
    }
    sendData(type: 0 | 1 | 2, percent: number) {
        return new Promise((resolve, reject) => {
            this._eos.transaction({
                actions: [
                    {
                        account: "testaccount1",
                        name: "upload",
                        authorization: [
                            {
                                actor: "testaccount1",
                                permission: "active"
                            }
                        ],
                        data: {
                            deviceid: this._devId,
                            type: type,
                            value: percent
                        }
                    }
                ]
            }).then((result: any) => {
                clmark('result <==');
                // console.log(result);
                // cl(result);
                resolve('OK');
            });
        });

    }
}
