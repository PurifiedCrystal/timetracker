/**
 * T109: Performance optimization and bundle analysis
 * Analyzes and optimizes application performance
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceOptimizer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      bundleAnalysis: {},
      recommendations: [],
      optimizations: [],
      metrics: {}
    };
  }

  async optimize() {
    console.log('⚡ Starting Performance Optimization Analysis...\n');

    await this.analyzeBundleSize();
    await this.checkCodeSplitting();
    await this.analyzeImages();
    await this.checkCaching();
    await this.analyzeDependencies();
    await this.checkNextJsOptimizations();
    await this.generateRecommendations();

    this.generateReport();
    return this.results;
  }

  // Analyze bundle size
  async analyzeBundleSize() {
    console.log('📦 Analyzing bundle size...');

    try {
      // Build the application first
      console.log('  Building application for analysis...');
      execSync('npm run build', { stdio: 'pipe' });

      // Check if .next directory exists
      if (fs.existsSync('.next')) {
        const nextDir = '.next';

        // Get build manifest
        const buildManifestPath = path.join(nextDir, 'build-manifest.json');
        if (fs.existsSync(buildManifestPath)) {
          const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
          this.results.bundleAnalysis.pages = buildManifest.pages;
          console.log('  ✅ Build manifest analyzed');
        }

        // Analyze static directory
        const staticDir = path.join(nextDir, 'static');
        if (fs.existsSync(staticDir)) {
          const staticFiles = this.getDirectorySize(staticDir);
          this.results.bundleAnalysis.staticSize = staticFiles;
          console.log(`  📊 Static files: ${this.formatBytes(staticFiles.totalSize)}`);
        }

        // Check for large files
        this.findLargeFiles(nextDir);

        console.log('  ✅ Bundle analysis complete');
      } else {
        console.log('  ❌ .next directory not found. Run npm run build first.');
      }

    } catch (error) {
      console.log(`  ❌ Bundle analysis failed: ${error.message}`);
      this.results.recommendations.push({
        type: 'error',
        category: 'build',
        message: 'Build failed during bundle analysis',
        action: 'Fix build errors before analyzing performance'
      });
    }
  }

  // Check code splitting configuration
  async checkCodeSplitting() {
    console.log('\n🔄 Checking code splitting configuration...');

    // Check Next.js configuration
    const nextConfigPath = 'next.config.js';
    if (fs.existsSync(nextConfigPath)) {
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');

      if (configContent.includes('splitChunks')) {
        console.log('  ✅ Custom webpack splitChunks configuration found');
      } else {
        console.log('  📊 Using Next.js default code splitting');
        this.results.recommendations.push({
          type: 'optimization',
          category: 'code-splitting',
          message: 'Consider custom webpack splitChunks for better optimization',
          action: 'Add webpack splitChunks configuration to next.config.js'
        });
      }

      if (configContent.includes('dynamic')) {
        console.log('  ✅ Dynamic imports configuration found');
      } else {
        console.log('  ⚠️  Dynamic imports not explicitly configured');
      }
    } else {
      console.log('  📊 Using Next.js default configuration');
    }

    // Check for dynamic imports in source code
    this.checkDynamicImports();
  }

  // Check dynamic imports usage
  checkDynamicImports() {
    const srcDir = 'src';
    if (fs.existsSync(srcDir)) {
      const dynamicImports = this.findDynamicImports(srcDir);
      if (dynamicImports.length > 0) {
        console.log(`  ✅ Found ${dynamicImports.length} dynamic imports`);
        this.results.optimizations.push({
          type: 'dynamic-imports',
          count: dynamicImports.length,
          files: dynamicImports
        });
      } else {
        console.log('  ⚠️  No dynamic imports found');
        this.results.recommendations.push({
          type: 'optimization',
          category: 'code-splitting',
          message: 'Consider using dynamic imports for large components',
          action: 'Use dynamic imports for components that are not immediately needed'
        });
      }
    }
  }

  // Analyze images
  async analyzeImages() {
    console.log('\n🖼️  Analyzing images...');

    const publicDir = 'public';
    if (fs.existsSync(publicDir)) {
      const images = this.findImageFiles(publicDir);

      if (images.length > 0) {
        console.log(`  📊 Found ${images.length} image files`);

        let totalImageSize = 0;
        let largeImages = [];

        for (const image of images) {
          const stats = fs.statSync(image);
          totalImageSize += stats.size;

          if (stats.size > 500 * 1024) { // Larger than 500KB
            largeImages.push({
              file: image,
              size: stats.size
            });
          }
        }

        console.log(`  📊 Total image size: ${this.formatBytes(totalImageSize)}`);

        if (largeImages.length > 0) {
          console.log(`  ⚠️  ${largeImages.length} large images found (>500KB)`);
          this.results.recommendations.push({
            type: 'optimization',
            category: 'images',
            message: `${largeImages.length} large images detected`,
            action: 'Optimize images using next/image component and consider WebP format'
          });
        }

        this.results.bundleAnalysis.images = {
          count: images.length,
          totalSize: totalImageSize,
          largeImages: largeImages.length
        };
      } else {
        console.log('  📊 No image files found in public directory');
      }
    }

    // Check for Next.js Image component usage
    this.checkImageComponentUsage();
  }

  // Check Next.js Image component usage
  checkImageComponentUsage() {
    const srcDir = 'src';
    if (fs.existsSync(srcDir)) {
      const imageImports = this.findInFiles(srcDir, /from ['"]next\/image['"]/g);
      const imgTags = this.findInFiles(srcDir, /<img\s/g);

      if (imageImports.length > 0) {
        console.log(`  ✅ Next.js Image component used in ${imageImports.length} files`);
      }

      if (imgTags.length > 0) {
        console.log(`  ⚠️  Regular <img> tags found in ${imgTags.length} files`);
        this.results.recommendations.push({
          type: 'optimization',
          category: 'images',
          message: 'Replace <img> tags with Next.js Image component',
          action: 'Use next/image for automatic optimization and lazy loading'
        });
      }
    }
  }

  // Check caching configuration
  async checkCaching() {
    console.log('\n🗄️  Checking caching configuration...');

    // Check Next.js caching configuration
    const nextConfigPath = 'next.config.js';
    if (fs.existsSync(nextConfigPath)) {
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');

      if (configContent.includes('headers')) {
        console.log('  ✅ Custom headers configuration found');
      } else {
        console.log('  ⚠️  No custom headers configuration');
        this.results.recommendations.push({
          type: 'optimization',
          category: 'caching',
          message: 'Add caching headers for static assets',
          action: 'Configure headers in next.config.js for better caching'
        });
      }
    }

    // Check Vercel configuration
    const vercelConfigPath = 'vercel.json';
    if (fs.existsSync(vercelConfigPath)) {
      const configContent = fs.readFileSync(vercelConfigPath, 'utf8');
      const config = JSON.parse(configContent);

      if (config.headers) {
        console.log('  ✅ Vercel headers configuration found');
      } else {
        console.log('  ⚠️  No Vercel headers configuration');
      }
    }

    // Check for service worker or cache implementation
    const serviceWorkerFiles = [
      'public/sw.js',
      'public/service-worker.js',
      'src/lib/cache.ts',
      'src/lib/query-cache.ts'
    ];

    let cachingImplemented = false;
    for (const file of serviceWorkerFiles) {
      if (fs.existsSync(file)) {
        console.log(`  ✅ Caching implementation found: ${file}`);
        cachingImplemented = true;
        break;
      }
    }

    if (!cachingImplemented) {
      this.results.recommendations.push({
        type: 'optimization',
        category: 'caching',
        message: 'Consider implementing application-level caching',
        action: 'Add service worker or implement query caching'
      });
    }
  }

  // Analyze dependencies
  async analyzeDependencies() {
    console.log('\n📦 Analyzing dependencies...');

    const packageJsonPath = 'package.json';
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      const totalDeps = Object.keys(deps).length + Object.keys(devDeps).length;

      console.log(`  📊 Total dependencies: ${totalDeps}`);
      console.log(`  📊 Production dependencies: ${Object.keys(deps).length}`);
      console.log(`  📊 Development dependencies: ${Object.keys(devDeps).length}`);

      // Check for large dependencies
      const largeDependencies = [
        'lodash', 'moment', 'jquery', 'bootstrap',
        'material-ui', '@mui/material', 'antd'
      ];

      const foundLargeDeps = largeDependencies.filter(dep => deps[dep]);
      if (foundLargeDeps.length > 0) {
        console.log(`  ⚠️  Large dependencies detected: ${foundLargeDeps.join(', ')}`);
        this.results.recommendations.push({
          type: 'optimization',
          category: 'dependencies',
          message: 'Large dependencies detected',
          action: 'Consider lighter alternatives or tree-shaking'
        });
      }

      // Check for unused dependencies
      console.log('  📊 Run npm audit for security analysis');

      this.results.bundleAnalysis.dependencies = {
        total: totalDeps,
        production: Object.keys(deps).length,
        development: Object.keys(devDeps).length,
        large: foundLargeDeps
      };
    }
  }

  // Check Next.js optimizations
  async checkNextJsOptimizations() {
    console.log('\n⚡ Checking Next.js optimizations...');

    const nextConfigPath = 'next.config.js';
    const optimizations = [];

    if (fs.existsSync(nextConfigPath)) {
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');

      // Check for experimental features
      if (configContent.includes('experimental')) {
        console.log('  📊 Experimental features enabled');
        optimizations.push('experimental-features');
      }

      // Check for compression
      if (configContent.includes('compress')) {
        console.log('  ✅ Compression enabled');
        optimizations.push('compression');
      } else {
        this.results.recommendations.push({
          type: 'optimization',
          category: 'nextjs',
          message: 'Enable compression in Next.js config',
          action: 'Add compress: true to next.config.js'
        });
      }

      // Check for output optimization
      if (configContent.includes('output')) {
        console.log('  ✅ Output optimization configured');
        optimizations.push('output-optimization');
      }

      // Check for SWC
      if (configContent.includes('swcMinify')) {
        console.log('  ✅ SWC minification enabled');
        optimizations.push('swc-minify');
      } else {
        this.results.recommendations.push({
          type: 'optimization',
          category: 'nextjs',
          message: 'Enable SWC minification',
          action: 'Add swcMinify: true to next.config.js'
        });
      }

    } else {
      console.log('  📊 Using Next.js default optimizations');
      this.results.recommendations.push({
        type: 'optimization',
        category: 'nextjs',
        message: 'Create Next.js configuration file',
        action: 'Add next.config.js with performance optimizations'
      });
    }

    this.results.optimizations.push({
      type: 'nextjs-config',
      enabled: optimizations
    });
  }

  // Generate optimization recommendations
  async generateRecommendations() {
    console.log('\n🎯 Generating optimization recommendations...');

    // Performance monitoring recommendations
    if (!fs.existsSync('src/lib/monitoring.ts')) {
      this.results.recommendations.push({
        type: 'feature',
        category: 'monitoring',
        message: 'Add performance monitoring',
        action: 'Implement Core Web Vitals tracking and error monitoring'
      });
    }

    // PWA recommendations
    if (!fs.existsSync('public/manifest.json')) {
      this.results.recommendations.push({
        type: 'feature',
        category: 'pwa',
        message: 'Consider Progressive Web App features',
        action: 'Add web app manifest and service worker for offline support'
      });
    }

    // Database optimization
    if (fs.existsSync('src/lib/database.ts')) {
      this.results.recommendations.push({
        type: 'optimization',
        category: 'database',
        message: 'Review database queries for optimization',
        action: 'Implement connection pooling and query optimization'
      });
    }

    console.log(`  📊 Generated ${this.results.recommendations.length} recommendations`);
  }

  // Utility methods
  getDirectorySize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;

    const traverse = (currentPath) => {
      const files = fs.readdirSync(currentPath);
      for (const file of files) {
        const filePath = path.join(currentPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          traverse(filePath);
        } else {
          totalSize += stats.size;
          fileCount++;
        }
      }
    };

    traverse(dirPath);
    return { totalSize, fileCount };
  }

  findLargeFiles(dirPath, threshold = 1024 * 1024) { // 1MB threshold
    const largeFiles = [];

    const traverse = (currentPath) => {
      if (!fs.existsSync(currentPath)) return;

      try {
        const files = fs.readdirSync(currentPath);
        for (const file of files) {
          const filePath = path.join(currentPath, file);
          const stats = fs.statSync(filePath);

          if (stats.isDirectory()) {
            traverse(filePath);
          } else if (stats.size > threshold) {
            largeFiles.push({
              file: filePath,
              size: stats.size
            });
          }
        }
      } catch (error) {
        // Skip files/directories we can't read
      }
    };

    traverse(dirPath);

    if (largeFiles.length > 0) {
      console.log(`  ⚠️  Found ${largeFiles.length} large files (>1MB)`);
      largeFiles.forEach(({ file, size }) => {
        console.log(`    • ${file}: ${this.formatBytes(size)}`);
      });
    }

    return largeFiles;
  }

  findDynamicImports(dirPath) {
    const dynamicImports = [];
    const pattern = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

    const searchInFile = (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        let match;
        while ((match = pattern.exec(content)) !== null) {
          dynamicImports.push({
            file: filePath,
            import: match[1]
          });
        }
      } catch (error) {
        // Skip files we can't read
      }
    };

    const traverse = (currentPath) => {
      try {
        const files = fs.readdirSync(currentPath);
        for (const file of files) {
          const filePath = path.join(currentPath, file);
          const stats = fs.statSync(filePath);

          if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            traverse(filePath);
          } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
            searchInFile(filePath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    traverse(dirPath);
    return dynamicImports;
  }

  findImageFiles(dirPath) {
    const images = [];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    const traverse = (currentPath) => {
      try {
        const files = fs.readdirSync(currentPath);
        for (const file of files) {
          const filePath = path.join(currentPath, file);
          const stats = fs.statSync(filePath);

          if (stats.isDirectory()) {
            traverse(filePath);
          } else if (imageExtensions.some(ext => file.toLowerCase().endsWith(ext))) {
            images.push(filePath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    traverse(dirPath);
    return images;
  }

  findInFiles(dirPath, pattern) {
    const matches = [];

    const searchInFile = (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (pattern.test(content)) {
          matches.push(filePath);
        }
      } catch (error) {
        // Skip files we can't read
      }
    };

    const traverse = (currentPath) => {
      try {
        const files = fs.readdirSync(currentPath);
        for (const file of files) {
          const filePath = path.join(currentPath, file);
          const stats = fs.statSync(filePath);

          if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            traverse(filePath);
          } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
            searchInFile(filePath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    traverse(dirPath);
    return matches;
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  generateReport() {
    console.log('\n📊 PERFORMANCE OPTIMIZATION REPORT');
    console.log('='.repeat(50));

    // Bundle analysis summary
    if (this.results.bundleAnalysis.staticSize) {
      const { totalSize, fileCount } = this.results.bundleAnalysis.staticSize;
      console.log(`Bundle Size: ${this.formatBytes(totalSize)} (${fileCount} files)`);
    }

    if (this.results.bundleAnalysis.images) {
      const { count, totalSize, largeImages } = this.results.bundleAnalysis.images;
      console.log(`Images: ${count} files, ${this.formatBytes(totalSize)}, ${largeImages} large`);
    }

    if (this.results.bundleAnalysis.dependencies) {
      const { total, production, large } = this.results.bundleAnalysis.dependencies;
      console.log(`Dependencies: ${total} total, ${production} production, ${large.length} large`);
    }

    // Recommendations by category
    const categories = {};
    this.results.recommendations.forEach(rec => {
      if (!categories[rec.category]) {
        categories[rec.category] = [];
      }
      categories[rec.category].push(rec);
    });

    console.log('\n🎯 OPTIMIZATION RECOMMENDATIONS:');
    Object.entries(categories).forEach(([category, recs]) => {
      console.log(`\n${category.toUpperCase()}:`);
      recs.forEach(rec => {
        console.log(`  • ${rec.message}`);
        console.log(`    Action: ${rec.action}`);
      });
    });

    console.log('\n⚡ NEXT STEPS:');
    console.log('1. Review and implement high-impact optimizations');
    console.log('2. Run Lighthouse audit for Core Web Vitals');
    console.log('3. Test performance with real user data');
    console.log('4. Set up continuous performance monitoring');

    // Save detailed report
    const reportFile = `performance-report-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new PerformanceOptimizer();
  optimizer.optimize()
    .then(() => {
      console.log('\n✅ Performance optimization analysis complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Optimization analysis failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceOptimizer;