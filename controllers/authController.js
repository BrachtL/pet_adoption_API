const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports.signup_post = async (req, res) => {
  
  const { var1, var2 } = req.body; //email, password, etc
  
  try {
    const salt = await bcrypt.genSalt();
    //password = await bcrypt.hash(password, salt);
    //user = //insert user in DB and retrieves it again, for the ID
    const token = createToken(/*user.id*/1);
    
    res.status(201).json(
      {
        "token": token,
        "id": user.id
      });
  } catch(e) {
    console.log(e);
    res.status(500).send("error, user not created");
  }
}

module.exports.login_post = (req, res) => {

}

function createToken(id) {
  return jwt.sign({id}, "secret", {
    expiresIn: 30 * 60 //30 min in secs
  })
}

/*

considerations:

  - Make a handleError function
  - I dont need to check if the user already exists in db, or such things
    - Instead: make a particular message for each MySQL error 
  - put id in payload, not sensitive data
  - function createToken(id)

*/