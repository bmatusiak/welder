define(["require", "exports", "module","core/architect"],function(require, exports, module) {
    function WelderApp() {}
    
    var architect = require("core/architect");
    
    WelderApp.prototype = {
        setup: function(appConfig,setupDone) {
            var _self = this;
            var requirePlugins = ["require", "exports", "module"];
            var architectPlugins = appConfig.config.welder.architectPlugins;
            for(var i in architectPlugins){
                requirePlugins.push(architectPlugins[i].name);
            }
            
            require(requirePlugins,startArchitect);
            function startArchitect(require){
                var initPlugins = [{
                    provides:["welder"],consumes:[],
                    setup:function(options, imports, register) {
                        register(null,{welder:_self});
                    }
                }];
                
                for(var i in architectPlugins){
                    if(!architectPlugins[i] || !architectPlugins[i].name) continue;
                    var plugin = require(architectPlugins[i].name);
                    if(typeof plugin == "function"){
                        initPlugins.push({
                            provides: architectPlugins[i].provides || plugin.provides || [],
                            consumes: architectPlugins[i].consumes || plugin.consumes || [],
                            setup:plugin
                        });
                    }
                    else if(plugin.setup){
                        plugin.provides = architectPlugins[i].provides || plugin.provides || [];
                        plugin.consumes = architectPlugins[i].consumes || plugin.consumes || [];
                        initPlugins.push(plugin);
                    }
                }
                    
                architect.createApp(initPlugins , function(err, Architect) {
                    if (err) {
                        console.error("While compiling app config");
                        throw err;
                    }else{
                        var services = _self.plugins = Architect.services;
                        var initServices = [];
                        
                        for(var i in services){
                            if(services[i].init){
                                initServices.push(i);
                            }
                        }
                        
                        (function(arr,finished) {
                            arr.reverse();
                            var loaded = {};
                            function startPlugins() {
                                var pluginName = arr.pop();
                                var plugin = services[pluginName];
                                if (!plugin){
                                    if(typeof finished == "function")
                                        finished();
                                    return ;
                                }
                                if (plugin.init){
                                    plugin.init(function () {
                                        if(!loaded[pluginName]){
                                            loaded[pluginName] = true;
                                            _self.plugins[pluginName] = plugin;
                                            startPlugins();
                                        }else{
                                            console.error("inline callback already calld : "+ pluginName);
                                        }
                                    });
                                }else{
                                    startPlugins();
                                }
                            }
                            startPlugins();
                        })(initServices,setupDone);
                    }
                });
            }
        }
    };

    return new WelderApp();
});