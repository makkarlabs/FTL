
/*
 * GET home page.
 */
var players = require('../players');

exports.index = function(req, res){
  res.render('index', { title: 'Fantasy Tweet League' });
};

exports.login = function(req, res){
  res.render('login', { title: 'Fantasy Tweet League | Login with Twitter' });
};

exports.pick = function(req, res){
  res.render('pick', {title: 'Fantasy Tweet League | Choose your Players', players: players.players});
};

exports.dash = function(req, res){
  res.render('dash', {title: 'Fantasy Tweet League| Dashboard', user: req.user});
};
