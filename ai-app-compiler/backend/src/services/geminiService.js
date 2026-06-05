// Gemini AI Service - powers AI-enhanced schema generation
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Fallback: use env var or the key directly if env loading fails
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBt59GQEQhETEAFsXC3_zLthZFKMYn_9qM';
let genAI = null;
let model = null;

function initGemini() {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    console.log('⚠️  No Gemini API key found - using deterministic mock engine');
    return false;
  }
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('✅ Gemini AI initialized (gemini-2.0-flash)');
    return true;
  } catch (e) {
    console.error('Gemini init error:', e.message);
    return false;
  }
}

const isAvailable = initGemini();
let isTemporarilyDisabled = false;

async function generateWithGemini(prompt, systemContext) {
  if (isTemporarilyDisabled || !isAvailable || !model) return null;

  const fullPrompt = `${systemContext}\n\nUser prompt: "${prompt}"\n\nCRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no code blocks. Raw JSON only.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        topK: 10,
        topP: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      }
    });
    const text = result.response.text();
    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini generation error:', err.message);
    if (err.message.includes('quota') || err.message.includes('429') || err.message.includes('fetch failed')) {
      console.log('⚠️  Gemini API quota exceeded or unreachable. Temporarily disabling Gemini service to maintain fast local compilation.');
      isTemporarilyDisabled = true;
    }
    return null;
  }
}

async function enhanceSchemaWithAI(intentSpec, blueprint, baseSchemas) {
  if (!isAvailable) return null;

  const systemContext = `You are an expert software architect. Generate a comprehensive app configuration JSON based on the app blueprint below.

App Type: ${intentSpec.appType}
Entities: ${intentSpec.entities.join(', ')}
Roles: ${intentSpec.roles.join(', ')}
Features: ${Object.entries(intentSpec.features).filter(([, v]) => v).map(([k]) => k).join(', ')}
Pages: ${intentSpec.pages.join(', ')}

You MUST return a JSON object with exactly these fields:
{
  "aiEnhancements": {
    "appDescription": "A detailed description of what this app does",
    "keyFeatures": ["feature1", "feature2", "feature3"],
    "technicalRecommendations": ["recommendation1", "recommendation2"],
    "suggestedIntegrations": ["integration1", "integration2"],
    "scalabilityNotes": "Notes on how this app can scale",
    "securityConsiderations": ["security note 1", "security note 2"],
    "additionalAssumptions": ["assumption1", "assumption2"],
    "estimatedComplexity": "low|medium|high|very_high",
    "estimatedBuildTime": "time estimate string",
    "costEstimate": {
      "infrastructure": "monthly cost estimate",
      "development": "one-time development cost estimate"
    }
  }
}`;

  return await generateWithGemini(intentSpec.input, systemContext);
}

module.exports = { generateWithGemini, enhanceSchemaWithAI, isGeminiAvailable: () => isAvailable && !isTemporarilyDisabled };
