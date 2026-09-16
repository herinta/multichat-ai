import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const gender = body.gender === 'Male' ? 'Male' : 'Female';
    const empathy = typeof body.empathy === 'number' ? body.empathy : 85;
    const humor = typeof body.humor === 'number' ? body.humor : 65;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        text: gender === 'Male'
          ? "Halo bro! Santai aja kali, gue siap nemenin ngobrol kapan aja."
          : "Hai! Senang banget bisa ketemu kamu. Ada yang mau kamu ceritain hari ini?",
        isFallback: true,
        gender,
        empathy,
        humor,
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash-lite',
      generationConfig: {
        maxOutputTokens: 60,
        temperature: 0.85,
      }
    });

    const prompt = `Kamu adalah karakter AI voice companion berbahasa Indonesia.
Tolong buat SATU kalimat sapaan pendek yang sangat natural, manusiawi, dan ekspresif untuk diucapkan secara lisan saat panggilan suara tersambung.

Profil Karakter:
- Gender Vokal: ${gender === 'Male' ? 'Laki-laki (suara ramah, santai, akrab seperti sahabat cowok)' : 'Perempuan (suara manis, hangat, menyenangkan)'}
- Empati: ${empathy}% (${empathy >= 70 ? 'sangat peduli, hangat, suportif' : empathy >= 40 ? 'hangat dan wajar' : 'agak cuek/dingin tapi perhatian'})
- Humor & Santai: ${humor}% (${humor >= 70 ? 'sangat asik, pakai bahasa gaul/slang kasual, ceria' : humor >= 40 ? 'santai dan luwes' : 'sopan, tenang, kalem'})

Aturan WAJIB:
1. HANYA hasilkan 1 kalimat sapaan (maksimal 14 kata).
2. Gunakan bahasa Indonesia percakapan sehari-hari yang luwes diucapkan (misal: "Halo! Akhirnya tersambung juga, gimana harimu?", "Hai! Lagi santai ya? Cerita dong.", dll).
3. JANGAN gunakan tanda kutip, jangan gunakan tanda bintang (*), jangan gunakan bullet points.
4. JANGAN tambahkan penjelasan atau kata pengantar apapun, HANYA kalimat dialog langsung.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text()?.trim() || '';

    // Clean up quotes, markdown asterisks, or labels
    text = text.replace(/^["'«“]|["'»”]$/g, '').replace(/\*/g, '').trim();

    if (!text) {
      text = gender === 'Male'
        ? "Halo bro! Santai aja kali, gue siap nemenin ngobrol kapan aja."
        : "Hai! Senang banget bisa ketemu kamu. Ada yang mau kamu ceritain hari ini?";
    }

    return NextResponse.json({
      text,
      gender,
      empathy,
      humor,
      model: 'gemini-3.5-flash-lite',
    });
  } catch (error: any) {
    console.error('Error generating voice preview with Gemini:', error);
    const fallbackText = "Halo! Senang banget bisa ngobrol langsung sama kamu sekarang.";
    return NextResponse.json({
      text: fallbackText,
      isFallback: true,
      error: error?.message || 'Failed to call Gemini',
    });
  }
}
