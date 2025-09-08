import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieSession from "cookie-session";
import multer from "multer";
import { storage } from "./storage";
import { awsService } from "./services/aws";
import { awsCredentialsSchema, roleAssumptionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(cookieSession({
    name: 's3-client-session',
    keys: [process.env.SESSION_SECRET || 'dev-secret-key'],
    maxAge: undefined, // Session expires when browser closes
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }));

  // Configure multer for file uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // Connect with access keys
  app.post('/api/connect/credentials', async (req, res) => {
    try {
      const credentials = awsCredentialsSchema.parse(req.body);
      
      await awsService.initializeWithCredentials(credentials);
      
      const session = await storage.createSession(credentials);
      req.session!.sessionId = session.id;
      
      res.json({ success: true, sessionId: session.id });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to connect with credentials' 
      });
    }
  });

  // Connect with role assumption
  app.post('/api/connect/role', async (req, res) => {
    try {
      const roleConfig = roleAssumptionSchema.parse(req.body);
      
      console.log('Attempting to assume role:', roleConfig.roleArn);
      const credentials = await awsService.initializeWithRole(roleConfig);
      console.log('Role assumed successfully');
      
      const session = await storage.createSession(credentials);
      req.session!.sessionId = session.id;
      
      res.json({ success: true, sessionId: session.id });
    } catch (error) {
      console.error('Role assumption failed:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to assume role' 
      });
    }
  });

  // Check connection status
  app.get('/api/connection/status', async (req, res) => {
    try {
      const sessionId = req.session?.sessionId;
      if (!sessionId) {
        return res.json({ connected: false });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.json({ connected: false });
      }

      await awsService.initializeWithCredentials(session.credentials);
      res.json({ connected: true, region: session.credentials.region });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  // Disconnect
  app.post('/api/disconnect', async (req, res) => {
    try {
      const sessionId = req.session?.sessionId;
      if (sessionId) {
        await storage.deleteSession(sessionId);
        req.session = null;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to disconnect' });
    }
  });

  // List buckets
  app.get('/api/buckets', async (req, res) => {
    try {
      const sessionId = req.session?.sessionId;
      if (!sessionId) {
        return res.status(401).json({ error: 'Not connected' });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      await awsService.initializeWithCredentials(session.credentials);
      const buckets = await awsService.listBuckets();
      
      res.json(buckets);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to list buckets' 
      });
    }
  });

  // List objects in bucket
  app.get('/api/buckets/:bucketName/objects*', async (req, res) => {
    try {
      const sessionId = req.session?.sessionId;
      if (!sessionId) {
        return res.status(401).json({ error: 'Not connected' });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { bucketName } = req.params;
      const { prefix = '' } = req.query;

      await awsService.initializeWithCredentials(session.credentials);
      const objects = await awsService.listObjects(bucketName, prefix as string);
      
      res.json(objects);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to list objects' 
      });
    }
  });

  // Get download URL
  app.get('/api/buckets/:bucketName/objects/:key/download', async (req, res) => {
    try {
      const sessionId = req.session?.sessionId;
      if (!sessionId) {
        return res.status(401).json({ error: 'Not connected' });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { bucketName, key } = req.params;

      await awsService.initializeWithCredentials(session.credentials);
      const downloadUrl = await awsService.getDownloadUrl(bucketName, decodeURIComponent(key));
      
      res.json({ downloadUrl });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to generate download URL' 
      });
    }
  });

  // Delete object
  app.delete('/api/buckets/:bucketName/objects/:key', async (req, res) => {
    try {
      const sessionId = req.session?.sessionId;
      if (!sessionId) {
        return res.status(401).json({ error: 'Not connected' });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { bucketName, key } = req.params;

      await awsService.initializeWithCredentials(session.credentials);
      await awsService.deleteObject(bucketName, decodeURIComponent(key));
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to delete object' 
      });
    }
  });

  // Upload object
  app.post('/api/buckets/:bucketName/upload', upload.single('file'), async (req, res) => {
    try {
      const sessionId = req.session?.sessionId;
      if (!sessionId) {
        return res.status(401).json({ error: 'Not connected' });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const { bucketName } = req.params;
      const { key } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      if (!key) {
        return res.status(400).json({ error: 'No key provided' });
      }

      await awsService.initializeWithCredentials(session.credentials);
      await awsService.uploadObject(bucketName, key, file.buffer);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to upload object' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
