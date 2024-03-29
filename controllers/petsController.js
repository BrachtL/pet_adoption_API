//const bcrypt = require('bcrypt');
//const jwt = require('jsonwebtoken');
//const { jwtSecret } = require('../configPar');
const { getPetsExceptMineLikedDisliked, setLikeRelation, setDislikeRelation, getSecondaryImagesURL, getLikedPets, getBreeds, insertLocation, 
  getUserLocation, insertNewPet, setNewPetSecondaryImagesUrls, getDonatingPetsById, getChatDataList, getChatDataNotOwner, getPetProfilePic,
  getPetData } = require('../Database/queries');

//todo: make a resource that pick public ids from public_ids_stored_on_cloudinary (except for the ones included until last week, for instance)
//and check against all public ids currently being used (from pets, users and secondary_images_url). Then send the remained IDs to be deleted from cloudinary
//client should not be concerned about it.

module.exports.pet_data_get = async (req, res) => {
  try {
    const token = req.headers.token;
    const petId = req.query.petId;
    const userId = req.decodedToken.id;

    const petData = await getPetData(petId);
    console.log("pet data: ", JSON.stringify(petData));
    
    let isThisPetMine;
    
    if(petData.id_user == userId) {
      isThisPetMine = true;
    } else {
      isThisPetMine = false;
    }
    
    res.status(200).json({
      token: token,
      petData: petData,
      isThisPetMine: isThisPetMine
    });   

  } catch(e) {
    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}

module.exports.pet_main_image_url_get = async (req, res) => {
  try {
    const petId = req.query.petId;

    const petProfilePic = await getPetProfilePic(petId);
    console.log("pet profile pic: ", JSON.stringify(petProfilePic));
    
    res.status(200).json({
      main_image_URL: petProfilePic
    });   

  } catch(e) {
    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}

module.exports.chat_list_not_owner_get = async (req, res) => {
  try {
    const token = req.headers.token;
    const petId = req.query.petId;
    const userId = req.decodedToken.id;


    const chatList = await getChatDataNotOwner(petId, userId);
    console.log("chatList: ", JSON.stringify(chatList));
    
    res.status(200).json({
      token: token,
      chatList: chatList
    });   

  } catch(e) {
    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}

module.exports.chat_list_get = async (req, res) => {
  try {
    const token = req.headers.token;
    const petId = req.query.petId;
    const userId = req.decodedToken.id;

    const chatList = await getChatDataList(petId, userId);
    console.log("chatList: ", JSON.stringify(chatList));
    
    res.status(200).json({
      token: token,
      chatList: chatList
    });   

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}

module.exports.donating_get = async (req, res) => {
  try {
    const token = req.headers.token;
    const userId = req.decodedToken.id;
    
    const petsList = await getDonatingPetsById(userId);
    console.log("petsList: ", JSON.stringify(petsList));
    console.log(`petsList length = ${petsList.length}`);
    
    res.status(200).json({
      petsList: petsList,
      token: token
    });   

  } catch(e) {
    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}

module.exports.pet_breeds_get = async (req, res) => {
  try {
    const token = req.headers.token;
    const breedsList = await getBreeds();
    console.log("pet breeds: ", JSON.stringify(breedsList));
    console.log(`breedsList length = ${breedsList.length}`);
    
    res.status(200).json({
      breedsList: breedsList,
      token: token
    });   

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}

module.exports.pet_create_post = async (req, res) => {
  try {
    const token = req.headers.token;
    console.log(JSON.stringify(req.body));
    //todo: remove public ids from to delete on DB
    //todo: before it I have to sent them to "to delete" from client

    const petData = req.body;

    const userId = req.decodedToken.id;
    console.log(userId);

    var locationId = 0;
    //todo: ask country here when it makes sense
    if(petData.latitude && petData.longitude && petData.uf && petData.city) {
      /*
      locationId = await getLocationId(city, uf);
      if(locationId == 0) {
        locationId = await insertLocation(petData.latitude, petData.longitude, petData.uf, petData.city);
      }
      */
    } else {
      locationId = await getUserLocation(userId);
    }

    var birthday = transformDateFormat(petData.birthday);
    
    //todo: make this query
    const newPetId = await insertNewPet(
      userId,
      locationId,
      petData.profile_photo_data.url,
      petData.name,
      birthday,
      petData.species, //todo: change those 2 (species and breed) to breedId
      petData.breed,  //delete those 2 fields from DB and update client new pet sent data
      petData.gender,
      petData.description,
      petData.profile_photo_data.publicId
    );

    const idList = await setNewPetSecondaryImagesUrls(newPetId, petData.album_photo_data_list);
    
    //todo: send new pet id instead of a message. I will need it to redirect to the pet view on client
    res.status(200).json({
      message: "Success",
      token: token
    });
  
  } catch(e) {
    res.status(400).json({message: e.toString()});
  }
}

module.exports.pets_get = async (req, res) => {

  try {
    const token = req.headers.token;
    const userId = req.decodedToken.id;
    const petsList = await getPetsExceptMineLikedDisliked(userId);
    console.log(petsList[0]);
    console.log(`petsList length = ${petsList.length}`);
    
    //await getUrlsAndFormatBirthday(petsList);
    //console.log("after forEach: ", petsList[10]);
    //console.log(`after forEach: petsList length = ${petsList.length}`);

    res.status(200).json({
      petsList: petsList,
      token: token
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
    //todo: remove this getUrl from here and add on the query!

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

function transformDateFormat(brazilianDate) {
  //transform dd/mm/yyyy into yyyy-mm-dd
  var parts = brazilianDate.split('/');
  var transformedDate = parts[2] + '-' + parts[1] + '-' + parts[0];

  return transformedDate;
}


//todo: implement this function
module.exports.like_pet_post = async (req, res) => {

  try {
    const token = req.headers.token;
    const userId = req.decodedToken.id;
    const petId = req.body.petId;
    console.log(`LIKE petId -> ${petId}`);

    const insertId = await setLikeRelation(userId, petId);

    res.status(200).json({
      message: "Success",
      token: token
    });

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}

module.exports.dislike_pet_post = async (req, res) => {

  try {
    const token = req.headers.token;
    const userId = req.decodedToken.id;
    const petId = req.body.petId;
    console.log(`DISLIKE petId -> ${petId}`);

    const insertId = await setDislikeRelation(userId, petId);

    res.status(200).json({
      message: "Success",
      token: token
    });

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }
}


module.exports.pets_grid_get = async (req, res) => {

  try {
    const token = req.headers.token;
    const userId = req.decodedToken.id;
    const petsLikedList = await getLikedPets(userId);
    console.log(petsLikedList[0]);
    console.log(`petsLikedList length = ${petsLikedList.length}`);
    
    /*
    await getUrlsAndFormatBirthday(petsLikedList);
    console.log("after forEach: ", petsLikedList[0]);
    console.log(`after forEach: petsLikedList length = ${petsLikedList.length}`);
    */

    res.status(200).json({
      petsList: petsLikedList,
      token: token
    });   

  } catch(e) {

    //res.status(400).json({});
    res.status(400).json({message: e.toString()});
  }

}


