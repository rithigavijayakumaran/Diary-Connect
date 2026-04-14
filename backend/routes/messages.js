const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// @POST /api/messages
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, content, rfqId } = req.body;
    const ids = [req.user._id.toString(), receiverId].sort();
    const conversation = ids.join('_');

    const message = await Message.create({
      conversation,
      sender: req.user._id,
      receiver: receiverId,
      content,
      rfq: rfqId || null
    });

    const populated = await message.populate([
      { path: 'sender', select: 'name company' },
      { path: 'receiver', select: 'name company' }
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/messages/conversations
router.get('/conversations', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    })
      .populate('sender', 'name company country')
      .populate('receiver', 'name company country')
      .sort({ createdAt: -1 });

    // Group by conversation
    const convMap = {};
    messages.forEach(msg => {
      if (!convMap[msg.conversation]) {
        convMap[msg.conversation] = {
          conversation: msg.conversation,
          lastMessage: msg,
          partner: msg.sender._id.toString() === req.user._id.toString() ? msg.receiver : msg.sender
        };
      }
    });

    res.json({ success: true, data: Object.values(convMap) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/messages/:userId - get conversation with specific user
router.get('/:userId', protect, async (req, res) => {
  try {
    const ids = [req.user._id.toString(), req.params.userId].sort();
    const conversation = ids.join('_');

    const messages = await Message.find({ conversation })
      .populate('sender', 'name company')
      .sort({ createdAt: 1 });

    // Mark all as read
    await Message.updateMany(
      { conversation, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
