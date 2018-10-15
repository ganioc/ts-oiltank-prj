import { clinfo } from "./formator";


export interface IfBackgroundTaskOptions {

}

export class BackgroundTask {
    constructor() {

    }
    start() {
        clinfo('BackgroundTask started')
    }
    restart(options: IfBackgroundTaskOptions) {
        clinfo('BackgroundTask restarted with options:')
    }
}
