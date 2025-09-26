# TimeTracker - Simple, Elegant Time Tracking

A modern time tracking application built with Next.js, Supabase, and Stripe. Features a clean, distraction-free interface designed for freelancers, consultants, and small teams.

## ✨ Features

- **Simple Time Tracking** - One-click clock in/out with real-time session timer
- **Smart Analytics** - Daily, weekly, monthly summaries with overtime calculations
- **Export Reports** - Generate CSV, PDF, and Excel reports
- **California Labor Compliance** - Automatic overtime tracking for CA users
- **Subscription Management** - $1.99/month with Stripe integration
- **Responsive Design** - Works beautifully on desktop and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account
- A Stripe account (for payments)
- Docker (optional, for containerized development)

### Option 1: Standard Setup

#### 1. Clone and Install
```bash
git clone <repository-url>
cd timetracker
npm install
```

#### 2. Environment Variables
Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_subscription_price_id

# Security
JWT_SECRET=your_jwt_secret_min_32_characters
ENCRYPTION_KEY=your_encryption_key_32_characters

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn_for_error_tracking
```

#### 3. Database Setup
```bash
# Run database setup script
npm run db:setup

# Or manually in Supabase SQL editor:
# 1. Go to your Supabase project dashboard
# 2. Navigate to SQL Editor
# 3. Run the content of database/schema.sql
# 4. Enable Row Level Security in Authentication > Settings
```

#### 4. Stripe Configuration
1. Create a Stripe account and get your API keys
2. Create a product with $1.99/month recurring pricing
3. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Enable webhook events: `customer.subscription.*`, `invoice.*`

#### 5. Development Server
```bash
# Start development server
npm run dev

# Or with type checking
npm run dev & npm run type-check --watch
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Option 2: Docker Setup

#### 1. Using Docker Compose
```bash
# Copy environment file
cp .env.example .env.local
# Edit .env.local with your values

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

#### 2. Production-like Docker Setup
```bash
# Build and run with nginx
docker-compose --profile production up -d
```

The app will be available at:
- Development: http://localhost:3000
- With nginx: http://localhost:80

## 🌐 Production Deployment

### Option 1: Vercel (Recommended)

#### 1. Vercel Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Or connect GitHub repository through Vercel dashboard
```

#### 2. Environment Variables
Add all production environment variables in Vercel dashboard:
- Go to Project → Settings → Environment Variables
- Add each variable with production values
- Ensure NODE_ENV is set to "production"

#### 3. Custom Domain
- Add your custom domain in Vercel dashboard
- Configure DNS settings as instructed
- SSL certificate is automatically provisioned

### Option 2: Netlify

#### 1. Connect Repository
```bash
# Build and deploy manually
npm run build
netlify deploy --prod

# Or connect via Netlify dashboard
```

#### 2. Build Configuration
- Build command: `npm run build`
- Publish directory: `.next`
- Functions directory: `netlify/functions`

#### 3. Environment Variables
Add all environment variables in Netlify dashboard:
- Site settings → Environment variables
- Ensure all production values are set

### Option 3: Docker Production Deployment

#### 1. Build Production Image
```bash
# Build optimized production image
docker build -t timetracker-prod .

# Run in production mode
docker run -p 3000:3000 --env-file .env.production timetracker-prod
```

#### 2. Docker Compose Production
```bash
# Use production profile with nginx
docker-compose --profile production up -d

# Scale application instances
docker-compose --profile production up -d --scale app=3
```

#### 3. Kubernetes Deployment (Advanced)
```yaml
# See kubernetes/ directory for full k8s manifests
apiVersion: apps/v1
kind: Deployment
metadata:
  name: timetracker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: timetracker
  template:
    metadata:
      labels:
        app: timetracker
    spec:
      containers:
      - name: timetracker
        image: timetracker:latest
        ports:
        - containerPort: 3000
```

## 🔧 Production Configuration

### Environment Variables Checklist
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (Production Supabase URL)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production Supabase anon key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Production service role key)
- [ ] `STRIPE_SECRET_KEY` (Live Stripe secret key)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Live Stripe publishable key)
- [ ] `STRIPE_WEBHOOK_SECRET` (Production webhook secret)
- [ ] `STRIPE_PRICE_ID` (Live price ID)
- [ ] `JWT_SECRET` (Strong 32+ character secret)
- [ ] `ENCRYPTION_KEY` (Strong 32+ character key)
- [ ] `NEXT_PUBLIC_APP_URL` (Production domain)
- [ ] `SENTRY_DSN` (Optional: Error tracking)

### Security Checklist
- [ ] Enable HTTPS enforcement
- [ ] Configure security headers (CSP, HSTS, etc.)
- [ ] Set up rate limiting
- [ ] Enable Supabase Row Level Security
- [ ] Configure CORS policies
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Backup strategy for database

### Performance Optimization
- [ ] Enable CDN for static assets
- [ ] Configure image optimization
- [ ] Set up database connection pooling
- [ ] Enable gzip compression
- [ ] Configure caching headers
- [ ] Set up monitoring for Core Web Vitals
- [ ] Database query optimization

### Monitoring Setup
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Core Web Vitals)
- [ ] Uptime monitoring
- [ ] Database performance monitoring
- [ ] User analytics (optional)
- [ ] Log aggregation

## 📊 Database Schema

The app uses 5 main tables:
- `user_profiles` - User preferences and location data
- `time_entries` - Clock in/out records with duration calculations
- `subscriptions` - Stripe subscription management
- `export_configurations` - Automated export settings
- `labor_violations` - California labor law compliance tracking

## 🏗️ Architecture

```
TimeTracker/
├── Frontend (Next.js + React + TypeScript)
├── API Layer (Next.js API Routes)
├── Business Logic (Service Classes)
├── Database (Supabase PostgreSQL)
├── Authentication (Supabase Auth)
├── Payments (Stripe)
└── Deployment (Netlify)
```

## 📝 API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/signin` - User login
- `POST /api/v1/auth/signout` - User logout
- `GET /api/v1/auth/session` - Get current session

### Time Tracking
- `GET /api/v1/time/entries` - List time entries
- `POST /api/v1/time/entries` - Clock in
- `PATCH /api/v1/time/entries/[id]` - Clock out/update
- `GET /api/v1/time/active` - Get active session

### Subscription
- `GET /api/v1/subscription/status` - Get subscription status
- `POST /api/v1/subscription/checkout` - Create checkout session
- `POST /api/v1/subscription/portal` - Customer portal access

## 🧪 Testing

```bash
# Run tests
npm test

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 🔒 Security

- Row Level Security (RLS) policies on all database tables
- API route authentication middleware
- Subscription requirement enforcement
- Environment variable validation
- HTTPS enforcement in production

## 📈 Performance

- Server-side rendering with Next.js
- Automatic code splitting
- Optimized images and assets
- Edge deployment with Netlify
- Real-time updates with Supabase

## 💡 Development Notes

### Key Design Decisions
- **Simplicity First** - Clean, minimal interface focused on core functionality
- **TypeScript** - Full type safety across frontend and backend
- **Service Layer** - Business logic separated from API routes
- **Real-time** - Live session tracking with Supabase subscriptions

### Labor Law Compliance
The app automatically tracks overtime for California users:
- Over 8 hours/day = 1.5x overtime
- Over 12 hours/day = 2x overtime
- Over 40 hours/week = 1.5x overtime
- Meal break reminders for shifts > 5 hours

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review environment variable setup

---

**TimeTracker** - Simple, elegant time tracking for modern professionals.