var WishApp = require('mist-api').WishApp;
var WebSocket = require('ws');
var Client = require('wish-rpc').Client;
var inspect = require("util").inspect;
var bson = require('bson-buffer');
var BSON = new bson();

var PowWorker = require('./pow-worker.js').PowWorker;

var useColors = true;
var maxInspectDepth = 10;
var quiet = false;
var pkg = require("./../package.json");

"use strict";

if (!quiet) {
    console.log("Welcome to Wish CLI v" + pkg.version);
    console.log("\x1b[33mNot everything works as expected! You have been warned.\x1b[39m");
}

if (!process.env.WSID) {
    process.env.WSID = 'cli';
}

if (!process.env.CORE) {
    process.env.CORE = '9094';
}

function Cli() {
    var app = new WishApp({ name: 'Wish CLI', corePort: parseInt(process.env.CORE) }); // , protocols: [] });

    app.once('ready', function() {
        
        app.request('version', [], function(err, version) {
            if(err) { return; };
            
            console.log("\x1b[32mConnected to Wish Core "+version+"\x1b[39m");
        });
        
        app.request('methods', [], function(err, methods) {
            for (var i in methods) {
                var path = i.split('.');
                var node = Core;
                //console.log("Root, path", path);
                while (path.length>1) {
                    if (!Core[path[0]]) {
                        Core[path[0]] = {};
                    }
                    node = Core[path[0]];
                    path.shift();
                    //console.log("shifted path", path);
                }

                node[path[0]] = (function(i) { 
                    return function() { 
                        var args = [];
                        var cb = arguments[arguments.length-1];

                        if ( typeof cb !== 'function') { 
                            cb = printResult; 
                            for (var j=0; j < arguments.length; j++) {
                                args.push(arguments[j]);
                            }
                        } else {
                            for (var j=0; j < arguments.length-1; j++) {
                                args.push(arguments[j]);
                            }
                        }
                        app.request(i, args, cb); 
                    };
                })(i);
                
                //Init help hints
                var args = methods[i].args || '?';
                var doc = methods[i].doc || 'n/a';

                Object.defineProperty(node[path[0]], "inspect", {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: (function(args, doc) { return function() { return '\x1b[33m'+args+'\x1b[37m '+doc+'\x1b[39m'; }; })(args, doc)
                });                
            };

            var repl = require("repl").start({
                prompt: "wish> ",
                input: process.stdin,
                output: process.stdout,
                terminal: true,
                ignoreUndefined: true,
                writer : function (obj) {
                    return inspect(obj, maxInspectDepth, null, useColors);
                }
            });

            repl.on("exit", function () {
                app.disconnect();
                console.log("Bye!");
                process.exit(0);
            });

            function printResult(err, data) {
                if(err) {
                    console.log("Error:", data);
                } else {
                    console.log(inspect(data, maxInspectDepth, null, useColors));
                }
                repl.context.result = data;
                repl.context.error = err;
            }

            function syncctx() {
                repl.resetContext();
                for(var i in Core) {
                    repl.context[i] = Core[i];
                }
                
                repl.context.help = function() {
                    console.log('Help:');
                    console.log();
                    console.log('Available commands from wish-api:');
                    console.log(inspect(Core, { colors: true, depth: 10 }));
                };
                
                repl.context.BSON = BSON;
                repl.context.directory = {
                    publish: function(uid) {
                        Core.identity.export(uid, function(err, cert) {
                            if(err) { return printResult(cert); }

                            Core.identity.sign(uid, cert, function(err, data) {
                                if(err) { return printResult(data); }

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

                            Core.identity.sign(uid, { data: BSON.serialize({ op: 'directory.unpublish', timestamp: timestamp }) }, function(err, data) {
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

            syncctx();
        });

        // Connect to Directory service for finding friends 
        var ws = new WebSocket('wss://mist.controlthings.fi:3030');

        var client = new Client(function(msg) { ws.send(BSON.serialize(msg)); });

        ws.on('open', function() {
            // Connected to directory
        });
        
        ws.on('message', function(message, flags) {
            if ( !flags.binary ) { return; }
            
            client.messageReceived(BSON.deserialize(message));
        });
    });
}


Core = {};

module.exports = {
    Cli: Cli };
