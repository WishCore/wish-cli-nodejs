
if(!process.env.CORE && !process.env.TCP) {
    console.log("Connecting using default parameters, unsecure connection to localhost:9094.");
    process.env.CORE = 'localhost:9094';
    process.env.TCP = '1';
}

var App = require('wish-app').App;
var inspect = require("util").inspect;

var useColors = true;
var maxInspectDepth = 10;
var quiet = false;
var pkg = require("./../package.json");

if (!quiet) {
    console.log("Welcome to Wish CLI v" + pkg.version);
}

if (!process.env.WSID) {
    process.env.WSID = 'cli';
}

function Cli() {

    var app = new App({ name: 'Wish CLI', permissions: [] });

    app.once('ready', function() {

        app.core('methods', [], function(err, methods) {

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
                        app.core(i, args, cb); 
                    };
                })(i);
                //Init help hints
                Object.defineProperty(node[path[0]], "_help_", {value : '('+methods[i].args +') '+ methods[i].doc });
            };

            var repl = require("repl").start({
                prompt : "wish> ",
                input : process.stdin,
                output : process.stdout,
                terminal : true,
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
            }

            syncctx();
       });
    });
}


Core = {};

module.exports = {
    Cli: Cli };
