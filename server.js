const express = require("express");
const app = express();

require('dotenv').config()

//middleware (ponte entre requests)
app.use(express.json());

const authRoutes = require('./routes/authRoutes').router
app.use(authRoutes);

const teste = require('./routes/authRoutes').teste;
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



//check if server is online
app.route("/").get((requirement, response) => {
  response.send("The server is online");
});

app.listen(3000);
console.log("successful loaded :D");





/*
  next steps:
  - to set proper env vars
  - create a table in my current db to test
  - create the signup and sign in, with hash and jwt
  - test with insomnia
  
  - to model db, user data
  - begin app dev
  - backend dev
  - test
*/