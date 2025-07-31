import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import { createUser, findUserByEmail, verifyUserCredentials, sanitizeUser } from './models/User';
import db from './config/database';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Request parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Test database connection
    await (await db).raw('SELECT 1');
    res.status(200).json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Input validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Register new user
app.post('/api/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      const error = fromZodError(validation.error);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.message
      });
    }

    const { email, password, firstName, lastName } = validation.data;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already in use',
        message: 'A user with this email already exists'
      });
    }

    // Create new user
    const newUser = await createUser({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    
    // Remove password from response
    const userResponse = sanitizeUser(newUser);
    
    res.status(201).json({ 
      success: true,
      data: userResponse,
      message: 'User registered successfully'
    });
  } catch (error) {
    next(error);
  }
});

// User login
app.post('/api/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      const error = fromZodError(validation.error);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.message
      });
    }

    const { email, password } = validation.data;
    
    // Verify credentials
    const user = await verifyUserCredentials(email, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Incorrect email or password'
      });
    }

    // In a real app, generate a JWT token here
    // const token = generateAuthToken(user);
    
    res.status(200).json({
      success: true,
      // token,
      user: sanitizeUser(user),
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  
  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const error = fromZodError(err);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.message,
      details: err.issues
    });
  }
  
  // Handle database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate Entry',
      message: 'A record with this information already exists'
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Run migrations
    if (process.env.NODE_ENV !== 'test') {
      await (await db).migrate.latest();
      console.log('Database migrations completed');
      
      // Run seeds in development
      if (process.env.NODE_ENV === 'development') {
        await (await db).seed.run();
        console.log('Database seeding completed');
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Handle graceful shutdown
    const gracefulShutdown = async () => {
      console.log('Shutting down gracefully...');
      
      // Close server
      server.close(async () => {
        console.log('HTTP server closed');
        
        // Close database connection
        try {
          await (await db).destroy();
          console.log('Database connection closed');
          process.exit(0);
        } catch (err) {
          console.error('Error closing database connection:', err);
          process.exit(1);
        }
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcing shutdown');
        process.exit(1);
      }, 10000);
    };
    
    // Listen for shutdown signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log this to an error tracking service
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  // In production, you might want to log this to an error tracking service
  // and perform any necessary cleanup before exiting
  process.exit(1);
});

// Only start the server if this file is run directly (not when imported for tests)
if (require.main === module) {
  startServer();
}

export { app }; 
