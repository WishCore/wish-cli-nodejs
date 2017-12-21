var WishApp = require('mist-api').WishApp;
var inspect = require("util").inspect;
var bson = require('bson-buffer');
var BSON = new bson();

var Directory = require('../deps/directory/directory.js').Directory;

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
                        return app.request(i, args, cb); 
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
                
                repl.context.cancel = function(id) {
                    app.cancel(id);
                };
                
                repl.context.BSON = BSON;
                repl.context.directory = new Directory(repl, printResult, Core);
                repl.context.remote = {
                    identity: {
                        list: function(host) {
                            Core.send
                        }
                    }
                }
            }

            syncctx();
        });
    });
}


Core = {};

module.exports = {
    Cli: Cli };
