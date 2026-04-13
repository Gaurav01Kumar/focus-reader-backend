import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import User from "./models/User";
import FolderRoute from "./routes/folder";
import NoteRoute from "./routes/notes";
import RecentFileRoute from "./routes/recentfile";
import AiRoutes from "./routes/airoutes";
import { log } from "./utils/logger";
import ensureAuth from "./middleware/auth";
import { successResponse } from "./utils/response";

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
// 🔐 PASSPORT CONFIG
// ==============================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails?.[0].value,
            image: profile.photos?.[0].value,
          });
          log("✅ New user created via Google");
        }
        return done(null, user);
      } catch (err) {
        return done(err, undefined);
      }
    },
  ),
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ==============================
// 🔐 MIDDLEWARE
// ==============================
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
); // Allow all CORS
app.use(cookieParser());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.text({ type: "text/plain" }));

// ==============================
// 🟢 HEALTH CHECK
// ==============================
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// ==============================
// 🔑 AUTH ROUTES
// ==============================
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req: any, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" },
    );

    try {
      res.cookie("app_auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      const clientUrl =
        process.env.CLIENT_URL ||
        "https://focusreader-ai.onrender.com/dashboard";
      res.redirect(clientUrl);
    } catch (error) {
      log("Error in google callback", error);
      res.redirect(
        `${process.env.CLIENT_URL || "https://focusreader-ai.onrender.com/"}/login?error=auth_failed`,
      );
    }
  },
);

app.get("/auth/logout", (req, res, next) => {
  res.clearCookie("app_auth_token");
  res.status(200).json({ message: "Logged out" });
});
// get profile from token to check auth
app.get("/api/auth/me", ensureAuth, async (req: any, res) => {
  const user = req.user;
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return successResponse(res, "User fetched successfully", user, 200);
});
app.get("/api/proxy-pdf", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) return res.status(400).json({ error: "URL required" });

    // Narrow the type: query params can be string | string[] | ParsedQs | ParsedQs[]
    if (typeof url !== "string") {
      return res.status(400).json({ error: "Invalid URL" });
    }

    // Security: only allow http/https
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const response = await fetch(decodeURIComponent(url), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FocusReader/1.0)",
        Accept: "application/pdf,*/*",
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType =
      response.headers.get("content-type") || "application/pdf";
    const buffer = await response.arrayBuffer();

    res.set({
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    });

    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: "Could not fetch PDF" });
  }
});
// ==============================
// 📁 ROUTES (PROTECTED)
// ==============================

app.use("/api/folders", ensureAuth, FolderRoute);
app.use("/api/notes", ensureAuth, NoteRoute);
app.use("/api/recent", ensureAuth, RecentFileRoute);
app.use("/api/model", ensureAuth, AiRoutes);

// ==============================
// 🍃 MONGODB CONNECTION
// ==============================
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  log("❌ MONGO_URI is not defined in .env");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    log("✅ MongoDB connected");
    app.listen(port, () => {
      log(`🚀 Server running on port ${port}`);
    });
  })
  .catch((err) => {
    log("❌ MongoDB connection failed:", err);
  });
