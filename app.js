/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var mongo = require('mongodb').MongoClient;

var app = express();

var passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

var config = require('./config');
var players = require('./players');

// all environments
app.set('port', process.env.PORT || 31759);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('yoyodude'));
app.use(express.session());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/login', routes.login);
app.get('/dash', routes.dash)
app.get('/pick', routes.pick);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


// Passport Twitter
// OAuth login
var TWITTER_CONSUMER_KEY = config.TWITTER_CONSUMER_KEY;
var TWITTER_CONSUMER_SECRET = config.TWITTER_CONSUMER_SECRET;
var DB_HOSTNAME = config.DB_HOSTNAME;

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
 
passport.deserializeUser(function(obj, done) {
  mongo.connect(DB_HOSTNAME, function(err, db) {
    var collection = db.collection('user');
    collection.find({id:obj}).toArray(function(err, items) {
       done(null, items[0])
    });
  });  
});

passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: "http://127.0.0.1:" + app.get('port') + "/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    // NOTE: You'll probably want to associate the Twitter profile with a
    //       user record in your application's DB.    
    mongo.connect(DB_HOSTNAME, function(err, db) {
    if(!err) {
         
      var collection = db.collection('user');

      collection.find({id:profile.id}).toArray(function(err, items) {
          if(items.length == 0) {
            var this_user = {id: profile.id, username: profile.username, displayName: profile.displayName, team: []};
            if(profile.photos.length > 0) {
              this_user.photo = profile.photos[0]["value"];
            } 
            collection.insert(this_user,{w:1}, function(err, result) {});
          } else {
            var this_user = {username: profile.username, displayName: profile.displayName};
            if(profile.photos.length > 0) {
              this_user.photo = profile.photos[0]["value"];
            } 
            collection.update({id:profile.id}, {$set:this_user}, {w:1}, function(err, result) {});
          }
      });
      
    } else  {
      console.log("some problem with the db");
    }
});

    return done(null, this_user);
  }
));

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { successReturnToOrRedirect: '/afterlogin', failureRedirect: '/login' }));
