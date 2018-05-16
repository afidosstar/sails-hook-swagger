# sails-hook-swagger


[![NPM version][npm-image]][npm-url]
[![Dependency Status][daviddm-image]][daviddm-url]

> Important! develoment in progress..

* [swagger.io](http://swagger.io/) hook for [Sails JS](http://sailsjs.org/).
* Customized to support the Swagger 2.0 specification, it is a simple and clean solution to integrate swagger with Sails JS, the application's models, controllers, and routes are automatically aggregated and transformed into a Swagger Document.
* Based in forks(outdated) of [swagger-express](https://github.com/fliptoo/swagger-express), [sails-swagger](https://github.com/tjwebb/sails-swagger), [sails-swagr](https://github.com/qbanguy/sails-swagr) and [sails-custom-swagger-hook][https://github.com/jasancheg/sails-custom-swagger-hook], but uptate and personalize to use with up to date dependencies and with a couple of extra features for allow inject CSS and JS files for brand personalization.


### Summary

This module will do it best to autogenerate everything it can from Sails configuration and create
a Swagger 2.0 JSON Specification to be used with the Swagger-UI. After routes and models have been generated,
you may create a `docs` directory under `api/` and place YML documents with paths definitions for each Controller. As a result, the generated JSONs and YAMLs will be **merged**.

Here is how documentation API page looks like ([sample](https://github.com/jasancheg/sails-custom-swagger-hook/blob/master/samples/picture-1.png)):

![](https://raw.githubusercontent.com/jasancheg/sails-custom-swagger-hook/master/samples/picture-1.png)

**Logs**
![](https://raw.githubusercontent.com/jasancheg/sails-custom-swagger-hook/master/samples/picture-2.png)


## Installation

    $ npm install @afidoss/sails-hook-swagger --save


## Quick Start

Configure hook as express middleware.

Key              | Example value                 | Description
---------------- | ----------------------------- |:---------------------
`apiVersion`     | '1.0'                         | Your api version. (**optional**)
`swaggerVersion` | '2.0'                         | Swagger version.(**optional**)
`swaggerURL`     | '/api/docs'                   | Path to use for swagger ui web interface.(**required**)
`swaggerJSON`    | '/api-docs.json'              | Path to use for swagger ui JSON.(**required**)
`basePath`       | process.env.HOST_NAME \| \| 'http://localhost:1337'      | The basePath for swagger.js .(**required**)
`info`           | { title: '', description: ''} | [Metadata][info] about the API (**optional**)
`apis`           | ['./api/docs/User.yml']       | Define your api array. (**optional**)
`ui`             | 'new'                         | Value list complet is:  `new`, `last` or `custom`. Default is `new` 
`uiIndex`        | 'index.html'                  | Index of ui .Default is `index.html`
`docsFile`       | true                          | Is used for load documentation with file
`swaggerDocsFile`| 'assets/api/docs-api.json'    | manuelly set documentation of api on format json or yml.use this un production after set `docsFile` to true
`uiPath`         | '/path-of-swagger-ui'         | if ui= custom, you must specify this,otherwise that will throw error
`folder`         |'/assets/docs'                 | Path to folder where `custom-swagger.css` and `custom-swagger.js` are stored (**optional**)

> Note:
> * Currently the implementation for personalization is very basic, you can place the folder for the customization files in any convenient folder of your application, for example `assets/docs`, however the name for the css/js files are mandatory. For properly operation of the hook please preserve the name for `custom-swagger.css` and `custom-swagger.js`
> * Files placed in your customization folder are availables as static assets, For example if your customization folder is `assets/docs` any file placed on the folder is available in the url `{host path}/api/docs/{file path/name}`


#### Simple set sails.config.appPath variable

Read:
* [Environment-specific files](http://sailsjs.org/documentation/reference/application/sails-get-base-url)
* [sails get base url](http://sailsjs.org/documentation/concepts/configuration#?environmentspecific-files-config-env)

*Steps (e.g.):*
* In your `config/local.js` file add the value `swagger.basePath': "http://localhost:1337"`
* In your `config/env/heroku.js` file add the value `swagger.basePath: "http://myapp.herokuapp.com"`
* In your `config/env/development.js` file add the value `swagger.basePath: "http://dev.myapp.com"`
* In your `config/env/staging.js` file add the value `swagger.basePath: "http://stg.myapp.com"`
* In your `config/env/production.js` file add the value `swagger.basePath: "http://myapp.com"`
* Set the properly NODE_ENV variable on each environment that you configure


## Sails Integration

Create the `config/swagger.js` to look like:

```js
module.exports.swagger = {
    apiVersion: '1.0',
    swaggerVersion: '2.0',
    swaggerURL: '/api/docs',
    swaggerJSON: '/api-docs.json',
    basePath: process.env.HOST_NAME||'http://localhost:1337',
    info: {
      title: ' App API Documentation',
      description: ' API Swagger'
    },

    apis: [
        "Users.yml"
    ]
  }

```
## Generate api documentation in command-line
Add this code on .sailsrc file:

```json
{
  "modules": {
    "swagger": "@afidoss/sails-hook-swagger/generate"
  }
}
```

Next stape execute this command-line:

```sh
$ sails generate swagger
```
we will see :

![](https://github.com/afidosstar/sails-hook-swagger/raw/master/simples/picture-3.png)

you can also specify filename like: sails generate swagger my-api.yml

> Note: 
> * commande line can support yml and json output
> * you can also specify filename like: `sails generate swagger my-api.yml`


## Inject files for look and feel customization, a JS and CSS file

Place the personalization files in your selected folder, for example '/assets/docs'. Find below a example for each one of this files:

```js
// @Name: custom-swagger.js

// Swagger UI uses jQuery,
// so there is not problem with to use it here
$(document).ready(function() {

  // Change page title
  $("title").text("App Name");

  // Change logo link
  $("#logo").attr(
    'href',
    document.location.protocol + '//' + document.location.host
  );

  // Change brand text
  $(".logo__title").text("App name");

  // Change logo image
  // all files added to the folder with custom files
  // is public in /api/docs/{path to file}
  // also you can use the assets folder provided by sails
  // to store an image or point to an external file
  $(".logo__img").attr({
    alt: "App name",
    height: "30",
    width: "30",
    src: "my-logo.png"
  });

});
```

CSS file

```css
/* @Name: custom-swagger.css */

#custom-swagger .swagger-section #header {
  background-color: #2BA0D3;
}

#custom-swagger .swagger-section #explore,
#custom-swagger .swagger-section #auth_container .authorize__btn {
  background-color: #42BFeF;
}

#custom-swagger .swagger-section #api_selector input {
  height: 20px;
  padding: 4px 12px;
  background-color: #fff;
  background-image: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: inset 0 1px 1px rgba(0,0,0,.075);
  -webkit-transition: border-color ease-in-out .15s,box-shadow ease-in-out .15s;
  transition: border-color ease-in-out .15s,box-shadow ease-in-out .15s;
  color: #777;
  line-height: 1.4em;
}
```

#### Swagger-UI

Lift sails and navigate to the specified `swaggerURL` e.g.

```
http://localhost:1337/api/docs
```


## Read from YAML file

Example 'Users.yml'

```yml

paths:
  /login:
    post:
      summary: Login with username and password
      notes: Returns a user based on username
      responseClass: User
      nickname: login
      consumes:
        - text/html
      parameters:

      - name: username
        dataType: string
        paramType: query
        required: true
        description: Your username

      - name: password
        dataType: string
        paramType: query
        required: true
        description: Your password

definitions:
  User:
    properties:
      username:
        type: String
      password:
        type: String
```

[Swagger](http://swagger.io/) is a specification and complete framework
implementation for describing, producing, consuming, and visualizing RESTful web services.
View [demo](http://petstore.swagger.io/).


That&rsquo;s it!

# Credits

- [swagger-express](https://github.com/fliptoo/swagger-express),
- [sails-swagger](https://github.com/tjwebb/sails-swagger)
- [sails-swagr](https://github.com/qbanguy/sails-swagr)
- [swagger-ui](https://github.com/swagger-api/swagger-ui)
- [sails-hook-swagger](https://github.com/afidosstar/sails-hook-swagger)


## License

The [MIT](https://github.com/jasancheg/sails-custom-swagger-hook/blob/master/LICENSE) License, © [afidoss](https://github.com/afidosstar)


[npm-url]: https://npmjs.org/package/sails-hook-swagger
[npm-image]: https://badge.fury.io/gh/afidosstar%2Fsails-hook-swagger.svg
[daviddm-url]: https://david-dm.org/afidosstar/sails-hook-swagger.svg
[daviddm-image]: https://david-dm.org/afidosstar/sails-hook-swagger.svg
