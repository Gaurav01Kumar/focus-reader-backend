import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { Webhook } from 'svix';
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import User from './models/User';
import FolderRoute from './routes/folder';
import NoteRoute from './routes/notes';
import RecentFileRoute from './routes/recentfile';
import AiRoutes from './routes/airoutes';
import { log } from './utils/logger';
import { protectRoute } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ==============================
// 🌐 REQUEST LOGGER
// ==============================
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.path}`);
  next();
});

// ==============================
// 🚀 WEBHOOK ROUTE
// ==============================
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // raw body for webhook
  async (req, res) => {
    try {
      const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
      if (!webhookSecret) throw new Error('Missing CLERK_WEBHOOK_SECRET');

      const wh = new Webhook(webhookSecret);
      let evt: any;

      try {
        evt = wh.verify(req.body, req.headers as any);
      } catch (err) {
        log('❌ Webhook verification failed');
        return res.sendStatus(400);
      }

      log(`📩 Webhook Event received: ${evt.type}`);

      const userData = evt.data;

      switch (evt.type) {
        case 'user.created':
          const existingUser = await User.findOne({ clerkId: userData.id });
          if (!existingUser) {
            await User.create({
              clerkId: userData.id,
              displayName: `${userData.first_name || ''} ${userData.last_name || ''}`,
              email: userData.email_addresses?.[0]?.email_address,
              image: userData.image_url,
            });
            log('✅ User created in DB');
          }
          break;

        case 'user.updated':
          await User.findOneAndUpdate(
            { clerkId: userData.id },
            {
              displayName: `${userData.first_name || ''} ${userData.last_name || ''}`,
              email: userData.email_addresses?.[0]?.email_address,
              image: userData.image_url,
            }
          );
          log('🔄 User updated');
          break;

        case 'user.deleted':
          await User.findOneAndDelete({ clerkId: userData.id });
          log('🗑️ User deleted');
          break;

        default:
          log(`⚡ Event ignored: ${evt.type}`);
      }

      return res.sendStatus(200);
    } catch (error) {
      log('🔥 Webhook error:', error);
      return res.sendStatus(500);
    }
  }
);

// ==============================
// 🔐 NORMAL MIDDLEWARE
// ==============================
app.use(
  cors({
    origin: "https://focusreader-ai.onrender.com",
    credentials: true,
  })
);                 // Allow all CORS
app.use(clerkMiddleware());          // Clerk auth middleware
app.use(express.json());             // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ==============================
// 🟢 HEALTH CHECK
// ==============================
app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// ==============================
// 📁 ROUTES (ALL PROTECTED WITH requireAuth)
// ==============================
app.use('/api/folders', protectRoute, FolderRoute);
app.use('/api/notes', protectRoute, NoteRoute);
app.use('/api/recent', protectRoute, RecentFileRoute);
app.use('/api/model', protectRoute, AiRoutes);

// ==============================
// 🍃 MONGODB CONNECTION
// ==============================
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  log('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    log('✅ MongoDB connected');
    app.listen(port, () => {
      log(`🚀 Server running on port ${port}`);
    });
  })
  .catch((err) => {
    log('❌ MongoDB connection failed:', err);
  });