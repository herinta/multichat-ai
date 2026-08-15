require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    console.log("Testing Gemini API with Key:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: "You are a test assistant."
    });
    
    const chat = model.startChat();
    
    console.log("Sending message...");
    const result = await chat.sendMessage("Hello!");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("Gemini Error:", err);
  }
}

test();
