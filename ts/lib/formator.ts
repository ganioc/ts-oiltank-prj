import * as colors from 'colors'

const COLOR_TIME = colors.dim;
const COLOR_WARN = colors.yellow;
const COLOR_ERROR = colors.red;
const COLOR_INFO = colors.green;
const COLOR_MARK = colors.blue;

export const strLoopObject = (obj: object): string => {
    const SPACING = 2;
    const CH_SPACING = ' ';
    const DEPTH_COLOR: any = {
        0: (str: string): string => { return str; },
        1: colors.blue,
        2: colors.yellow,
        3: colors.red,
        4: colors.green,
        5: colors.bgYellow,
        6: colors.bgCyan,
        7: colors.cyan,
        8: colors.bgMagenta,
        9: colors.bgGreen,
        10: colors.bgWhite,
        11: colors.blue,
        12: colors.yellow,
        13: colors.red,
        14: colors.green,
        15: colors.bgYellow,
        16: colors.bgCyan,
        17: colors.cyan,
        18: colors.bgMagenta,
        19: colors.bgGreen,
        20: colors.bgWhite,
    }

    let out = "";

    // console.log('type of:', typeof obj)

    let funcLoop = (item: any, depth: number, offset: number = 0) => {
        out += ' '.repeat(SPACING + offset) + "{\n"

        Object.keys(item).forEach((chunk: string) => {

            let strKey = CH_SPACING.repeat(2 * SPACING + offset) + DEPTH_COLOR[depth](chunk) + " : ";

            if (typeof item[chunk] === 'object') {
                out += strKey + '\n';
                funcLoop(item[chunk], depth + 1, 2 * SPACING + offset)
            } else {
                out += strKey + item[chunk] + '\n';
            }
        })

        out += ' '.repeat(SPACING + offset) + "}\n"
    }


    funcLoop(obj, 0, 0);

    // console.log(out);

    return out;
}

export const cl = (...args: any[]): void => {
    let out: string[] = [];
    args.forEach((item) => {

        if (typeof item === 'object') {
            // console.log('='.repeat(40))
            // console.log(item)
            // console.log('*'.repeat(40))
            // out.push(item.toString())
            out.push(strLoopObject(item))
        } else {
            out.push(item)
        }
    })
    console.log(out.join(' '))
}
export const cltime = (...args: any[]): void => {
    let t = new Date().toLocaleString();

    console.log(COLOR_TIME('[' + t + ']'), args.join(' '))
}
export const clwarn = (...args: any[]): void => {
    cltime([COLOR_WARN(args.join(' '))]);
}
export const clerror = (...args: any[]): void => {
    cltime([COLOR_ERROR(args.join(' '))]);
}
export const clinfo = (...args: any[]): void => {
    cltime([COLOR_INFO(args.join(' '))]);
}
export const clmark = (...args: any[]): void => {
    cltime([COLOR_MARK(args.join(' '))]);
}
