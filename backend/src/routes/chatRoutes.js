import express from 'express';
import { chatController } from '../controllers/chatController.js';

const router = express.Router();

router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id', chatController.getConversationById);
router.post('/conversations', chatController.createConversation);
router.delete('/conversations/:id', chatController.deleteConversation);
router.post('/chat/stream', chatController.streamChat);

export default router;
