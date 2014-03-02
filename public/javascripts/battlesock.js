var io = io.connect();
console.log("Socket connected")

$(document).ready(function() {

    var starttimer = false;

    io.emit('ready');

    console.log("Emitted Im ready");
    $('#banner').html('');
    $('#banner').css('left','40%');
    var clock = $('#banner').FlipClock(60, {
                    clockFace: 'Counter'
                });

    io.on('startgame', function(data){
        io.on('timer', function(data){
            if(!starttimer){
                starttimer = true;
            
                setTimeout(function() {
                    setInterval(function() {
                        if(clock.getTime.time != 0)
                            clock.decrement();
                    }, 1000);
                });
            }
        });

        io.on('newtweet', function(data){
            console.log(data.id+","+data.name);
            var count = $('.s' + data.id).html();
            count++;
            $('.s' + data.id).html(count);
        });

        io.on('gameover', function(data){
            post_match();
        });
    });
    function post_match() {
        var t1S = 0, t2S = 0;
        var t1p0 = $('#t1p0s').html();
        var t2p0 = $('#t2p0s').html();
        var t1p1 = $('#t1p1s').html();
        var t2p1 = $('#t2p1s').html();
        var t1p2 = $('#t1p2s').html();
        var t2p2 = $('#t2p2s').html();
        var t1p3 = $('#t1p3s').html();
        var t2p3 = $('#t2p3s').html();
        var t1p4 = $('#t1p4s').html();
        var t2p4 = $('#t2p4s').html();

        if(t1p0 > t2p0)
            t1S++;
        else if(t1p0 < t2p0)
            t2S++;
        
        if(t1p1 > t2p1)
            t1S++;
        else if(t1p1 < t2p1)
            t2S++;
        
        if(t1p2 > t2p2)
            t1S++;
        else if(t1p2 < t2p2)
            t2S++;
        
        if(t1p3 > t2p3)
            t1S++;
        else if(t1p3 < t2p3)
            t2S++;
        
        if(t1p4 > t2p4)
            t1S++;
        else if(t1p4 < t2p4)
            t2S++;
        
        var text = t1S + ' - ' + t2S;
        if(t1S < t2S)
            $('#banner').html('You Lost ' + text);
        else if(t1S > t2S)
            $('#banner').html('You Won ' + text);
        else
            $('#banner').html('You Drew ' + text);
    }
});
