import * as config from '../../config/config.json';
import * as events from 'events';
import { clmark, cl, clerror, clinfo } from '../formator';

const Eos = require('eosjs');

const MAX_ORDER_NUM = 1000;

const myconfig = (<any>config);

export interface IfOrder {
    id: number,
    status: string,
    buyer: string,
    data: string,
    deviceid: number,
    reqvolume: string,
    actvolume: string,
    estpayment: string,
    actpayment: string,
    balpayment: string,
    launchtime: string,
    confirmtime: string,
    canceltime: string,
    overtime: string,
    lastfetchtime: string,
    fetchidx: string,
    datanum: string
}

export class Chain extends events.EventEmitter {
    private _devId: number;
    private _eosData: any;
    private _eosOrder: any;
    private _eosSeller: any;
    constructor() {
        super();
        this._devId = myconfig.id;
        this._eosData = Eos({
            httpEndpoint: myconfig.chain_config.httpEndpoint,
            chainId: myconfig.chain_config.chainId,
            keyProvider: myconfig.chain_config.keyProvider
        });
        this._eosOrder = Eos({
            httpEndpoint: myconfig.chain_config.httpEndpoint,
            chainId: myconfig.chain_config.chainId,
            keyProvider: myconfig.chain_config.keyProviderBuyer
        });
        this._eosSeller = Eos({
            httpEndpoint: myconfig.chain_config.httpEndpoint,
            chainId: myconfig.chain_config.chainId,
            keyProvider: myconfig.chain_config.keyProviderSeller
        });
    }
    sendData(type: 0 | 1 | 2, percent: number) {
        return new Promise((resolve, reject) => {
            this._eosData.transaction({
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
    readData() {
        return new Promise((resolve, reject) => {
            this._eosData.getTableRows({
                code: 'testaccount1',
                scope: this._devId,
                table: 'oildata',
                json: true,
            }).then((res: any) => {
                console.log('readData table');
                console.log(res);
                resolve('OK');
            });
        });
    }
    sendOrder(percentNeeded: number) {
        clinfo("percentNeeded");
        console.log(percentNeeded);

        return new Promise((resolve, reject) => {
            this._eosOrder.transaction({
                actions: [
                    {
                        account: "testaccount2",
                        name: "launch",
                        authorization: [
                            {
                                actor: "testbiguser1",
                                permission: "active"
                            }
                        ],
                        data: {
                            buyer: "testbiguser1",
                            data: "testaccount1",
                            deviceid: this._devId,
                            reqvolume: parseInt(percentNeeded.toString())
                        }
                    }
                ]
            }).then((result: any) => {
                clmark('sendOrder result <==');
                console.log(result);
                // cl(result);
                resolve('OK');
            }, (err: any) => {
                clerror('sendOrder error <==');
                console.log(err);
                resolve('NOK');
            });
        });
    }
    readOrder(): Promise<{ status: string; data: any }> {
        // 读，返回时间上最新的一个
        return new Promise((resolve, reject) => {
            this._eosData.getTableRows({
                code: 'testaccount2',
                scope: 'testaccount2',
                table: 'orders',
                limit: MAX_ORDER_NUM,
                json: true,
            }).then((res: any) => {
                console.log('readData table');
                console.log(res);
                resolve({
                    status: 'OK',
                    data: this.getLatestOrder(res)
                });
            }, (err: any) => {
                resolve({
                    status: 'NOK',
                    data: err
                });
            });
        });
    }
    readLatestOrder(): Promise<{ status: string; data: any }> {
        // 读，返回时间上最新的一个
        return new Promise((resolve, reject) => {
            this._eosData.getTableRows({
                code: 'testaccount2',
                scope: 'testaccount2',
                table: 'orders',
                limit: MAX_ORDER_NUM,
                json: true,
            }).then((res: any) => {
                // console.log('readData table');
                // console.log(res);
                resolve({
                    status: 'OK',
                    data: this.getLatestOrder(res)
                });
            }, (err: any) => {
                resolve({
                    status: 'NOK',
                    data: err
                });
            });
        });
    }
    getLatestOrder(result: any): IfOrder | null {
        if (result.rows.length === 0) {
            return null;
        }
        let latestObj: IfOrder = Object.create(null);
        let latestTime = 0;
        let obj = result.rows.forEach((element: IfOrder) => {
            let time = parseInt(element.launchtime);
            if (time > latestTime) {
                latestTime = time;
                latestObj = element;
            }
        });
        return latestObj;
    }
    confirmOrder(id: number): Promise<{ status: string; data: any }> {
        return new Promise((resolve, reject) => {
            this._eosSeller.transaction({
                actions: [
                    {
                        account: "testaccount2",
                        name: "confirm",
                        authorization: [
                            {
                                actor: "testbiguser2",
                                permission: "active"
                            }
                        ],
                        data: {
                            orderid: id
                        }
                    }
                ]
            }).then(async (res: any) => {
                // console.log('order confirmed');
                // console.log(res);
                // let order = this.getLatestOrder(res);

                resolve({
                    status: 'OK',
                    data: {}
                });
            }, (err: any) => {
                // clerror('order not confirmed');
                // console.log(err);
                resolve({
                    status: 'NOK',
                    data: err
                });
            });
        });
    }
    checkOrder(): Promise<{ status: string; data: any }> {
        return new Promise(async (resolve, reject) => {
            let result = await this.readLatestOrder();
            if (result.status === 'OK') {
                if (result.data.status !== undefined && result.data.status === 'launched') {
                    let res = await this.confirmOrder(result.data.id);
                    resolve(res);
                }
            } else {
                resolve({
                    status: 'NOK',
                    data: {}
                });
            }
        });
    }
}
