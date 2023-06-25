const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../configPar');
const { insertUser, getUser } = require('../Database/queries');

module.exports.signup_post = async (req, res) => {
  
  const { email, password } = req.body;
  //todo: validate strings email and password: length, special chars, etc. Here and in front-end. Here for security and front for usability
  
  try {
    const salt = await bcrypt.genSalt();
    hashedPassword = await bcrypt.hash(password, salt);
    const id = await insertUser(email, hashedPassword);
    const token = createToken(id);
    
    res.status(201).json({
        "token": token,
        "id": id
      });
  } catch(e) {
    console.log(e);
    //console.log(e.toString().includes("Duplicate entry") && e.toString().includes("email"));
    res.status(500).send(e.toString());
  }
}

module.exports.login_post = async (req, res) => {

  const { email, password } = req.body;
  
  try {
    const user = await getUser(email);

    if(user) {
      const auth = await bcrypt.compare(password, user.password);
      console.log("I am here");
      console.log("AUTH: ", auth);
      if(auth) {
        //send access token to the client
        const token = createToken(user.id);
        res.status(200).json({
            token: token,
            id: user.id
          });
      } else {
        throw Error('incorrect password');
      }
    } else {
      throw Error('incorrect email');
    }
    

  } catch(e) {

    //res.status(400).json({});
    res.status(400).send(e.toString());
  }

}

function createToken(id) {
  return jwt.sign({id: id}, jwtSecret, {
    expiresIn: 30 * 60 //30 min in secs
  });
}

/*

considerations:

  - Make a handleError function
  - I dont need to check if the user already exists in db, or such things
    - Instead: make a particular message for each MySQL error 
  - put id in payload, not sensitive data
  - function createToken(id)

*/