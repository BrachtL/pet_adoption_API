const pool = require('./dbConfig');


async function setLastOnline(userId, currentTime) {
  try {
    const connection = await pool.getConnection();

    const [results, fields] = await connection.query(
      `UPDATE users SET last_online_datetime = ?
       WHERE id = ?`, 
      [currentTime, userId]
    );
    console.log(`setLastOnline(${userId}, ${currentTime}) -> results: ${JSON.stringify(results)}`);

    connection.release();

    return results;
    
  } catch (err) {
    console.log('Error querying database: setLastOnline', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function setSeenMessages(userId, petId, senderId) {
  try {
    const connection = await pool.getConnection();

    const [results, fields] = await connection.query(
      `UPDATE messages SET seen = true
       WHERE id_recipient = ? and id_pet = ? and id_sender = ?`, 
      [userId, petId, senderId]
    );
    console.log(`setSeenMessages(${userId}, ${petId}, ${senderId}) -> results: ${JSON.stringify(results)}`);

    connection.release();

    return results;
    
  } catch (err) {
    console.log('Error querying database: setSeenMessages', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getChatDataNotOwner(petId, userId) {
  try {
    const connection = await pool.getConnection();

    const [results, fields] = await connection.query(`
      SELECT
        users.id,
        users.name,
        users.image_URL,
        MAX(messages.creation_datetime) AS last_message_datetime,
        messages.content AS last_message_content,
        COALESCE(unseen_message_counts.unseen_message_count, 0) AS unseen_message_count
      FROM
        pets
      JOIN
        users ON pets.id_user = users.id
      LEFT JOIN messages ON (users.id = messages.id_sender OR users.id = messages.id_recipient)
        AND messages.id = (
          SELECT id
          FROM messages
          WHERE (
            (id_sender = users.id AND id_recipient = ?)
            OR
            (id_recipient = users.id AND id_sender = ?)
          )
          ORDER BY creation_datetime DESC, id DESC
          LIMIT 1
      )
      LEFT JOIN (
        SELECT
          CASE WHEN id_sender = ? THEN id_recipient ELSE id_sender END AS user_id,
          COUNT(*) AS unseen_message_count
        FROM
          messages
        WHERE
          seen = false AND id_recipient = ?
        GROUP BY
          user_id
      ) AS unseen_message_counts ON users.id = unseen_message_counts.user_id
      WHERE
        pets.id = ?
      GROUP BY
        users.id, users.name, users.image_URL;`, 
      [userId, userId, userId, userId, petId]
    );
    console.log(`getChatDataNotOwner(${petId})[0] -> results: ${JSON.stringify(results[0])}`);

    connection.release();

    return results;
  } catch(err) {
    console.log('Error querying database: getChatDataNotOwner', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getChatDataList(petId, petOwnerId) {
  try {
    const connection = await pool.getConnection();

    const [results, fields] = await connection.query(`
      SELECT
        users.id,
        users.name,
        users.image_URL,
        MAX(messages.creation_datetime) AS last_message_datetime,
        messages.content AS last_message_content,
        COALESCE(unseen_message_counts.unseen_message_count, 0) AS unseen_message_count
      FROM
        users
      JOIN
        user_liked_interactions ON users.id = user_liked_interactions.id_user
      LEFT JOIN messages ON (users.id = messages.id_sender OR users.id = messages.id_recipient)
          AND messages.id = (
              SELECT id
              FROM messages
              WHERE (
                (id_sender = users.id AND id_recipient = ?)
                OR
                (id_recipient = users.id AND id_sender = ?)
              )
              ORDER BY creation_datetime DESC, id DESC
              LIMIT 1
          )
      LEFT JOIN (
        SELECT
          CASE WHEN id_sender = ? THEN id_recipient ELSE id_sender END AS user_id,
          COUNT(*) AS unseen_message_count
        FROM
          messages
        WHERE
          seen = false AND id_recipient = ?
        GROUP BY
          user_id
      ) AS unseen_message_counts ON users.id = unseen_message_counts.user_id
      WHERE
        users.id != ? AND (user_liked_interactions.id_pet_liked = ? OR messages.id_pet = ?)
      GROUP BY
        users.id, users.name, users.image_URL;`, 
   [petOwnerId, petOwnerId, petOwnerId, petOwnerId, petOwnerId, petId, petId]
   );
    console.log(`getChatDataList(${petId})[0] -> results: ${JSON.stringify(results[0])}`);

    connection.release();

    return results;
  } catch(err) {
    console.log('Error querying database: getChatDataList', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}


async function getChatMessages(petId, adoptingUserId) {
  try {
    const connection = await pool.getConnection();

    const [results, fields] = await connection.query(
      `SELECT id, id_sender, id_recipient, content, creation_datetime
      FROM messages
      WHERE id_pet = ? AND (id_sender = ? OR id_recipient = ?)
      ORDER BY creation_datetime DESC`, 
      [petId, adoptingUserId, adoptingUserId]
    );
    console.log(`getChatMessages(${petId})[0] -> results: ${JSON.stringify(results[0])}`);

    connection.release();

    return results;
  } catch(err) {
    console.log('Error querying database: getChatMessages', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function insertMessage(senderId, recipientId, content, currentTime, petId) {
  try {

    const connection = await pool.getConnection();

    const [results, fields] = await connection.query(
      'INSERT INTO messages (id_sender, id_recipient, content, creation_datetime, id_pet) VALUES (?, ?, ?, ?, ?)', 
      [senderId, recipientId, content, currentTime, petId]
    );
    console.log(`insertMessage(${senderId}, ${recipientId}, ${content}, ${currentTime}, ${petId}) -> results: ${JSON.stringify(results.insertId)}`);

    connection.release();

    return results.insertId;
    
  } catch (err) {
    console.log('Error querying database: insertMessage', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}


async function setNewPetSecondaryImagesUrls(newPetId, secondaryPhotoDataList) {
  try {
    const connection = await pool.getConnection();
    
    let resultsList = [];
    
    for(let k = 0; k < secondaryPhotoDataList.length; k++) {
      const [results, fields] = await connection.query(`
      INSERT INTO secondary_images_url (id_pet, url, image_public_id) 
      VALUES (?, ?, ?)`,
      [newPetId, secondaryPhotoDataList[k].url, secondaryPhotoDataList[k].publicId]); 

      console.log(`
      INSERT INTO sencondary_images_url (id_pet, url, image_public_id) 
      VALUES (?, ?, ?)`,
      [newPetId, secondaryPhotoDataList[k].url, secondaryPhotoDataList[k].publicId]); 
      resultsList[k] = results;
    }
   
    connection.release();

    console.log('setNewPetSecondaryImagesUrls() return:', resultsList);
    return resultsList;
  } catch (err) {
    console.log('Error querying database: setNewPetSecondaryImagesUrls', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function insertNewPet(
  userId,
  locationId,
  profilePhotoDataUrl,
  name,
  birthday,
  species, //todo: change those 2 (species and breed) to breedId
  breed,  //delete those 2 fields from DB and update client new pet sent data
  gender,
  description,
  profilePhotoDataPublicId
) {
  try {
    const connection = await pool.getConnection();
    
    const [results, fields] = await connection.query(`
      INSERT INTO pets (id_user, id_location, main_image_URL, name, birthday, species, breed, 
        gender, description, image_public_id, creation_datetime) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, locationId, profilePhotoDataUrl, name, birthday, species, breed, 
        gender, description, profilePhotoDataPublicId]);    
    connection.release();

    console.log(`
    INSERT INTO pets (id_user, id_location, main_image_URL, name, birthday, species, breed, 
      gender, description, image_public_id, creation_datetime) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [userId, locationId, profilePhotoDataUrl, name, birthday, species, breed, 
      gender, description, profilePhotoDataPublicId]);  
    console.log('insertNewPet() return:', results);
    return results.insertId;
  } catch (err) {
    console.log('Error querying database: insertNewPet', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getUserLocation(userId) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT id_location FROM users
      WHERE id = '${userId}'`);
    connection.release();
    console.log('getCredentials() return:', results[0].id_location);
    return results[0].id_location;
  } catch (err) {
    console.log(`Error querying database: getUserLocation(${userId})`, err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getBreeds() {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT id, breed, species
      FROM breeds
      `);
    connection.release();
    console.log('getBreeds() return:', results);
    return results;
  } catch (err) {
    console.log('Error querying database: getBreeds', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

//todo: changed the commented lines
async function insertUser(
  email, hashedPassword, name, age, category, description, locationId,
  imageUrl
  ) {
  try {
    const connection = await pool.getConnection();
    //const [results, fields] = await connection.query(`
    //  INSERT INTO users (id_location, email, name, age, password, description, image_url, category) 
    //  VALUES ('${locationId}', '${email}', '${name}', '${age}', '${hashedPassword}', '${description}', '${imageUrl}', '${category}')`);
    //console.log(`INSERT INTO users (id_location, email, name, age, password, description, image_url, category) 
    //VALUES ('${locationId}', '${email}', '${name}', '${age}', '${hashedPassword}', '${description}', '${imageUrl}', '${category}')`);
   
    //todo: insert current_timestamp (or "Now()") in creation_datetime
    const [results, fields] = await connection.query(`
      INSERT INTO users (id_location, email, name, age, password, description, image_url, category, creation_datetime) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [locationId, email, name, age, hashedPassword, description, imageUrl, category]);    
    connection.release();

    console.log(`
      INSERT INTO users (id_location, email, name, age, password, description, image_url, category, creation_datetime) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [locationId, email, name, age, hashedPassword, description, imageUrl, category]);
    console.log('insertUser() return:', results);
    return results.insertId;
  } catch (err) {
    console.log('Error querying database: insertUser', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function insertLocation(latitude, longitude, uf, city) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      INSERT INTO locations (latitude, longitude, uf, city) VALUES (?, ?, ?, ?)`,
      [latitude, longitude, uf, city]);
    console.log('insertLocation() return:', results);
    connection.release();
    return results.insertId;
    
  } catch (err) {
    console.log('Error querying database: insertLocation', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getLocationId(city, uf) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT id FROM locations WHERE city = '${city}' AND uf = '${uf}'`);
    console.log('getLocationId() return:', results);
    connection.release();
    if (results.length > 0) {
      console.log(results[0].id);
      return results[0].id;
    } else {
      return 0;
    }
    
  } catch (err) {
    console.log('Error querying database: getLocationId', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

//this query is only used to give the user a token. All the rest (getUser(id)) is done with the token
async function getUserData(email) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT
      users.id, users.email, users.password,
      locations.latitude, locations.longitude
      FROM users
      JOIN locations ON users.id_location = locations.id
      WHERE email = '${email}'`);
    connection.release();
    console.log('getCredentials() return:', results[0]);
    return results[0];
  } catch (err) {
    console.log('Error querying database: getCredentials', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getPublicUserData(id) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      SELECT id, id_location, email, name, age, description, image_url, category, creation_datetime, image_public_id, last_online_datetime
      FROM users WHERE id = '${id}'`);
    connection.release();
    console.log('getPublicUserData() return:', results[0]);
    return results[0];
  } catch (err) {
    console.log('Error querying database: getPublicUserData', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}


async function getPetsExceptMineLikedDisliked(userId) {
  try {
    const connection = await pool.getConnection();
/*
    const [results, fields] = await connection.query(`
      SELECT pets.id, pets.id_user, pets.id_location, pets.main_image_URL, pets.name, pets.birthday,
      pets.species, pets.breed, pets.gender, pets.description, pets.creation_datetime,
      locations.country, locations.uf, locations.city, locations.latitude, locations.longitude
      FROM pets
      JOIN locations ON pets.id_location = locations.id
      WHERE pets.id_user != ?`, [userId]);
*/

    const [results, fields] = await connection.query(`SELECT pets.id, pets.id_user, pets.id_location, pets.main_image_URL, pets.name, pets.birthday,
      pets.species, pets.breed, pets.gender, pets.description, pets.creation_datetime,
      locations.country, locations.uf, locations.city, locations.latitude, locations.longitude,
      GROUP_CONCAT(DISTINCT secondary_images_url.url) AS secondary_images_URL_string
      FROM pets
      JOIN locations ON pets.id_location = locations.id
      LEFT JOIN secondary_images_url ON pets.id = secondary_images_url.id_pet
      WHERE pets.id_user != ? 
      AND pets.id NOT IN (
        SELECT id_pet_liked
        FROM user_liked_interactions
        WHERE id_user = ?
      )
      AND pets.id NOT IN (
        SELECT id_pet_disliked
        FROM user_disliked_interactions
        WHERE id_user = ?
      )
      GROUP BY pets.id;`, [userId, userId, userId]);


    connection.release();
    console.log(`getPetsExceptMineLikedDisliked(${userId}) return: ${JSON.stringify(results)}`);
    return results;
  } catch (err) {
    console.log('Error querying database: getPetsExceptMineLikedDisliked', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

  async function setLikeRelation(userId, petId) {
    try {
      const connection = await pool.getConnection();
      const [results, fields] = await connection.query(`
        INSERT INTO user_liked_interactions (id_user, id_pet_liked) VALUES (?, ?)`,
        [userId, petId]);
      connection.release();
      console.log(`setLikeRelation(${userId}, ${petId}) return: ${JSON.stringify(results)}`);
      return results.insertId;
    } catch (err) {
      console.log('Error querying database: setLikeRelation', err);
      console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
      throw new Error(err.sqlMessage);
    }
  }

  async function setDislikeRelation(userId, petId) {
    try {
      const connection = await pool.getConnection();
      const [results, fields] = await connection.query(`
        INSERT INTO user_disliked_interactions (id_user, id_pet_disliked) VALUES (?, ?)`,
        [userId, petId]);
      connection.release();
      console.log(`setDislikeRelation(${userId}, ${petId}) return: ${JSON.stringify(results)}`);
      return results.insertId;
    } catch (err) {
      console.log('Error querying database: setDislikeRelation', err);
      console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
      throw new Error(err.sqlMessage);
    }
  }

  async function getSecondaryImagesURL(petId) {
    try {
      const connection = await pool.getConnection();
      const [results, fields] = await connection.query(`
        SELECT url FROM secondary_images_url WHERE id_pet = ?`,
        [petId]);
      connection.release();
      console.log(`getSecondaryImagesURL(${petId}) return: ${JSON.stringify(results)}`);
      
      let urlList = [];
      results.forEach( element => {
        urlList.push(element.url);
      })
      
      console.log(`urlList: ${urlList}`);
      
      return urlList;
    } catch (err) {
      console.log('Error querying database: getSecondaryImagesURL', err);
      console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
      throw new Error(err.sqlMessage);
    }
  }

  async function getDonatingPetsById(userId) {
    try {
      const connection = await pool.getConnection();
  
      const [results, fields] = await connection.query(`
        SELECT pets.id, pets.id_user, pets.id_location, pets.main_image_URL, pets.name, pets.birthday, pets.species, pets.breed, pets.gender,
          pets.description, pets.creation_datetime, locations.country, locations.uf, locations.city, locations.latitude, locations.longitude,
        GROUP_CONCAT(DISTINCT user_liked_interactions.id_user) AS liked_user_ids, GROUP_CONCAT(DISTINCT secondary_images_url.url) AS secondary_images_URL_string
        FROM pets
        JOIN locations ON pets.id_location = locations.id
        LEFT JOIN user_liked_interactions ON pets.id = user_liked_interactions.id_pet_liked
        LEFT JOIN secondary_images_url ON pets.id = secondary_images_url.id_pet
        WHERE pets.id_user = ?
        GROUP BY pets.id;`, [userId]
      );

      //TODO -> use this same concept to refactor this and the getLikedPets(userId) query in order not to need to retrieve the urls one by one anymore!
  
      connection.release();
      console.log(`getDonatingPetsById(${userId}) return: ${JSON.stringify(results)}`);
      return results;
    } catch (err) {
      console.log('Error querying database: getDonatingPetsById', err);
      console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
      throw new Error(err.sqlMessage);
    }
  }

  //TODO: CHECK THIS QUERY!
  async function getLikedPets(userId) {
    try {
      const connection = await pool.getConnection();
  
      const [results, fields] = await connection.query(`SELECT pets.id, pets.id_user, pets.id_location, pets.main_image_URL, pets.name, pets.birthday,
        pets.species, pets.breed, pets.gender, pets.description, pets.creation_datetime,
        locations.country, locations.uf, locations.city, locations.latitude, locations.longitude,
        GROUP_CONCAT(DISTINCT secondary_images_url.url) AS secondary_images_URL_string
        FROM pets
        JOIN locations ON pets.id_location = locations.id
        LEFT JOIN user_liked_interactions ON pets.id = user_liked_interactions.id_pet_liked
        LEFT JOIN secondary_images_url ON pets.id = secondary_images_url.id_pet
        WHERE user_liked_interactions.id_user = ?
        GROUP BY pets.id;`, [userId]);
  
  
      connection.release();
      console.log(`getLikedPets(${userId}) return: ${JSON.stringify(results)}`);
      return results;
    } catch (err) {
      console.log('Error querying database: getLikedPets', err);
      console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
      throw new Error(err.sqlMessage);
    }
  }


module.exports = {
  insertUser,
  getUserData,
  getLocationId,
  insertLocation,
  getPetsExceptMineLikedDisliked,
  setLikeRelation,
  setDislikeRelation,
  getSecondaryImagesURL,
  getLikedPets,
  getBreeds,
  getUserLocation,
  insertNewPet,
  setNewPetSecondaryImagesUrls,
  insertMessage,
  getPublicUserData,
  getChatMessages,
  getDonatingPetsById,
  getChatDataList,
  setSeenMessages,
  setLastOnline,
  getChatDataNotOwner
}