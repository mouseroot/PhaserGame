var app  = require("express")();
var http = require("http").Server(app);
var io   = require("socket.io")(http);

//Webserver routes
app.get("/", function(req, res){
	res.sendFile(__dirname + "/index.html");
});

app.get("/build.js", function(req, res){
	res.sendFile(__dirname + "/build.js");
});

app.get("/phaser.min.js", function(req, res){
	res.sendFile(__dirname + "/phaser.min.js");
});

app.get("/spritesheet.png", function(req, res){
	res.sendFile(__dirname + "/spritesheet.png");
});

app.get("/spritesheet2.png", function(req, res){
	res.sendFile(__dirname + "/spritesheet2.png");
});

app.get("/spritesheet3.png", function(req, res){
	res.sendFile(__dirname + "/spritesheet3.png");
});

var players = [];

function PlayerPrefab(x,y) {
	var x,y,id,username,skin;

	return {
		username: username,
		skin: skin,
		x: x,
		y: y,
		id: id,
		chat: []
	};
}


function onConnection(socket) {
	socket.on("disconnect",onDisconnect);
	socket.on("new",onNew);
	socket.on("move",onMove);
	socket.on("kill",onKill);
	socket.on("list",function(data){
		this.emit("list",{
			players: players
		});		
	});
	socket.on("msg",function(data){
		var msgPlayer = getPlayerById(this.id);
		msgPlayer.chat.push(data.text);
		console.log(msgPlayer.username,":",data.text);
		this.broadcast.emit("msg",{
			id: this.id,
			text: data.text
		});
	});
}

function onDisconnect(socket) {
	var deadPlayer = getPlayerById(this.id);
	console.log("Client",deadPlayer.username,"disconnected",players.length,"left");
	players.splice(players.indexOf(deadPlayer),1);
	this.broadcast.emit("kill",{
		id: this.id
	});
}

function getPlayerById(id) {
	for(var i=0;i < players.length;i++) {
		if(players[i].id == id) {
			return players[i];
		}
	}
	return false;
}

function checkUsername(username) {
	for(var i in players) {
		var player = players[i];
		if(player.username === username) {
			return false;
		}

	}
	return true;
}

function onNew(data) {
	//check if this username exists
	if(checkUsername(data.username)) {
		var newPlayer = new PlayerPrefab(data.x, data.y);
		newPlayer.id = this.id;
		newPlayer.username = data.username;
		newPlayer.skin = data.skin;
		players.push(newPlayer);
		/*this.broadcast.emit("list",{
			players: players
		});*/
		this.emit("list",{
			players: players
		});	
		console.log("client",newPlayer.username,"connected");
	}
	else {
		this.emit("used_username",null);
		this.disconnect();
		onKill(null);
	}
}

function onKill(data) {
	var deadPlayer = getPlayerById(this.id);
	players.splice(players.indexOf(deadPlayer),1);
	this.broadcast.emit("kill",{id: this.id});
	console.log("client",deadPlayer.username,"killed");
}

function onMove(data) {
	var movePlayer = getPlayerById(this.id);
	movePlayer.x = data.x;
	movePlayer.y = data.y;
	movePlayer.direction = data.direction;
	this.broadcast.emit("move",{
		id: movePlayer.id, 
		x: movePlayer.x, 
		y: movePlayer.y,
		direction: movePlayer.direction
	});
}


//Websocket
io.on("connection",onConnection);

http.listen(8000, function(){
	console.log("Listening on 8000");
});
