# 🏥 Pharmacy Delivery System

A complete pharmacy delivery management system with mobile customer app and web admin panel.

## 📱 System Overview

- **Mobile App**: React Native application for customers to order medications
- **Admin Panel**: React web application for pharmacy management
- **Backend API**: Node.js/Express REST API with SQLite database

## ✨ Key Features

### Customer Experience
- 🔐 Secure user registration and authentication
- 💊 Browse and search medications
- 🛒 Smart shopping cart management
- 📸 Prescription upload functionality
- 📦 Real-time order tracking
- 💳 Multiple payment options
- 📍 Delivery address management

### Admin Experience
- 📊 Comprehensive dashboard with analytics
- 📦 Complete order management workflow
- 💊 Drug inventory management (CRUD)
- 📋 Prescription viewer and management
- 📈 Sales analytics and reporting
- 🎯 Performance insights
- 📱 Real-time status updates

### Technical Features
- 🔒 JWT-based authentication
- 🗄️ SQLite database with proper relations
- 📤 File upload handling for prescriptions
- 🔄 Real-time status synchronization
- 📱 Responsive design
- ⚡ Optimized performance
- 🛡️ Security best practices

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd pharmacy-delivery-system
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database**
```bash
node scripts/migrate.js
node scripts/seed.js
node scripts/add-cart-table.js
```

5. **Start backend server**
```bash
node server.js
```

6. **Setup admin panel**
```bash
cd pharmacy-admin
npm install
npm start
```

7. **Setup mobile app**
```bash
cd pharmacy-app
npm install
npx expo start
```

## 🔐 Demo Credentials

### User Account
- **Email**: demo@user.com
- **Password**: password123

### Admin Account
- **Email**: admin@pharmacy.com
- **Password**: admin123

## 📁 Project Structure

```
pharmacy-delivery-system/
├── 📂 backend/
│   ├── 🗄️ database.sqlite
│   ├── 📂 uploads/
│   ├── 📂 models/
│   ├── 📂 routes/
│   ├── 📂 middleware/
│   ├── 📂 utils/
│   ├── 📂 scripts/
│   └── 📄 server.js
├── 📂 pharmacy-admin/
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   ├── 📂 contexts/
│   │   ├── 📂 pages/
│   │   ├── 📂 services/
│   │   └── 📄 App.js
│   ├── 📂 build/
│   └── 📄 package.json
├── 📂 pharmacy-app/
│   ├── 📂 screens/
│   ├── 📂 utils/
│   ├── 📂 services/
│   ├── 📄 App.js
│   └── 📄 package.json
├── 📄 DEMO.md
├── 📄 DEPLOYMENT.md
└── 📄 README.md
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT
- **File Upload**: Multer
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

### Admin Panel
- **Framework**: React
- **Routing**: React Router
- **HTTP Client**: Axios
- **Styling**: CSS Modules
- **State Management**: Context API

### Mobile App
- **Framework**: React Native
- **Navigation**: React Navigation
- **State Management**: Context API
- **Storage**: AsyncStorage
- **HTTP Client**: Axios
- **UI Components**: React Native Elements

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login

### Drugs
- `GET /api/drugs` - List all drugs
- `GET /api/drugs/:id` - Get drug details
- `POST /api/admin/drugs` - Add new drug (Admin)
- `PUT /api/admin/drugs/:id` - Update drug (Admin)
- `DELETE /api/admin/drugs/:id` - Delete drug (Admin)

### Cart
- `POST /api/cart/add` - Add item to cart
- `GET /api/cart` - Get user cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove cart item

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `GET /api/admin/orders` - Get all orders (Admin)
- `PUT /api/admin/orders/:id/status` - Update order status (Admin)

### Prescriptions
- `POST /api/prescriptions/upload` - Upload prescription
- `GET /api/prescriptions/:orderId` - Get prescription

## 🧪 Testing

### Integration Tests
```bash
# Run comprehensive integration tests
node test-integration.js

# Run simple connectivity test
node simple-test.js
```

### Test Coverage
- ✅ User authentication flow
- ✅ Admin authentication flow
- ✅ Drug management operations
- ✅ Cart operations
- ✅ Order creation and tracking
- ✅ Prescription upload
- ✅ API error handling

## 📱 Mobile App Features

### Screens
- **Login/Signup**: User authentication
- **Drug List**: Browse medications with search
- **Drug Detail**: View detailed drug information
- **Cart**: Shopping cart management
- **Checkout**: Complete order process
- **Order List**: View order history
- **Order Detail**: Track specific orders

### Capabilities
- 🔍 Real-time search
- 📸 Camera integration for prescriptions
- 🔄 Pull-to-refresh
- 📱 Responsive design
- 💾 Offline data persistence
- 🔔 Local notifications

## 🖥️ Admin Panel Features

### Pages
- **Dashboard**: Overview with key metrics
- **Orders**: Order management with status updates
- **Drugs**: Inventory management
- **Reports**: Sales analytics and insights

### Capabilities
- 📊 Real-time statistics
- 🔍 Advanced filtering and search
- 📸 Prescription image viewer
- 📈 Data visualization
- 🔄 Live status updates
- 📱 Responsive design

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Proper cross-origin setup
- **File Upload Security**: Type and size validation
- **SQL Injection Protection**: Parameterized queries

## 📈 Performance Optimizations

- **Database Indexing**: Optimized query performance
- **Image Compression**: Efficient file handling
- **Caching Strategy**: Response caching where appropriate
- **Bundle Optimization**: Minified production builds
- **Lazy Loading**: Component lazy loading in admin panel
- **Connection Pooling**: Efficient database connections

## 🚀 Deployment

### Backend Deployment
```bash
# Production setup
npm install --production
export NODE_ENV=production
node server.js

# With PM2 (recommended)
npm install -g pm2
pm2 start server.js --name pharmacy-api
```

### Admin Panel Deployment
```bash
cd pharmacy-admin
npm run build

# Deploy to static hosting
# Netlify, Vercel, or traditional web server
```

### Mobile App Deployment
```bash
cd pharmacy-app
npx expo build:android

# Generate APK for testing
# Generate AAB for Play Store
```

## 📋 Database Schema

### Tables
- **users**: Customer information
- **admins**: Admin accounts
- **drugs**: Medication inventory
- **orders**: Order records
- **order_items**: Order line items
- **cart_items**: Shopping cart data
- **prescriptions**: Prescription images

### Relationships
- Users → Orders (1:many)
- Orders → Order Items (1:many)
- Orders → Prescriptions (1:1, optional)
- Drugs → Order Items (1:many)
- Drugs → Cart Items (1:many)

## 🔄 Development Workflow

### Environment Setup
1. Development environment with hot reload
2. Database migrations and seeding
3. Environment variable configuration
4. API documentation with Swagger (optional)

### Code Quality
- ESLint configuration
- Prettier code formatting
- Git hooks for pre-commit checks
- Comprehensive error handling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For technical support:
- 📧 Email: support@pharmacy-delivery.com
- 📱 Phone: +1-555-PHARMACY
- 💬 Live Chat: Available on admin panel

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React Native team for amazing mobile framework
- Express.js community for robust backend tools
- SQLite for lightweight database solution
- Open source contributors and libraries

---

**🎉 Thank you for using Pharmacy Delivery System!**

Built with ❤️ for modern pharmacy management.
