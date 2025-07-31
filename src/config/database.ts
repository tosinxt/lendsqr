import knex, { Knex } from 'knex';
import config from '../../knexfile';

type Environment = 'development' | 'test' | 'production';
const environment = (process.env.NODE_ENV || 'development') as Environment;

type ConnectionConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
};

// Helper to get database name from config
function getDatabaseConfig(env: Environment): { dbName: string; connection: ConnectionConfig } {
  const envConfig = config[env];
  
  // Handle different connection formats
  if (typeof envConfig.connection === 'string') {
    // Handle connection string
    const url = new URL(envConfig.connection);
    return {
      dbName: url.pathname.replace(/^\//, ''),
      connection: {
        host: url.hostname,
        port: parseInt(url.port, 10) || 3306,
        user: url.username,
        password: url.password,
      }
    };
  } else if (envConfig.connection && typeof envConfig.connection === 'object') {
    // Handle connection object
    const conn = envConfig.connection as ConnectionConfig;
    return {
      dbName: conn.database || 'lendsqr',
      connection: {
        host: conn.host || 'localhost',
        port: conn.port || 3306,
        user: conn.user || 'root',
        password: conn.password || '',
      }
    };
  }
  
  throw new Error('Invalid database configuration');
}

// Initialize the database connection
async function initializeDatabase(): Promise<Knex> {
  const { dbName, connection } = getDatabaseConfig(environment);
  
  // Create a connection without a database to check if the database exists
  const tempConnection = knex({
    ...config[environment],
    connection: {
      ...connection,
      database: undefined, // Connect without specifying a database
    },
  });

  try {
    // Check if database exists
    const [rows] = await tempConnection.raw<[any[]]>(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbName]
    );

    // Create database if it doesn't exist
    if (rows.length === 0) {
      await tempConnection.raw(`CREATE DATABASE \`${dbName}\``);
      console.log(`Created database: ${dbName}`);
    }
  } catch (error) {
    console.error('Error ensuring database exists:', error);
    throw error;
  } finally {
    await tempConnection.destroy();
  }

  // Create a new connection with the database specified
  const db = knex({
    ...config[environment],
    connection: {
      ...connection,
      database: dbName,
    },
  });
  
  // Test the connection
  try {
    await db.raw('SELECT 1');
    console.log('Database connection established successfully');
    
    // Run migrations
    if (process.env.NODE_ENV !== 'test') {
      await db.migrate.latest();
      console.log('Database migrations completed');
    }
    
    return db;
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    await db.destroy();
    process.exit(1);
  }
}

// Initialize and export the database connection
const db = initializeDatabase();

export default db;
