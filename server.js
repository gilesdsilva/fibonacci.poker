var express = require('express');
var serialize = require('node-serialize');
var path = require('path');
var _ = require('underscore');
var app = express();
var fs = require('fs');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var usernames = {};
var storyName = '';
var storySummary = {};
var storyPointsHidden=true;
var game={};
var outputFileName = path.join(__dirname, 'output', 'test.json');

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1');

server.listen(app.get('port'), app.get('ip'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

//server.listen(process.env.PORT || 3000);

app.set('socketio', io);
app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.use('/public', express.static('public'));


app.get('/', function (req, res) {
  res.render('login');
});

app.get('/main', function (req, res) {
	console.log('Express server listening on port ' + outputFileName);
	readStories(outputFileName);
	res.render('main');
});

function readStories() {
	fs.exists(outputFileName, function(err,exists) {
		if(exists == true) {
			fs.readFile(outputFileName, function(err, data) {
				if (err) {
					console.log(err);
					throw err;
				}
				try {
					game = JSON.parse(data);
					console.log('successfully read from file ' + outputFileName);
				} catch (e) {
					game = {};
				}
			});
		}

	});


}

io.sockets.on('connection', function(socket) {
	socket.on('showstorypoints', function() {
		storyPointsHidden=!storyPointsHidden;
		updateStoryPoints();
	});

	function saveGame() {
		var objS = serialize.serialize(game);
		socket.emit('updatestorysummary',game,true);
		socket.broadcast.emit('updatestorysummary',game,false);
		fs.writeFile(outputFilename, objS, function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log("Game story saved to file" + outputFilename);
			}
		});
		for(user in usernames) {
			usernames[user] = '';
		}
	}

	socket.on('closestory',function(storyPoints) {
		if(storyName && storyPoints) {
			storySummary[storyName] = storyPoints;
			socket.broadcast.emit('resetonclosestory');
			clearStoryPoints();
			saveGame();
		}

	});

	function clearStoryPoints() {
		storyName = '';
		for(var username in usernames) {
			usernames[username] = '';
		}
		updateStoryPoints();
	}

	socket.on('deletestory', function(gameName,storyName) {
		delete  game[gameName][storyName];
		saveGame();
	});

	socket.on('updategamename',function(gameName) {
		if(!(gameName in game)) {
			game[gameName] = storySummary;
		}
	});

	socket.on('sendstoryname', function(data){
		storyName = data;
		io.sockets.emit('updatestoryname',storyName);
	});

	function userIsAdmin(username) {
		return username.indexOf("admin") > -1;
	}

	socket.on('adduser', function(username) {
		socket.username = username;
		usernames[username] =  '';
		socket.emit('connectionnotification', { connected: true, to_self: true, username: username });
		socket.broadcast.emit('connectionnotification', { connected: true, username: username });
		if(userIsAdmin(username)) {
			socket.emit("updateuserisadmin");
			clearStoryPoints();
			clearGame();
		}
		io.sockets.emit('updateusers', usernames);
		socket.emit('updatestorysummary',game, userIsAdmin(username));
		socket.emit('updatestoryname',storyName);
		updateStoryPoints();
	});

	function clearGame() {
		game={};
	}

	function updateStoryPoints() {
		if(storyPointsHidden) {
			io.sockets.emit('updatestorypointshidden',usernames);
			io.sockets.emit('updatefinalstorypoints','*');
		}
		else {
			var points = [];
			for ( var username in usernames) {
				var point = Number(usernames[username]);
                points.push(point);
			}
			io.sockets.emit('updatestorypointsvisible',usernames);
			io.sockets.emit('updatefinalstorypoints',find_mode(points));
		}


	}

	function find_mode(arr) {
		var mode = {};
		var max = 0, count = 0;

		arr.forEach(function (value) {
			{
				if (mode[value]) {
					mode[value]++;
				}
				else {
					mode[value] = 1;
				}

				if (count<mode[value]) {
					max = value;
					count = mode[value];
				} else if(count == mode[value]) {
					if(value> max) {
						max = value;
					}
				}
			}
		});
		return max;
	}

	socket.on('sendstorypoints',function(data) {
		usernames[socket.username] = data;
		updateStoryPoints();

	});

	socket.on('disconnect', function(){
		delete usernames[socket.username];
		io.sockets.emit('updateusers', usernames);
		updateStoryPoints();
		socket.broadcast.emit('connectionnotification', { username: socket.username });
	});
});
