var Worker = require('tiny-worker');
var sha256 = require('./sha256.js');

var workerList = [];

function checkPow(task, pow) {

    var sum = 0;

    for(var i in pow) {
        var sha = sha256.create();
        sha.update(i +':'+ pow[i] +':');
        sha.update(task);
        var hash = new Uint8Array(sha.array());
        var p = 0;

        //console.log("checkPow: ", i +':'+ pow[i] +':', hash[0], hash[1], hash[2]);

        for(var n=0; n<32; n++) {
            if (hash[n] === 0) {
                p += 8;
            } else {
                if (hash[n] < 2) {
                    p += 7;
                } else if (hash[n] < 4) {
                    p += 6;
                } else if (hash[n] < 8) {
                    p += 5;
                } else if (hash[n] < 16) {
                    p += 4;
                } else if (hash[n] < 32) {
                    p += 3;
                } else if (hash[n] < 64) {
                    p += 2;
                } else if (hash[n] < 128) {
                    p += 1;
                }
                break;
            }
        }

        if (p>=18) {
            //console.log('accepted, added points:', Math.pow(2, p-16));
            sum += Math.pow(2, p-16);
        } else {
            console.log('less than 18 points is considered spam, deny service. ('+ pow +')');
            return 0;
        }
    }

    return sum;
}

function PowWorker(task, cb) {
    var self = this;
    workerList.push(this);

    this.cb = typeof cb === 'function' ? cb : null;

    this.worker = new Worker("pow.js", [], { cwd: __dirname });

    this.worker.onmessage = function (e) {
        if (typeof self.cb !== 'function') {
            return console.log('Message from worker, but no Cb function:', e.data);
        }

        if (e.data && e.data.event && e.data.data) {
            var powScore = checkPow(task, e.data.data);
            self.cb(e.data.event, e.data.data, powScore);
        }
    };

    this.worker.postMessage({ op: 'pow', args: [task], id: 1 }); // Sending message as an array to the worker
    
}

PowWorker.prototype.stop = function() {
    if (this.worker) { this.worker.postMessage({ op: 'stop' }); }
};

PowWorker.prototype.terminate = function() {
    if (this.worker) { this.worker.terminate(); }
};

PowWorker.prototype.start = function() {
    if (this.worker) { this.worker.postMessage({ op: 'start' }); }
};


process.on('exit', function() {
    for (var i in workerList) {
        try {
            workerList[i].terminate();
        } catch(e) {
            // could not terminate, but we tried
        }
    }
});

module.exports = {
    PowWorker: PowWorker };