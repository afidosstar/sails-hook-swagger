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

  bindListener: function(sails){
    sails.on('router:bind',function (route) {
      let exclude = ['find','create','update', 'destroy','add','replace',
        'csrfToken', 'csrftoken', '__getcookie', 'remove','__getcookie']
      if(!new RegExp(exclude.join('|')).test(route.path)){
        routes.push(route)
      }
      //console.log('bind')
    })
  },
  generate: function(sails){
    let options = verifyOptions(sails.config.swagger);
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
    api.definitions = parseModelsToDefinitions(sails.models,sails)
      api.paths = parseToPaths(routes,sails,api.definitions);
      //console.log(api.paths);
    return api
  },

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

  before: function (scope, done) {

    module.exports.bindListener(sails);

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
      let  stringApi = ''
      if(/\.(json)$/.test(pathfile)){
        stringApi = JSON.stringify(api,null,4);
      }else{
        stringApi = yaml.safeDump(api,{skipInvalid:true})
      }
      fs.writeFileSync(path.resolve(scope.rootPath,pathfile),stringApi)

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
        type: _.toLower(val.type),
        required: !!val.required,
        nullable: !!val.allowNull,

      };
      if(val.validations && val.validations.isIn){
        attrs[key]['enum'] = val.validations.isIn
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

function parseToPaths(routes,sails,definitions){
  let paths ={};
  _.each(routes,function(route){
    // ignore route default path of middleware
    if(['/*','/'].some((x) => x === route.path)) return;
    if(route.swagger){
      paths[convertPath(route.path)] = route.swagger||{}
    }
    paths[convertPath(route.path)] = paths[convertPath(route.path)] || {}

    let model = route.options.model||route.path.replace(new RegExp('.*\\/(\\w*)(\\/:\\w*)?\\??$'),"$1");
    model = model.replace(/(.+)\.(.+)/,'$1')
    .split('_').map((x) => _.capitalize(x)).join('')

    let sucessSchema =!/:/.test(route.path.trim())?
      {
      type: 'array',
      items: {
          $ref: "#/definitions/" + _.capitalize(model)
        }
    }:{
        $ref: '#/definitions/' + _.capitalize(model)
    }
    let body = [];
    let bodyParamsReader = function(definition,body = []){

    }
    if(!['get','delete'].some(x => x === route.verb)){
      if(definitions[model]){
        let definition = definitions[model]
        if(definition["properties"]){
          _.each(definition["properties"],function (value,key) {
            if(value.type && value.type !== 'array'){
              body.push({
                name: key,
                in: 'body',
                description: `'${key}' property of ${model}`,
                required: !!value.required,
                schema:{
                  type: value.type,
                  ...(value.enum ? {format: value.enum} : {})
                }
              })
            }else{
              body.push({
                name: key,
                in: 'body',
                description: `'${key}' property of ${model}`,
                required: !!value.required,
                schema:value
              })
            }

          })
        }
        if(definition["allOf"]){
          body.push({
            name: model,
            in: 'body',
            description: `'${model}' property of ${model}`,
            schema: definition
          })
        }
      }

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

function parseModelsToDefinitions(models,sails){
  definitions = definitions||{}
  _.each(models, function(value, key){
    definitions[_.capitalize(key)] = {
      type: "object",
      required: [
        "id"
      ],
      ...waterlineModelParser(value.attributes,sails)
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
