import { clinfo, clmark, clwarn, clerror } from './lib/formator'
import { GlobalState } from './lib/state'
import { Code } from './lib/code';

const FILENAME = '[index.ts]';

clmark('='.repeat(60))
clmark(' ___       ___       ___       ___       ___       ___')
clmark('\/\\  \\     \/\\  \\     \/\\__\\     \/\\__\\     \/\\  \\     \/\\  \\')
clmark('\\:\\  \\   \/::\\  \\   \/:| _|_   \/:\/ _\/_   \/::\\  \\   \/::\\  \\ ')
clmark('\/::\\__\\ \/::\\:\\__\\ \/::|\/\\__\\ \/::-"\\__\\ \/::\\:\\__\\ \/::\\:\\__\\')
clmark('\/:\/\\\/__\/ \\\/\\::\/  \/ \\\/|::\/  \/ \\;:;-",-" \\:\\:\\\/  \/ \\;:::\/  \/')
clmark('\\\/__\/      \/:\/  \/    |:\/  \/   |:|  |    \\:\\\/  \/   |:\\\/__\/ ')
clmark('          \\\/__\/     \\\/__\/     \\|__|     \\\/__\/     \\|__|  ')
clwarn('')
clwarn('2018-10-15 oil tank surveilance');
clmark('='.repeat(60))


let state = new GlobalState({
    stateDbName: 'mystate',
    measurmentDbName: 'mymeasurement',
    logDbName: 'mylog',
    maxMeasurement: 60 * 1,
});

async function main() {

    let feedback: any = await state.checkDatabase();
    // console.log(feedback);

    if (feedback.error !== 'OK') {
        throw new Error('Can not create/open database correctly');
    } else {
        clmark(FILENAME, 'Database opened OK');
    }

    await state.checkNetwork();
    await state.checkTime();

    /**
 * 在每一个状态，都需要运行一个周期性的查询任务，或者是一个等待一步完成的任务
 * 当这个任务顺利完成，或超时的时候，会emit event, 进行状态state切换
 * 这是程序的主要思路
 * 
 * 每个状态的消息响应函数可能是不一样的
 * 
 * 有些任务是与状态无关的，要把它给拎出来，
 * 
 * 主程序不会因为特定的状态重启。只会重新重启对应的模块;
 */
    state.on('ready', () => {
        clinfo('State = ready')
    });

    state.on('oilShortage', () => {
        clinfo('State = oilShortage')
        clerror('Oil is in shortage');
    })

    state.on('contractOngoing', () => {
        clinfo('State = contractOngoing')
    })

    state.on('contractComplete', () => {
        clinfo('State = contractComplete')
    })

    state.on('error', (err) => {
        clinfo('State = error')
    })

    state.run();
}

main();
