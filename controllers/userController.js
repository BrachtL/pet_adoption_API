const { getPublicUserData, getChatMessages, setSeenMessages } = require('../Database/queries');


  module.exports.user_chat_get = async (req, res) => {
    try {
      const token = req.headers.token;
      const interlocutorId = req.query.interlocutorId;
      const userId = req.decodedToken.id;
      const petId = req.query.petId;

      const userData = await getPublicUserData(interlocutorId);
      console.log("userData: ", JSON.stringify(userData));
      
      let messageList = [];

      if(req.query.adoptingUserId == "me") {
        console.log("adoptingUserId == me true");
        console.log(`req.query.adoptingUserId -> ${req.query.adoptingUserId} and interlocutorId -> ${interlocutorId}`);
        messageList = await getChatMessages(petId, userId);
        console.log("messageList.length: ", messageList.length);
      } else {
        console.log("adoptingUserId == me false");
        console.log(`req.query.adoptingUserId -> ${req.query.adoptingUserId} and interlocutorId -> ${interlocutorId}`);
        messageList = await getChatMessages(petId, interlocutorId);
        console.log("messageList.length: ", messageList.length);
      }
     
      await setSeenMessages(userId, petId, interlocutorId);
      
      res.status(200).json({
        token: token,
        interlocutorName: userData.name,
        interlocutorPicUrl: userData.image_url,
        lastOnlineDatetime: userData.last_online_datetime,
        messageList: messageList
      });   
  
    } catch(e) {
  
      //res.status(400).json({});
      res.status(400).json({message: e.toString()});
    }
  }