const {
  getPublicUserData,
  getChatMessages,
  setSeenMessages,
  saveFbToken,
  getUserData,
  getPetIdList,
  deletePetsByIdList,
  deleteUserById,
} = require("../Database/queries");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');

module.exports.token_post = async (req, res) => {
  try {
    const token = req.headers.token;
    const fbToken = req.body.fbToken;
    const userId = req.decodedToken.id;
    console.log(req.body);
    console.log(JSON.stringify(req.body));

    const fbTokenDbResponse = await saveFbToken(fbToken, userId);
    console.log("fbTokenDbResponse: ", JSON.stringify(fbTokenDbResponse));

    res.status(200).json({
      token: token,
    });
  } catch (e) {
    res.status(400).json({ message: e.toString() });
  }
};

module.exports.user_chat_get = async (req, res) => {
  try {
    const token = req.headers.token;
    const interlocutorId = req.query.interlocutorId;
    const userId = req.decodedToken.id;
    const petId = req.query.petId;

    const userData = await getPublicUserData(interlocutorId);
    console.log("userData: ", JSON.stringify(userData));

    let messageList = [];

    if (req.query.adoptingUserId == "me") {
      console.log("adoptingUserId == me true");
      console.log(
        `req.query.adoptingUserId -> ${req.query.adoptingUserId} and interlocutorId -> ${interlocutorId}`
      );
      messageList = await getChatMessages(petId, userId);
      console.log("messageList.length: ", messageList.length);
    } else {
      console.log("adoptingUserId == me false");
      console.log(
        `req.query.adoptingUserId -> ${req.query.adoptingUserId} and interlocutorId -> ${interlocutorId}`
      );
      messageList = await getChatMessages(petId, interlocutorId);
      console.log("messageList.length: ", messageList.length);
    }

    await setSeenMessages(userId, petId, interlocutorId);

    res.status(200).json({
      token: token,
      interlocutorName: userData.name,
      interlocutorPicUrl: userData.image_url,
      lastOnlineDatetime: userData.last_online_datetime,
      messageList: messageList,
    });
  } catch (e) {
    //res.status(400).json({});
    res.status(400).json({ message: e.toString() });
  }
};

module.exports.show_delete_page = async (req, res) => {
  // Logic for rendering the delete page
  res.render("../pages/deletePage.ejs", {
    successMessage: null,
    errorMessage: null,
  }); // Assuming you are using a template engine like EJS or Pug
};

module.exports.delete_user_data = async (req, res) => {
  //todo: delete data from cloudinary before deleting from here

  try {
    
    /*
    
    
    
    
    // Create a transporter object
    const transporter = nodemailer.createTransport({
      service: "gmail", // Use your email service provider, e.g., 'gmail', 'hotmail', etc.
      auth: {
        user: "lucianoeletronico@gmail.com",
        pass: process.env.PASS
      },
    });

    // Set up the email content
    const mailOptions = {
      from: "lucianoeletronico@gmail.com",
      to: "lucianoeletronico@gmail.com",
      subject: "Someone is trying to delete its account",
      text: `${req.body.email} is trying to delete its account`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
    
    
    
    */

    console.log(req.body);
    const userEmail = req.body.email;
    const userPassword = req.body.senha;

    const user = await getUserData(userEmail);

    if (user) {
      console.log("user.id -> ", user.id);
      console.log("Start bcrypt.compare()");
      const auth = await bcrypt.compare(userPassword, user.password);
      console.log("Finish bcrypt.compare()");
      console.log("AUTH: ", auth);

      if (auth) {
        //delete user here and render with succeed message
        const petIdList = await getPetIdList(user.id); //TEST IT
        if (petIdList.length > 0) {
          console.log("trying to delete pets");
          const deletePets = await deletePetsByIdList(petIdList); //TEST IT
        }
        console.log("trying to delete user");
        const deletedUser = await deleteUserById(user.id); //TEST IT
        if (!deletedUser) {
          return res
            .status(404)
            .render("../pages/deletePage.ejs", {
              successMessage: null,
              errorMessage: "Usuário não encontrado",
            });
        }

        return res.render("../pages/deletePage.ejs", {
          successMessage: "Usuário excluído com sucesso!",
          errorMessage: null,
        });
      } else {
        return res
          .status(404)
          .render("../pages/deletePage.ejs", {
            successMessage: null,
            errorMessage: "Senha incorreta",
          });
      }
    } else {
      return res
        .status(404)
        .render("../pages/deletePage.ejs", {
          successMessage: null,
          errorMessage: "Usuário não encontrado",
        });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .render("../pages/deletePage.ejs", {
        successMessage: null,
        errorMessage: "Erro interno do servidor",
      });
  }
};
