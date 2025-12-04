# Pharmacy Delivery System - Deployment Guide

## 🚀 Deployment Overview

Complete deployment instructions for:
- Backend API Server
- Admin Web Panel
- Mobile App (Android APK)

## 📋 Prerequisites

### System Requirements
- Node.js 16+ 
- npm or yarn
- Git
- Android Studio (for mobile app build)
- Web hosting (for admin panel)

### Environment Variables
Create `.env` file in root directory:
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
```

## 🖥️ Backend API Deployment

### 1. Production Build
```bash
# Install dependencies
npm install --production

# Set environment
export NODE_ENV=production

# Start production server
node server.js
```

### 2. Process Manager (PM2)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name "pharmacy-api"

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

### 3. Nginx Reverse Proxy (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        proxy_pass http://localhost:3000;
    }
}
```

## 🌐 Admin Panel Deployment

### 1. Build for Production
```bash
cd pharmacy-admin

# Install dependencies
npm install

# Build production version
npm run build

# Test production build locally
npx serve -s build -l 3001
```

### 2. Deploy to Static Hosting

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=pharmacy-admin/build
```

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd pharmacy-admin
vercel --prod
```

#### Traditional Web Hosting
1. Copy `pharmacy-admin/build` folder to web server
2. Configure domain to point to build folder
3. Update API URL in production build

### 3. Environment Configuration
Create `.env.production` in `pharmacy-admin`:
```env
REACT_APP_API_URL=https://your-domain.com/api
GENERATE_SOURCEMAP=false
```

## 📱 Mobile App Deployment

### 1. Android APK Build
```bash
cd pharmacy-app

# Install dependencies
npm install

# Start Expo build
npx expo build:android

# Choose build type:
# - APK (for testing/side-loading)
# - AAB (for Google Play Store)
```

### 2. Configuration Updates
Update `app.json` for production:
```json
{
  "expo": {
    "name": "Pharmacy Delivery",
    "slug": "pharmacy-delivery",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "platforms": ["android"],
    "android": {
      "package": "com.pharmacy.delivery",
      "versionCode": 1
    }
  }
}
```

### 3. API URL Configuration
Update `services/api.js` for production:
```javascript
const API_BASE_URL = 'https://your-domain.com/api';
```

## 🔧 Production Optimizations

### 1. Database Optimization
```bash
# Backup database
cp database.sqlite database.backup.sqlite

# Run VACUUM to optimize
sqlite3 database.sqlite 'VACUUM;'

# Create indexes for performance
sqlite3 database.sqlite 'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);'
sqlite3 database.sqlite 'CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);'
```

### 2. Security Headers
Add to `server.js`:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

## 📊 Monitoring & Logging

### 1. Application Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. Health Checks
```javascript
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await Database.get('SELECT 1');
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: 'Database connection failed'
    });
  }
});
```

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy Pharmacy System

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          # Your deployment script here
          echo "Deploying API to production server"

  deploy-admin:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and deploy admin panel
        run: |
          cd pharmacy-admin
          npm install
          npm run build
          # Deploy to hosting provider
```

## 🌍 Domain Configuration

### 1. DNS Settings
```
A Record: @ -> YOUR_SERVER_IP
A Record: api -> YOUR_SERVER_IP
CNAME: www -> your-domain.com
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📱 Google Play Store Submission

### 1. Prepare Release
```bash
# Generate signed AAB
npx expo build:android --type app-bundle

# Download AAB file
# Upload to Google Play Console
```

### 2. Store Listing Requirements
- App icon (512x512)
- Feature graphic (1024x500)
- Screenshots (phone and tablet)
- App description
- Privacy policy URL
- Content rating questionnaire

## 🔍 Post-Deployment Checklist

### Backend
- [ ] API endpoints responding correctly
- [ ] Database connections stable
- [ ] Authentication working
- [ ] File uploads functioning
- [ ] Error logging active
- [ ] Health checks passing

### Admin Panel
- [ ] Loading at correct URL
- [ ] API connectivity working
- [ ] Authentication flow working
- [ ] All pages loading
- [ ] Responsive design working
- [ ] Error handling functional

### Mobile App
- [ ] APK installs successfully
- [ ] API connectivity working
- [ ] All screens functional
- [ ] Image upload working
- [ ] Push notifications (if implemented)
- [ ] Performance acceptable

## 🆘 Troubleshooting

### Common Issues

#### API Connection Errors
```bash
# Check if server is running
curl http://localhost:3000/health

# Check logs
pm2 logs pharmacy-api

# Restart if needed
pm2 restart pharmacy-api
```

#### Admin Panel Not Loading
```bash
# Check build
cd pharmacy-admin
npm run build

# Serve locally to test
npx serve -s build -l 3001
```

#### Mobile App API Issues
```bash
# Check network connectivity
# Verify API URL in app configuration
# Check CORS settings on server
```

## 📞 Support Contacts

For deployment issues:
- Technical Support: tech@pharmacy.com
- Documentation: docs@pharmacy.com
- Emergency: +1-555-PHARMACY

---

**Deployment Complete! 🎉**

Your pharmacy delivery system is now live and ready for customers.
