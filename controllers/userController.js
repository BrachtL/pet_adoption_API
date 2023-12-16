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
        messageList = await getChatMessages(petId, userId);
        console.log("messageList.length: ", messageList.length);
      } else {
        messageList = await getChatMessages(petId, req.query.adoptingUserId);
        console.log("messageList.length: ", messageList.length);
      }
     
      await setSeenMessages(userId, petId);
      
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