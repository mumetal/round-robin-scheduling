let canvas = document.querySelector('canvas');
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;
canvas.width = 1000;
canvas.height = 600;
const c = canvas.getContext('2d');
const GRAVITY = 0.2;
const COLOR = {
    bg: '#04bfbf',
    scheduler: '#0367a6',
    packet: '#7d45a6',
    flow: '#333333'

};



function Rectangle(x, y, width, height, options = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = options.color || '#000000';
    this.dy = 0;
    this.dynamic = options.dynamic || false;
    this.text = "";
    if (options.text != null) {
        this.text = `${options.text}`;
    }
    
    this.update = (colliders = []) => {
        if (this.dynamic) {
            this.dy += GRAVITY;
            this.y += this.dy;
            colliders.forEach(obj => {
                if (obj != this) {
                    let collisionData = getCollisionData(this, obj);
                    if (collisionData.collision) {
                        let newY = collisionData.adjustmentsToRect1.y;
                        if (newY && newY < this.y) {
                            this.y = newY;
                            this.dy = 0;
                        }
                    }
                }
            });
        }
        this.draw();
    };

    this.draw = () => {
        c.beginPath();
        c.fillStyle = this.color;
        c.fillRect(this.x, this.y, this.width, this.height);
        c.strokeStyle = COLOR.flow;
        c.rect(this.x, this.y, this.width, this.height);
        c.stroke();
        if (this.text.length > 0) {
            c.fillStyle = '#ffffff';
            c.fillText(`${this.text}`, this.x + this.width/4, this.midY());
        }
        c.closePath()

    };

    this.midX = () => {
        return this.x + (this.width /2);
    };
    this.midY = () => {
        return this.y + (this.height /2);
    }
}


function FlowGUI(x, y, width, height, options = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.deficitBoxHeight = 40;
    this.innerWidth = 10;//Math.floor(0.1 * width) || 1;
    this.innerHeight = 30;//Math.floor(0.1 * height) || 1;
    this.packetWidth = this.width - (2 *this.innerWidth) - 2; 
    this.dynamics = [];
    this.options = options;
    this.left = new Rectangle(x, y, this.innerWidth, height, options);
    this.right = new Rectangle(x + width - this.innerWidth, y, this.innerWidth, height, options);
    this.bottom = new Rectangle(x, y + height - this.innerHeight, width, this.innerHeight, options);
    this.deficitBox = new Rectangle(x + this.innerWidth,
        y + height - this.innerHeight - this.deficitBoxHeight, 
        this.packetWidth + 2, this.deficitBoxHeight, {...options, text: 0});
    this.statics = [this.left, this.right, this.bottom, this.deficitBox];
    


    this.update = () => {
        this.draw();
    };

    this.draw = () => {
        let colliders = [this.bottom, this.deficitBox, ...this.dynamics];
        this.statics.forEach(e => {e.update();} );
        this.dynamics.forEach(e => {e.update(colliders);} );
    };

    this.addPacket = size => {
        let x = this.x + this.innerWidth + 1;
        let totalHeight = 0;
        this.dynamics.forEach(p=> {
            totalHeight += p.height;
        });
        totalHeight = (totalHeight > this.height) ? this.height - totalHeight : 0;
        let y = totalHeight - size ;
        let options = {dynamic: true, color: COLOR.packet, text: size}; 
        let p = new Rectangle(x, y, this.packetWidth, size, options);
        this.dynamics.push(p);
    };

    this.pop = () => {
        if (this.dynamics.length == 0) {
            return;
        }
        this.dynamics[0].y = this.height;
        setTimeout(()=>{
            this.dynamics = this.dynamics.slice(1);
        }, 1000);
    }
}



function init() {
    flows = [];
    scheduler = new Rectangle(flowXoffset, 500, 100, 100, {color: COLOR.scheduler});
    for (let i = 0; i < 3; i++) {
        let x = (flowXoffset * i) + flowXoffset; 
        let y = 0; 
        let w = 100;
        let h = 400;
        let r = new FlowGUI(x,y,w,h, {color: COLOR.flow});
        flows.push(r);
    }
    particles = [...flows, scheduler];
}

function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0,0,canvas.width, canvas.height);
    c.fillStyle = COLOR.bg;
    c.fillRect(0,0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
    });

}





let setDeficitCounterofFlow = (flowIndex, deficitCounter) => {
    let flow = flows[flowIndex];
    flow.deficitBox.text = `${deficitCounter}`;
}

let setSchedulerPosition = (index) => {
    scheduler.x = (index * flowXoffset) + flowXoffset;
}

let addPackettoFlow = (index, packetSize) => {
    flows[index].addPacket(packetSize);
}

let popFlow = (index) => {
    flows[index].pop();
}

let control = () => {
    if (D.run) {
        D.stop();
        clearInterval(pushInterval);
        // ctrlButton.textContent = 'PLAY';
        ctrlSpan.className = 'fa fa-play';
    } else {
        D.start()
        pushInterval = setInterval(randomPush, 3000);
        // ctrlButton.textContent= 'PAUSE';
        ctrlSpan.className = 'fa fa-pause';
    }
}

let quantumBtnHandler = (e) => {
    let quantum = parseInt(quantumInput.value) || 0;
    D.quantum = quantum;
}

let randomPush = () => {
    let fi = randomIntFromRange(0, flows.length - 1);
    let size = randomIntFromRange(1, 3);
    size *= 50;
    D.addToFlow(fi, size);
}

window.addEventListener('resize', init);
let ctrlButton = document.querySelector('#control');
let ctrlSpan = document.querySelector('#control span');
let quantumInput = document.querySelector("#quantumInput");
let quantumBtn = document.querySelector("#quantumBtn");
ctrlButton.addEventListener('click', control);
quantumBtn.addEventListener('click', quantumBtnHandler);

let D = new DRRScheduler(3, 150);
D.addEventListener('setSchedulerPosition', setSchedulerPosition);
D.addEventListener('setDeficitCounterofFlow', setDeficitCounterofFlow);
D.addEventListener('addPackettoFlow', addPackettoFlow);
D.addEventListener('popFlow', popFlow);
quantumInput.value = D.quantum;

let particles;
let flows = D.flows.length;
let scheduler;
let flowXoffset = 150;
let pushInterval;
init();
animate();