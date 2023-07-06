const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../configPar');
const { insertUser, getCredentials } = require('../Database/queries');

//todo: make  and send a proper message in case duplicated e-mail
module.exports.signup_post = async (req, res) => {
  
  const { email, password, name, age, category } = req.body;
  //todo: validate strings email and password: length, special chars, etc. Here and in front-end. Here for security and front for usability
  
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const id = await insertUser(email, hashedPassword, name, age, category);
    const token = createToken(id);
    
    res.status(201).json({
        "token": token
      });
  } catch(e) {
    console.log(e);
    //console.log(e.toString().includes("Duplicate entry") && e.toString().includes("email"));
    res.status(400).json({message: e.toString()});
  }
}

module.exports.login_post = async (req, res) => {

  const { email, password } = req.body;
  
  try {
    const user = await getCredentials(email);

    if(user) {
      console.log("Start bcrypt.compare()");
      const auth = await bcrypt.compare(password, user.password);
      console.log("Finish bcrypt.compare()");
      console.log("AUTH: ", auth);
      if(auth) {
        //send access token to the client
        const token = createToken(user.id);
        res.status(200).json({
            message: token
          });
      } else {
        throw Error('incorrect password');
      }
    } else {
      throw Error('incorrect email');
    }
    

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }

}

module.exports.logout_get = async (req, res, decodedToken) => {
  
  const token = req.headers.authorization;

  try {
    console.log("I am here");
    //const isSuccess = insertTokenInBlacklist(token); //todo
    console.log(req.decodedToken);

  } catch(e) {

  }
}

function createToken(id) {
  return jwt.sign({id: id}, jwtSecret, {
    expiresIn: 30 * 60 //30 min in secs
  });
}