var WebSocket = require('ws');
var Client = require('@wishcore/wish-rpc').Client;
var bson = require('bson-buffer');
var BSON = new bson();

var PowWorker = require('./pow-worker.js').PowWorker;

function Directory(repl, printResult, wish) {
    
    // Connect to Directory service for finding friends 
    var ws = new WebSocket('wss://relay.wishtech.fi', { rejectUnauthorized: false });

    var client = new Client(function(msg) { ws.send(BSON.serialize(msg)); });

    ws.on('error', function(error) {
        console.log('Could not connect to directory.', error);
    });

    ws.on('open', function() {
        // Connected to directory
    });

    ws.on('message', function(message, flags) {
        if ( !flags.binary ) { return; }

        client.messageReceived(BSON.deserialize(message));
    });
    
    return {
        time: function() {
            client.request('time', [], function(err, timestamp) {
                if (err) { return console.log('Error getting time from server', timestamp); }
                
                console.log('Time from directory:', new Date(timestamp), '('+timestamp+')');
            });
        },
        publish: function(uid, directoryData) {
            wish.identity.export(uid, function(err, cert) {
                if(err) { return printResult(err, cert); }
                
                if (directoryData) {
                    var directoryEntry = BSON.deserialize(cert.data);
                    directoryEntry.meta = directoryData;
                    cert.data = BSON.serialize(directoryEntry);
                    
                    //console.log('Would publish this:', directoryEntry);
                }

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

                                    console.log('Published\033[1m', BSON.deserialize(cert.data).alias, '\033[0mto directory.');
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
        remove: function(id) {
            client.request('directory.remove', [id], (err, data) => {
                console.log('\n\x1b[33mDirectory remove:\x1b[39m\x1b[32m'+id+'\x1b[39m', err, data);
            });
        },
        find: function(alias, showId) {
            client.request('directory.find', [alias], (err, data) => {
                console.log('\n\x1b[33mDirectory search result:\x1b[39m');
                
                var none = true;
                for(var i in data) {
                    console.log('  result['+i+']: \x1b[32m'+data[i].alias+'\x1b[39m ('+data[i].uid.toString('hex')+')' + (showId ? data[i]._id : '') );
                    none = false;
                }
                
                if (none) { console.log('  No matches found to: '+alias); }
                
                repl.context.result = data;
                repl.displayPrompt(true);
            });
        },
        friendRequest: function(uid, entry) {
            wish.identity.friendRequest(uid, entry.cert, printResult);
        }
    };
}

module.exports = {
    Directory: Directory };
