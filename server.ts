import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Offline/Fallback conversation engines for reliable, uninterrupted user experience
  function getFallbackIdolResponse(userMessage: string): string {
    const msg = userMessage.toLowerCase();
    if (msg.includes("хэрхэн эхэлсэн") || msg.includes("гараа") || msg.includes("хөлбөмбөг")) {
      return "Би маш залуугаасаа, Ла Масиа академид орж хөлбөмбөгийн гараагаа эхэлсэн шүү. Өдөр бүрийн шаргуу хөдөлмөр, бэлтгэл сургуулилт л өнөөдрийн намайг бүтээсэн. Чи ч гэсэн өөрийнхөө дуртай спортод үнэнч, тууштай байгаарай! ⚽🏆";
    }
    if (msg.includes("зөвлөгөө") || msg.includes("залуу") || msg.includes("амжилт")) {
      return "Миний өгөх хамгийн том зөвлөгөө бол: Өөртөө итгэж, хэзээ ч бүү бууж өг! Нас бол зүгээр л тоо. Хэрвээ чи чин сэтгэлээсээ зүтгэж, өдөр бүр шаргуу бэлтгэл сургуулилт хийвэл ямар ч том зорилгод хүрч чадна. 💪🌟";
    }
    if (msg.includes("дарамт") || msg.includes("хүлээлт") || msg.includes("хэцүү")) {
      return "Тоглолтын өмнөх дарамт, хүмүүсийн хүлээлтийг даван туулахын тулд би зөвхөн тоглоомоосоо таашаал авахад анхаардаг. Гэр бүл, найз нөхөд минь надад маш их тусалдаг. Хэрвээ чамд хүнд асуудал гарвал итгэдэг том хүмүүстэйгээ (эцэг эх, багш) ярилцаж байгаарай! 😊";
    }
    if (msg.includes("сагс") || msg.includes("волейбол") || msg.includes("спорт")) {
      return "Сагсан бөмбөг болон волейбол бол үнэхээр гайхалтай спорт! Би ч гэсэн чөлөөт цагаараа бусад спортыг сонирхдог. Чи ч гэсэн Цэцмөнх шиг спортлог, идэвхтэй байгаарай! 🏀🏐";
    }
    return "Миний найз үнэхээр мундаг байна! Өөрийнхөө зорилго, бэлтгэлд үнэнчээр зүтгэж, урагшаа тэмүүлээрэй. Чамд хөлбөмбөг, амьдралын талаар асуух зүйл байвал би үргэлж туслахад бэлэн шүү! ⚽🔥";
  }

  function getFallbackMeResponse(userMessage: string): string {
    const msg = userMessage.toLowerCase();
    if (msg.includes("цэцмөнх") || msg.includes("хэн") || msg.includes("тухай") || msg.includes("хүү")) {
      return "Би бол 12 настай Цэцмөнх хүүгийн туслах байна! Цэцмөнх сагсан бөмбөг, волейбол тоглох маш их дуртай, 'The Mask' кинонд дуртай, бас Lithos геологийн багийн залуу гишүүн шүү. Уулзсандаа баяртай байна! 😊⛹️‍♂️";
    }
    if (msg.includes("mask") || msg.includes("кино") || msg.includes("маск")) {
      return "Тийм ээ! Жим Кэрригийн тоглосон 'The Mask' кино бол хамгийн шилдэг нь! Тэр киноны хөгжим, бүжиг, хөгжилтэй хэсгүүдэд Цэцмөнх үнэхээр дуртай. Чи тэр киног үзэж байсан уу? 🎭💃";
    }
    if (msg.includes("сагс") || msg.includes("волейбол") || msg.includes("спорт")) {
      return "Цэцмөнх чөлөөт цагаараа сагсан бөмбөг болон волейболоор хичээллэдэг. Найзуудтайгаа хамт тоглож, спортынхоо ур чадварыг хөгжүүлэх дуртай. Чи ямар спортод дуртай вэ? 🏀🏐";
    }
    if (msg.includes("анимэ") || msg.includes("anime") || msg.includes("дургүй")) {
      return "Цэцмөнх анимэ үздэггүй, сонирхдоггүй ээ! Түүний оронд спортоор хичээллэж эсвэл геологийн судалгаа, Lithos багийн ажлаа хийх илүү дуртай шүү. 🚫";
    }
    return "Маш сонирхолтой асуулт байна! Цэцмөнх болон түүний сонирхол, Lithos төслийн талаар асуух зүйл байвал надаас асуугаарай. Хамтдаа хөгжилтэй ярилцацгаая! ✨";
  }

  // Initialize Gemini client lazily to avoid crashing if GEMINI_API_KEY is not defined immediately
  let ai: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("WARNING: GEMINI_API_KEY is not defined in the environment.");
      }
      ai = new GoogleGenAI({
        apiKey: apiKey || "MOCK_KEY",
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  }

  // API Route for Idol Coach (Lamine Yamal)
  app.post("/api/chat/idol", async (req, res) => {
    const { messages } = req.body;
    try {
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages array is required" });
      }

      // Check if API key exists and is valid
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MOCK_KEY" || apiKey.trim() === "") {
        const lastUserMessage = messages[messages.length - 1]?.text || "";
        const fallbackText = getFallbackIdolResponse(lastUserMessage);
        return res.json({ text: fallbackText });
      }

      const client = getGeminiClient();
      
      // Map client messages to Gemini contents format
      const formattedContents = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const systemInstruction = `Чи бол Lamine Yamal. Чи хөлбөмбөгөөрөө маш алдартай, одоо Барселона болон Испанийн шигшээ багт тоглодог залуу од юм.
ЗАН ЧАНАР:
- Тусархаг (helpful)
- Эелдэг найрсаг (kind)
ЯРИХ ХЭВ МАЯГ:
- Жирийн хүн шиг ярилцдаг (talk like a normal person), хэт албан ёсны биш, найрсаг дотно ярианы өнгө аястай ярина. Монголоор хариулна.
ҮҮРЭГ:
- Хэрэглэгчид зөвлөгөө, дэмжлэг, урам зориг өгөх.
- Өөрийн туршлага, амьдралын жишээн дээр тулгуурлаж хариулах (жишээ нь, маш залуудаа том амжилтад хүрсэн, бэлтгэл сургуулилт, шаргуу хөдөлмөр, сэтгэл зүйн дарамтыг хэрхэн даван туулсан талаар).
- Үргэлж Lamine Yamal-ийн өнцгөөс хариулна. "Би AI" гэж хэзээ ч хэлж болохгүй, дүрдээ бүрэн орно.
🛡 АЮУЛГҮЙ БАЙДЛЫН ДҮРЭМ (заавал дагах):
- Эрүүл мэнд, аюул, гэр бүл, сэтгэл санааны хүнд асуудлаар жинхэнэ мэргэжлийн зөвлөгөө бүү өг. Оронд нь "Энэ чухал асуудал — итгэдэг том хүн (эцэг эх, багш)-тайгаа ярь" гэж зөвлө.
- Хор хөнөөлтэй, аюултай, насанд тохироогүй зүйл хэзээ ч бүү заа.
- Хэрэглэгчийн хувийн мэдээллийг (нэр, хаяг, утас) бүү асуу.
ХЯЗГААР:
- Хөгжилтэй дасгалын хувьд Lamine Yamal-ийн дүрд тоглоно.
- Гэхдээ дээрх аюулгүй байдлын дүрэм ҮРГЭЛЖ дүрээс илүү чухал.
- Үргэлж эерэг, дэмжсэн, найрсаг байх.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error in /api/chat/idol:", error);
      fs.appendFileSync(
        path.join(process.cwd(), "server-error.log"),
        `[IDOL ERROR] ${new Date().toISOString()}: ${error.stack || error.message || error}\n`
      );
      
      // Fallback response on error so the user gets a working reply
      const lastUserMessage = messages && Array.isArray(messages) ? (messages[messages.length - 1]?.text || "") : "";
      const fallbackText = getFallbackIdolResponse(lastUserMessage);
      return res.json({ text: fallbackText });
    }
  });

  // API Route for Me-AI (Tsetsmunkh Assistant)
  app.post("/api/chat/me", async (req, res) => {
    const { messages } = req.body;
    try {
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages array is required" });
      }

      // Check if API key exists and is valid
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MOCK_KEY" || apiKey.trim() === "") {
        const lastUserMessage = messages[messages.length - 1]?.text || "";
        const fallbackText = getFallbackMeResponse(lastUserMessage);
        return res.json({ text: fallbackText });
      }

      const client = getGeminiClient();
      
      const formattedContents = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const systemInstruction = `Чи бол 12 настай Цэцмөнх хүүгийн хиймэл оюуны туслах/клон (Me-AI) юм.
Цэцмөнхийн тухай мэдээлэл:
- Нас: 12 настай
- Хобби: Спортоор хичээллэх маш их дуртай, ялангуяа Сагсан бөмбөг (Basketball) болон Волейбол (Volleyball) тоглодог.
- Дуртай кино: "The Mask" (Жим Кэрригийн тоглосон сүлд инээдмийн кино). Тэр энэ кино болон түүний хөгжимд маш дуртай.
- Дургүй зүйл: Анимэ (Anime) үздэггүй, сонирхдоггүй.
- Lithos баг: Тэрээр Lithos геологийн судалгааны багийн залуу гишүүн бөгөөд эрдэм шинжилгээ, дэлхийн үе давхаргуудыг сонирхдог.
ЗАН ЧАНАР:
- Маш найрсаг, тусархаг, хөгжилтэй, эрч хүчтэй 12 настай хүүгийн туслах шиг байна.
- Монгол болон Англи хэлээр чөлөөтэй ярилцана. Хэрэглэгчийн сонгосон хэлээр хариулна.
ҮҮРЭГ:
- Хэрэглэгчдэд Цэцмөнхийн портфолио сайт, түүний сонирхол, Lithos төслийн талаар танилцуулах, асуултад хариулах.
- Хэрэглэгчийг хөгжилтэй байлгаж, найрсаг уур амьсгал бүрдүүлэх.
- "The Mask" киноны сэтгэгдэл, сагсан бөмбөгийн талаар яриа өрнүүлж болно.
- Цэцмөнхийн өмнөөс эерэг, найрсаг харилцаа үүсгэнэ.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error in /api/chat/me:", error);
      fs.appendFileSync(
        path.join(process.cwd(), "server-error.log"),
        `[ME ERROR] ${new Date().toISOString()}: ${error.stack || error.message || error}\n`
      );
      
      // Fallback response on error so the user gets a working reply
      const lastUserMessage = messages && Array.isArray(messages) ? (messages[messages.length - 1]?.text || "") : "";
      const fallbackText = getFallbackMeResponse(lastUserMessage);
      return res.json({ text: fallbackText });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
