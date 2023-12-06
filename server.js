const express = require("express");
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { insertMessage } = require("./Database/queries");
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./configPar');

const app = express();
const mainServer = http.createServer(app);

// Serve the HTML file at /socket
app.get('/socket', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Main Express server
app.use(express.json());
const routes = require('./routes/routes').router;
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

// Setup WebSocket server on the same server
const wss = new WebSocket.Server({ server: mainServer, clientTracking: true });

// Mapping of user IDs to WebSocket connections
const userSockets = new Map();

// Handle WebSocket connections
wss.on('connection', (webSocket) => {
  console.log('A user connected');

  // Handle user registration with an ID
  webSocket.on('message', async (data) => {
    console.log(JSON.parse(data));
    
    const { type, token, userId, senderId, recipientId, content } = JSON.parse(data);

    if (type === 'register') {
      if (!token) {
        console.log('socket connection attempted without a token');
        webSocket.close();
        return;
      }

      //this allows me to use the html to test without a token, sending the id directly
      if(token.length > 3) {

        jwt.verify(token, jwtSecret, (err, decoded) => {
          if (err) {
            webSocket.close();
            return;
          }

          const userId = decoded.id;

          console.log(`User registered: ${userId}`);
          userSockets.set(userId.toString(), webSocket);
        });
      } else {
        const userId = token;
        console.log(`User registered: ${userId}`);
        userSockets.set(userId.toString(), webSocket);
      }

    } else if (type === 'private message') {
      console.log(`Message from ${senderId} to ${recipientId}: ${content}`);

      // Persist the message to the database
      const idMessage = await insertMessage(senderId, recipientId, content);

      // Retrieve the target user's WebSocket and send the message
      const targetSocket = userSockets.get(recipientId);
      if (targetSocket) {
        console.log("sending message ", content, " to ", recipientId);
        const privateMessage = { type: 'private message', senderId: senderId, content };
        targetSocket.send(JSON.stringify(privateMessage));
      } else {
        console.log(`User ${recipientId} not found`);
        // todo: in this case, use firebase to push a notification
      }
    }
  });
  
  // Handle ping frames to keep the connection alive
  webSocket.on('ping', () => {
    userSockets.forEach((socket, userId) => {
      if (socket === webSocket) {
        console.log('Received ping frame from ' + userId);
      }
    });
    webSocket.pong(); // Respond with a pong frame
  });

  // Handle disconnection
  webSocket.on('close', () => {
    console.log('User disconnected');
    
    // Remove the disconnected user's WebSocket from the map
    userSockets.forEach((socket, userId) => {
      if (socket === webSocket) {
        console.log(`Removing user: ${userId}`);
        userSockets.delete(userId);
      }
    });
  });
});

// Start the main server with WebSocket on port 3000
const PORT_MAIN = 3000;
mainServer.listen(PORT_MAIN, () => {
  console.log(`Main server with WebSocket is running on port ${PORT_MAIN}`);
});
