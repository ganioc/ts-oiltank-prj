import { deflateRaw } from "zlib";
import * as net from 'net';

let term = require('terminal-kit').terminal;
// 默认 80*24
const WINDOW_WIDTH = term.width;
const WINDOW_HEIGHT = term.height;
const TANK_LEFT = 20;
const TANK_WIDTH = 20;
const TANK_HEIGHT = 20;
const OIL_LEFT = 20;
const OIL_BOTTOM = WINDOW_HEIGHT - 2;
const OIL_HEIGHT = 10;
const OIL_WIDTH = 20;
const LOGO_LEFT = 50;
const LOGO_TOP = 10;
const SERVER_PORT = 39000;

let oilpercent: number = 100.0;
let INTERVAL = 500; // 200 ms
const oilChangeRate: number = 1.0;
const oilUseRate: number = 0.01;
const oilUpperLimit = 90;
const oilLowerLimit = 15;

let server: net.Server;
//  |_|
function drawOilTank() {
    for (let i = 1; i < TANK_WIDTH; i++) {
        term.moveTo(TANK_LEFT + i, OIL_BOTTOM - TANK_HEIGHT, "_");
    }
    for (let i = 0; i < TANK_HEIGHT; i++) {
        let y = OIL_BOTTOM - i;
        term.moveTo(TANK_LEFT, y, "|");
        term.moveTo(TANK_LEFT + TANK_WIDTH, y, "|");
    }
    for (let i = 1; i < TANK_WIDTH; i++) {
        term.moveTo(TANK_LEFT + i, OIL_BOTTOM + 1, "-");
    }
}
function drawOil() {

    let oilHeight: number = TANK_HEIGHT * oilpercent / 100;

    for (let i = 0; i < TANK_HEIGHT; i++) {
        let y = OIL_BOTTOM - i;
        for (let j = TANK_LEFT + 1; j < TANK_LEFT + TANK_WIDTH; j++) {
            term.moveTo(j, y, " ");
        }
    }

    for (let i = 0; i < Math.round(oilHeight); i++) {
        let y = OIL_BOTTOM - i;
        for (let j = TANK_LEFT + 1; j < TANK_LEFT + TANK_WIDTH; j++) {
            if (oilpercent >= oilUpperLimit) {
                term.moveTo.bgGreen(j, y, " ");
            } else if (oilpercent <= oilLowerLimit) {
                term.moveTo.bgRed(j, y, " ");
            } else {
                term.moveTo.bgBlue(j, y, " ");
            }

        }

    }

}
function drawLogo() {
    term.red.bgWhite.moveTo(LOGO_LEFT, 3, "油罐运行模拟程序");
    term.yellow.moveTo(LOGO_LEFT, 5, "上限 " + oilUpperLimit);
    term.yellow.moveTo(LOGO_LEFT, 6, "下限 " + oilLowerLimit);

    term.moveTo(LOGO_LEFT, WINDOW_HEIGHT - 4, "端口     - " + SERVER_PORT);
    term.moveTo(LOGO_LEFT, WINDOW_HEIGHT - 3, "上 键    - 增加油料");
    term.moveTo(LOGO_LEFT, WINDOW_HEIGHT - 2, "下 键    - 减少油料");
    term.moveTo(LOGO_LEFT, WINDOW_HEIGHT - 1, "Ctrl-C   - 退出");
}
function drawPercent() {
    if (oilpercent >= oilUpperLimit) {
        term.green.moveTo(LOGO_LEFT, LOGO_TOP, "余量 " + oilpercent.toFixed(2) + " %");
    } else if (oilpercent <= oilLowerLimit) {
        term.red.moveTo(LOGO_LEFT, LOGO_TOP, "余量 " + oilpercent.toFixed(2) + " %");
    } else {
        term.white.moveTo(LOGO_LEFT, LOGO_TOP, "余量 " + oilpercent.toFixed(2) + " %");
    }

    term.eraseLineAfter();
}
function draw() {


    // drawOilTank();
    drawOil();

    // drawLogo();

    drawPercent();

    term.moveTo(1, WINDOW_HEIGHT - 1);
}
function nextPosition() {
    // 计算下一个percent
}
function writeLog(str: string) {
    term.moveTo(1, WINDOW_HEIGHT);
    // term.eraseLine();
    term(new Date().toLocaleString() + " => " + str);
    term.eraseLineAfter();
}
function startServer() {
    let bWorking = false;
    server = net.createServer((connection) => {
        bWorking = true;
        async function run() {

            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 1000)
            });
            if (bWorking === true) {
                try {
                    connection.write(JSON.stringify({ data: oilpercent }));
                    run();
                } catch (e) {

                }

            }
        }

        run();
    });
    server.listen({ port: SERVER_PORT, host: 'localhost' }, () => { });
    server.on('error', (err: any) => {
        // writeLog(err);
    });
    server.on('close', () => {
        writeLog('Restart server');
        setTimeout(() => {
            startServer();
        }, 3000);
        bWorking = false;
    })
    server.on('end', () => {
        writeLog("ended");
        bWorking = false;
    });
}
function init() {
    startServer();
    term.grabInput();
    drawOilTank();
    drawLogo();

    term.on('key', function (name: string, matches: any, data: any) {
        writeLog("'key' event:" + name);

        // Detect CTRL-C and exit 'manually'
        if (name === 'CTRL_C') {
            term.moveTo(1, WINDOW_HEIGHT, "\n");
            process.exit();
        }
        else if (name === 'UP') {
            oilpercent += oilChangeRate;
            if (oilpercent >= 100) {
                oilpercent = 100;
            }

        } else if (name === 'DOWN') {
            oilpercent -= oilChangeRate;
            if (oilpercent <= 0) {
                oilpercent = 0;
            }

        }
    });
}
function useOil() {
    oilpercent -= oilUseRate;
    if (oilpercent <= 0) {
        oilpercent = 0;
    }
}
async function main2() {
    term.clear();
    init();

    async function run() {
        draw();
        nextPosition();
        await new Promise((resolve) => {
            setTimeout(() => {
                writeLog(" ");
                resolve()
            }, INTERVAL);
        })
        useOil();
        run();
    }

    run();
}

main2();