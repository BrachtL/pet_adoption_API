const express = require("express");
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { insertMessage, setLastOnline, setSeenMessages, getFbToken, getName } = require("./Database/queries");
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./configPar');
const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('./pet-adoption-fb-firebase-adminsdk-lj4px-6f048a9126.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});


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

    if(data == "ping") {
      webSocket.send('pong');
      return;
    }

    console.log(JSON.parse(data));
    
    let { type, token, senderId, recipientId, content, petId } = JSON.parse(data);
    console.log("petId ---> ", petId);
    //todo: change the way I deal witn token and senderId vars. I am shadowing them, they should be const.
    //maybe change the MessageModel on client too

    if (type == 'register') {
      if (!token) {
        console.log('socket connection attempted without a token');
        webSocket.close();
        return;
      }

      jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
          webSocket.close();
          return;
        }

        const userId = decoded.id;


        //todo: why is this commented? It makes sense. Check it later
        /*
        if(false && userSockets.get(userId.toString())) {
          
          console.log(`User already registered: ${userId}`);
          return;

        } else {
        */

        console.log(`User registered now: ${userId}`);

        userSockets.set(userId.toString(), webSocket);
        const systemMessage = { type: "system", senderId: userId, content: "online", senderName: "", petId: petId };

        console.log("!  broadcast message  !")
        userSockets.forEach((webSocket, userId) => {
          if(userId != decoded.id) {
            webSocket.send(JSON.stringify(systemMessage));
            console.log(`message: ${JSON.stringify(systemMessage)}    userId: ${userId}`);
          }
        });
      }); 
      //});

    } else if (type == 'private message') {

      token = senderId;

      if (!token) {
        console.log('socket connection attempted without a token');
        webSocket.close();
        return;
      }

      jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
          webSocket.close();
          return;
        }

        senderId = decoded.id;
      });

      if(!userSockets.get(senderId.toString())) {
        userSockets.set(senderId.toString(), webSocket);
        console.log("User should be registered already, but it was not. Now it is :D")
      }

      console.log(`Message from ${senderId} to ${recipientId}: ${content} -> petId: ${petId}`);

      // Persist the message to the database
      const currentDateTime = new Date();
      currentDateTime.setHours(currentDateTime.getHours() - 3);
      const formattedDateTime = currentDateTime.toISOString().slice(0, 19).replace('T', ' ');
      const idMessage = await insertMessage(senderId, recipientId, content, formattedDateTime, petId);
      const senderName = await getName(senderId);

      // Retrieve the target user's WebSocket and send the message
      const targetSocket = userSockets.get(recipientId);
      if (targetSocket) {
        console.log("sending message ", content, " to ", recipientId, "petId -> ", petId);
        const privateMessage = { type: 'private message', senderId: senderId, content: content, senderName: senderName, petId: petId };
        targetSocket.send(JSON.stringify(privateMessage));
        
      } else {
        console.log(`User ${recipientId} not found`);
        console.log(`Sending a message to firebase notificate a new message`)
        
        const fbToken = await getFbToken(recipientId);

        if(fbToken != null && fbToken != "") {

          const message = {
            data: {
              senderId: `${senderId}`,
              content: content,
              type: type,
              senderName: senderName,
              petId: petId
            },
            /*notification: { //this block is used when I want the firebase to send a notification directly
              title: `${senderName} enviou mensagens no chat`,
              body: `Última mensagem enviada: ${content}`,
            },*/
            token: fbToken, // FCM registration token
          };

          console.log(JSON.stringify(message));
          // Send the message
          firebaseAdmin.messaging().send(message)
            .then((response) => {
              console.log('Successfully sent message:', response);
            })
            .catch((error) => {
              console.error('Error sending message:', error);
            });
        }
      }

      //todo: create a commun part with the code shared between all conditions avoiding to repeat the same code 3 times
    } else if(type == "system") {
      token = senderId;

      if (!token) {
        console.log('socket connection attempted without a token');
        webSocket.close();
        return;
      }  

      jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
          webSocket.close();
          return;
        }

        senderId = decoded.id;
      });

      if(!userSockets.get(senderId.toString())) {
        userSockets.set(senderId.toString(), webSocket);
        console.log("User should be registered already, but it was not. Now it is :D")
      }

      console.log(`System message from ${senderId} to ${recipientId}: ${content}`);
      console.log(`type = ${type}, petId = ${petId}`);

      const senderName = await getName(senderId);

      // Retrieve the target user's WebSocket and send the message
      const targetSocket = userSockets.get(recipientId);
      if (targetSocket) {
        if(content == "check online interval") {
          console.log(`check online interval from ${senderId} to ${recipientId}`);
          
          console.log(`user ${recipientId} is online`);

          const checkOnlineIntervalMessage = { type: "system", senderId: recipientId, content: "online", senderName: senderName, petId: petId };
          webSocket.send(JSON.stringify(checkOnlineIntervalMessage));
        } else {
          console.log("sending system message ", content, " to ", recipientId);
          console.log(`type = ${type}, petId = ${petId}, senderName = ${senderName}`);
          const systemMessage = { type: 'system', senderId: senderId, content: content, senderName: senderName, petId: petId };
          targetSocket.send(JSON.stringify(systemMessage));
        }
        
      } else {
        console.log(`User ${recipientId} not found`);

        if(content == "check online interval") {
          const checkOnlineIntervalMessage = { type: "system", senderId: recipientId, content: "offline", senderName: senderName, petId: petId };
          webSocket.send(JSON.stringify(checkOnlineIntervalMessage));

        } else if(content != "online" && content != "offline") {
          console.log(`Sending a message to firebase notificate a new message`)
        
          const fbToken = await getFbToken(recipientId);

          if(fbToken != null && fbToken != "") {

            const message = {
              data: {
                senderId: `${senderId}`,
                content: content,
                type: type,
                senderName: senderName,
                petId: petId
              },
              /*notification: { //this block is used when I want the firebase to send a notification directly
                title: `${senderName} enviou mensagens no chat`,
                body: `Última mensagem enviada: ${content}`,
              },*/
              token: fbToken, // FCM registration token
            };

            console.log(JSON.stringify(message));
            // Send the message
            firebaseAdmin.messaging().send(message)
              .then((response) => {
                console.log('Successfully sent message:', response);
              })
              .catch((error) => {
                console.error('Error sending message:', error);
              });
            }
          }
      }

////   !!!  Change those type verifications below to content verifications and send "ask online" and "check online interval" using content attribute

    } else if(type == "ask online") {
      token = senderId;

      if (!token) {
        console.log('socket connection attempted without a token');
        webSocket.close();
        return;
      }  

      jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
          webSocket.close();
          return;
        }

        senderId = decoded.id;
      });

      if(!userSockets.get(senderId.toString())){
        userSockets.set(senderId.toString(), webSocket);
        console.log("User should be registered already, but it was not. Now it is :D")
      }

      console.log(`ask online from ${senderId} to ${recipientId}`);

      // Retrieve the target user's WebSocket and send the message
      const targetSocket = userSockets.get(recipientId);
      if (targetSocket) {
        console.log(`user ${recipientId} is online`);
        const askOnlineMessage = { type: "system", senderId: recipientId, content: "online", senderName: "", petId: petId };
        webSocket.send(JSON.stringify(askOnlineMessage));
      } else {
        console.log(`User ${recipientId} not found`);
      }
    } else if(type == "set seen messages") {
      token = senderId;

      if (!token) {
        console.log('socket connection attempted without a token');
        webSocket.close();
        return;
      }  

      jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
          webSocket.close();
          return;
        }

        senderId = decoded.id;
      });

      if(!userSockets.get(senderId.toString())){
        userSockets.set(senderId.toString(), webSocket);
        console.log("User should be registered already, but it was not. Now it is :D")
      }

      console.log(`set seen messages from the ${recipientId} for ${senderId} on the petId: ${content}`);

      await setSeenMessages(senderId, content, recipientId);
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
    userSockets.forEach(async (socket, userId) => {
      if (socket === webSocket) {
        console.log(`Removing user: ${userId}`);  
        const currentDateTime = new Date();
        currentDateTime.setHours(currentDateTime.getHours() - 3);
        const formattedDateTime = currentDateTime.toISOString().slice(0, 19).replace('T', ' ');
        await setLastOnline(userId, formattedDateTime);
        userSockets.delete(userId);
        return;
      }
    });
  });
});

// Start the main server with WebSocket on port 3000
const PORT_MAIN = 3000;
mainServer.listen(PORT_MAIN, () => {
  console.log(`Main server with WebSocket is running on port ${PORT_MAIN}`);
});
