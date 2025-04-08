import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, Store } from "@shared/schema";
import { db } from "./db";
import pg from "pg";
import connectPgSimple from "connect-pg-simple";

const PostgresStore = connectPgSimple(session);
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

declare global {
  namespace Express {
    interface User extends User {
      store?: Store;
    }
  }
  
  namespace Express.Session {
    interface SessionData {
      storeCode?: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'developmentsecret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production'
    },
    store: new PostgresStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    })
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use('local', new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    }, async (req: Request, username: string, password: string, done: any) => {
      try {
        // Get store code from request
        const storeCode = req.body.storeCode;
        if (!storeCode) {
          return done(null, false, { message: 'Store code is required' });
        }

        // Find store by code
        const store = await storage.getStoreByCode(storeCode);
        if (!store) {
          return done(null, false, { message: 'Invalid store code' });
        }

        // Save store code in session for future use
        req.session.storeCode = storeCode;

        // Find user by username and store ID
        const user = await storage.getUserByUsernameAndStoreId(username, store.id);
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        // Verify password
        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        // Return user with store info
        return done(null, { ...user, store });

      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, null);
      }

      // Attach store information if available
      if (user.storeId) {
        const store = await storage.getStore(user.storeId);
        if (store) {
          return done(null, { ...user, store });
        }
      }

      return done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Register route
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, name, email, role, store } = req.body;

      // Check if store code already exists
      const existingStore = await storage.getStoreByCode(store.code);
      if (existingStore) {
        return res.status(400).json({ message: "Store code already exists" });
      }

      // Create the store first
      const newStore = await storage.createStore(store);

      // Create the user with the store ID
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        name,
        email,
        role,
        storeId: newStore.id
      });

      // Login the user
      req.login({ ...user, store: newStore }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error during login" });
        }
        return res.status(201).json({ ...user, store: newStore });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: Express.User, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Current user route
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  // Middleware to check if user is authenticated
  app.use("/api/*", (req, res, next) => {
    // Skip authentication for these paths
    const authExemptPaths = [
      "/api/register",
      "/api/login",
      "/api/logout",
      "/api/user"
    ];

    if (authExemptPaths.includes(req.path)) {
      return next();
    }

    if (req.isAuthenticated()) {
      return next();
    }

    res.status(401).json({ message: "Authentication required" });
  });
}