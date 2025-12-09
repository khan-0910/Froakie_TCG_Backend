# 🐸 Froakie_TCG Backend Server

Complete Node.js + Express + MongoDB backend for Froakie_TCG Pokemon Cards Store with Razorpay integration.

## ✨ Features

- ✅ RESTful API for products and orders
- ✅ MongoDB database for data persistence
- ✅ Razorpay payment integration with signature verification
- ✅ Automatic stock management
- ✅ Webhook support for payment notifications
- ✅ CORS enabled for frontend integration
- ✅ Secure payment verification

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org

2. **MongoDB Account** (Free)
   - Sign up: https://www.mongodb.com/cloud/atlas/register

3. **Razorpay Account**
   - Dashboard: https://dashboard.razorpay.com

### Installation

1. **Install Dependencies**
```bash
cd Froakie_TCG_Backend
npm install
```

2. **Set Up Environment Variables**
```bash
# Copy the example file
copy .env.example .env

# Edit .env with your actual values
```

3. **Configure .env File**
```env
MONGODB_URI=your_mongodb_connection_string
RAZORPAY_KEY_ID=rzp_live_Rn3w5m3jxnc59J
RAZORPAY_KEY_SECRET=your_regenerated_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
PORT=3000
NODE_ENV=production
```

4. **Run the Server**
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Server will start on: http://localhost:3000

## 📡 API Endpoints

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `PATCH /api/products/:id/stock` - Update stock

### Orders

- `POST /api/create-order` - Create Razorpay order
- `POST /api/verify-payment` - Verify payment signature
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/:id` - Get single order

### Webhooks

- `POST /api/webhook` - Razorpay webhook endpoint

### Utilities

- `GET /` - Health check
- `POST /api/initialize` - Initialize sample products (run once)

## 🗄️ MongoDB Setup

### Step 1: Create MongoDB Atlas Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Create a new cluster (Free M0 tier)

### Step 2: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password
5. Replace `<dbname>` with `froakie_tcg`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/froakie_tcg?retryWrites=true&w=majority
```

### Step 3: Whitelist IP Address

1. Go to "Network Access" in MongoDB Atlas
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
4. Or add your specific IP address

## 🌐 Deployment Options

### Option 1: Render.com (Recommended - FREE)

1. **Create Account**
   - Go to: https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `Froakie_TCG_Backend` folder

3. **Configure Service**
   ```
   Name: froakie-tcg-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables**
   - Go to "Environment" tab
   - Add all variables from .env file
   - Click "Save Changes"

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your API URL: `https://froakie-tcg-backend.onrender.com`

### Option 2: Railway.app (Easy - FREE)

1. **Create Account**
   - Go to: https://railway.app
   - Sign up with GitHub

2. **Deploy**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `Froakie_TCG_Backend` folder

3. **Add Environment Variables**
   - Go to "Variables" tab
   - Add all from .env file

4. **Deploy**
   - Railway auto-deploys
   - Get your URL from dashboard

### Option 3: Heroku (Paid - $5/month)

1. **Install Heroku CLI**
   ```bash
   # Download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and Create App**
   ```bash
   heroku login
   cd Froakie_TCG_Backend
   heroku create froakie-tcg-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set RAZORPAY_KEY_ID=your_key_id
   heroku config:set RAZORPAY_KEY_SECRET=your_secret
   ```

4. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

## 🔗 Connect Frontend to Backend

After deploying, update your frontend:

1. **Update API Base URL**
   
   In your frontend JavaScript files, replace:
   ```javascript
   const API_URL = 'https://your-backend-url.onrender.com/api';
   ```

2. **Update Razorpay Config**
   
   Keep only the Key ID in frontend:
   ```javascript
   const RAZORPAY_CONFIG = {
       keyId: 'rzp_live_Rn3w5m3jxnc59J',
       // Secret removed - now on backend
   };
   ```

## 🧪 Testing the API

### Using cURL:

```bash
# Health check
curl https://your-backend-url.onrender.com/

# Get products
curl https://your-backend-url.onrender.com/api/products

# Initialize sample data
curl -X POST https://your-backend-url.onrender.com/api/initialize
```

### Using Postman:

1. Download Postman: https://www.postman.com/downloads/
2. Import the API endpoints
3. Test each endpoint

## 🔐 Security Notes

### ✅ DO:
- Keep .env file secret
- Use environment variables for sensitive data
- Regenerate Razorpay secret key
- Enable HTTPS on production
- Whitelist specific IPs in MongoDB

### ❌ DON'T:
- Commit .env file to Git
- Share API keys publicly
- Use same keys for test and production
- Disable CORS without understanding

## 📊 Monitoring

### Check Server Status:
```bash
# Visit your backend URL
https://your-backend-url.onrender.com/
```

### View Logs:
- **Render**: Dashboard → Logs tab
- **Railway**: Dashboard → Deployments → View Logs
- **Heroku**: `heroku logs --tail`

### Monitor Database:
- MongoDB Atlas Dashboard
- Collections → View Documents

## 🐛 Troubleshooting

### Server Won't Start:
1. Check Node.js version: `node --version`
2. Verify all dependencies installed: `npm install`
3. Check .env file exists and has correct values
4. Look for error messages in console

### Can't Connect to MongoDB:
1. Verify connection string is correct
2. Check IP whitelist in MongoDB Atlas
3. Ensure database user has correct permissions
4. Test connection string in MongoDB Compass

### Payment Verification Fails:
1. Verify Razorpay secret key is correct
2. Check webhook secret matches
3. Ensure signature verification logic is correct
4. Check Razorpay dashboard for payment status

### CORS Errors:
1. Verify frontend URL is correct
2. Check CORS configuration in server.js
3. Ensure credentials are included in requests

## 📞 Support

### Render.com:
- Docs: https://render.com/docs
- Support: https://render.com/support

### MongoDB:
- Docs: https://docs.mongodb.com
- Support: https://www.mongodb.com/support

### Razorpay:
- Docs: https://razorpay.com/docs
- Support: https://razorpay.com/support

## 🎯 Next Steps

1. ✅ Deploy backend to Render/Railway
2. ✅ Set up MongoDB Atlas
3. ✅ Configure environment variables
4. ✅ Initialize sample products
5. ✅ Test API endpoints
6. ✅ Connect frontend to backend
7. ✅ Test complete payment flow
8. ✅ Set up Razorpay webhooks

---

**🐸 Your backend is ready to deploy!**

All code is production-ready with proper error handling, security, and MongoDB integration.
