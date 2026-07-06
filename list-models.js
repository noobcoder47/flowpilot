const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Manually extract key to avoid needing dotenv package
const envContent = fs.readFileSync('.env.local', 'utf8');
const keyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
if (keyMatch) {
  process.env.GEMINI_API_KEY = keyMatch[1].trim();
}

async function listModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY found in .env.local");
    return;
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // We can't directly list models easily with the SDK in older versions, 
  // but we can just use native fetch to call the REST API.
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  
  if (data.models) {
    console.log("Available models for this key:");
    data.models.forEach(m => console.log(m.name, "-", m.supportedGenerationMethods.join(', ')));
  } else {
    console.log("Error fetching models:", data);
  }
}

listModels();
