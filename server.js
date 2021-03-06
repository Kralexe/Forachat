//Creating environment for our app
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
//Three arrays: two for users of different rooms, one for socketIO connections
users = [];
users1 = [];
connections = [];

app.use(express.static('public'))
//make server listen to specified by user port OR port 3000, write to console that all's okay
server.listen(process.env.PORT || 3000);
console.log('Server is running...');

//create routes to index.html file
app.get('/superprivatechat', function(req, res){
	res.sendFile(__dirname + '/index.html')
});

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index1.html')
});
//on connection we push newly created socket to connections array and output number 
//of socket connection to console
io.sockets.on('connection', function(socket){
	//create channels to two index html pages
	socket.on('channelfixer', function(mychannel){
		socket.join(mychannel);
	});

	//push existing socket connections to the end of array
	connections.push(socket);
	console.log('Connected: %s sockets connected to', connections.length);

	//on disconnect we cut user that left chat out, update user names and update number of existing connections at the same time
	socket.on('disconnect', function(data) {
		delete users[users.indexOf(socket.username)];
		delete users1[users1.indexOf(socket.username)];
		updateUsernames();
		updateUsernames1()
		console.log(users);
		console.log(users1);
		connections.splice(connections.indexOf(socket), 1);
		console.log('Disconnected: %s sockets connected', connections.length);
		//console.log(socket);
	});

	//on event 'send message' we print data sent by user, his name and time of the day. There's a built-in check if user entered some data or not, 
	//in second case no input will be printed. There's no alert window, because it might disconcern some users
	//Data is sent to different rooms
	socket.on('send message', function(data){
	if (data != ''){
		io.to(Object.values(socket.rooms)[1]).emit('new message', {msg:data, user: socket.username, hours:pad(new Date().getHours(), 2), minutes:pad(new Date().getMinutes(), 2)});};
	});

	//when new user joins, his name is pushed to jquery variable $username for displaying in scope of particular socket, if no name is entered in textfield then alert window
	//will pop up. If nickname (case-insensitive) already taken, then another alert window will pop up urging user to change his nickname of choice. So, for example, if somebody
	//already took username 'alex' then he won't be able to take username 'Alex' or '   aLex  '
	socket.on('new user', function(data, callback){
		let users_lower = users.map(item => item.toLowerCase().trim())
		if(data != '' && !(users_lower.includes(data.toLowerCase().trim())))
		{callback(true);
		socket.username = data;
		users.push(socket.username);
		updateUsernames();
		} else if (users_lower.includes(data.toLowerCase().trim())){
			alertAnotherUser();
		}
		else {
			alertUser();
		}
	});

	//users socket for public page
	socket.on('new user1', function(data, callback){
		let users_lower = users1.map(item => item.toLowerCase().trim())
		if(data != '' && !(users_lower.includes(data.toLowerCase().trim())))
		{callback(true);
		socket.username = data;
		users1.push(socket.username);
		updateUsernames1();
		} else if (users_lower.includes(data.toLowerCase().trim())){
			alertAnotherUser();
		}
		else {
			alertUser();
		}
	});

	//self-evident function related to Jquery function in index.html
	function updateUsernames(){
		io.to('superprivatechat').emit('get users', users);
	}

	function updateUsernames1(){
		io.to('public').emit('get users1', users1);
	}

	//emits alert window in index.html
	function alertAnotherUser() {
		//io.sockets.emit('alert user')
		socket.emit('alert another user');
	}

	//emits alert window in index.html
	function alertUser() {
		//io.sockets.emit('alert user')
		socket.emit('alert user');
	}

	//this function is required for padding new Date() methods with preceding zeros (just for pretty output)
	function pad (str, max) {
  		str = str.toString();
 		return str.length < max ? pad("0" + str, max) : str;
	}


});