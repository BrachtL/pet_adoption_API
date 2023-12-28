const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../configPar');
const { insertUser, getUserData, getLocationId, insertLocation } = require('../Database/queries');

module.exports.signup_post = async (req, res) => {
  
  let { email, password, name, age, category, lat, lng, uf, city, profile_photo_data } = req.body;
  console.log(JSON.stringify(profile_photo_data));
  console.log(JSON.stringify(req.body));
  //todo: validate strings email and password: length, special chars, etc. Here and in front-end. Here for security and front for usability
  //done: front end already validates fields
  
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    
    var locationId = await getLocationId(city, uf);

    if (locationId == 0) {
      locationId = await insertLocation(lat, lng, uf, city);
    }

    if (category == "Sou uma pessoa") {
      category = "person"
    }

    const id = await insertUser(email, hashedPassword, name, age, category, undefined, locationId, profile_photo_data);
    //const token = createToken(id);
    console.log("id -> ", id);
    
    const token = createToken(id);
    
    res.status(200).json({
        "token": token,
        "message": "Success"
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
    const user = await getUserData(email);

    if(user) {
      console.log("Start bcrypt.compare()");
      const auth = await bcrypt.compare(password, user.password);
      console.log("Finish bcrypt.compare()");
      console.log("AUTH: ", auth);
      if(auth) {
        //send access token to the client
        const token = createToken(user.id);
        res.status(200).json({
            token: token,
            latitude: user.latitude,
            longitude: user.longitude
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
  
  //const token = req.headers.token;

  try {
    console.log("I am here");
    //const isSuccess = insertTokenInBlacklist(token); //todo
    console.log(req.decodedToken);

  } catch(e) {

  }
}

function createToken(id) {
  return jwt.sign({ id: id }, jwtSecret, {
    expiresIn: 60 * 60 * 24 * 7 // 7 days in seconds
  });
};
exports.createToken = createToken;

