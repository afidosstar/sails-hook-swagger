var fs = require('fs');
var pkg = require('./package');
var chalk = require('chalk');
var path =  require('path');
fs.copyFile(
    path.join(__direname,pkg.constant.src),
    path.join(__direname,pkg.constant.dest),function(err){
    if(err) console.log(chalk.yellow(err.message))
})