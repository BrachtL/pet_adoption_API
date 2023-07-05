const pool = require('./dbConfig');

//todo: change the commented lines
async function insertUser(
  email, hashedPassword, age, category, description, id_location,
  image_url, name
  ) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
      INSERT INTO users (id_location, email, name, age, password, description, image_url, category) 
      VALUES ('${id_location}', '${email}', '${name}', '${age}', '${hashedPassword}', '${description}', '${image_url}', '${category}')`);
    connection.release();
    console.log(`INSERT INTO users (id_location, email, name, age, password, description, image_url, category) 
    VALUES ('${id_location}', '${email}', '${name}', '${age}', '${hashedPassword}', '${description}', '${image_url}', '${category}')`);
    console.log('insertUser() return:', results);
    return results.insertId;
  } catch (err) {
    console.log('Error querying database: insertUser', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

//this query is only used to give the user a token. All the rest (getUser(id)) is done with the token
async function getCredentials(email) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`
    SELECT id, email, password FROM users WHERE email = '${email}'`);
    connection.release();
    console.log('getCredentials() return:', results[0]);
    return results[0];
  } catch (err) {
    console.log('Error querying database: getCredentials', err);
    console.log("THE MESSAGE IS:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getUser(email, password) {
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


module.exports = {
  insertUser,
  getCredentials
}