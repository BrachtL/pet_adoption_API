//const bcrypt = require('bcrypt');
//const jwt = require('jsonwebtoken');
//const { jwtSecret } = require('../configPar');
const { getPetsExceptMine } = require('../Database/queries');





module.exports.pets_get = async (req, res, decodedToken) => {

  try {
    const userId = req.decodedToken.id;
    const petsList = await getPetsExceptMine(userId);
    console.log(petsList[0]);
    console.log(`petsList length = ${petsList.length}`);

    res.status(200).json({
      petsList: petsList
    });




    /*
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
    */
    

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }

}
