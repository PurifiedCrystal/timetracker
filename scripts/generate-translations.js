/**
 * Translation Generation Script
 *
 * Generates translations for all supported languages using LibreTranslate
 */

const fs = require('fs');
const path = require('path');

// Simple translation function using LibreTranslate API
async function translateText(text, targetLang, sourceLang = 'en') {
  try {
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const result = await response.json();
    return result.translatedText || text;
  } catch (error) {
    console.warn(`Translation failed for "${text}": ${error.message}`);
    return text; // Return original text if translation fails
  }
}

// Extract all translatable strings from an object
function extractStrings(obj, path = '') {
  const strings = [];

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof value === 'string') {
      strings.push({ path: currentPath, text: value });
    } else if (typeof value === 'object' && value !== null) {
      strings.push(...extractStrings(value, currentPath));
    }
  }

  return strings;
}

// Reconstruct object with translated strings
function reconstructObject(obj, translations, stringIndex = { value: 0 }) {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = translations[stringIndex.value] || value;
      stringIndex.value++;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = reconstructObject(value, translations, stringIndex);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// Translate a namespace file
async function translateNamespace(namespace, targetLang) {
  const englishPath = path.join(__dirname, '../public/locales/en', `${namespace}.json`);
  const targetPath = path.join(__dirname, '../public/locales', targetLang, `${namespace}.json`);

  try {
    // Read English translations
    const englishContent = JSON.parse(fs.readFileSync(englishPath, 'utf8'));

    // Extract all strings
    const strings = extractStrings(englishContent);
    console.log(`Translating ${strings.length} strings for ${namespace} (${targetLang})...`);

    // Translate strings in small batches to avoid rate limiting
    const translations = [];
    const batchSize = 5;

    for (let i = 0; i < strings.length; i += batchSize) {
      const batch = strings.slice(i, i + batchSize);
      const batchPromises = batch.map(item => translateText(item.text, targetLang));

      const batchTranslations = await Promise.all(batchPromises);
      translations.push(...batchTranslations);

      // Small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log(`  Progress: ${Math.min(i + batchSize, strings.length)}/${strings.length}`);
    }

    // Reconstruct translated object
    const translatedContent = reconstructObject(englishContent, translations);

    // Ensure target directory exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Write translated file
    fs.writeFileSync(targetPath, JSON.stringify(translatedContent, null, 2), 'utf8');
    console.log(`✓ Generated ${targetPath}`);

    return true;
  } catch (error) {
    console.error(`Failed to translate ${namespace} to ${targetLang}:`, error);
    return false;
  }
}

// Language configurations
const languages = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' }
];

const namespaces = ['common', 'dashboard', 'auth', 'settings', 'time', 'export'];

// Main function
async function generateAllTranslations() {
  console.log('🌐 Starting translation generation...\n');

  for (const lang of languages) {
    console.log(`📝 Generating ${lang.name} (${lang.code}) translations:`);

    for (const namespace of namespaces) {
      await translateNamespace(namespace, lang.code);
    }

    console.log(`✅ Completed ${lang.name}\n`);
  }

  console.log('🎉 All translations generated successfully!');
}

// CLI execution
if (require.main === module) {
  generateAllTranslations().catch(error => {
    console.error('Translation generation failed:', error);
    process.exit(1);
  });
}

module.exports = { translateText, translateNamespace };