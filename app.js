/**
 * Module dependencies.
 */

var express = require('express.io');
var app = express();
app.http().io();
var routes = require('./routes');
var http = require('http');
var path = require('path');
var mongo = require('mongodb').MongoClient;

//var app = express().http().io();
var sock_routes = require('./sock_routes');
var passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

var config = require('./config');
var players = require('./players');

//Initialize player sockets
for(var i = 0; i < players.players.length; i++){
  players.players.linkRooms = [];
}

// all environments
app.set('port', process.env.PORT || 31759);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({secret: 'podavenna'}));
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
app.get('/dash', routes.dash);
app.get('/pick', routes.pick);
app.get('/afterlogin', ensureLoggedIn('/login'), routes.afterlogin);
app.get('/wait', ensureLoggedIn('/login'), routes.wait);
app.post('/teamSelect', ensureLoggedIn('/login'), routes.teamselect);
app.post('/battle', ensureLoggedIn('login'), function(req, res) {
  var this_room = rooms[+req.body.room];
  req.session.rno = +req.body.room;
  this_room.connsockets = [null,null];
  //var rno = req.session.roomid;
  if(req.body.player == '1') {    
    this_room.p1id = req.user.id;
    res.render('headtohead', {user: this_room.p1req.session.passport.user, opponent: this_room.p2req.session.passport.user});
  } else {
    this_room.p2id = req.user.id;
    res.render('headtohead', {user: this_room.p2req.session.passport.user, opponent: this_room.p1req.session.passport.user});
  }
});

app.listen(app.get('port'))
/*var eserver = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var iox = require('socket.io').listen(eserver);
*/
// Passport Twitter
// OAuth login
var TWITTER_CONSUMER_KEY = config.TWITTER_CONSUMER_KEY;
var TWITTER_CONSUMER_SECRET = config.TWITTER_CONSUMER_SECRET;
var DB_HOSTNAME = config.DB_HOSTNAME;

passport.serializeUser(function(user, done) {
  done(null, user);
});
 
passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: "http://127.0.0.1:" + app.get('port') + "/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    var this_user;
    // NOTE: You'll probably want to associate the Twitter profile with a
    //       user record in your application's DB.    
    mongo.connect(DB_HOSTNAME, function(err, db) {
      if(!err) {
           
        var collection = db.collection('user');

        collection.find({id:profile.id}).toArray(function(err, items) {
            if(items.length == 0) {
              this_user = {id: profile.id, username: profile.username, displayName: profile.displayName, 
                team: [], transfer: false, winStreak: 0, lastFive: []};
              if(profile.photos.length > 0) {
                this_user.photo = profile.photos[0]["value"];
              } 
              collection.insert(this_user,{w:1}, function(err, result) {});
              done(null, this_user)
            } else {
              this_user = items[0];
              this_user.username = profile.username;
              this_user.displayName = profile.displayName;            
              if(profile.photos.length > 0) {
                this_user.photo = profile.photos[0]["value"];
              } 
              collection.update({id:profile.id}, {$set:{username: this_user.username, displayName: this_user.displayName, photo: this_user.photo}}, {w:1}, function(err, result) {});         
              done(null, this_user)   
            }
        });
        
      } else  {
        console.log("some problem with the db");
      }
    });    
  }
));

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { successReturnToOrRedirect: '/afterlogin', failureRedirect: '/login' }));


// Sockets the new way

var userWaiting = null;
var rooms = []

app.io.route('imwaiting', function(req){
  //console.log('imwaiting');
  if(userWaiting != null && userWaiting.io.socket.disconnected == false) {
    console.log("starting....");
    var rno = rooms.length;
    //req.io.join('r'+rno);
    rooms.push({p1req: req, p2req: userWaiting,p1ready: false, p2ready: false, gameover:false});

    req.io.emit('joinroom', {roomno: rno, player: 1});
    userWaiting.io.emit('joinroom', {roomno: rno, player: 2});
    userWaiting = null;
  } else {
    //console.log('reqio');
    //console.log(req.session.passport.user);
    userWaiting = req;
    //console.log(playerWaiting);
  }  
});

function counter(data) {  
  //console.log(data.timer);
  if(data.timer == 0) {
    data.gameover = true;
  } else {
    data.timer--;
    data.broadcast('timer',{time: data.timer});
    setTimeout(function(){counter(data)},1000);
  }
}

app.io.route('ready', function(req) {
  console.log('imready');
  //console.log(req);
  var rno = req.session.rno;
  if(req.session.passport.user.id == rooms[rno].p1id) {
    rooms[rno].connsockets[0] = req.io;
    rooms[rno].p1ready = true;
  } else {
    rooms[rno].connsockets[1] = req.io;
    rooms[rno].broadcast = function(event, data){
      rooms[rno].connsockets[0].emit(event,data);
      rooms[rno].connsockets[1].emit(event,data);
    };
    rooms[rno].p2ready = true;
  }

  if(rooms[rno].p1ready && rooms[rno].p2ready){
    rooms[rno].broadcast('startgame');
    rooms[rno].timer = 60;
    rooms[rno].broadcast('timer',{time: rooms[rno].timer});
    setTimeout(function(){counter(rooms[rno]);},1000);
  }

});


//Socket.io
/*var io = require('socket.io').listen(eserver);
var playerWaiting = null;
var rooms = [];

io.sockets.on('connection', function(socket) {


    socket.on('wait', function(data) {      
      socket.twitter_id = data.twitter_id;
      if(playerWaiting != null && playerWaiting.socket.connected == true) {
        startGame(socket, playerWaiting); 
        playerWaiting = null;
      } else {
        playerWaiting = socket;
      }
    });

    socket.on('gameready', function(data) {
      socket.twitter_id = data.twitter_id;
      var this_room =  rooms[data.room];

      if(data.player == 1 && data.twitter_id == this_room.p1tid) {
        this_room.p1ready = true;
        this_room.p1sock = socket;        
      } else if (data.twitter_id == this_room.p2tid) {
        this_room.p2ready = true;
        this_room.p2sock = socket;        
      }

      if (this_room.p1ready && this_room.p2ready) {
        getPlayers(this_room);
      }
          
    });    

});

function startGame(p1sock, p2sock) {
  var current_room = {p1tid: p1sock.twitter_id, p2tid: p2sock.twitter_id, id:rooms.length, 
    p1ready: false, p2ready: false, gameover:false};
  rooms.push(current_room);

  p1sock.emit('battle',{room:current_room.id, player: 1});
  p2sock.emit('battle',{room:current_room.id, player: 2});

}

function getPlayers(this_room) {
  var p1sock = this_room.p1sock;
  var p2sock = this_room.p2sock;
   mongo.connect(DB_HOSTNAME, function(err, db) {
      if(!err) {           
        var collection = db.collection('user');
        collection.find({id:p1sock.twitter_id}).toArray(function(err, items) {
          p1sock.players = items[0].players;
          collection.find({id:p2sock.twitter_id}).toArray(function(err, items) {
            p2sock.players = items[0].players;
            registerRoom(this_room);
          });
        });
      }
    });
}

function registerRoom(this_room) {
  this_room.p1sock.emit('startgame');
  this_room.p2sock.emit('startgame');

  setInterval(function(){
    this_room.gameover = true; 
  }, 60000);

  var roomPlayers = this_room.p1sock.players.slice(0, 5).concat(this_room.p2sock.players.slice(0, 5));
  roomPlayers = roomPlayers.filter(function(value, index, self){return self.indexOf(value) === index});
  for (var this_player in roomPlayers) {
    players.players[this_player].linkRooms.push(this_room); 
  }
}*/