//Demo Build.js

var game = new Phaser.Game(800,600,Phaser.CANVAS,"game-window",{create: create, update: update, preload: preload});

var player = null,
	remotePlayers = null,
	cursors,
	socket,
	txtUsername = document.getElementById("username"),
	txtChat = document.getElementById("msg"),
	btnConnect = document.getElementById("connect"),
	username = null,
	id,
	hasConnected = false,
	connectedText,
	numPlayersText,
	usedUsername = false,
	newPlayer = null,
	selectedSkin,
	message,
	playername;

function onConnect() {
	console.log("Connecting as",username);
	console.log("Connected to server");
	socket.emit("new",{
		x: player.x, 
		y: player.y,
		username: username,
		skin: selectedSkin
	});
	socket.emit("list",null);
	player.id = this.id;
}

function onDisconnect() {
	console.log("Connection was lost");
	socket.disconnect();
	//player.destroy();
	remotePlayers.destroy(true);
	if(!usedUsername) {
		connectedText.text = "Connection was lost";
		connectedText.fill = "#cc1111";
		numPlayersText.text = "Single player mode";
		numPlayersText.fill = "#666";
	}
	else {
		connectedText.text = "username " + username + " in use";
		connectedText.fill = "#cc1111";
		numPlayersText.text = "Single player mode";
		numPlayersText.fill = "#666";
	}
}

function onList(data) {
	remotePlayers.destroy(true);
	remotePlayers = game.add.group();
	newPlayer = null;
	for(var i=0;i < data.players.length;i++) {
		var player = data.players[i];
	if(this.id !== player.id) {
		if(player.skin == 1) {
			newPlayer = game.add.sprite(player.x, player.y, "player_red");
		}

		if(player.skin == 2) {
			newPlayer = game.add.sprite(player.x, player.y, "player_green");
		}

		if(player.skin == 3) {
			newPlayer = game.add.sprite(player.x, player.y, "player_blue");
		}
		newPlayer.name = game.add.text(newPlayer.x, newPlayer.y,player.username,{fill:"#c11",font: "10pt Consolas"});
		newPlayer.name.anchor.set(0.5);
		newPlayer.scale.set(0.7);
		newPlayer.anchor.set(0.5);
		newPlayer.alpha = 0.4;
		newPlayer.id = player.id;
		newPlayer.username = player.username;
		game.physics.arcade.enable(newPlayer);
		newPlayer.body.collideWorldBounds = true;
		newPlayer.animations.add("down",[0,1,2,3],7,true);
		newPlayer.animations.add("left",[4,5,6,7],7,true);
		newPlayer.animations.add("right",[8,9,10,11],7,true);
		newPlayer.animations.add("up",[12,13,14,15],7,true);
		remotePlayers.add(newPlayer.name);
		remotePlayers.add(newPlayer);
	}
	}
	numPlayersText.text = remotePlayers.children.length + " players online";
	numPlayersText.fill = "#11cc11";
}

function onMove(data) {
	var movePlayer = getPlayerById(data.id);
	if(!movePlayer) {
		return false;
	}
	if(data.direction == "none") {
		movePlayer.animations.stop();
		movePlayer.animations.frame = 2;
	}
	else {
		movePlayer.animations.play(data.direction);
	}
	movePlayer.x = data.x;
	movePlayer.y = data.y;
	movePlayer.name.position.set(movePlayer.x, movePlayer.y - 22);
}

function onKill(data) {
	var deadPlayer = getPlayerById(this.id);
	if(!deadPlayer) {
		return;
	}
	deadPlayer.destroy();
	remotePlayers.splice(remotePlayers.indexOf(deadPlayer),1);
}

function onUsedUsername(data) {
	usedUsername = true;
}

function onMsg(data) {
	message.text = data.text;
	message.anchor.set(0.5);
	var msgPlayer = getPlayerById(data.id);
	console.log(msgPlayer);
	message.position.set(msgPlayer.x, msgPlayer.y - 10);
	game.add.existing(message);
	var twn = game.add.tween(message).to({ alpha: 0}, 2000,Phaser.Easing.Linear.None, true,0, 0, false);
		twn.onComplete.add(function(obj, tween){
			tween.stop();
			//obj.destroy();
		}, this);
}

function connect() {
	username = txtUsername.value;
	playername.text = username;
	txtUsername.setAttribute("disabled","disabled");
	if(username !==  '') {
		socket = io.connect({
			port: 8000,
			transports: ["websocket"]
		});
		socket.on("connect",onConnect);
		socket.on("disconnect",onDisconnect);
		//socket.on("new",onNew);
		socket.on("move",onMove);
		socket.on("kill",onKill);
		socket.on("list",onList);
		socket.on("used_username",onUsedUsername);
		socket.on("msg",onMsg);
		hasConnected = true;
		connectedText.text = "Connected as " + username;
		connectedText.fill = "#11cc11";
		numPlayersText.text = "Asking server for player list...";
		numPlayersText.fill = "#cccc11";
		usedUsername = false;
	}
	else {
		connectedText.text = "No username provided!";
		connectedText.fill = "#cc1111";
	}
}

function getPlayerById(id) {
	for(var i=0;i < remotePlayers.children.length;i++) {
		if(remotePlayers.children[i].id == id) {
			return remotePlayers.children[i];
		}
	}
	return false;
}

function createPlayer(i) {
	if(i == 1)
		player = game.add.sprite(game.world.randomX,game.world.randomY, "player_red");

	if(i == 2)
		player = game.add.sprite(game.world.randomX,game.world.randomY, "player_green");

	if(i == 3)
		player = game.add.sprite(game.world.randomX, game.world.randomY, "player_blue");

	player.skin = i;
	
	//player.id = id;
	game.physics.arcade.enable(player);
	player.body.collideWorldBounds = true;
	player.scale.set(0.7);
	player.anchor.set(0.5);
	player.animations.add("down",[0,1,2,3],7,true);
    player.animations.add("left",[4,5,6,7],7,true);
    player.animations.add("right",[8,9,10,11],7,true);
    player.animations.add("up",[12,13,14,15],7,true);
    game.add.existing(playername);
	game.add.existing(player);
}


function preload() {
	game.load.spritesheet("player_red","spritesheet.png",32,41);
	game.load.spritesheet("player_green","spritesheet2.png",32,41);
	game.load.spritesheet("player_blue","spritesheet3.png",32,41);
}

function create() {
	this.game.stage.disableVisibilityChange = true;
	game.physics.startSystem(Phaser.Physics.ARCADE);
	cursors = game.input.keyboard.createCursorKeys();
	remotePlayers = game.add.group();
	message = game.make.text(0,0,"",{fill:"#c11",font: "13pt Consolas"});
	playername = game.make.text(0,0,"",{fill:"#1c1", font: "10pt Consolas"});
	playername.anchor.set(0.5);
	remotePlayers.enableBody = true;

	//connect();
	game.time.events.loop(Phaser.Timer.SECOND,function(){
		if(hasConnected) {
			socket.emit("list",null);
		}
	}, this);
	connectedText = game.add.text(20,10,"Not Connected",{fill:"#cc1111", font: "15px Consolas"});
	numPlayersText = game.add.text(20, 25, "Single player mode",{fill:"#666", font: "15px Consolas"});
	selectedSkin = game.rnd.between(1,3);
	createPlayer(selectedSkin);
}

function update() {
	playername.text = txtUsername.value;
	playername.position.set(player.x, player.y - 22);

	if(player != null) {	

		if(!cursors.left.isDown && !cursors.right.isDown && !cursors.up.isDown && !cursors.down.isDown) {
			player.animations.stop();
			player.frame = 2;
			if(hasConnected) {
				socket.emit("move",{x: player.x, y: player.y, direction: "none"});
			}
		}

		if(cursors.left.isDown) {
			player.x -= 2;
			player.animations.play("left");
			if(hasConnected) {
				socket.emit("move",{x: player.x, y: player.y,direction: "left"});
			}
		}
		else if(cursors.right.isDown) {
			player.x += 2;
			player.animations.play("right");
			if(hasConnected) {
				socket.emit("move",{x: player.x, y: player.y,direction: "right"});
			}
		}
		if(cursors.up.isDown) {
			player.y -= 2;
			player.animations.play("up");
			if(hasConnected) {
				socket.emit("move",{x: player.x, y: player.y, direction: "up"});
			}
		}
		else if(cursors.down.isDown) {
			player.y += 2;
			player.animations.play("down");
			if(hasConnected) {
				socket.emit("move",{x: player.x, y: player.y, direction: "down"});
			}
		}
	}
}

//Handle the pesky reload
window.onbeforeunload = function(e) {
	if(hasConnected) {
		socket.emit("kill",{id: this.id});
		player.destroy();
		remotePlayers.destroy(true);
		return "[!!!!] This will drop your connection [!!!!]";
	}
}

//Handle connect button click
btnConnect.onclick = function(e) {
	connect();	
};

txtChat.onkeydown = function(e) {
	if(e.keyCode == 13) {
		var msg = txtChat.value;
		socket.emit("msg",{
			text: msg
		});
	}
}
