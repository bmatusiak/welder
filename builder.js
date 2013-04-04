var Architect = require("architect");

var configPath = __dirname+"/config.js";
var plugins = require(configPath);

Architect.createApp(Architect.resolveConfig(plugins, __dirname + "/server-plugins"), function(err, architect) {
    if (err) {
        console.error("While compiling app config '%s':", configPath);
        throw err;
    }else{
        var welder = architect.services.welder;
        for(var i in architect.config){
            var Package = require(architect.config[i].packagePath+"/package.json");
            if(Package.client){
                var exports = {};
                for(var j in architect.config[i].provides){
                    exports[architect.config[i].provides[j]] = architect.services[architect.config[i].provides[j]];
                }
                welder.addWelderPlugin(architect.config[i].packagePath,exports);
            }
        }
        welder.buildClient(__dirname+'/build/client.js',function(err){
            if(err){
                console.error("While Building app '%s'", err);
            }else{
                process.exit();
            }
        });
    }
});

