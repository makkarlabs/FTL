/*
 * GET home page.
 */
var config = require('../config');
var mongo = require('mongodb').MongoClient;

var players = require('../players');
var updateUser = require('../app');

exports.index = function(req, res){
  res.render('login', { title: 'Fantasy Tweet League | Login with Twitter' });
};

exports.login = function(req, res){
  res.render('login', { title: 'Fantasy Tweet League | Login with Twitter' });
};

exports.pick = function(req, res){
  res.render('pick', {title: 'Fantasy Tweet League | Choose your Players', players: players.players});
};

exports.afterlogin = function(req, res){
  console.log(req.user);
  if (req.user.team.length == 0)
  	res.redirect('/pick');
  else
  	res.redirect('/dash');
};

exports.dash = function(req, res){
    res.render('dash', {title: 'Fantasy Tweet League | My Team', user: req.user});
};

exports.wait = function(req, res){
	if(req.user.team.length == 0) {
		res.redirect('/pick');
	} else {
		res.render('wait');
	}
};

exports.teamselect = function(req, res){	
	if(req.user.team.length == 0) {
		if(req.body.players.length == 8) {
			var newteam = [];
			for(var i in req.body.players){
				newteam.push(players.players[+req.body.players[i] - 1]);
			}			
			req.user.team = newteam;
			mongo.connect(config.DB_HOSTNAME, function(err, db) {
		      if(!err) {		           
			        var collection = db.collection('user');
			        collection.find({id:req.user.id}).toArray(function(err, items) { 			        	
			        	var this_user = items[0];
			        	this_user.team = req.user.team;
			        	console.log(this_user);
			        	collection.update({id:req.user.id}, {$set:{team: this_user.team}}, {w:1}, function(err, result) {});
			        });
		    	}
			});
		}
		res.redirect('/dash')
	} else {
		res.redirect('/dash');
	}
}

exports.leaderboard = function(req, res){
    mongo.connect(config.DB_HOSTNAME, function(err, db) {
        if(!err) {
            var collection = db.collection('user');
            collection.find().sort({winStreak: -1}).limit(10).toArray(function(err, items) {
                console.log(items);
                res.render('leaderboard', {items: items});
            });
        }
        else {
            console.log("mongo error");
        }
    });
}

exports.choosesquad = function(req, res){    
    if(req.user.team.length == 8) {
        if(req.body.players.length == 8) {
            var newteam = [];
            for(var i in req.body.players){
                newteam.push(players.players[+req.body.players[i] - 1]);
            }           
            req.user.team = newteam;
            mongo.connect(config.DB_HOSTNAME, function(err, db) {
              if(!err) {                   
                    var collection = db.collection('user');
                    collection.find({id:req.user.id}).toArray(function(err, items) {                        
                        var this_user = items[0];
                        this_user.team = req.user.team;
                        console.log(this_user);
                        collection.update({id:req.user.id}, {$set:{team: this_user.team}}, {w:1}, function(err, result) {});
                    });
                }
            });
        }
        res.redirect('/wait')
    } else {
        res.redirect('/wait');
    }
}