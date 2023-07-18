const pool = require('./dbConfig');

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

async function getUser(id) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
    SELECT id, id_location, email, name, age, password, description, image_url, category
    FROM users WHERE id = '${id}'`);
    connection.release();
    console.log('getUser() return:', results[0]);
    return results[0];
  } catch (err) {
    console.log('Error querying database: getUser', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}


async function getPetsExceptMine(userId) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
    SELECT pets.id, pets.id_user, pets.id_location, pets.main_image_URL, pets.name, pets.birthday,
    pets.species, pets.breed, pets.gender, pets.description, pets.creation_datetime,
    locations.country, locations.uf, locations.city, locations.latitude, locations.longitude
    FROM pets
    JOIN locations ON pets.id_location = locations.id
    WHERE pets.id_user != ?`, [userId]);
    connection.release();
    console.log(`getPetsExceptMine(${userId}) return: ${results}`);
    return results;
  } catch (err) {
    console.log('Error querying database: getPetsExceptMine', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}


module.exports = {
  insertUser,
  getUserData,
  getLocationId,
  insertLocation,
  getPetsExceptMine
}