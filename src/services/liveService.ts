import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { processCommand } from "./commandService";
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

export class LiveSessionManager {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  // Audio playback state
  private playbackContext: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  public isMuted: boolean = false;
  
  public onStateChange: (state: "idle" | "listening" | "processing" | "speaking") => void = () => {};
  public onMessage: (sender: "user" | "zoya", text: string) => void = () => {};
  public onCommand: (url: string) => void = () => {};

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || "" });
  }

  async start() {
    try {
      this.onStateChange("processing");
      
      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;

      // Resume contexts on user gesture (already within start() which is called on click)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      if (this.playbackContext.state === 'suspended') {
        await this.playbackContext.resume();
      }

      // Get Microphone - Use simpler constraints first to avoid "Permission denied" or "Constraint not satisfied"
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          } 
        });
      } catch (permErr) {
        console.error("Microphone access denied:", permErr);
        throw new Error("Microphone permission denied. Please ensure you have allowed microphone access in your browser settings.");
      }

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.sessionPromise) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true);
        }
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        this.sessionPromise.then(session => {
          session.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }).catch(err => console.error("Error sending audio", err));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      // Connect to Live API
      this.sessionPromise = this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction: getSystemInstruction(),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{
            functionDeclarations: [
              {
                name: "getCurrentTime",
                description: "Get the current day, date, and time in India.",
                parameters: { type: Type.OBJECT, properties: {} }
              },
              {
                name: "executeBrowserAction",
                description: "Open a website or perform a browser action (like opening YouTube, Spotify, or WhatsApp). Call this when the user asks to open a site, play a song, or send a message.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    actionType: { type: Type.STRING, description: "Type of action: 'open', 'youtube', 'spotify', 'whatsapp'" },
                    query: { type: Type.STRING, description: "The search query, website name, or message content." },
                    target: { type: Type.STRING, description: "The target phone number for WhatsApp, if applicable." }
                  },
                  required: ["actionType", "query"]
                }
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
        callbacks: {
          onopen: () => {
            console.log("Live API Connected");
            this.onStateChange("listening");
            // Trigger mandatory greeting
            this.sendText("Greet me now!");
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              this.onStateChange("speaking");
              this.playAudioChunk(base64Audio);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              this.stopPlayback();
              this.onStateChange("listening");
            }

            // Handle Transcriptions
            const userText = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (userText) {
               // Output transcription
               this.onMessage("zoya", userText);
            }

            // Handle Function Calls
            const functionCalls = message.toolCall?.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
              for (const call of functionCalls) {
                let toolResult = null;

                if (call.name === "getCurrentTime") {
                  const now = new Date();
                  toolResult = {
                    result: now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + 
                            " " + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  };
                } else if (call.name === "executeBrowserAction") {
                  const args = call.args as any;
                  let url = "";
                  if (args.actionType === "youtube") {
                    url = `https://www.youtube.com/results?search_query=${encodeURIComponent(args.query)}`;
                  } else if (args.actionType === "spotify") {
                    url = `https://open.spotify.com/search/${encodeURIComponent(args.query)}`;
                  } else if (args.actionType === "whatsapp") {
                    url = `https://web.whatsapp.com/send?phone=${args.target || ''}&text=${encodeURIComponent(args.query)}`;
                  } else {
                    let website = args.query.replace(/\s+/g, "");
                    if (!website.includes(".")) website += ".com";
                    url = `https://www.${website}`;
                  }
                  
                  this.onCommand(url);
                  toolResult = { result: "Action executed successfully in the browser." };
                } else if (call.name === "saveFamilyMember") {
                  const args = call.args as any;
                  const memory = getMemory();
                  const rel = args.relation.toLowerCase();
                  if (rel === "mother") memory.family.mother = args.name;
                  else if (rel === "father") memory.family.father = args.name;
                  else {
                    if (!memory.family.siblings) memory.family.siblings = [];
                    memory.family.siblings.push(`${args.relation}: ${args.name}`);
                  }
                  saveMemory(memory);
                  toolResult = { result: "Memory saved successfully." };
                } else if (call.name === "saveFriend") {
                  const args = call.args as any;
                  const memory = getMemory();
                  if (!memory.friends) memory.friends = [];
                  memory.friends.push(args.name);
                  saveMemory(memory);
                  toolResult = { result: "Friend remembered successfully." };
                }

                if (toolResult) {
                  this.sessionPromise?.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        name: call.name,
                        id: call.id,
                        response: toolResult
                      }]
                    });
                  });
                }
              }
            }
          },
          onclose: () => {
            console.log("Live API Closed");
            this.stop();
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            if (err.message?.includes("429") || err.message?.includes("QUOTA_EXCEEDED") || err.message?.includes("RESOURCE_EXHAUSTED")) {
              this.onMessage("zoya", "Oh ho! Lagta hai main aaj bohot zyada bol chuki hoon. Quota khatam ho gaya hai. Thodi der baad milte hain!");
            }
            this.stop();
          }
        }
      });

    } catch (error) {
      console.error("Failed to start Live Session:", error);
      this.stop();
    }
  }

  private playAudioChunk(base64Data: string) {
    if (!this.playbackContext || this.isMuted) return;
    
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const buffer = new Int16Array(bytes.buffer);
      const audioBuffer = this.playbackContext.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }
      
      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);
      
      const currentTime = this.playbackContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }
      
      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.isPlaying = true;
      
      source.onended = () => {
        if (this.playbackContext && this.playbackContext.currentTime >= this.nextPlayTime - 0.1) {
          this.isPlaying = false;
          this.onStateChange("listening");
        }
      };
    } catch (e) {
      console.error("Error playing chunk", e);
    }
  }

  private stopPlayback() {
    if (this.playbackContext) {
      this.playbackContext.close();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.stopPlayback();
    
    if (this.sessionPromise) {
      this.sessionPromise.then(session => session.close()).catch(() => {});
      this.sessionPromise = null;
    }
    
    this.onStateChange("idle");
  }

  sendText(text: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({ text });
      });
    }
  }
}
