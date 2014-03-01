var io = io.connect();
io.emit('ready');

io.on('startgame', function(data){
	io.on('timer', function(data){
		$("#banner").html(data.time);
		console.log("time remaining "+data.time);
	});
});