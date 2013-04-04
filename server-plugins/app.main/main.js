"use strict";

module.exports = function(options, imports, register) {
    imports.welder.addStaticMount("/static",__dirname+"/static");
    register(null, {
        "main": {
        }
    });

};
