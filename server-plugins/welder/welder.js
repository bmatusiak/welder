"use strict";
var ejs = require("ejs");
var path = require("path");
var fs = require("fs");

var isNodeWebkit = (typeof process == "object") && process.versions && process.versions['node-webkit'];
                    
module.exports = function(options, imports, register) {
    imports.ejs = ejs;
    var staticPath = "/static";
    var welder;
    var clientExtensions = {};
    var staticMountPaths = {};
    
    clientExtensions.core = __dirname + '/lib/requireCore';
   
    clientExtensions.welder = __dirname + '/browser';
    var http = imports.http = require("./plugins/web.http/http.js")();
    
    function _StaticFiles(){
        var Path,mount,name;
        for (name in staticMountPaths) {
            Path = staticMountPaths[name].toString();
            mount = name;
            addStaticMount(mount, Path,true);
        } 
        
        if(options.isBuild){
            addStaticMount(staticPath,path.resolve(__dirname+"/../../build"),true);
        }else{
            for (name in clientExtensions) {
                Path = clientExtensions[name].toString();
                mount = staticPath+"/" + name;
                
                addStaticMount(mount, Path,true);
            } 
        }
    }
    function addStaticMount(mount, dir, listDirAlso){
        if(options.listDirectories || listDirAlso)
            http.app.use(mount, http.express.directory(dir));
        
        http.app.use(mount, http.express.static(dir));
        console.log("Static Mounted",mount,"=",dir);
    }
    
    function _RequestParsers(){
        //every thing under there gets cookies and session data
        http.app.use(http.express.bodyParser());
        http.app.use(http.express.cookieParser(options.clientSecret));
        
    }
    
    var __Middlewares = {};
    function _Middlewares(){
        for(var i in __Middlewares){
            http.app.use(__Middlewares[i](http.app));
        }
    }
    
    var onListenRoutes;
    var indexRoutes = [];
    var pluginsInit = [];
    
    function beforeListen(callback){
        _StaticFiles();
        _RequestParsers();
        _Middlewares();
        
        onListenRoutes(indexRoutes,pluginsInit,function(){
            callback(pluginsInit);
        });
    }
    
    welder = {
        start:function(callback){
            this.listen(callback);
        },
        buildClient:function(out,callback){
            var _self = this;
            beforeListen(function(detectedPlugins){
                var requirejs = require('requirejs');
                var extsList = _self.clientExtensions;
                var includes = ["core/require"];
                for(var i in detectedPlugins){
                    includes.push(detectedPlugins[i].name);
                }
                var config = {
                    baseUrl: clientExtensions.core,
                    paths: {},
                    include: includes,
                    excludeShallow:[],
                    name: 'welder/welder',
                    out: out,
                    logLevel: 0,
                };
                
                config.onBuildRead = function(moduleName, path, contents) {
                    console.log("reading "+moduleName,path);
                    
                    return contents;
                };
                
                config.onBuildWrite = function(moduleName, path, contents) {
                    console.log("writing "+moduleName,path);
                    if(moduleName.indexOf("less") >= 1){
                        console.log("writing "+moduleName,path);
                    }
                    return contents;
                };
            
                config.optimize = "none";
                //config.optimize = "uglify";
                
                config.optimizeAllPluginResources = true;
                
                for(var j in extsList){
                    config.paths[j] = extsList[j];
                }
                try{
                    requirejs.optimize(config, function(buildResponse) {
                        var outText = fs.readFileSync(config.out, 'utf8');
                        console.log("build done!");
                        callback(null,buildResponse,outText);
                    });
                }catch(e){
                    console.log(e);
                }
            });
        },
        listen:function(callback){
            beforeListen(function(someData){
                try{
                    //detect node-webkit
                    if (isNodeWebkit)
                    {
                        var nwIndex,gui = window.global.gui;
                        if(options.isBuild){
                            nwIndex = (__dirname+'/lib/startpage/nw-indexB.html').replace(window.global.appPath,"");
                        }else{
                            nwIndex = (__dirname+'/lib/startpage/nw-index.html').replace(window.global.appPath,"");
                        }          
                        var win = gui.Window.open(nwIndex);
                        win.appConfig = window.appConfig;
                    }else{
                        http.listen();
                    }
                    callback();
                }catch(e){
                    callback(e);
                }
            });
        },
        clientExtensions:clientExtensions,
        addWelderPlugin:function(pluginDir,exports){
            var _self = this;
            try{
                var clientPackage = require(pluginDir+"/package.json");
                if(clientPackage.client && clientPackage.client.name){
                    var client = clientPackage.client;
                    
                    if(client.main && client.name && client.path){
                        var plugin = {
                            name: (client.namespace ? client.namespace+"/" : "")+client.name+"/"+client.main
                        };
                        if(client.plugin && client.plugin.consumes || client.plugin.provides){
                            plugin.consumes = client.plugin.consumes;
                            plugin.provides = client.plugin.provides;
                        }
                        
                        _self.addPlugin(plugin);
                        
                        if(client.routes)
                            _self.addRoute(client.routes);
                            
                        clientExtensions[(client.namespace ? client.namespace+"/" : "")+client.name] = path.resolve(pluginDir,client.path);
                    }
                    
                }
                return;
            }catch(e){
                console.log(e);
            }
        },
        addPlugin:function(clientExtPath,routeName){
            if(typeof clientExtPath == "string")
                pluginsInit.push({name:clientExtPath});
            else if(typeof clientExtPath == "object")
                pluginsInit.push(clientExtPath);
        },
        addStaticMount:function(mount,dir,listDirAlso){
            if(options.listDirectories || listDirAlso)
                http.app.use(mount, http.express.directory(dir));
            
            http.app.use(mount, http.express.static(dir));
            console.log("Static Mounted",mount,"=",dir);
        },
        addRoute:function(routeName){
            if(routeName)
                indexRoutes.push(routeName);
        },
        addMiddleWare:function(name,fn){
            __Middlewares[name]=fn;
        }
    };
    
    onListenRoutes = require("./lib/routes.js")(options,imports,welder);
    
    register(null,{"welder": welder});
};