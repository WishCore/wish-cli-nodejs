var WebSocket = require('ws');
var Client = require('wish-rpc').Client;
var bson = require('bson-buffer');
var BSON = new bson();

var PowWorker = require('./pow-worker.js').PowWorker;

function Directory(repl, printResult, wish) {
    
    // Connect to Directory service for finding friends 
    var ws = new WebSocket('wss://mist.controlthings.fi:3030');

    var client = new Client(function(msg) { ws.send(BSON.serialize(msg)); });

    ws.on('error', function() {
        console.log('Could not connect to directory.');
    });

    ws.on('open', function() {
        // Connected to directory
    });

    ws.on('message', function(message, flags) {
        if ( !flags.binary ) { return; }

        client.messageReceived(BSON.deserialize(message));
    });
    
    return {
        publish: function(uid) {
            wish.identity.export(uid, function(err, cert) {
                if(err) { return printResult(err, cert); }

                wish.identity.sign(uid, cert, function(err, data) {
                    if(err) { return printResult(err, data); }

                    client.request('time', [], function(err, timestamp) {
                        if (err) { return console.log('Error getting time from server', timestamp); }

                        var claim = BSON.serialize({ uid: uid, timestamp: timestamp });

                        var worker = new PowWorker(claim, function(type, pow, powScore) {
                            //console.log('workCb', type, pow, powScore);
                            if (type === 'pow' && powScore > 50) {
                                worker.stop();
                                worker.terminate();

                                client.request('directory.publish', [data, claim, pow], function(err, data) {
                                    if (err) { return printResult(err, data); }

                                    console.log('Published \033[1m', BSON.deserialize(cert.data).alias, '\033[0mto directory.');
                                    repl.displayPrompt(true);
                                });
                            }
                        });
                    });
                });
            });
            console.log('This might take a while...');
        },
        unpublish: function(uid) {
            client.request('time', [], function(err, timestamp) {
                if (err) { return console.log('Error getting time from server', timestamp); }

                wish.identity.sign(uid, { data: BSON.serialize({ op: 'directory.unpublish', timestamp: timestamp }) }, function(err, data) {
                    if (err) { return console.log('identity.sign:', err, data); }

                    client.request('directory.unpublish', [uid, data], function(err, data) {
                        if (err) { return console.log('directory.unpublish:', err, data); }

                        console.log('Unpublished from directory.');
                    }); 
                });        
            });
        },
        find: function(alias) { client.request('directory.find', [alias], printResult); }
    };
}

module.exports = {
    Directory: Directory };