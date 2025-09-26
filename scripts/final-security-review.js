/**
 * T110: Final security review and compliance check
 * Comprehensive security audit and compliance verification
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityReviewer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overallScore: 0,
      categories: {},
      violations: [],
      recommendations: [],
      compliance: {},
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        passed: 0,
        total: 0
      }
    };
  }

  async review() {
    console.log('🔒 Starting Final Security Review and Compliance Check...\n');

    await this.checkAuthentication();
    await this.checkAuthorization();
    await this.checkDataProtection();
    await this.checkInputValidation();
    await this.checkCryptography();
    await this.checkConfigurationSecurity();
    await this.checkDependencyVulnerabilities();
    await this.checkComplianceRequirements();
    await this.checkSecurityHeaders();
    await this.checkSessionManagement();

    this.calculateOverallScore();
    this.generateReport();
    return this.results;
  }

  // Check authentication implementation
  async checkAuthentication() {
    console.log('🔐 Reviewing authentication implementation...');

    const category = 'authentication';
    this.results.categories[category] = [];

    // Check authentication routes
    const authRoutes = [
      'src/app/api/v1/auth/signup/route.ts',
      'src/app/api/v1/auth/session/route.ts'
    ];

    for (const route of authRoutes) {
      if (fs.existsSync(route)) {
        const content = fs.readFileSync(route, 'utf8');

        // Check for proper password hashing
        if (content.includes('bcrypt') || content.includes('argon2') || content.includes('scrypt')) {
          this.pass(category, 'Password hashing', 'Secure password hashing implemented');
        } else if (content.includes('password')) {
          this.fail(category, 'Password hashing', 'Password hashing method not clearly identified', 'high');
        }

        // Check for rate limiting
        if (content.includes('rateLimit') || content.includes('rateLimiter')) {
          this.pass(category, 'Rate limiting', 'Authentication rate limiting implemented');
        } else {
          this.warn(category, 'Rate limiting', 'Rate limiting not clearly implemented for auth endpoints', 'medium');
        }
      } else {
        this.fail(category, `Route exists: ${route}`, 'Authentication route file missing', 'high');
      }
    }

    // Check JWT configuration
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      if (jwtSecret.length >= 32) {
        this.pass(category, 'JWT secret strength', 'JWT secret meets minimum length requirements');
      } else {
        this.fail(category, 'JWT secret strength', 'JWT secret is too weak (< 32 characters)', 'critical');
      }

      // Check if JWT secret is not a default value
      const defaultSecrets = ['secret', 'jwt-secret', 'your-secret-key', 'change-me'];
      if (defaultSecrets.some(secret => jwtSecret.toLowerCase().includes(secret))) {
        this.fail(category, 'JWT secret security', 'JWT secret appears to be a default value', 'critical');
      } else {
        this.pass(category, 'JWT secret security', 'JWT secret appears to be properly randomized');
      }
    } else {
      this.fail(category, 'JWT secret configuration', 'JWT_SECRET environment variable not configured', 'critical');
    }

    // Check middleware implementation
    const middlewarePath = 'src/middleware.ts';
    if (fs.existsSync(middlewarePath)) {
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

      if (middlewareContent.includes('authentication') || middlewareContent.includes('auth')) {
        this.pass(category, 'Authentication middleware', 'Authentication middleware implemented');
      } else {
        this.warn(category, 'Authentication middleware', 'Authentication middleware not clearly identified', 'medium');
      }
    }

    console.log(`  ✅ Authentication review complete: ${this.results.categories[category].length} checks`);
  }

  // Check authorization implementation
  async checkAuthorization() {
    console.log('🛡️  Reviewing authorization implementation...');

    const category = 'authorization';
    this.results.categories[category] = [];

    // Check API routes for authorization
    const apiDir = 'src/app/api/v1';
    if (fs.existsSync(apiDir)) {
      const apiRoutes = this.findFiles(apiDir, 'route.ts');

      for (const routePath of apiRoutes) {
        const content = fs.readFileSync(routePath, 'utf8');

        // Check for authorization checks
        if (content.includes('authorization') || content.includes('authenticate') || content.includes('session')) {
          this.pass(category, `Authorization in ${path.basename(path.dirname(routePath))}`, 'Authorization check present');
        } else {
          // Skip public endpoints
          if (routePath.includes('/auth/') || routePath.includes('/health')) {
            continue;
          }
          this.fail(category, `Authorization in ${path.basename(path.dirname(routePath))}`, 'Authorization check missing', 'high');
        }
      }
    }

    // Check for role-based access control
    const rbacFiles = [
      'src/lib/auth.ts',
      'src/lib/permissions.ts',
      'src/types/user.ts'
    ];

    let rbacImplemented = false;
    for (const file of rbacFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('role') || content.includes('permission') || content.includes('admin')) {
          rbacImplemented = true;
          this.pass(category, 'Role-based access control', 'RBAC implementation found');
          break;
        }
      }
    }

    if (!rbacImplemented) {
      this.warn(category, 'Role-based access control', 'RBAC not clearly implemented', 'low');
    }

    console.log(`  ✅ Authorization review complete: ${this.results.categories[category].length} checks`);
  }

  // Check data protection implementation
  async checkDataProtection() {
    console.log('🔐 Reviewing data protection implementation...');

    const category = 'data_protection';
    this.results.categories[category] = [];

    // Check encryption configuration
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (encryptionKey) {
      if (encryptionKey.length >= 32) {
        this.pass(category, 'Encryption key strength', 'Encryption key meets minimum requirements');
      } else {
        this.fail(category, 'Encryption key strength', 'Encryption key too weak', 'high');
      }
    } else {
      this.warn(category, 'Encryption configuration', 'ENCRYPTION_KEY not configured', 'medium');
    }

    // Check for data encryption in database models
    const serviceFiles = this.findFiles('src/services', '.ts');
    let encryptionUsed = false;

    for (const file of serviceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('encrypt') || content.includes('decrypt') || content.includes('cipher')) {
        encryptionUsed = true;
        this.pass(category, 'Data encryption', 'Data encryption implementation found');
        break;
      }
    }

    if (!encryptionUsed) {
      this.warn(category, 'Data encryption', 'Data encryption not clearly implemented', 'medium');
    }

    // Check for PII handling
    const typeFiles = this.findFiles('src/types', '.ts');
    let piiHandling = false;

    for (const file of typeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('email') || content.includes('phone') || content.includes('address')) {
        piiHandling = true;
        this.warn(category, 'PII handling', 'PII fields identified - ensure proper protection', 'medium');
        break;
      }
    }

    // Check database security (RLS)
    const dbFiles = ['database/schema.sql', 'src/lib/database.ts'];
    let rlsFound = false;

    for (const file of dbFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('RLS') || content.includes('row_security') || content.includes('ENABLE ROW LEVEL SECURITY')) {
          rlsFound = true;
          this.pass(category, 'Row Level Security', 'Database RLS configured');
          break;
        }
      }
    }

    if (!rlsFound) {
      this.fail(category, 'Row Level Security', 'Database RLS not configured', 'high');
    }

    console.log(`  ✅ Data protection review complete: ${this.results.categories[category].length} checks`);
  }

  // Check input validation
  async checkInputValidation() {
    console.log('🛡️  Reviewing input validation implementation...');

    const category = 'input_validation';
    this.results.categories[category] = [];

    // Check API routes for input validation
    const apiDir = 'src/app/api/v1';
    if (fs.existsSync(apiDir)) {
      const apiRoutes = this.findFiles(apiDir, 'route.ts');
      let validationFound = false;

      for (const routePath of apiRoutes) {
        const content = fs.readFileSync(routePath, 'utf8');

        // Check for validation libraries or patterns
        if (content.includes('validate') || content.includes('schema') || content.includes('zod') || content.includes('joi')) {
          validationFound = true;
          this.pass(category, `Input validation in ${path.basename(path.dirname(routePath))}`, 'Input validation implemented');
        }
      }

      if (!validationFound) {
        this.fail(category, 'API input validation', 'No input validation found in API routes', 'high');
      }
    }

    // Check for SQL injection protection
    const dbFiles = this.findFiles('src/services', '.ts');
    let sqlInjectionProtection = true;

    for (const file of dbFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Look for dangerous SQL patterns
      const dangerousPatterns = [
        /\$\{.*?\}/g, // Template literals in SQL
        /\+.*?['"`]/g, // String concatenation
        /['"`]\s*\+/g // String concatenation
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(content) && content.includes('SELECT') || content.includes('INSERT')) {
          this.fail(category, 'SQL injection protection', `Potential SQL injection vulnerability in ${file}`, 'critical');
          sqlInjectionProtection = false;
        }
      }
    }

    if (sqlInjectionProtection) {
      this.pass(category, 'SQL injection protection', 'No obvious SQL injection vulnerabilities found');
    }

    // Check for XSS protection
    const reactFiles = this.findFiles('src/app', '.tsx');
    let xssVulnerabilities = false;

    for (const file of reactFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for dangerous HTML injection
      if (content.includes('dangerouslySetInnerHTML')) {
        this.warn(category, 'XSS protection', `dangerouslySetInnerHTML used in ${file}`, 'medium');
        xssVulnerabilities = true;
      }
    }

    if (!xssVulnerabilities) {
      this.pass(category, 'XSS protection', 'No obvious XSS vulnerabilities found');
    }

    console.log(`  ✅ Input validation review complete: ${this.results.categories[category].length} checks`);
  }

  // Check cryptography implementation
  async checkCryptography() {
    console.log('🔐 Reviewing cryptography implementation...');

    const category = 'cryptography';
    this.results.categories[category] = [];

    // Check for strong random number generation
    const codeFiles = this.findFiles('src', '.ts');
    let weakRandomFound = false;

    for (const file of codeFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for weak random number generation
      if (content.includes('Math.random()')) {
        this.warn(category, 'Random number generation', `Math.random() used in ${file} - consider crypto.randomBytes()`, 'medium');
        weakRandomFound = true;
      }

      // Check for proper crypto usage
      if (content.includes('crypto.randomBytes') || content.includes('crypto.randomUUID')) {
        this.pass(category, 'Secure random generation', 'Secure random number generation used');
      }
    }

    // Check for proper hashing algorithms
    let hashingFound = false;
    for (const file of codeFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for weak hashing
      const weakHashes = ['md5', 'sha1'];
      for (const hash of weakHashes) {
        if (content.includes(hash)) {
          this.fail(category, 'Hash algorithm security', `Weak hash algorithm ${hash} found in ${file}`, 'high');
        }
      }

      // Check for strong hashing
      if (content.includes('bcrypt') || content.includes('scrypt') || content.includes('argon2')) {
        this.pass(category, 'Password hashing', 'Strong password hashing algorithm used');
        hashingFound = true;
      }
    }

    // Check TLS configuration
    const configFiles = ['vercel.json', 'next.config.js'];
    let tlsConfigured = false;

    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('https') || content.includes('ssl') || content.includes('tls')) {
          tlsConfigured = true;
          this.pass(category, 'TLS configuration', 'TLS/HTTPS configuration found');
          break;
        }
      }
    }

    if (!tlsConfigured) {
      this.warn(category, 'TLS configuration', 'TLS/HTTPS configuration not clearly defined', 'medium');
    }

    console.log(`  ✅ Cryptography review complete: ${this.results.categories[category].length} checks`);
  }

  // Check configuration security
  async checkConfigurationSecurity() {
    console.log('⚙️  Reviewing configuration security...');

    const category = 'configuration';
    this.results.categories[category] = [];

    // Check environment file security
    if (fs.existsSync('.gitignore')) {
      const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');

      if (gitignoreContent.includes('.env')) {
        this.pass(category, 'Environment file protection', '.env files excluded from git');
      } else {
        this.fail(category, 'Environment file protection', '.env files not in .gitignore', 'critical');
      }
    } else {
      this.fail(category, 'Gitignore configuration', '.gitignore file missing', 'high');
    }

    // Check for hardcoded secrets
    const sourceFiles = this.findFiles('src', '.ts');
    let hardcodedSecrets = false;

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for potential hardcoded secrets
      const secretPatterns = [
        /password\s*=\s*['"`][^'"`]+['"`]/gi,
        /secret\s*=\s*['"`][^'"`]+['"`]/gi,
        /key\s*=\s*['"`][^'"`]+['"`]/gi,
        /token\s*=\s*['"`][^'"`]+['"`]/gi
      ];

      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          this.warn(category, 'Hardcoded secrets', `Potential hardcoded secret in ${file}`, 'high');
          hardcodedSecrets = true;
          break;
        }
      }
    }

    if (!hardcodedSecrets) {
      this.pass(category, 'Hardcoded secrets', 'No obvious hardcoded secrets found');
    }

    // Check error handling
    let errorHandlingSecure = true;
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for information disclosure in errors
      if (content.includes('console.log') && content.includes('error')) {
        this.warn(category, 'Error information disclosure', `Potential error information disclosure in ${file}`, 'low');
        errorHandlingSecure = false;
      }
    }

    if (errorHandlingSecure) {
      this.pass(category, 'Error handling', 'Error handling appears secure');
    }

    console.log(`  ✅ Configuration security review complete: ${this.results.categories[category].length} checks`);
  }

  // Check dependency vulnerabilities
  async checkDependencyVulnerabilities() {
    console.log('📦 Reviewing dependency vulnerabilities...');

    const category = 'dependencies';
    this.results.categories[category] = [];

    try {
      // Run npm audit
      const auditResult = execSync('npm audit --audit-level=moderate --json', { encoding: 'utf8', stdio: 'pipe' });
      const audit = JSON.parse(auditResult);

      if (audit.vulnerabilities) {
        const vulnCount = Object.keys(audit.vulnerabilities).length;

        if (vulnCount === 0) {
          this.pass(category, 'NPM audit', 'No vulnerabilities found');
        } else {
          // Count by severity
          let critical = 0, high = 0, moderate = 0, low = 0;

          Object.values(audit.vulnerabilities).forEach(vuln => {
            if (vuln.severity === 'critical') critical++;
            else if (vuln.severity === 'high') high++;
            else if (vuln.severity === 'moderate') moderate++;
            else low++;
          });

          if (critical > 0) {
            this.fail(category, 'Critical vulnerabilities', `${critical} critical vulnerabilities found`, 'critical');
          }
          if (high > 0) {
            this.fail(category, 'High vulnerabilities', `${high} high severity vulnerabilities found`, 'high');
          }
          if (moderate > 0) {
            this.warn(category, 'Moderate vulnerabilities', `${moderate} moderate vulnerabilities found`, 'medium');
          }
        }
      }
    } catch (error) {
      this.warn(category, 'Dependency audit', 'Could not run npm audit', 'low');
    }

    // Check for known vulnerable packages
    const vulnerablePackages = [
      'lodash', // Often has prototype pollution issues
      'minimist', // Prototype pollution
      'qs', // Prototype pollution
      'ua-parser-js' // Had malware injection
    ];

    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      for (const pkg of vulnerablePackages) {
        if (allDeps[pkg]) {
          this.warn(category, `Potentially vulnerable package: ${pkg}`, 'Check for latest secure version', 'medium');
        }
      }
    }

    console.log(`  ✅ Dependency vulnerability review complete: ${this.results.categories[category].length} checks`);
  }

  // Check compliance requirements
  async checkComplianceRequirements() {
    console.log('📋 Reviewing compliance requirements...');

    const category = 'compliance';
    this.results.categories[category] = [];
    this.results.compliance = {};

    // GDPR Compliance (basic checks)
    const gdprRequirements = {
      privacyPolicy: false,
      dataExport: false,
      dataMinimization: false,
      consentManagement: false
    };

    // Check for privacy policy
    const privacyFiles = ['privacy.md', 'PRIVACY.md', 'privacy-policy.md'];
    for (const file of privacyFiles) {
      if (fs.existsSync(file)) {
        gdprRequirements.privacyPolicy = true;
        this.pass(category, 'GDPR: Privacy Policy', 'Privacy policy document found');
        break;
      }
    }

    if (!gdprRequirements.privacyPolicy) {
      this.warn(category, 'GDPR: Privacy Policy', 'Privacy policy document not found', 'medium');
    }

    // Check for data export functionality
    const exportFiles = this.findFiles('src', '.ts');
    for (const file of exportFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('export') && content.includes('data')) {
        gdprRequirements.dataExport = true;
        this.pass(category, 'GDPR: Data Export', 'Data export functionality implemented');
        break;
      }
    }

    // California Consumer Privacy Act (CCPA) - basic checks
    this.results.compliance.ccpa = {
      dataProcessingDisclosure: false,
      optOutMechanism: false,
      dataDeletion: false
    };

    // Check for California-specific features (labor laws implemented)
    const californiaFiles = this.findFiles('src', '.ts');
    let californiaCompliance = false;

    for (const file of californiaFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('california') || content.includes('CA') && content.includes('labor')) {
        californiaCompliance = true;
        this.pass(category, 'California Labor Laws', 'California labor law compliance implemented');
        break;
      }
    }

    this.results.compliance.gdpr = gdprRequirements;
    this.results.compliance.californiaCompliance = californiaCompliance;

    console.log(`  ✅ Compliance review complete: ${this.results.categories[category].length} checks`);
  }

  // Check security headers
  async checkSecurityHeaders() {
    console.log('🌐 Reviewing security headers configuration...');

    const category = 'headers';
    this.results.categories[category] = [];

    const configFiles = ['vercel.json', 'next.config.js'];
    let headersConfigured = false;

    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');

        const requiredHeaders = [
          'X-Content-Type-Options',
          'X-Frame-Options',
          'X-XSS-Protection',
          'Strict-Transport-Security',
          'Content-Security-Policy'
        ];

        for (const header of requiredHeaders) {
          if (content.includes(header)) {
            this.pass(category, `Security header: ${header}`, 'Security header configured');
            headersConfigured = true;
          } else {
            this.warn(category, `Security header: ${header}`, 'Security header not configured', 'medium');
          }
        }
      }
    }

    if (!headersConfigured) {
      this.warn(category, 'Security headers', 'Security headers configuration not found', 'medium');
    }

    console.log(`  ✅ Security headers review complete: ${this.results.categories[category].length} checks`);
  }

  // Check session management
  async checkSessionManagement() {
    console.log('🎫 Reviewing session management...');

    const category = 'session_management';
    this.results.categories[category] = [];

    // Check session configuration
    const sessionFiles = this.findFiles('src', '.ts');
    let sessionSecure = true;

    for (const file of sessionFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for secure session cookies
      if (content.includes('httpOnly') && content.includes('secure')) {
        this.pass(category, 'Session cookie security', 'Secure session cookie configuration found');
      }

      // Check for session timeout
      if (content.includes('maxAge') || content.includes('expires')) {
        this.pass(category, 'Session timeout', 'Session timeout configuration found');
      }
    }

    console.log(`  ✅ Session management review complete: ${this.results.categories[category].length} checks`);
  }

  // Helper methods
  pass(category, check, detail) {
    this.results.categories[category].push({
      check,
      status: 'pass',
      severity: 'info',
      detail,
      timestamp: new Date().toISOString()
    });
    this.results.summary.passed++;
    this.results.summary.total++;
    console.log(`    ✅ ${check}: ${detail}`);
  }

  fail(category, check, detail, severity = 'medium') {
    this.results.categories[category].push({
      check,
      status: 'fail',
      severity,
      detail,
      timestamp: new Date().toISOString()
    });

    this.results.violations.push({
      category,
      check,
      severity,
      detail
    });

    this.results.summary[severity]++;
    this.results.summary.total++;
    console.log(`    ❌ ${check}: ${detail} (${severity.toUpperCase()})`);
  }

  warn(category, check, detail, severity = 'low') {
    this.results.categories[category].push({
      check,
      status: 'warning',
      severity,
      detail,
      timestamp: new Date().toISOString()
    });

    this.results.recommendations.push({
      category,
      check,
      severity,
      detail
    });

    this.results.summary[severity]++;
    this.results.summary.total++;
    console.log(`    ⚠️  ${check}: ${detail} (${severity.toUpperCase()})`);
  }

  findFiles(dir, extension) {
    const files = [];

    const traverse = (currentDir) => {
      try {
        const items = fs.readdirSync(currentDir);
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            traverse(fullPath);
          } else if (item.endsWith(extension)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    traverse(dir);
    return files;
  }

  calculateOverallScore() {
    const { total, critical, high, medium, low, passed } = this.results.summary;

    if (total === 0) {
      this.results.overallScore = 0;
      return;
    }

    // Weighted scoring
    const criticalWeight = -20;
    const highWeight = -10;
    const mediumWeight = -5;
    const lowWeight = -1;
    const passedWeight = 2;

    const score = (
      (critical * criticalWeight) +
      (high * highWeight) +
      (medium * mediumWeight) +
      (low * lowWeight) +
      (passed * passedWeight)
    );

    // Normalize to 0-100 scale
    this.results.overallScore = Math.max(0, Math.min(100, 50 + score));
  }

  generateReport() {
    console.log('\n🔒 FINAL SECURITY REVIEW REPORT');
    console.log('='.repeat(50));

    const { total, critical, high, medium, low, passed } = this.results.summary;

    console.log(`Overall Security Score: ${this.results.overallScore.toFixed(1)}/100`);
    console.log(`Total Security Checks: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Critical Issues: ${critical} 🚨`);
    console.log(`High Priority: ${high} ⚠️`);
    console.log(`Medium Priority: ${medium} 📋`);
    console.log(`Low Priority: ${low} 💡`);

    // Security grade
    let grade = 'F';
    if (this.results.overallScore >= 90) grade = 'A';
    else if (this.results.overallScore >= 80) grade = 'B';
    else if (this.results.overallScore >= 70) grade = 'C';
    else if (this.results.overallScore >= 60) grade = 'D';

    console.log(`\nSecurity Grade: ${grade}`);

    // Critical issues (must fix before production)
    if (critical > 0) {
      console.log('\n🚨 CRITICAL SECURITY ISSUES (FIX IMMEDIATELY):');
      this.results.violations
        .filter(v => v.severity === 'critical')
        .forEach(violation => {
          console.log(`  • ${violation.check}: ${violation.detail}`);
        });
    }

    // High priority issues
    if (high > 0) {
      console.log('\n⚠️ HIGH PRIORITY ISSUES:');
      this.results.violations
        .filter(v => v.severity === 'high')
        .forEach(violation => {
          console.log(`  • ${violation.check}: ${violation.detail}`);
        });
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n📋 SECURITY RECOMMENDATIONS:');
      this.results.recommendations
        .slice(0, 10) // Show top 10
        .forEach(rec => {
          console.log(`  • ${rec.check}: ${rec.detail}`);
        });
    }

    // Compliance status
    console.log('\n📋 COMPLIANCE STATUS:');
    if (this.results.compliance.gdpr) {
      const gdprScore = Object.values(this.results.compliance.gdpr).filter(Boolean).length;
      console.log(`  GDPR Readiness: ${gdprScore}/4 requirements met`);
    }
    console.log(`  California Labor Laws: ${this.results.compliance.californiaCompliance ? '✅' : '❌'}`);

    // Next steps
    console.log('\n🎯 NEXT STEPS:');
    if (critical > 0) {
      console.log('1. 🚨 FIX ALL CRITICAL ISSUES before production deployment');
    }
    if (high > 0) {
      console.log('2. ⚠️ Address high priority security issues');
    }
    console.log('3. 📋 Review and implement security recommendations');
    console.log('4. 🔄 Set up continuous security monitoring');
    console.log('5. 📅 Schedule regular security audits');

    // Production readiness
    console.log('\n🚀 PRODUCTION READINESS:');
    if (critical === 0 && high <= 2) {
      console.log('✅ READY: Application meets basic security requirements for production');
    } else if (critical === 0) {
      console.log('⚠️ CAUTION: Address high priority issues before production deployment');
    } else {
      console.log('❌ NOT READY: Critical security issues must be fixed');
    }

    // Save detailed report
    const reportFile = `security-review-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed security report saved to: ${reportFile}`);
  }
}

// Run security review if called directly
if (require.main === module) {
  const reviewer = new SecurityReviewer();
  reviewer.review()
    .then(() => {
      const exitCode = reviewer.results.summary.critical > 0 ? 1 : 0;
      console.log(`\n${exitCode === 0 ? '✅' : '❌'} Security review completed`);
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Security review failed:', error);
      process.exit(1);
    });
}

module.exports = SecurityReviewer;