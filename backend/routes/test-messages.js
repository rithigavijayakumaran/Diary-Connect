const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/dairybridge');
  const User = require('../models/User');
  const Message = require('../models/Message');

  const messages = await Message.find({}).lean();
  if (messages.length === 0) {
      console.log('No messages found in DB');
      process.exit();
  }
  
  const sampleMsg = messages[messages.length-1];
  const senderId = sampleMsg.sender;
  const tsUserSender = await User.findById(senderId);
  
  if (!tsUserSender) {
      console.log('User not found');
      process.exit();
  }

  const userMsgs = await Message.find({
    $or: [{ sender: tsUserSender._id }, { receiver: tsUserSender._id }]
  })
    .populate('sender', 'name company country')
    .populate('receiver', 'name company country')
    .sort({ createdAt: -1 });

  const convMap = {};
  userMsgs.forEach(msg => {
    if (!convMap[msg.conversation]) {
      convMap[msg.conversation] = {
        conversation: msg.conversation,
        partner: msg.sender._id.toString() === tsUserSender._id.toString() ? msg.receiver : msg.sender
      };
    }
  });

  const convs = Object.values(convMap);
  console.log('Conversations count: ', convs.length);
  
  const specificConv = convs[0];
  if (specificConv) {
      const ids = [tsUserSender._id.toString(), specificConv.partner._id.toString()].sort();
      const conversation = ids.join('_');
      console.log('Computed ID:', conversation);
      console.log('DB ID:', specificConv.conversation);
      console.log('Match?', conversation === specificConv.conversation);
  }

  process.exit();
}

test().catch(console.error);
