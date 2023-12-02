const express = require("express");
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const mainServer = http.createServer(app);
const io = socketIo(mainServer);



//this HTML is just for testing the sockets
// Serve the HTML file at /socket
app.get('/socket', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


// Serve Socket.IO library using express.static
app.use('/socket.io', express.static(path.join(__dirname, 'node_modules/socket.io-client/dist')));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle incoming messages
  socket.on('chat message', (msg) => {
    console.log(`Message from user: ${msg}`);
    io.emit('chat message', msg); // Broadcast the message to all connected clients
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});



// Main Express server
app.use(express.json());
const routes = require('./routes/routes').router
app.use(routes);

const teste = require('./routes/routes').teste;
console.log("teste -> " + teste);

// Function to handle unexpected errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

// Function to handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

// Check if the main server is online
app.route("/").get((requirement, response) => {
  response.send("The main server is online");
  console.log("The main server is online");
});

// Start the main server on port 3000
const PORT_MAIN = 3000;
mainServer.listen(PORT_MAIN, () => {
  console.log(`Main server is running on http://localhost:${PORT_MAIN}`);
});



// Start the Socket.IO server on port 3500
const PORT_SOCKETIO = 3500;
io.listen(PORT_SOCKETIO);
console.log(`Socket.IO server is running on http://localhost:${PORT_SOCKETIO}`);

