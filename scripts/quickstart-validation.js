/**
 * T108: Complete quickstart validation
 * Validates the complete application setup and functionality
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

class QuickstartValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overall: 'pending',
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  // Main validation function
  async validate() {
    console.log('🚀 Starting TimeTracker Quickstart Validation...\n');

    await this.checkEnvironment();
    await this.checkDependencies();
    await this.checkConfiguration();
    await this.checkDatabase();
    await this.checkBuild();
    await this.checkAPIEndpoints();
    await this.checkExternalServices();
    await this.checkSecurity();
    await this.checkPerformance();

    this.generateReport();
    return this.results;
  }

  // Check system environment
  async checkEnvironment() {
    this.addCheck('Environment Check', 'Verifying system requirements');

    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

      if (majorVersion >= 18) {
        this.passCheck('Node.js version', `${nodeVersion} (✓ >= 18)`);
      } else {
        this.failCheck('Node.js version', `${nodeVersion} (✗ < 18 required)`);
      }

      // Check npm version
      try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        this.passCheck('npm version', npmVersion);
      } catch (error) {
        this.failCheck('npm version', 'npm not found');
      }

      // Check git
      try {
        const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
        this.passCheck('Git version', gitVersion);
      } catch (error) {
        this.warnCheck('Git version', 'Git not found (optional for development)');
      }

      // Check Docker (optional)
      try {
        const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
        this.passCheck('Docker version', dockerVersion);
      } catch (error) {
        this.warnCheck('Docker version', 'Docker not found (optional)');
      }

    } catch (error) {
      this.failCheck('Environment check', error.message);
    }
  }

  // Check project dependencies
  async checkDependencies() {
    this.addCheck('Dependencies Check', 'Verifying project dependencies');

    try {
      // Check if package.json exists
      if (fs.existsSync('package.json')) {
        this.passCheck('package.json', 'Found');

        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

        // Check key dependencies
        const requiredDeps = [
          'next',
          'react',
          'react-dom',
          '@supabase/supabase-js',
          'stripe',
          'typescript'
        ];

        for (const dep of requiredDeps) {
          if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
            this.passCheck(`Dependency: ${dep}`, 'Installed');
          } else {
            this.failCheck(`Dependency: ${dep}`, 'Missing');
          }
        }

        // Check if node_modules exists
        if (fs.existsSync('node_modules')) {
          this.passCheck('node_modules', 'Dependencies installed');
        } else {
          this.failCheck('node_modules', 'Run npm install');
        }

      } else {
        this.failCheck('package.json', 'Not found');
      }

    } catch (error) {
      this.failCheck('Dependencies check', error.message);
    }
  }

  // Check configuration
  async checkConfiguration() {
    this.addCheck('Configuration Check', 'Verifying environment configuration');

    try {
      // Check for environment file
      const envFiles = ['.env.local', '.env', '.env.development'];
      let envFound = false;

      for (const file of envFiles) {
        if (fs.existsSync(file)) {
          this.passCheck(`Environment file: ${file}`, 'Found');
          envFound = true;

          // Parse and check environment variables
          const envContent = fs.readFileSync(file, 'utf8');
          this.checkEnvironmentVariables(envContent);
          break;
        }
      }

      if (!envFound) {
        this.failCheck('Environment file', 'No .env file found');
      }

      // Check configuration files
      const configFiles = [
        'next.config.js',
        'tailwind.config.js',
        'tsconfig.json',
        'vercel.json'
      ];

      for (const file of configFiles) {
        if (fs.existsSync(file)) {
          this.passCheck(`Config: ${file}`, 'Found');
        } else {
          this.warnCheck(`Config: ${file}`, 'Not found (may be optional)');
        }
      }

    } catch (error) {
      this.failCheck('Configuration check', error.message);
    }
  }

  // Check environment variables
  checkEnvironmentVariables(envContent) {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'JWT_SECRET'
    ];

    const optionalVars = [
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_ID',
      'ENCRYPTION_KEY',
      'SENTRY_DSN'
    ];

    for (const varName of requiredVars) {
      if (envContent.includes(`${varName}=`)) {
        // Check if it's not just the placeholder
        const match = envContent.match(new RegExp(`${varName}=(.+)`));
        if (match && match[1] && !match[1].includes('your_') && !match[1].includes('placeholder')) {
          this.passCheck(`Required env: ${varName}`, 'Configured');
        } else {
          this.failCheck(`Required env: ${varName}`, 'Contains placeholder value');
        }
      } else {
        this.failCheck(`Required env: ${varName}`, 'Not found');
      }
    }

    for (const varName of optionalVars) {
      if (envContent.includes(`${varName}=`)) {
        this.passCheck(`Optional env: ${varName}`, 'Configured');
      } else {
        this.warnCheck(`Optional env: ${varName}`, 'Not configured (optional)');
      }
    }
  }

  // Check database connection
  async checkDatabase() {
    this.addCheck('Database Check', 'Verifying database connection');

    try {
      // Check if database schema file exists
      if (fs.existsSync('database/schema.sql')) {
        this.passCheck('Database schema', 'Found');
      } else {
        this.failCheck('Database schema', 'database/schema.sql not found');
      }

      // Try to connect to database (if running)
      try {
        const testEndpoint = 'http://localhost:3000/api/v1/auth/session';
        // This would require the server to be running
        this.warnCheck('Database connection', 'Requires server to be running for full test');
      } catch (error) {
        this.warnCheck('Database connection', 'Cannot test without running server');
      }

    } catch (error) {
      this.failCheck('Database check', error.message);
    }
  }

  // Check build process
  async checkBuild() {
    this.addCheck('Build Check', 'Verifying application builds successfully');

    try {
      console.log('📦 Running build process (this may take a moment)...');

      // Run type checking
      try {
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        this.passCheck('TypeScript compilation', 'No type errors');
      } catch (error) {
        this.failCheck('TypeScript compilation', 'Type errors found');
      }

      // Run linting
      try {
        execSync('npm run lint', { stdio: 'pipe' });
        this.passCheck('ESLint check', 'No linting errors');
      } catch (error) {
        this.warnCheck('ESLint check', 'Linting warnings/errors found');
      }

      // Run build
      try {
        execSync('npm run build', { stdio: 'pipe' });
        this.passCheck('Production build', 'Build successful');

        // Check if .next directory was created
        if (fs.existsSync('.next')) {
          this.passCheck('Build output', '.next directory created');
        } else {
          this.failCheck('Build output', '.next directory not found');
        }
      } catch (error) {
        this.failCheck('Production build', 'Build failed');
      }

    } catch (error) {
      this.failCheck('Build check', error.message);
    }
  }

  // Check API endpoints (requires running server)
  async checkAPIEndpoints() {
    this.addCheck('API Check', 'Checking API endpoints');

    const endpoints = [
      '/api/v1/auth/session',
      '/api/v1/user/profile',
      '/api/v1/time-entries',
      '/api/v1/exports/generate',
      '/api/v1/monitoring/metrics'
    ];

    // Note: This would require the development server to be running
    // For now, just check that the API route files exist
    for (const endpoint of endpoints) {
      const filePath = `src/app${endpoint.replace(/\[.*?\]/g, '[id]')}/route.ts`;
      if (fs.existsSync(filePath)) {
        this.passCheck(`API route: ${endpoint}`, 'File exists');
      } else {
        this.failCheck(`API route: ${endpoint}`, `File not found: ${filePath}`);
      }
    }
  }

  // Check external services
  async checkExternalServices() {
    this.addCheck('External Services', 'Checking external service connectivity');

    // Check Supabase URL accessibility
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        // Just check if URL is valid format
        new URL(supabaseUrl);
        this.passCheck('Supabase URL format', 'Valid URL format');
      } catch {
        this.failCheck('Supabase URL format', 'Invalid URL format');
      }
    }

    // Check Stripe API key format
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      if (stripeKey.startsWith('sk_')) {
        this.passCheck('Stripe key format', 'Valid format');
      } else {
        this.failCheck('Stripe key format', 'Invalid format (should start with sk_)');
      }
    }

    this.warnCheck('Service connectivity', 'Full connectivity test requires running server');
  }

  // Check security configuration
  async checkSecurity() {
    this.addCheck('Security Check', 'Verifying security configuration');

    // Check JWT secret length
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      if (jwtSecret.length >= 32) {
        this.passCheck('JWT secret strength', 'Sufficient length (≥32 chars)');
      } else {
        this.failCheck('JWT secret strength', 'Too short (<32 chars)');
      }
    }

    // Check for .env in .gitignore
    if (fs.existsSync('.gitignore')) {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      if (gitignore.includes('.env')) {
        this.passCheck('Environment security', '.env files in .gitignore');
      } else {
        this.failCheck('Environment security', '.env files not in .gitignore');
      }
    }

    // Check for security headers configuration
    if (fs.existsSync('vercel.json')) {
      const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
      if (vercelConfig.headers) {
        this.passCheck('Security headers', 'Configured in vercel.json');
      } else {
        this.warnCheck('Security headers', 'Not configured in vercel.json');
      }
    }
  }

  // Check performance configuration
  async checkPerformance() {
    this.addCheck('Performance Check', 'Checking performance optimizations');

    // Check Next.js configuration
    if (fs.existsSync('next.config.js')) {
      this.passCheck('Next.js config', 'Configuration file found');
    } else {
      this.warnCheck('Next.js config', 'Default configuration (may want to optimize)');
    }

    // Check for monitoring setup
    const monitoringFiles = [
      'src/lib/monitoring.ts',
      'src/lib/core-web-vitals.ts',
      'src/lib/performance-testing.ts'
    ];

    for (const file of monitoringFiles) {
      if (fs.existsSync(file)) {
        this.passCheck(`Monitoring: ${path.basename(file)}`, 'Implemented');
      } else {
        this.warnCheck(`Monitoring: ${path.basename(file)}`, 'Not implemented');
      }
    }
  }

  // Utility methods
  addCheck(category, description) {
    console.log(`\n📋 ${category}: ${description}`);
  }

  passCheck(name, detail) {
    console.log(`  ✅ ${name}: ${detail}`);
    this.results.checks.push({
      name,
      status: 'pass',
      detail,
      timestamp: new Date().toISOString()
    });
    this.results.summary.passed++;
    this.results.summary.total++;
  }

  failCheck(name, detail) {
    console.log(`  ❌ ${name}: ${detail}`);
    this.results.checks.push({
      name,
      status: 'fail',
      detail,
      timestamp: new Date().toISOString()
    });
    this.results.summary.failed++;
    this.results.summary.total++;
  }

  warnCheck(name, detail) {
    console.log(`  ⚠️  ${name}: ${detail}`);
    this.results.checks.push({
      name,
      status: 'warning',
      detail,
      timestamp: new Date().toISOString()
    });
    this.results.summary.warnings++;
    this.results.summary.total++;
  }

  generateReport() {
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('='.repeat(50));

    const { total, passed, failed, warnings } = this.results.summary;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    console.log(`Total Checks: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Warnings: ${warnings} ⚠️`);
    console.log(`Success Rate: ${successRate}%`);

    // Determine overall status
    if (failed === 0 && warnings === 0) {
      this.results.overall = 'excellent';
      console.log('\n🎉 EXCELLENT: All checks passed!');
    } else if (failed === 0) {
      this.results.overall = 'good';
      console.log('\n✅ GOOD: All critical checks passed, some warnings to review');
    } else if (failed <= 2) {
      this.results.overall = 'needs_work';
      console.log('\n⚠️ NEEDS WORK: Some critical issues to fix');
    } else {
      this.results.overall = 'critical';
      console.log('\n❌ CRITICAL: Multiple issues need immediate attention');
    }

    // Show failed checks
    if (failed > 0) {
      console.log('\n🔧 ISSUES TO FIX:');
      this.results.checks
        .filter(check => check.status === 'fail')
        .forEach(check => {
          console.log(`  • ${check.name}: ${check.detail}`);
        });
    }

    // Show warnings
    if (warnings > 0) {
      console.log('\n📋 RECOMMENDATIONS:');
      this.results.checks
        .filter(check => check.status === 'warning')
        .forEach(check => {
          console.log(`  • ${check.name}: ${check.detail}`);
        });
    }

    console.log('\n🚀 Next Steps:');
    if (failed > 0) {
      console.log('  1. Fix the critical issues listed above');
      console.log('  2. Re-run validation: node scripts/quickstart-validation.js');
    } else {
      console.log('  1. Start the development server: npm run dev');
      console.log('  2. Open http://localhost:3000 in your browser');
      console.log('  3. Test the application functionality');
    }

    // Save report to file
    const reportFile = `validation-report-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Full report saved to: ${reportFile}`);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new QuickstartValidator();
  validator.validate()
    .then(() => {
      const exitCode = validator.results.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = QuickstartValidator;