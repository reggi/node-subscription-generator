var path = require("path");
var argv = require('minimist')(process.argv.slice(2));
var moduleFile = argv._.shift();
moduleFile = path.join(process.cwd(), moduleFile);
var module = require(moduleFile);
if(typeof module == "object"){
  var string = JSON.stringify(module, undefined, 2);
  console.log(string)
}else if(argv.return){
  var output = module.apply(null, argv._);
  console.log(output);
}else if(argv.promise){
  module.apply(null, argv._)
}
