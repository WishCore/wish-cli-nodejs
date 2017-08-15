
// import sha256 function
importScripts('sha256.js');


var stop = false;
var work = null;
var s = [];
var i = 0; // work index number
var c = 0; // work nonce
var meta = '';

var workerTimeout = null;

addEventListener('message', function(e) {
    var data = e.data;
    switch (data.op) {
        case 'start':
            //console.log('Continuing work: ', i, c, work);

            stop = false;

            if (workerTimeout) { clearTimeout(workerTimeout); }
            workerTimeout = setTimeout(worker, 0);
            break;
        case 'stop':
            postMessage({ event: 'stop' });
            stop = true;
            //console.log('set stop to true in worker.');
            break;
        case 'destroy':
            stop = true;
            close(); // Terminates the worker.
            break;
        default:
            //console.log('Going to work: ', data.op, data.id, data.args, i, c, s);
            id = data.id;
            
            if (data.args[0].type === 'Buffer') {
                //console.log('its a buffer');
                work = data.args[0].data;
            } else {
                work = new Uint8Array(data.args[0]);
            }
            
            
            //console.log('work, work', typeof work, work instanceof Uint8Array, data.args[0]);
            
            if (workerTimeout) { clearTimeout(workerTimeout); }
            workerTimeout = setTimeout(worker, 0);
    }
}, false);

function worker() {
    while (!stop) {
        
        var hash = sha256.create();
        hash.update(i +':'+ c +':');
        hash.update(work);
        var shasum = new Uint8Array(hash.array());
        
        if (shasum[0] === 0 && shasum[1] === 0 && shasum[2] < (i>=10 ? 8 : 64) ) {
            s.push(c);
            //postMessage({ sig: id, found: i, meta: i+':'+c+':hash' });
            postMessage({ event: 'pow', data: s });
            //console.log('found:', i, c, work, hash.hex());

            i++;
            c = 0;

            break;
        } else {
            c++;
        }
        
        if (c%20000 === 0) { break; }
    }
    
    if (!stop) {
        if (workerTimeout) { clearTimeout(workerTimeout); }
        workerTimeout = setTimeout(worker, 0);
    }
}
