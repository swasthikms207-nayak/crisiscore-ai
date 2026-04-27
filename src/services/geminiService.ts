export interface CrisisResponse {
  score: number;
  eta_text: string;
  status_msg: string;
  safety_protocol: string[];
  shelter_types: string[];
  sms_template: string;
  suspicious: boolean;
}

const fallbackResponse = (name: string): CrisisResponse => ({
  score: 50,
  eta_text: "Rescuers are being dispatched",
  status_msg: "Emergency services notified. Stay calm.",
  safety_protocol: ["Find higher ground", "Conserve phone battery"],
  shelter_types: ["community_center"],
  sms_template: `CRISISCORE ALERT: ${name} triggered SOS.`,
  suspicious: false,
});

export async function analyzeCrisis(
  name: string,
  age: number,
  emergencyType: string,
  location: { lat: number; lng: number },
  emergencyContact: string,
  situationalData: {
    peopleCount: number;
    riskLevel: string;
    description: string;
  }
): Promise<CrisisResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  if (!apiKey) {
    console.warn("Gemini API key missing. Using fallback crisis analysis.");
    return fallbackResponse(name);
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are the CrisisCore AI. Return only valid JSON.

VICTIM INFO:
Name: ${name}
Age: ${age}
Emergency Type: ${emergencyType}
Location: [${location.lat}, ${location.lng}]
Emergency Contact: ${emergencyContact}

SITUATION:
People Count: ${situationalData.peopleCount}
Risk Level: ${situationalData.riskLevel}
Description: ${situationalData.description}

SCORING:
- 90-100: Critical life threat
- 70-89: High risk
- 40-69: Medium risk
- 1-39: Low risk

Return exactly:
{
  "score": number,
  "eta_text": "string",
  "status_msg": "string",
  "safety_protocol": ["string", "string"],
  "shelter_types": ["community_center"],
  "sms_template": "string",
  "suspicious": false
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    return {
      score: Number(parsed.score || 50),
      eta_text: parsed.eta_text || "Rescuers are being dispatched",
      status_msg: parsed.status_msg || "Emergency services notified.",
      safety_protocol:
        Array.isArray(parsed.safety_protocol) && parsed.safety_protocol.length > 0
          ? parsed.safety_protocol
          : ["Find higher ground", "Conserve phone battery"],
      shelter_types:
        Array.isArray(parsed.shelter_types) && parsed.shelter_types.length > 0
          ? parsed.shelter_types
          : ["community_center"],
      sms_template:
        parsed.sms_template || `CRISISCORE ALERT: ${name} triggered SOS.`,
      suspicious: Boolean(parsed.suspicious),
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return fallbackResponse(name);
  }
}