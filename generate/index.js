/**
 * Module dependencies
 */

var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var Sails = require('sails').Sails;
var chalk = require('chalk');
var yaml = require('js-yaml');


/**
 * @afidoss/sails-generate-test
 *
 * Usage:
 * `sails generate test`
 *
 * @description Generates a test.
 * @docs https://sailsjs.com/docs/concepts/extending-sails/generators/custom-generators
 */
let sails = Sails();
let routes = [];
let definitions = {}, paths = {}
let api = {};

module.exports = {

  /**
   * `before()` is run before executing any of the `targets`
   * defined below.
   *
   * This is where we can validate user input, configure default
   * scope variables, get extra dependencies, and so on.
   *
   * @param  {Dictionary} scope
   * @param  {Function} done
   */

  generate: function(sails){
    let options = verifyOptions(sails.config.swagger);
    sails.on('router:bind',function (route) {
      let exclude = ['find','create','update', 'destroy','add','replace',
        'csrfToken', 'csrftoken', '__getcookie', 'remove','__getcookie']

      if(!new RegExp(exclude.join('|')).test(route.path)){
        routes.push(route)
      }
    })
    api = {
      swagger: options.swaggerVersion || '2.0',
      basePath: '/',
      apiVersion: options.apiVersion,
      info: options.info || {
        version: "1.0.0",
        title: "API Documentation"
      },
      description: options.description,
      paths: paths,
      definitions: definitions
    }
    parseToPaths(routes,paths);
    parseModelsToDefinitions(sails.models,definitions)

    return api
  },

  before: function (scope, done) {



    sails.load({
      models: {
        migrate: 'safe'
      },
      hooks:{
        grunt: false,
        swagger: false
      },
    },function (err){
      if(err)console.error(chalk.red(err))
      module.exports.generate(sails)
      let pathfile = scope.args[0]||'assets/templates/api-docs.json'

      if(!/\.(json|yml|yaml)$/.test(pathfile)){
         throw new Error("Unknow extension.Extension alowed are: json, yml, yaml");
      }
      if(/\.(json)$/){
        let  jsonApi = JSON.stringify(api,null,4);
        fs.writeFileSync(path.resolve(scope.rootPath,pathfile),jsonApi)
      }else{
        let ymlApi = yaml.safeDump(api,{skipInvalid:true})
        fs.writeFileSync(path.resolve(scope.rootPath,pathfile),ymlApi)
      }

      console.log(chalk.blue('Generate docs to: '),chalk.grey(pathfile))
      sails.lower(done)
    })
  },



  /**
   * The files/folders to generate.
   * @type {Dictionary}
   */
  targets: {},
};


function verifyOptions(opt) {
  if (!opt) {
    throw new Error('\'option\' is required.');
  }
  opt.folder = opt.folder || path.join(__dirname,'/assets')
  opt.apiVersion = opt.apiVersion || '1.0';
  opt.swagger = opt.swagger || '1.0';
  return opt;
}

function waterlineModelParser(attributes) {

  let attrs = {};
  let extend = []

  _.each(attributes, function(val, key) {
    if(val.type){
      attrs[key] = {
        type: _.capitalize(val.type),
        required: val.required || false,
        nullable: val.allowNull || false,

      };

      if(val.isIn){
        attrs[key]['enum'] = val.isIn
      }
    }
    if(val.collection){
      attrs[key] = {
        type: 'array',
        items: {
          $ref:  "#/definitions/" + _.capitalize(val.collection)
        }
      }
    }
    if(val.model){
      //console.log('key:',key,' unique:', val.autoMigrations.unique)
      if(val.autoMigrations && val.autoMigrations.unique){
        extend.push({
          $ref: '#/definitions/' + _.capitalize(val.model)
        })
      }else{
        attrs[key] = {
          $ref: '#/definitions/' + _.capitalize(val.model)
        }
      }

    }
  });
  if(extend.length){
    extend.push(attrs)
    return {allOf: extend};
  }
  return {properties: attrs};
}

function summary(route){
  switch (route.verb){
    case 'get':
      return (/:/.test(route.path)? "Find one " :"Find all ")+ route.options.model
    case 'put':
      return 'Update on ' + route.options.model
    case 'post':
      return (/add/.test(route.path)?'Create ':'Add ' ) + route.options.model
    case 'delete':
      return "Delete " + route.options.model
    case 'all':
      return "Create|delete|update|post|put " + route.options.model
  }
}

function parseToPaths(routes, paths){
  paths = paths||{}
  _.each(routes,function(route){
    if(['/*','/'].some((x) => x === route.path)) return;
    if(route.swagger){
      paths[convertPath(route.path)] = route.swagger
    }
    paths[convertPath(route.path)] = paths[convertPath(route.path)] || {}

    let model = route.path.replace(new RegExp('.*\\/(\\w*)(\\/:\\w*)?\\??$'),"$1");
    model = model.replace(/(.+)\.(.+)/,'$1')
    .split('_').map((x) => _.capitalize(x)).join('')

    let sucessSchema =!/:/.test(route.path.trim())?
      {
      type: 'array',
      items: {
          $ref: "#/definitions/" + _.capitalize(model)
        }
    }:{
      type: 'object',
      properties: {
        $ref: '#/definitions/' + _.capitalize(model)
      }
    }
    let body = [];
    if(!['get','delete'].some(x => x === route.verb)){
      body.push({
        "$ref": '#/definitions/' + _.capitalize(model)
      })
    }

    let tags = route.path.replace(sails.config.blueprints.prefix,'')
    .split('/').filter((x) => x && !/:/.test(x) )




    paths[convertPath(route.path)][route.verb] = {
      description: "Api for model "+ _.capitalize(route.options.model||model),
      operationId: route.verb+ (''+ route.options.action)
      .split('/').map((p) => _.capitalize(p)).join(''),
      summary: summary(route),
      produces: [
        "application/json",
        "multipart/form-data",
      ],
      parameters: [
        ...paramsPath(route),
        ...body,
      ],
      tags,
      responses: {
        "200": {
          "description": _.capitalize(model)+" response",
          "schema": sucessSchema,
        },
        "400": {
          "description": "bad Request",
          "schema": {
            "$ref": "#/definitions/ErrorModel"
          }
        },
        "500": {
          "description": "Server Error",
          "schema": {
            "$ref": "#/definitions/ErrorModel"
          }
        },
        "default": {
          "description": "unexpected error",
          "schema": {
            "$ref": "#/definitions/ErrorModel"
          }
        }
      }
    }
  })
  return paths
}

function convertPath(path){
  return path.replace(/:(\w*)\??/g,'{$1}')
}

function paramsPath(route){
  //let params = [route.options.model,..._.keys(sails.models[route.options.model].attributes)]
  //marched
  return (route.path.match(/(\w*)\/:(\w*)/g)||[]).filter((x) => x).map((param) =>
  {
    param = param.split('/:');
    return {name: param[1],in: 'path',"required": true,
      //"schema": {"$ref": "#/definitions/" + _.capitalize(param[0])}
    }
  })
}

function parseModelsToDefinitions(models,definitions){
  definitions = definitions||{}
  _.each(models, function(value, key){
    definitions[_.capitalize(key)] = {
      type: "object",
      required: [
        "id"
      ],
      ...waterlineModelParser(value.attributes)
    };
    //definitions['New' + _.capitalize(key)] = _.omit(definitions[_.capitalize(key)],)
  });
  definitions["ErrorModel"] = {
    "type": "object",
    "required": [
      "code",
      "message"
    ],
    "properties": {
      "code": {
        "type": "integer",
        "format": "int32"
      },
      "message": {
        "type": "string"
      }
    }
  }
  return definitions
}
