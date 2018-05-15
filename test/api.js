

var Sails = require('sails').Sails;
var models = require('./../fixtures/models');
var swagger = require('./../fixtures/swagger');
var chai = require('chai')
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
chai.should()
expect = chai.expect

describe("Check api response",function(){
    var sails = null;
    var app =  null;
    this.timeout(110000);
    var request = function(){return chai.request(app)}
    before(function(done){
        
        Sails().lift({
            paths:{
                "models": "fixtures/models/"
            },
            models:{
                migrate: 'drop',
                attributes: {
                    createdAt: { type: 'number', autoCreatedAt: true, },
                    updatedAt: { type: 'number', autoUpdatedAt: true, },
                    
                    id: { type: 'string', columnName: '_id',required: true },
                    deletedAt: { type: 'string', columnName: 'datetime' },
                  },
                  dataEncryptionKeys: {
                    default: 'UK5JxqnWqKbrlM8c8G6TbZtTEhROhLMo57n43mS8Fw8='
                  },
            },
            hooks:{
                "swagger": require('../'),
                grunt: false,
                orm: require('sails-hook-orm')
            },
            log: {level: "silent"},
            swagger
        },function(err,_sails){
            if(err)return done(err);
            sails = _sails;
            app = sails.hooks.http.app
            done()
        })

    })

    after(function(done){
        if(sails){
           return sails.lower(done);
        }
        done()
    })




    it('#should have /api-docs.json',function(done){
        request().get('/api-docs.json')
        .end(function(err,resp){
            if(err) return done(err);
            expect(resp).to.have.status(200);
            done()
        })
    })
    
    it('#should request /api-docs.json and get json response',function(done){
        request().get('/api-docs.json')
        .end(function(err,resp){
            if(err) return done(err);
            expect(resp).to.have.status(200);
            expect(resp).to.be.json;
            done()
        })
    })



    it('#should request /api-docs.json and should have paths and definitions',function(done){
        request().get('/api-docs.json')
        .end(function(err,resp){
            if(err) return done(err);
            expect(resp.body).to.have.property('paths')
            expect(resp.body).to.have.property('definitions')
            done()
        })
    })




    it('#should have User in definitions',function(done){
        request().get('/api-docs.json')
        .end(function(err,resp){
            if(err) return done(err);
            expect(resp).to.have.status(200)
            expect(resp.body).to.have.property('definitions')
            expect(resp.body.definitions).to.have.property('User');
            done()
        })
    })
    it('#should have /user in paths',function(done){
        request().get('/api-docs.json')
        .end(function(err,resp){
            if(err) return done(err);
            expect(resp).to.have.status(200)
            expect(resp.body).to.have.property('definitions')
            expect(resp.body.paths).to.have.property('/user');
            done()
        })
    })





    it('#should contains url of json docs', function(done){
        request().get('/api/docs').end(function(err,resp){
            if(err) return done(err);
            expect(resp).to.have.status(200)
            expect(resp).to.be.html;
            done()
        })
    })

    it('#should containe swagger json url', function(){
        request().get('/api/docs').end(function(err,resp){
            if(err) throw err
            expect(resp).to.have.status(200)
            expect(resp).to.be.html;
            expect(resp.text).to.be.contain(swagger.swaggerJSON);
            
        })
    })

})