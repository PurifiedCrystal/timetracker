# Production Environment Setup Checklist
# T107: Complete production deployment and configuration guide

## 🚀 Pre-Deployment Checklist

### 1. Code Quality & Testing
- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds without errors (`npm run build`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Performance tests completed
- [ ] Security audit completed
- [ ] Code review approved

### 2. Environment Configuration
- [ ] Production environment variables configured
- [ ] Secrets properly secured (not in code)
- [ ] API keys and tokens validated
- [ ] Database connection strings updated
- [ ] Third-party service credentials verified

### 3. Database Setup
- [ ] Production database created
- [ ] Schema migrations applied
- [ ] Row Level Security (RLS) enabled
- [ ] Database indexes created
- [ ] Backup strategy configured
- [ ] Connection pooling setup

### 4. External Services
- [ ] Supabase production project configured
- [ ] Stripe live mode activated
- [ ] Webhook endpoints configured
- [ ] DNS records configured
- [ ] SSL certificates provisioned

## 🔧 Production Configuration

### Required Environment Variables

#### Supabase Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

#### Stripe Configuration
```env
STRIPE_SECRET_KEY=sk_live_...your-live-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...your-live-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_...your-webhook-secret
STRIPE_PRICE_ID=price_...your-subscription-price-id
```

#### Security Configuration
```env
JWT_SECRET=your-strong-jwt-secret-32-characters-minimum
ENCRYPTION_KEY=your-encryption-key-32-characters-minimum
NEXTAUTH_SECRET=your-nextauth-secret-for-session-encryption
```

#### Application Configuration
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
```

#### Optional Monitoring
```env
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### Security Configuration

#### 1. Supabase Security
- [ ] Row Level Security enabled on all tables
- [ ] API access restricted to authenticated users
- [ ] Database roles and permissions configured
- [ ] CORS settings configured for production domain
- [ ] Rate limiting enabled

#### 2. Application Security
- [ ] HTTPS enforcement enabled
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Input validation on all endpoints
- [ ] Authentication middleware applied
- [ ] CSRF protection enabled
- [ ] Rate limiting middleware active

#### 3. Infrastructure Security
- [ ] Firewall rules configured
- [ ] VPN/private network access (if applicable)
- [ ] Regular security updates scheduled
- [ ] Backup encryption enabled
- [ ] Log retention policies configured

## 🚀 Deployment Steps

### Vercel Deployment

#### 1. Project Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

#### 2. Configure Build Settings
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci"
}
```

#### 3. Deploy
```bash
# Deploy to production
vercel --prod

# Or setup automatic deployments via GitHub integration
```

### Alternative: Docker Deployment

#### 1. Build Production Image
```bash
# Build optimized image
docker build -t timetracker:latest .

# Tag for registry
docker tag timetracker:latest your-registry/timetracker:latest

# Push to registry
docker push your-registry/timetracker:latest
```

#### 2. Deploy with Docker Compose
```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 📊 Post-Deployment Verification

### 1. Functionality Tests
- [ ] User registration works
- [ ] User login/logout works
- [ ] Time tracking (clock in/out) functions
- [ ] Export generation works
- [ ] Subscription flow functions
- [ ] Email notifications sent
- [ ] Database operations successful

### 2. Performance Checks
- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms
- [ ] Core Web Vitals in good range
- [ ] No memory leaks detected
- [ ] Database query performance acceptable

### 3. Security Verification
- [ ] HTTPS redirects work
- [ ] Security headers present
- [ ] Authentication required for protected routes
- [ ] Rate limiting active
- [ ] No sensitive data in client code
- [ ] Error messages don't leak information

### 4. Integration Tests
- [ ] Stripe webhooks receive events
- [ ] Supabase real-time updates work
- [ ] Email delivery functions
- [ ] Third-party APIs accessible
- [ ] Monitoring systems receiving data

## 🔍 Monitoring & Alerting Setup

### 1. Error Monitoring
- [ ] Sentry configured for error tracking
- [ ] Error alerts configured
- [ ] Performance monitoring active
- [ ] User feedback collection setup

### 2. Performance Monitoring
- [ ] Core Web Vitals tracking active
- [ ] API endpoint monitoring
- [ ] Database performance monitoring
- [ ] Resource usage monitoring

### 3. Uptime Monitoring
- [ ] External uptime monitoring service
- [ ] Health check endpoints configured
- [ ] Alert notifications setup
- [ ] Status page configured (optional)

### 4. Business Metrics
- [ ] User registration tracking
- [ ] Subscription conversion tracking
- [ ] Feature usage analytics
- [ ] Revenue tracking

## 🔄 Maintenance & Updates

### Regular Tasks
- [ ] Weekly dependency updates
- [ ] Monthly security patches
- [ ] Quarterly performance reviews
- [ ] Annual security audits

### Backup Strategy
- [ ] Daily database backups
- [ ] Weekly full system backups
- [ ] Monthly backup restoration tests
- [ ] Offsite backup storage

### Update Process
- [ ] Staging environment for testing
- [ ] Blue-green deployment strategy
- [ ] Rollback procedures documented
- [ ] Database migration strategy

## 🆘 Troubleshooting Guide

### Common Issues

#### Build Failures
1. Check Node.js version compatibility
2. Clear node_modules and package-lock.json
3. Verify all environment variables
4. Check TypeScript errors

#### Database Connection Issues
1. Verify Supabase URL and keys
2. Check network connectivity
3. Verify SSL settings
4. Check rate limiting

#### Stripe Integration Issues
1. Verify webhook endpoint URL
2. Check webhook secret
3. Verify product and price IDs
4. Test in Stripe dashboard

#### Performance Issues
1. Enable Next.js production optimizations
2. Check database query performance
3. Verify CDN configuration
4. Review bundle size

### Emergency Procedures
- [ ] Rollback procedure documented
- [ ] Emergency contact list updated
- [ ] Incident response plan ready
- [ ] Communication channels established

## ✅ Go-Live Checklist

### Final Steps Before Launch
- [ ] All checklist items completed
- [ ] Stakeholder approval obtained
- [ ] DNS propagation completed
- [ ] SSL certificates active
- [ ] Monitoring alerts configured
- [ ] Team notified of launch
- [ ] Documentation updated
- [ ] Support procedures ready

### Launch Day Tasks
- [ ] Final smoke tests
- [ ] Monitor error rates
- [ ] Watch performance metrics
- [ ] Track user registrations
- [ ] Monitor payment processing
- [ ] Check all integrations

### Post-Launch (First Week)
- [ ] Daily performance reviews
- [ ] User feedback collection
- [ ] Bug triage and fixes
- [ ] Performance optimization
- [ ] Monitor business metrics

---

**Production Environment Setup Complete** ✅

Contact: [Support Email/Slack Channel]
Last Updated: $(date)
Version: 1.0