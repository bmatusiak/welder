"use strict";
var isNodeWebkit = (typeof process == "object") && process.versions && process.versions['node-webkit'];
var path = require("path");

module.exports = function(options, imports,welder) {
    return function OnListen(getPaths,architectClientPlugins,callback){
        var ejs = imports.ejs;
        var http = imports.http;
                
        var setStartFile = __dirname + '/startpage/index.html';
        var setStartFileContent = require("fs").readFileSync(setStartFile,"utf8");
            
        function renderIndex(req, res){
            var compiledStartFile = ejs.compile(setStartFileContent,{filename:setStartFile});
            var params;
            if(req.params && req.params[0]){
                params = req.params[0].split("/");
                for(var i in params){
                    if(params[i] === ""){
                        params.splice(1,i);
                    }
                }
            }
            
            res.end(compiledStartFile({
                appConfig:appConfig,
                isBuild:options.isBuild
            }));
        }
        
        var appConfig = {};
        
        
        if (!isNodeWebkit)
        {
            appConfig.baseUrl = "/static/core";
            appConfig.paths= {};
            for (var name in welder.clientExtensions) {
                appConfig.paths[name] = "/static/"+name;
            } 
        }else{
            appConfig.baseUrl = __dirname+"/requireCore";
            appConfig.paths= {};
            for (var name in welder.clientExtensions) {
                appConfig.paths[name] = welder.clientExtensions[name];
            } 
        }
        
        appConfig.config = {
            welder : {
                architectPlugins : architectClientPlugins
            }
        };
        
        //detect node-webkit
        if (isNodeWebkit)
        {
            window.appConfig = appConfig;
        }
        
        http.app.get('/favicon.ico',function(req,res){
            res.redirect('/static/images/favicon.ico');
        });
        
        http.app.get('/',renderIndex);
        
        if(getPaths)
        for(var i in getPaths){
           http.app.get(getPaths[i],renderIndex);
        }
        
        http.app.use(function(req,res){
            res.statusCode = 404;
            renderIndex(req,res);
        });
        
        callback();
    };
};