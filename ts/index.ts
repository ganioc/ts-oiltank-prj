import { clinfo, clmark, clwarn, clerror } from './lib/formator'
import { GlobalState, GLOBAL_STATE } from './lib/state'
import { Code } from './lib/code';
import { BackgroundTask } from './lib/task/bgtask';

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
clwarn('2018-10-15 oil tank measurement system');
clmark('='.repeat(60))

// 保存状态，数据库管理
let state = new GlobalState({
    stateDbName: 'mystate',
    measurmentDbName: 'mymeasurement',
    logDbName: 'mylog',
    maxMeasurement: 20 * 1,
    measurePeriod: 6 * 1000,
});

// 运行的背景任务
// let task = new BackgroundTask({
//     state: state,
//     measurePeriod: 6 * 1000, // 
// });

async function main() {
    // state diagram

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
        state.switchState(GLOBAL_STATE.ready);
    });

    state.on('shortage', (data) => {
        clinfo('State = shortage')
        clerror(FILENAME, 'Oil is in shortage', data);
        state.switchState(GLOBAL_STATE.shortage);
    })

    state.on('published', () => {
        clinfo('State = published')
        state.switchState(GLOBAL_STATE.published);
    })
    state.on('confirmed', () => {
        clinfo('State = confirmed')
        state.switchState(GLOBAL_STATE.published);
    })
    state.on('error', (err) => {
        clinfo('State = error')
        clerror(err);
    })

    let feedback: any = await state.checkDatabase();
    // console.log(feedback);
    // 这时候状态有可能是从database里读取的

    if (feedback.error !== 'OK') {
        throw new Error('Can not create/open database correctly');
    } else {
        clmark(FILENAME, 'Database opened OK');
    }

    state.switchState(state.getState());
}

main();
