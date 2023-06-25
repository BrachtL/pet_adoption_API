const pool = require('./dbConfig');

async function insertUser(email, hashedPassword) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`INSERT INTO test_user (email, password) VALUES ('${email}', '${hashedPassword}')`);
    connection.release();
    console.log('insertUser() return:', results);
    return results.insertId;
  } catch (err) {
    console.log('Error querying database: insertUser', err);
    console.log("A MENSAGEM É:  ->> ", err.sqlMessage, " <<-");
    throw new Error(err.sqlMessage);
  }
}

async function getUser(email) {
  try {
    const connection = await pool.getConnection();
    const [results, fields] = await connection.query(`SELECT id, email, password FROM test_user WHERE email = '${email}'`);
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
  getUser
}