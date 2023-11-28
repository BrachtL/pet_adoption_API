//const bcrypt = require('bcrypt');
//const jwt = require('jsonwebtoken');
//const { jwtSecret } = require('../configPar');
const { getPetsExceptMineLikedDisliked, setLikeRelation, setDislikeRelation, getSecondaryImagesURL, getLikedPets, getBreeds } = require('../Database/queries');



module.exports.pet_breeds_get = async (req, res) => {
  try {
    const breedsList = await getBreeds();
    console.log("pet breeds: ", JSON.stringify(breedsList));
    console.log(`breedsList length = ${breedsList.length}`);
    
    res.status(200).json(
      breedsList
    );   

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}

module.exports.pet_create_post = async (req, res) => {
  try {
    console.log(JSON.stringify(req.body))
    res.status(200).json({
      message: "It is ok"
    });   
  } catch(e) {
    res.status(400).json({message: e.toString()});
  }
}

module.exports.pets_get = async (req, res) => {

  try {
    const userId = req.decodedToken.id;
    const petsList = await getPetsExceptMineLikedDisliked(userId);
    console.log(petsList[0]);
    console.log(`petsList length = ${petsList.length}`);
    
    await getUrlsAndFormatBirthday(petsList);
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

//todo: the best is probably to delete it and deal with it on client (resource management). Check it on stress test.
//todo: use try catch here is probably a good idea
async function getUrlsAndFormatBirthday(petsList) {
  const promises = petsList.map(async (element) => {
    element.secondary_images_URL = await getSecondaryImagesURL(element.id);

    const date = new Date(element.birthday);
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    //element.birthday = formattedDate.replace(/-/g, "/");
    element.birthday = formattedDate;
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


module.exports.pets_grid_get = async (req, res) => {

  try {
    const userId = req.decodedToken.id;
    const petsLikedList = await getLikedPets(userId);
    console.log(petsLikedList[0]);
    console.log(`petsLikedList length = ${petsLikedList.length}`);
    
    await getUrlsAndFormatBirthday(petsLikedList);
    console.log("after forEach: ", petsLikedList[0]);
    console.log(`after forEach: petsLikedList length = ${petsLikedList.length}`);

    res.status(200).json({
      petsList: petsLikedList
    });   

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }

}


