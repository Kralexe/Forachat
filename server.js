//Creating environment for our app
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
//Two arrays: one for users, one for socketIO connections
users = [];
connections = [];

//make server listen to specified by user port OR port 3000, write to console that all's okay
server.listen(process.env.PORT || 3000);
console.log('Server is running...');

//create a route to index.html file
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html')
});

//on connection we push newly created socket to connections array and output number 
//of socket connection to console
io.sockets.on('connection', function(socket){
	connections.push(socket);
	console.log('Connected: %s sockets connected', connections.length);

	//on disconnect we cut user that left chat out, update user names and update number of existing connections at the same time
	socket.on('disconnect', function(data) {
		users.splice(users.indexOf(socket.username), 1);
		updateUsernames();
		console.log(data);
		connections.splice(connections.indexOf(socket), 1);
		console.log('Disconnected: %s sockets connected', connections.length);
	});

	//on event 'send message' we emit data sent by user, his name and time of the day
	socket.on('send message', function(data){
		io.sockets.emit('new message', {msg:data, user: socket.username, hours:pad(new Date().getHours(), 2), minutes:pad(new Date().getMinutes(), 2)});
	});

	//when new user joined the caht his name is pushed to jquery variable username for displaying
	socket.on('new user', function(data, callback){
		callback(true);
		socket.username = data;
		users.push(socket.username);
		updateUsernames();
	});

	//self-evident function related to Jquery function in index.html
	function updateUsernames(){
		io.sockets.emit('get users', users);
	}

	//this function is required for padding new Date() methods with preceding zeros (just for pretty output)
	function pad (str, max) {
  		str = str.toString();
 		return str.length < max ? pad("0" + str, max) : str;
	}
});