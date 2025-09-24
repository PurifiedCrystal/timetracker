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
- A Supabase account
- A Stripe account (for payments)

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PRICE_ID=your_price_id

# App URL
NEXTAUTH_URL=http://localhost:3000
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
3. Enable Row Level Security policies

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🌐 Deployment to Netlify

### 1. Connect Repository
- Push your code to GitHub
- Connect the repository to Netlify

### 2. Configure Build Settings
- Build command: `npm run build`
- Publish directory: `.next`

### 3. Environment Variables
Add all environment variables from `.env.local` to Netlify:
- Go to Site settings → Environment variables
- Add each variable with production values

### 4. Supabase Setup
```sql
-- Run this in your Supabase SQL editor
-- (The complete schema is in database/schema.sql)
```

### 5. Stripe Configuration
- Create a product with $1.99/month pricing
- Set up webhook endpoints pointing to your Netlify domain
- Configure webhook events: `customer.subscription.*`, `invoice.*`

### 6. Deploy
- Netlify will automatically deploy on every push to main branch
- Your app will be available at `https://your-app-name.netlify.app`

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