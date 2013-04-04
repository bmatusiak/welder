define(function(require, exports, module) {
    return function(options, imports, register) {
        register(null,{
            main:{
                init:function(callback){
                    console.log("loaded!");
                }
            }
        });
    };
});