import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    tone: { type: String, default: 'Professional' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: 'New Conversation' },
    tone: { type: String, enum: ['Professional', 'Casual', 'Concise'], default: 'Professional' },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

export const ConversationModel = mongoose.model('Conversation', ConversationSchema);
