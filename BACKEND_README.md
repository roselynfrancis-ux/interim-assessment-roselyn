# Coinbase Clone Backend API

A full-featured backend API for the Coinbase clone cryptocurrency platform built with Node.js, Express, and MongoDB.

## Features

- **JWT Authentication**: Secure user authentication with HTTP-only cookies
- **User Registration & Login**: Complete authentication system
- **Protected Routes**: User profile endpoint with authentication
- **Cryptocurrency Management**: CRUD operations for cryptocurrencies
- **Top Gainers**: Fetch highest performing cryptocurrencies
- **New Listings**: Display recently added cryptocurrencies
- **RESTful API**: Clean and organized API endpoints

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── cryptoController.js  # Cryptocurrency logic
├── middleware/
│   └── auth.js             # JWT authentication middleware
├── models/
│   ├── User.js             # User schema
│   └── Crypto.js           # Cryptocurrency schema
├── routes/
│   ├── authRoutes.js       # Authentication endpoints
│   └── cryptoRoutes.js     # Cryptocurrency endpoints
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
└── server.js               # Main server file
```

## Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

4. **Configure your MongoDB connection in `.env`:**
```
MONGODB_URI=mongodb://localhost:27017/coinbase-clone
JWT_SECRET=your_secure_secret_key
```

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT)

## API Endpoints

### Authentication (`/api/auth`)

- **POST /register** - Register a new user
  
  **Option 1** - Using firstName/lastName (recommended for React frontend):
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
  
  **Option 2** - Using name field:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- **POST /login** - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- **GET /profile** - Get user profile (Protected)
  - Requires JWT token in Authorization header or cookie

- **POST /logout** - Logout user (Protected)

### Cryptocurrencies (`/api/crypto`)

- **GET /** - Get all cryptocurrencies
  ```
  GET /api/crypto
  ```

- **GET /gainers** - Get top 10 gainers (sorted by 24h change%)
  ```
  GET /api/crypto/gainers
  ```

- **GET /new** - Get 10 newest listings
  ```
  GET /api/crypto/new
  ```

- **GET /:id** - Get single cryptocurrency by ID
  ```
  GET /api/crypto/507f1f77bcf86cd799439011
  ```

- **POST /** - Add new cryptocurrency (Protected)
  
  **Required fields:**
  ```json
  {
    "name": "Bitcoin",
    "symbol": "BTC",
    "price": 45000,
    "image": "https://example.com/bitcoin.png",
    "change24h": 2.5
  }
  ```
  
  **Optional fields (for enhanced frontend display):**
  ```json
  {
    "name": "Bitcoin",
    "symbol": "BTC",
    "price": 45000,
    "image": "https://example.com/bitcoin.png",
    "change24h": 2.5,
    "change7d": 8.14,
    "marketCap": 1940000000000,
    "volume": 48200000000,
    "supply": 19700000,
    "color": "#F7931A",
    "category": "crypto",
    "sparkline": [44000, 44500, 45000, 45200, 45000]
  }
  ```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected endpoints require a token:

**Bearer Token (Authorization Header):**
```
Authorization: Bearer <your_jwt_token>
```

**Or HTTP-only C (unique, uppercase),
  price: Number,
  image: String,
  change24h: Number,              // Required - 24h percentage change
  change7d: Number,               // Optional - 7 day percentage change
  marketCap: Number,              // Optional - Market capitalization
  volume: Number,                 // Optional - 24h trading volume
  supply: Number,                 // Optional - Total supply
  color: String,                  // Optional - Hex color (e.g., "#F7931A")
  category: String,               // Optional - Enum: crypto, stablecoin, stock, prediction
  sparkline: [Number],            // Optional - Array of prices for chart

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Crypto Model
```javascript
{
  name: String,
  symbol: String,
  price: Number,
  image: String,
  change24h: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Deployment

### Deploy to Render

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Set environment variables in Render dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure secret key
   - `NODE_ENV`: Set to `production`
   - `CORS_ORIGIN`: Your frontend URL

5. Deploy!

### Environment Variables for Production

```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coinbase-clone
JWT_SECRET=your_super_secure_secret_key_change_this
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-frontend-domain.com
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT authentication
- ✅ HTTP-only cookies
- ✅ CORS protection
- ✅ Input validation
- ✅ Secure password storage

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT generation and verification
- **dotenv** - Environment variables
- **cors** - Cross-origin resource sharing
- **cookie-parser** - Cookie parsing middleware

## License

ISC
