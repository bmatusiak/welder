"use strict";

module.exports = function(options, imports, register) {
    
    var express = require('express');
    
    var app = express();
    
    var server = require('http').createServer(app);
    
    var http =  {
            app:app,
            server:server,
            express:express,
            listen: function(port,ip,callback){
                var PORT = port || process.env.PORT || null;
                var IP = ip || process.env.IP || null;
                server.listen(PORT, IP,function(err){
                    if(!err){
                        console.log("Server Listen Started",IP+":"+PORT);
                    }
                    if(callback)
                    callback(err,server);
                });
            }
        };
        
    if(register)
        register(null, {
            "http":http
        });
    else
    return http;
};