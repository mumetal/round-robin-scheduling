class QNode {
    constructor(data) {
        this.data = data;
        this.next = null;
    }

    setNext(qnode) {
        this.next = qnode;
    }

    getNext() {
        return this.next;
    }
}

class Queue{
    constructor(data = null) {
        this.head = null;
        if (data != null) {
            let headnode = new QNode(data)
            this.head = headnode;
        }
    }

    enqueue(data){
        let newnode = new QNode(data);
        if (this.head == null) {
            this.head = newnode;
        } else {
            let current = this.head;
            while (current.getNext() != null){
                current = current.getNext();
            }
            current.setNext(newnode);
        }
    }

    dequeue() {
        if (this.head == null) {
            return null;
        }else {
            let toRemove = this.head;
            this.head = toRemove.getNext();
            return toRemove.data;
        }
    }

    peek() {
        return this.head.data;
    }

    isEmpty() {
        return this.head == null;
    }

    toList() {
        let l = [];
        let current  = this.head;
        while(current != null) {
            l.push(current.data);
            current = current.next;
        }
        return l;
    }

    toString() {
        let s = "";
        let current = this.head;
        while (current != null) {
            s += current.data.toString();
            if (current.next != null) {
                s += ', '
            }
            current = current.next;
        }
        return s;
    }

    sum() {
        let s = 0;
        let current = this.head;
        while (current != null) {
            s += parseInt(current.data.size) || 0;
            current = current.next;
        }
        return s;
    }
}


class Packet{
    constructor(size){
        this.size = size;
    }

    getSize(){
        return this.size;
    }

    toString() {
        return this.size;
    }
}

class Flow{
    constructor(queue, deficitCounter = 500) {
        this.queue = queue;
        this.deficitCounter = deficitCounter;
    }

    getDeficitCounter(){
        return this.deficitCounter;
    }

    incrementDeficitCounter(val) {
        this.deficitCounter += val;
    }

    queueIsEmpty() {
        return this.queue.isEmpty();
    }

    getNext() {
        return this.queue.dequeue();
    }

    peek() {
        return this.queue.peek();
    }

    enqueue(packet) {
        this.queue.enqueue(packet);
    }

    enqueuePacket(size) {
        this.queue.enqueue(new Packet(size));
    }

    toString() {
        return `DeficitCounter:${this.deficitCounter} Q:${this.queue.toString()}`;
    }
}

class DRRScheduler {
    constructor(numOfFlows, quantum, waitTime = 1000){
        this.quantum = quantum;
        this.flows = [];
        this.wasProcessed = [];
        for (let i = 0; i < numOfFlows; i++) {
            const flow = new Flow(new Queue(), 0);
            this.flows.push(flow);
            this.wasProcessed.push(false);
        }

        this.currentIndex = 0;
        this.firstEnter = true;
        this.currentPacketSize = null;
        this.waitTime = waitTime;
        this.run = false;
        this.eventListeners = {};
    }

    addEventListener(eventType, handler) {
        this.eventListeners[eventType] = handler;
    }

    async start() {
        this.run = true;
        while (this.run){
            await this.doNextPromise();
        }
    }

    stop () {
        this.run = false;
    }

    async doNextPromise() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this.doNext())
            }, this.waitTime);
        })
    }

    doNext() {
        this.currentPacketSize = null;
        const flow = this.flows[this.currentIndex];
        if (flow.queueIsEmpty()){
            if (this.firstEnter) {
                flow.deficitCounter = 0;
                this.eventListeners.setDeficitCounterofFlow(this.currentIndex, flow.deficitCounter);
            }
            this.nextFlow();
            return;
        } else {
            let packet = flow.peek();
            if (packet == null) {
                flow.deficitCounter = 0;
                this.eventListeners.setDeficitCounterofFlow(this.currentIndex, flow.deficitCounter);
                this.nextFlow();
                return;
            } else {
                if (this.firstEnter) {
                    flow.deficitCounter += this.quantum;
                    this.eventListeners.setDeficitCounterofFlow(this.currentIndex, flow.deficitCounter);
                    this.firstEnter = false;
                    return;
                }
            }
            if (packet.getSize() <= flow.deficitCounter) {
                flow.deficitCounter -= packet.getSize();
                this.eventListeners.setDeficitCounterofFlow(this.currentIndex, flow.deficitCounter);
                flow.getNext();
                this.eventListeners.popFlow(this.currentIndex);
                this.firstEnter = false;
                this.currentPacketSize = packet.getSize();
                return;
            } else {                
                this.nextFlow();
                return;
            }
        }
    }

    state() {
        let s = "";
        this.flows.forEach((flow, index) => {
            s += `Flow ${index} ${flow.toString()} \n`;
        });

        s += `Processing Flow${this.currentIndex}`;
        s += '\n\n';
        return s;
    }

    addToFlow(index, size) {
        if (index < this.flows.length) {
            this.flows[index].enqueuePacket(size);
            this.eventListeners.addPackettoFlow(index, size);
        }
    }

    nextFlow() {
        this.firstEnter = true;
        this.currentIndex = (this.currentIndex + 1) % this.flows.length;
        this.eventListeners.setSchedulerPosition(this.currentIndex);
    }
}


// D.addToFlow(0, 200);
// D.addToFlow(0, 400);
// D.addToFlow(1, 100);
// D.addToFlow(1, 200);
// D.addToFlow(1, 300);
// D.addToFlow(2, 200);
// D.addToFlow(2, 200);
// D.addToFlow(2, 200);
// D.start();
// let fun = () => {
//     let l = 0;
//     let u = 2
//     let f = Math.round(l + (Math.random() * (u - l)));
//     let lp = 1;
//     let up = 6;
//     let p = Math.round(lp + (Math.random() * (up - lp)));
//     let ps = p * 100;
//     D.addToFlow(f, ps)
// };
// setInterval(fun, 6000);