import mongoose from 'mongoose';

let lastConnectionError: string | null = null;
let connectionAttempted = false;

export const isDbConfigured = (): boolean => {
  const uri = process.env.MONGO_URI;
  return typeof uri === 'string' && uri.trim().length > 0;
};

export const isDbConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const getDbStatus = () => {
  return {
    configured: isDbConfigured(),
    connected: isDbConnected(),
    readyState: mongoose.connection.readyState,
    error: lastConnectionError,
  };
};

export const connectDB = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGO_URI?.trim();
  connectionAttempted = true;

  if (!mongoUri) {
    lastConnectionError =
      'MONGO_URI environment variable is not set. Add your MongoDB Atlas connection string to .env or Secrets.';
    console.warn(`[Database] ${lastConnectionError}`);
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    lastConnectionError = null;
    return true;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    lastConnectionError = null;
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown MongoDB connection error';
    lastConnectionError = message;
    console.error(`[Database] Connection failed: ${message}`);
    return false;
  }
};

export const hasAttemptedConnection = (): boolean => connectionAttempted;
