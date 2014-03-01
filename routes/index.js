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

exports.afterlogin = function(req, res){
  console.log(req.user);
  if (req.user.team.length == 0)
  	res.redirect('/pick');
  else
  	res.redirect('/dash');
};

exports.dash = function(req, res){

};

exports.wait = function(req, res){
	if(req.user.team.length == 0) {
		res.redirect('/pick');
	} else {
		res.render('wait')
	}
};
