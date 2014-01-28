'use strict';
var utils = require('../utils'),
    Observable = utils.Observable,
    UserModel;

module.exports = Observable.extend({
  constructor: function UserHandler(sandbox) {
    Observable.apply(this, arguments);

    this.models = sandbox.models;
    UserModel = sandbox.models.user;
    this.mailer = sandbox.mailer;
    this.helpers = sandbox.helpers;

  },
  
  validateRegister: function (req, res, next) {
    var username  = req.param('username');
    var email     = req.param('email');
    var key       = req.param('key');

    if (!username || !key || !email) {
      // Not enough details
    }

    var user = {
      name: username,
      email: email,
      key: key
    };

    UserModel.load(username, function (err, result) {
      if (result) {
        return;
        // User exists no signup sorry
      }

      UserModel.create(user, function (err) {
        if (err) {
          return next(err);
        }
        req.validatedUser = user;
        next();
      });

    });                 

    
  },

  validateLogin: function (req, res, next) {
    var username  = req.param('username');
    var key       = req.param('key');


    UserModel.load(username, function (err, user) {

      var validationComplete = function(err, validated){
        if (validated) {
          req.validatedUser = user;
        }
        next(err);
      };

      if (err || !user) {
        next(err);
      }

      var JSBin2User = !user.created.getTime();
      var validateKey = UserModel['valid' + (JSBin2User ? 'OldKey' : '')]; 


      if (!JSBin2User) {
        validateKey(key, user.key, validationComplete);
      } else { 
      
        validateKey(key, user.key, function(err, valid) {

          validationComplete = validationComplete.bind(null, err , valid);

          if (err || !valid) {
            return validationComplete();
          } 
          
          UserModel.upgradeKey(user.name, key, validationComplete);

        });

      }

    });
        
  }

});