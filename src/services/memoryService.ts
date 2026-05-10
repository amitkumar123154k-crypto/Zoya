
export interface UserMemory {
  family: {
    mother?: string;
    father?: string;
    siblings?: string[];
  };
  friends?: string[];
  otherFacts?: string[];
  secretCode?: string;
}

const MEMORY_KEY = "zoya_user_memory";

const INITIAL_MEMORY: UserMemory = {
  family: {
    mother: "Mrs. Asha Devi",
    father: "Mr. Chandrbhan",
    siblings: ["Sanjani (Sister)", "Sezal (Choti Sister)", "Vipin (Bhai)"]
  },
  friends: [],
  otherFacts: ["Creator's name is Amit"],
  secretCode: "H2SO4"
};

export const getMemory = (): UserMemory => {
  const saved = localStorage.getItem(MEMORY_KEY);
  let memory = { ...INITIAL_MEMORY };

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge logic: prefer saved but ensure structure
      memory = {
        ...INITIAL_MEMORY,
        ...parsed,
        family: {
          ...INITIAL_MEMORY.family,
          ...(parsed.family || {})
        }
      };
      
      // Specifically fix the Sazel/Sezal issue if it exists in the saved siblings
      if (memory.family.siblings) {
        memory.family.siblings = memory.family.siblings.map(s => s.replace("Sazel", "Sezal"));
      }
    } catch (e) {
      console.error("Failed to parse memory", e);
    }
  }
  
  return memory;
};

export const saveMemory = (memory: UserMemory) => {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
};

export const updateMemoryFromText = (text: string) => {
  // This is a simple implementation. 
  // In a real app, we might use Gemini to extract facts.
  // For now, we'll let Gemini know she can "request" updates or we can just append to otherFacts.
  // Actually, it's better to let Gemini manage the facts via system instruction.
};
