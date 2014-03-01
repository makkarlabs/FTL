var io = io.connect();
io.emit('imwaiting');

io.on('joinroom', function(data){
	$('#hidden_form').html('<form action="/battle" name="roomform" method="post" style="display:none;">\
		<input type="text" name="room" value="'+data.roomno+'" />\
		<input type="text" name="player" value="'+data.player+'" />\
		</form>');

    document.forms['roomform'].submit();
});