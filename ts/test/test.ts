import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } from "constants";
import { Chain } from '../lib/net/chain';
import * as config from '../config/config.json'
import { clerror, clinfo, cl, clwarn, clmark } from "../lib/formator";
const myconfig = (<any>config);
// const defaultPrivateKey = "5Jb1uWnvSArKZsWGyjGmMktdzS1aWEkNyEbQHZoDsNAEPDu3KJr"; // testaccount1
const Eos = require('eosjs')
// let eos = Eos({ myconfig.chain_config.httpEndpoint, mychonfig.chain_config.chainId, keyProvider })


const MAX_QUEUE_LEN = 8;

function testCirculuarQueue() {

    let queue = new Buffer(MAX_QUEUE_LEN);
    let head = 0;
    let tail = 0;

    function add(value: number) {

        let new_tail_id;
        let new_header_id = head;

        new_tail_id = (tail + 1) % MAX_QUEUE_LEN;

        if (new_tail_id === head) {
            new_header_id = new_tail_id + 1;
            if (new_header_id >= MAX_QUEUE_LEN) {
                new_header_id = 0;
            }
        }

        queue[tail] = value;
        head = new_header_id;
        tail = new_tail_id;
    }

    for (let i = 1; i < 80; i++) {
        add(i);
        console.log(queue);
        console.log('head:', head, 'tail:', tail);


    }

}
async function testConfig() {

    console.log(myconfig.chain_config.httpEndpoint);
    console.log(myconfig.chain_config.chainId);
    console.log(myconfig.chain_config.keyProvider);
    // let eos = Eos({httpEndpoint, chainId, keyProvider});
    let eos = Eos({
        httpEndpoint: myconfig.chain_config.httpEndpoint,
        chainId: myconfig.chain_config.chainId,
        keyProvider: myconfig.chain_config.keyProvider
    });

    // eos.getBlock(1, (err: any, data: any) => {
    //     if (err) {
    //         clerror('get block 1:', err);
    //         return;
    //     }
    //     clinfo('Get data')
    //     console.log(data);

    // })
    clwarn('getBlock 1');
    let block = await eos.getBlock(1);
    console.log(block);

    clwarn('getInfo ');
    let info = await eos.getInfo({});
    console.log(info);

    clwarn('push action =>');
    // eos.contract('testaccount1').then((item: any) => {
    //     item.upload(0, 1, 66.5);
    // })
    eos.transaction({
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
                    deviceid: 1,
                    type: 1,
                    value: 34.5
                }
            }
        ]
    }).then((result: any) => {
        clmark('result <==');
        console.log(result);
    });

}
// testCirculuarQueue();
function testSend() {
    let chain = new Chain();
    chain.sendData(1, 55.5);
}
testSend();
