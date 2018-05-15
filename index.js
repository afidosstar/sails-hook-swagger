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
  swaggerGenerator.bindListener(sails);

  return {

    configure: function(){
      const MIDDLE_SWAGGER = 'swaggerMiddleware';
      sails.config.http.middleware[MIDDLE_SWAGGER] =(function _testMiddleware() {
        let express = require('express')
        let  swagger = express()
        assetsPath  = options.swaggerURL;
        swagger.use(assetsPath,express.static(options.uiPath))
        swagger.use(assetsPath,express.static(options.folder))
        swagger.use(options.swaggerJSON, function (req, res) {
          return res.json(api)
        })
        // swagger.use(options.swaggerURL,async function (req, res) {
        //   console.log('requeste')
        //   console.log((new RegExp('http://petstore.swagger.io/v2/swagger.json','g')).test(options.contentFile))
        //   if(!options.contentFile){
        //     options.contentFile = await readFile(options.uiPathIndex)
        //     options.contentFile = options.contentFile.replace(
        //       new RegExp('http://petstore.swagger.io/v2/swagger.json','g'),
        //       options.fullSwaggerJSONPath
        //     )
        //     return res.send(options.contentFile);
        //   }
        //   res.send(options.contentFile)
        // })
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
      sails.on("ready",async ()=>{ 
        let extRegExp = /\.(json|yml|yaml)$/;
        if(options.docsFile && fs.existsSync(options.swaggerDocsFile)){
          if(!extRegExp.test(options.swaggerDocsFile)){
            throw new Error("Unknow extension.Extension alowed are: json, yml, yaml");
        }
          api = _.merge(api, /\.(json)$/.test(options.swaggerDocsFile)?
          await readJSON(options.swaggerDocsFile):
          await readYml(options.swaggerDocsFile))
        }else{
          api = _.merge(swaggerGenerator.generate(sails),api);
          console.log(api);
        }
        (options.apis||[]).reduce(async (filename,acc) => {
          let fullname = path.resolve(sails.config.rootPath,filename)
          if(extRegExp.test(fullname) && fs.existsSync(fullname)){
            let content = /\.(json)$/.test(filename)? await readJSON(fullname): await readYml(fullname);
            console.log(api.paths||{},content.paths||{});
            api.paths = _.merge(api.paths||{},content.paths||{})
            api.definitions = _.merge(api.definitions||{},content.definitions||{})
          }
        },api)
      });
      //console.log(api);
      
    
      return done();

    },
    routes: {
      [options.swaggerURL]:async function (req, res) {
        console.log('requeste')
        console.log((new RegExp('http://petstore.swagger.io/v2/swagger.json','g')).test(options.contentFile))
        if(!options.contentFile){
          options.contentFile = await readFile(options.uiPathIndex)
          options.contentFile = options.contentFile.replace(
            new RegExp('http://petstore.swagger.io/v2/swagger.json','g'),
            options.fullSwaggerJSONPath
          )
          return res.send(options.contentFile);
        }
        res.send(options.contentFile)
      }
    }

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