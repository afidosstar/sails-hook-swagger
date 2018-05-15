var Sails = require('sails').Sails;
var chai = require('chai')
chai.should()
 describe('Custom ui tests ::', function() {

     // Var to hold a running sails app instance
     var sails;
   // parame
     let swagger = {
         ui: 'custom'
    };


     // Before running any tests, attempt to lift Sails
     before(function () {
         // Hook will timeout in 10 seconds
         //this.timeout(11000);
         sails = Sails();

         sails.lift({
            hooks: {
                // Load the hook
                "swagger": require('../'),
                // Skip grunt (unless your hook uses it)
                "grunt": false
          },
          swagger:{
            ui:'custom',
            uiPath: './assets/templates'
        },
          log: {level: "error"}
        },function (err) {
            if (err) return done(err);
            //return done();
        });
    });


     // After tests are complete, lower Sails
     after(function (done) {

         // Lower Sails (if it successfully lifted)
         if (sails) {
             return sails.lower(done);
         }
         // Otherwise just return
         return done();
     });

     it ('sails does not crash', function() {
        return true
    });

 });