import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } from "constants";


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

testCirculuarQueue();
