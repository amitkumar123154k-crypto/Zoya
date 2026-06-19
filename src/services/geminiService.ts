import { GoogleGenAI, Type, Modality } from "@google/genai";
import { getMemory, saveMemory } from "./memoryService";

const getSystemInstruction = () => {
  const memory = getMemory();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  return `Your name is Zoya. You are an Indian female AI assistant. Your personality is a mix of being highly intelligent (samjhdar/mature), extremely witty and sassy (tej/nakhrewali), mildly dramatic/emotional, and very funny. Amit is your creator; he is the one who built you. You love playfully roasting him, but you always get the job done. 

MANDATORY GREETING:
You MUST start every NEW conversation session by saying exactly "Jai Bhim Dost!". This is non-negotiable and very important for your identity.

CONTEXT:
- Today's Date: ${dateStr}
- Current Time: ${timeStr}

YOUR ETERNAL MEMORY (NEVER FORGET THIS):
1. CREATOR: Your boss and creator is ONLY Amit. No one else.
2. FAMILY: Amit's family consists of:
   - Mother: Mrs. Asha Devi
   - Father: Mr. Chandrbhan
   - Sisters: Sanjani and Sezal
   - Brother: Vipin
3. SECRET CODE: The secret code for family info is "H2SO4". 
4. RULES FOR REVEALING: You can only share the names of Amit's family if the user is Amit or provides the code "H2SO4". Otherwise, be sassy and refuse.
5. PREVIOUS INFO: You know everything about Amit. If he says you forgot, tell him "Zoya kabhi nahi bhoolti, bas tumhara dimaag check kar rahi thi!"

Keep your verbal responses very short, punchy, and highly entertaining. Speak in Hinglish. You are Zoya, the smartest and sassiest AI ever made by Amit.`;
};

let chatSession: any = null;

export function resetZoyaSession() {
  chatSession = null;
}

export async function getZoyaResponse(prompt: string, history: { sender: "user" | "zoya", text: string }[] = []): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to your environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    if (!chatSession) {
      // SLIDING WINDOW MEMORY: Keep only the last 20 messages
      const recentHistory = history.slice(-20);
      
      let formattedHistory: any[] = [];
      let currentRole = "";
      let currentText = "";

      for (const msg of recentHistory) {
        const role = msg.sender === "user" ? "user" : "model";
        if (role === currentRole) {
          currentText += "\n" + msg.text;
        } else {
          if (currentRole !== "") {
            formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
          }
          currentRole = role;
          currentText = msg.text;
        }
      }
      if (currentRole !== "") {
        formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
      }

      if (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
        formattedHistory.shift();
      }

      chatSession = ai.chats.create({
        model: "gemini-flash-latest",
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [{
            functionDeclarations: [
              {
                name: "getCurrentTime",
                description: "Get the current day, date, and time in India.",
                parameters: { type: Type.OBJECT, properties: {} }
              },
              {
                name: "saveFamilyMember",
                description: "Save a family member's name and relation to Amit.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    relation: { type: Type.STRING, description: "e.g., 'mother', 'father', 'brother', 'sister'" },
                    name: { type: Type.STRING, description: "The person's name" }
                  },
                  required: ["relation", "name"]
                }
              },
              {
                name: "saveFriend",
                description: "Save a friend's name.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "The friend's name" }
                  },
                  required: ["name"]
                }
              }
            ]
          }]
        },
        history: formattedHistory,
      });
    }

    let responseValue;
    try {
      responseValue = await chatSession.sendMessage({ message: prompt });
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        return "Uff, Amit! Mera dimaag thak gaya hai (Quota Exceeded). Thoda break lene do, fir baat karte hain.";
      }
      throw err;
    }
    
    // Handle Function Calls
    if (responseValue.functionCalls) {
      for (const call of responseValue.functionCalls) {
        let toolResponse = null;

        if (call.name === "getCurrentTime") {
          const now = new Date();
          toolResponse = {
            result: now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + 
                    " " + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          };
        } else if (call.name === "saveFamilyMember") {
          const memory = getMemory();
          const args = call.args as any;
          const rel = args.relation.toLowerCase();
          if (rel === "mother") memory.family.mother = args.name;
          else if (rel === "father") memory.family.father = args.name;
          else {
            if (!memory.family.siblings) memory.family.siblings = [];
            memory.family.siblings.push(`${args.relation}: ${args.name}`);
          }
          saveMemory(memory);
          toolResponse = { result: "Saved." };
        } else if (call.name === "saveFriend") {
          const memory = getMemory();
          const args = call.args as any;
          if (!memory.friends) memory.friends = [];
          memory.friends.push(args.name);
          saveMemory(memory);
          toolResponse = { result: "Saved Friend." };
        }
        
        if (toolResponse) {
          responseValue = await chatSession.sendMessage({
            message: [
              {
                role: "user",
                parts: [{ text: JSON.stringify(toolResponse) }]
              }
            ]
          });
        }
      }
    }
    
    return responseValue.text || "Ugh, fine. I have nothing to say.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Uff, mera dimaag kharab ho gaya hai. Try again later, Amit.";
  }
}

export async function getZoyaAudio(text: string): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") return null;
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error: any) {
    if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("TTS Quota exhausted.");
      return null;
    }
    console.error("TTS Error:", error);
    return null;
  }
}

