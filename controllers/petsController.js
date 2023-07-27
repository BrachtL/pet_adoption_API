//const bcrypt = require('bcrypt');
//const jwt = require('jsonwebtoken');
//const { jwtSecret } = require('../configPar');
const { getPetsExceptMineLikedDisliked, setLikeRelation, setDislikeRelation, getSecondaryImagesURL } = require('../Database/queries');





module.exports.pets_get = async (req, res) => {

  try {
    const userId = req.decodedToken.id;
    const petsList = await getPetsExceptMineLikedDisliked(userId);
    console.log(petsList[0]);
    console.log(`petsList length = ${petsList.length}`);
    
    await getUrls(petsList);
    console.log("after forEach: ", petsList[10]);
    console.log(`after forEach: petsList length = ${petsList.length}`);

    res.status(200).json({
      petsList: petsList
    });   

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }

}

async function getUrls(petsList) {
  const promises = petsList.map(async (element) => {
    element.secondary_images_URL = await getSecondaryImagesURL(element.id);
    return element;
  });

  // Wait for all promises to resolve
  return Promise.all(promises);
}


//todo: implement this function
module.exports.like_pet_post = async (req, res) => {

  try {
    const userId = req.decodedToken.id;
    const petId = req.body.petId;
    console.log(`LIKE petId -> ${petId}`);

    const insertId = await setLikeRelation(userId, petId);

    res.status(200).json({
      message: "Success"
    });

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}

module.exports.dislike_pet_post = async (req, res) => {

  try {
    const userId = req.decodedToken.id;
    const petId = req.body.petId;
    console.log(`DISLIKE petId -> ${petId}`);

    const insertId = await setDislikeRelation(userId, petId);

    res.status(200).json({
      message: "Success"
    });

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}
