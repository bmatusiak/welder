var Architect = require("architect");
var path = require("path");

if(typeof __dirname == "undefined")
    __dirname = path.resolve("./");

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
        welder.start(function(err){
            if(err){
                console.error("While Starting app '%s'", err);
            }else{
                console.log("Started App!");
            }
        });
    }
});