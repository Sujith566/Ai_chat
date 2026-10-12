import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isMongoConnected } from '../config/db.js';
import { ConversationModel } from '../models/Conversation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'conversations.json');

// Ensure local fallback data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

const readLocalData = () => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

const writeLocalData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing local storage fallback:', err);
  }
};

export const storageService = {
  async getAll() {
    if (isMongoConnected()) {
      return await ConversationModel.find({}).sort({ updatedAt: -1 }).lean();
    }
    const data = readLocalData();
    return data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  async getById(conversationId) {
    if (isMongoConnected()) {
      return await ConversationModel.findOne({ conversationId }).lean();
    }
    const data = readLocalData();
    return data.find((c) => c.conversationId === conversationId) || null;
  },

  async upsert(conversation) {
    const timestamp = new Date();
    if (isMongoConnected()) {
      return await ConversationModel.findOneAndUpdate(
        { conversationId: conversation.conversationId },
        {
          ...conversation,
          updatedAt: timestamp,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
    }

    const data = readLocalData();
    const index = data.findIndex((c) => c.conversationId === conversation.conversationId);
    const updated = {
      ...conversation,
      updatedAt: timestamp.toISOString(),
      createdAt: index >= 0 ? data[index].createdAt : timestamp.toISOString(),
    };

    if (index >= 0) {
      data[index] = updated;
    } else {
      data.unshift(updated);
    }
    writeLocalData(data);
    return updated;
  },

  async delete(conversationId) {
    if (isMongoConnected()) {
      return await ConversationModel.findOneAndDelete({ conversationId });
    }
    const data = readLocalData();
    const filtered = data.filter((c) => c.conversationId !== conversationId);
    writeLocalData(filtered);
    return true;
  },
};
