var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var url = require('url');
var chalk = require('chalk');
var swaggerGenerator = require('./generate/index')

/**
 * swagger hook
 *
 * @description :: A hook definition.  Extends Sails by adding shadow routes, implicit actions, and/or initialization logic.
 * @docs        :: https://sailsjs.com/docs/concepts/extending-sails/hooks
 */

module.exports = function defineSwaggerHook(sails) {
  // 
  let options = generate(_.defaults(sails.config.swagger,{
    ui: 'new',
    basePath: `http${sails.config.ssl?'s':''}://127.0.0.1:${sails.config.port||1337}`,
    swaggerVersion: '2.0',
    info: {
      version: "1.0.0",
      title: "API Documentation"
    },
    swaggerURL: '/api/docs',
    swaggerJSON: '/api-docs.json',
  }))
  
  let api = {
    swagger: options.swaggerVersion,
    basePath: options.basePath,
    apiVersion: options.apiVersion,
    info: options.info 
  };

  return {

    configure: function(){
      const MIDDLE_SWAGGER = 'swaggerMiddleware';
      sails.config.http.middleware[MIDDLE_SWAGGER] =(function _testMiddleware() {
        let express = require('express')
        let  swagger = express()
        swagger.use(options.swaggerURL,express.static(path.join(__dirname, options.uiPath)))
        swagger.use(options.swaggerURL,express.static(options.folder))
        swagger.use(options.swaggerJSON, function (req, res) {
          return res.json(api)
        })
        swagger.use(options.swaggerURL,async function (req, res, next) {
          if(!options.contentFile){
            options.contentFile = await readFile(options.uiPathIndex)
            options.contentFile = options.contentFile.replace(
              'http://petstore.swagger.io/v2/swagger.json',
              path.join(options.basePath,options.swaggerJSON)
            )
            return res.send(options.contentFile);
          }
          res.send(options.contentFile)
        })


        return swagger
      })()
      sails.config.http.middleware.order.splice(0,0,MIDDLE_SWAGGER);
    },

    /**
     * Runs when a Sails app loads/lifts.
     *
     * @param {Function} done
     */
    initialize: async function (done) {

      if(options.docsFile && fs.existsSync(options.swaggerDocsFile)){
        if(!/\.(json|yml|yaml)$/.test(options.swaggerDocsFile)){
          throw new Error("Unknow extension.Extension alowed are: json, yml, yaml");
       }
        api = _.merge(/\.(json)$/.test(options.swaggerDocsFile)?
        await readJSON(options.swaggerDocsFile):
        await readYml(options.swaggerDocsFile)
        ,api)
      }else{
        api = _.merge(swaggerGenerator.generate(sails),api)
      }
    
      return done();

    },
    routes: {}

  };

};
function readFile(path){
  return new Promise(function(resolve, reject){
    fs.readFile(path,'utf-8',function (err,data) {
      if(err) return reject(err)
      resolve(data)
    })
  })
}
async function readYml(filename) {
  return yaml.safeLoad(await readFile(filename));
}
async function readJSON(filename) {
  return JSON.parse(await readFile(filename));
}



function generate(opt) {

  if (!opt) {
    throw new Error('\'option\' is required.');
  }

  if (!opt.basePath) {
    throw new Error('\'basePath\' is required.');
  }

  if (!opt.ui) {
    throw new Error('\'ui\' is required.');
  }

  if(!/^last|new|custom$/i.test(opt.ui)){
      throw new Error("value of ui must be  last,new or custom.");
  }

  if(opt.ui.toLowerCase() == 'custom' && !opt.uiPath){
    throw new Error('For custom ui ,you must specify uiPath');
  }

  if(/^last|new$/i.test(opt.ui)){
    opt.uiPath = path.join(__dirname,opt.ui + '-ui');
  }


  opt.uiIndex =  opt.uiIndex || 'index.html';
  opt.uiPathIndex = path.join(opt.uiPath , opt.uiIndex);
  opt.folder = opt.folder || path.join(__dirname,'/assets')
  opt.apiVersion = opt.apiVersion || '1.0';
  opt.swagger = opt.swagger || '1.0';
  Object.defineProperty(opt,'fullSwaggerJSONPath',{
    get: function(){
        return url.parse(opt.basePath + opt.swaggerJSON).path
    }
  })
  console.log(
    chalk.blue('Swagger info: '),
    chalk.gray('------------------------------------------------------')
  );
  // verifie if you are chose you ui
  console.log(
    chalk.blue('ui:                       '),
     opt.ui.toLowerCase()
  )
  console.log(
    chalk.blue('basePath + swaggerJSON:   '),
    chalk.yellow(opt.basePath + opt.swaggerJSON)
  );
  console.log(
    chalk.blue('parsed path to json file: '),
    chalk.yellow(opt.fullSwaggerJSONPath)
  );
  if(opt.fullSwaggerJSONPath.lastIndexOf('//') !== -1) {
    console.log(
      chalk.red('veriry provided options, there is an unused `//` in the json path')
    );
  }
  console.log(
    chalk.blue('Swagger info: '),
    chalk.gray('-----------------------------------------------------')
  );
  return opt;
}






























