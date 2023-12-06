const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../configPar');
const createToken  = require('../controllers/authController').createToken

const requireAuth = (req, res, next) => {
  try {
    //const token = req.headers.authorization
    const token = req.headers.token
    if(token) {
      jwt.verify(token, jwtSecret, (err, decodedToken) => {
        if(err) {
          console.log(err.message);
          res.status(500).json({message: "token not valid"}) //todo
        } else {
          console.log("decodedToken: ", decodedToken);
          console.log("DATE NOW: ", Math.floor(Date.now() / 1000));
          const timeLeftInSec = (decodedToken.exp - Math.floor(Date.now() / 1000));
          console.log("token time left: ", decodedToken.exp - Math.floor(Date.now() / 1000));
          if(timeLeftInSec < 432000) { //5 days in sec
            const newToken = createToken(decodedToken.id);
            console.log("newToken -> ", newToken);
            req.headers.token = newToken;
          }
          //in the future: todo: send the old token to blacklist when create a new one
          req.decodedToken = decodedToken;
          next();
        }
      })
    } else {
      console.log("no token found");
      res.status(500).json({message: "token not valid"}) //todo
    }
  } catch(e) {
    res.status(400).json({message: e.toString()});
  }
}

module.exports = {
  requireAuth
}