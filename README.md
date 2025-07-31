# Lendsqr User Registration API

A secure, production-ready Node.js API for user registration and authentication built with TypeScript, Express, and MySQL.

## Features

- User registration with email and password
- Secure password hashing with bcrypt
- Input validation using Zod
- Rate limiting and security headers
- MySQL database with migrations
- Environment-based configuration
- Comprehensive error handling
- TypeScript support
- Request logging

## Tech Stack

- **Runtime**: Node.js (LTS)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **ORM**: Knex.js
- **Validation**: Zod
- **Security**: Helmet, express-rate-limit
- **Logging**: Built-in request logging

## Prerequisites

- Node.js 16+
- MySQL 8.0+
- npm or yarn

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lendsqr.git
   cd lendsqr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and update the values as needed:
   ```bash
   cp .env.example .env
   ```

4. **Run database migrations**
   ```bash
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000` by default.

## API Endpoints

### Register a new user

```
POST /api/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Success Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2025-07-31T12:00:00.000Z",
    "updated_at": "2025-07-31T12:00:00.000Z"
  }
}
```

**Error Response (400 Bad Request - Validation Error):**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 8,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Password must be at least 8 characters",
      "path": ["password"]
    }
  ]
}
```

**Error Response (409 Conflict - Duplicate Email):**
```json
{
  "success": false,
  "error": "Duplicate Entry",
  "message": "A user with this email already exists"
}
```

### User Login

```
POST /api/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2025-07-31T12:00:00.000Z",
    "updated_at": "2025-07-31T12:00:00.000Z"
  },
  "message": "Login successful"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Incorrect email or password"
}
```

## Environment Variables

The application uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to run the server on | `3000` |
| `NODE_ENV` | Application environment | `development` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | - |
| `DB_NAME` | Database name | `lendsqr` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |
| `JWT_SECRET` | Secret for JWT signing | - |
| `JWT_EXPIRES_IN` | JWT expiration time | `30d` |

## Development

### Running Tests

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

### Building for Production

```bash
# Build TypeScript files
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── config/           # Configuration files
│   └── database.ts   # Database configuration
├── controllers/      # Route controllers
├── middleware/       # Express middleware
├── models/           # Database models
│   └── User.ts       # User model
├── routes/           # Route definitions
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── app.ts            # Express app setup
└── index.ts          # Application entry point
```

## Security Considerations

- Passwords are hashed using bcrypt before being stored in the database
- Rate limiting is implemented to prevent brute force attacks
- Security headers are set using Helmet middleware
- Input validation is performed using Zod
- Environment variables are used for sensitive configuration
- SQL injection is prevented by using Knex query builder

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Express.js](https://expressjs.com/)
- [Knex.js](http://knexjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)
  "error": "Email already in use"
}
```

## Project Structure

```
src/
├── config/           # Configuration files
│   └── database.ts   # Database configuration
├── database/
│   ├── migrations/   # Database migrations
│   └── seeds/        # Database seed files
├── models/           # Data models
│   └── User.ts       # User model and operations
└── index.ts          # Application entry point
```

## Development

- **Run in development mode:** `npm run dev`
- **Run tests:** `npm test` (when tests are added)
- **Run migrations:** `npm run migrate`
- **Rollback migrations:** `npm run migrate:rollback`

## Production

For production, you'll want to:

1. Set `NODE_ENV=production` in your environment variables
2. Configure a production database (PostgreSQL recommended)
3. Build the TypeScript code: `npm run build`
4. Start the server: `npm start`

## License

ISC