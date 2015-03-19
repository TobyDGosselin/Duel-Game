/**
 * Created by toby on 2/22/15.
 */
var io = require('socket.io')({
    transports: ['websocket']
});
//var Enum = require('enum');
io.attach(3000);

//var playerState = new Enum(['idle','jammed','fired','killed']);
//var gameState = new Enum(['inactive', 'active','over']);
//Will implement enums in the future. Currently using ints
//player state ints(0:idle,1:fired,2:jammed,3:dead)
//game state ints(0:inactive,1:active,:2,over)

var games = {};
var players = {};
var channels={};


function playGame(data){
    //Choose random  time in future to enable draw
    channels[data.channel].gameState=1;
    var delay = Math.random() * 30000;
    console.log("beginning first game loop. Draw will occur in "+Math.max(delay,25000));
    var gameLoop = function(){
        clearInterval(loop);
        if(    channels[data.channel].gameState===undefined)
        {
            console.log('game has been deleted. Ending loop');
            return;
        }
        else {
            if (channels[data.channel].gameState=== 1) {
                io.to(data.channel).emit('draw');
                channels[data.channel].drawActive = true;
                console.log('draw state entered');
                delay = Math.random() * 30000;
                //emit draw event
                setTimeout(function () {
                    io.to(data.channel).emit('endDraw');
                    channels[data.channel].drawActive = false;
                    console.log('draw state ended');
                }, Math.min(3000, delay - 500));
                console.log("beginning new game loop. Draw will occur in " + delay);
                loop = setInterval(gameLoop, Math.max(delay, 10000));
            }
        }
    };
    var loop = setInterval(gameLoop, Math.max(delay,15000));
}

console.log('server started');
io.on('connection', function(socket){
    function getCurrentState(){
        //return states of players and game as JSON object
	if(games[playerCode].player2state === undefined)
		games[playerCode].player2state = 0;
        return {player1state: games[playerCode].player1state, player2state: games[playerCode].player2state, gameState: games[playerCode].gameState}
    }
    console.log('a user connected');
    var playerCode = '----';
    socket.on('disconnect', function(){
        console.log('- user disconnected');
        if(players.hasOwnProperty(playerCode)){
            console.log('- deleted ' + players[playerCode]);
            delete players[playerCode];
        }
        if(games.hasOwnProperty(playerCode)){
            console.log('- deleted ' + games[playerCode].channel);
            // emit a disconnect to all other connected clients in the room
            io.sockets.in(games[playerCode].channel).emit('playerDisconnected');
        }
    });
    socket.on('requestPlayerCode', function() {
        var code;
        do {
            var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            var randomString = '';
            for (var i = 0; i < 4; i++) {
                var randomPoz = Math.floor(Math.random() * charSet.length);
                randomString += charSet.substring(randomPoz,randomPoz+1);
            }
            code = randomString;
        } while(players.hasOwnProperty(code));
        playerCode = code;
        players[playerCode]={};
        players[playerCode].id=socket.id;
        players[playerCode].isBusy = false;
        socket.emit('playerCodeCreated', {code:playerCode})
    });
    socket.on('challenge', function(data) {
        var code = data.code;
        if (players.hasOwnProperty(data.code)) {
            console.log("code is valid");
            if (players[data.code].isBusy === false) {
                io.to(players[data.code].id).emit('challengePosted',{id:data.challengerId});
                //Set both players as currently busy until challenge is accepted or declined
                players[playerCode].isBusy = true;
                players[data.code].isBusy=true;
                //Create a new game and add it to the games list
                //generate unique channel code
                do
                {
                    var channelCode = Math.random().toString(36).slice(2).substring(0,4).toUpperCase();
                } while(channels.hasOwnProperty(channelCode));
                var game=
                {
                    channel:channelCode,
                    gameState: 0,
                    drawActive: false,
                    player1:players[playerCode],
                    player2:null,
                    player1state: 0,
                    player2State: 0
                };
                socket.join(game.channel);
                games[playerCode] = game;
                channels[channelCode]=game;
            }
            else {
                socket.emit('challengedIsBusy');
            }
        }
        else{
            console.log("Code is invalid");
            socket.emit('invalidCode');
        }
    });
    socket.on('playerDisconnected', function(){
        //last player in game deletes game
	console.log(games[playerCode]);
        socket.leave(games[playerCode].channel);
        players[playerCode].isBusy = false;
        delete games[playerCode];
        console.log('deleted game  ' +games[playerCode]);
        console.log(games);
    });
    socket.on('cancelChallenge', function(data){
        //Delete game object and allow challenges for both players
        socket.leave(games[playerCode].channel);
        delete games[playerCode];
        players[data.code].isBusy = false;
        players[playerCode].isBusy = false;
        io.to(players[data.code].id).emit("challengeCanceled");
    });
    socket.on('rejectChallenge', function(data){
        //Delete game object and allow challenges for both players
        delete games[data.challengerId];
        players[data.challengerId].isBusy = false;
        players[playerCode].isBusy = false;
        io.to(players[data.challengerId].id).emit("challengeRejected");
    });
    socket.on('acceptChallenge', function(data){
        socket.join(games[data.challengerId].channel);
        games[playerCode] = games[data.challengerId];
        games[playerCode].player2=players[playerCode];
        socket.to(games[playerCode].player1.id).emit("challengeAccepted");
        setTimeout(function(){
		if(games[playerCode] !==undefined){
                console.log('game is beginning');
                console.log(games[playerCode]);
                io.to(games[playerCode].channel).emit('beginGame');
                console.log(getCurrentState());
                playGame({channel: games[playerCode].channel});
           	}
		}
            ,3000);
    });
    socket.on('processInput', function(){
        if(games[playerCode].gameState ===1){
            var isPlayer1 = (games[playerCode].player1.id === socket.id);
            //handle gun jams
            if(!games[playerCode].drawActive){
                //set player state
                if(isPlayer1){
                    games[playerCode].player1state=2;
                }
                else{
                    games[playerCode].player2state=2;
                }
                //set update states to be sent to clients
                //send current states to game
                io.to(games[playerCode].channel).emit('gameUpdate',getCurrentState());
                console.log(playerCode + 'is jammed');
                setTimeout(function(){
                    if(games[playerCode].gameState === 1) {
                        if (isPlayer1) {
                            games[playerCode].player1state = 0;
                        }
                        else {
                            games[playerCode].player2state = 0;
                        }
                        io.to(games[playerCode].channel).emit('gameUpdate',getCurrentState());
                        console.log(playerCode + 'is no longer jammed');
                    }
                },5000);
            }
            //handle player winning
            else{
                games[playerCode].gameState=2;
                if(isPlayer1){
                    console.log('player 1 wins!');
                    games[playerCode].player1state=1;
                    games[playerCode].player2state=3;
                }
                else{
                    console.log('player 2 wins!');
                    games[playerCode].player1state=3;
                    games[playerCode].player2state=1;
                }
                io.to(games[playerCode].channel).emit('gameUpdate',getCurrentState());
            }
        }
    });
});
