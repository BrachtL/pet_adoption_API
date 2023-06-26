const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../configPar');

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization
  if(token) {
    jwt.verify(token, jwtSecret, (err, decodedToken) => {
      if(err) {
        console.log(err.message);
        res.status(500).json({message: "token not valid"}) //todo
      } else {
        console.log("decodedToken: ", decodedToken);
        console.log("DATE NOW: ", Math.floor(Date.now() / 1000));
        req.decodedToken = decodedToken;
        next();
      }
    })
  } else {
    console.log("no token found");
    res.status(500).json({message: "token not valid"}) //todo
  }
}

module.exports = {
  requireAuth
}