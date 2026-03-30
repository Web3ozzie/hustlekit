import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { tool, payload } = body; // "bio" | "letter" | "pitch" | "cv"

    let systemPrompt = "You are a helpful assistant that writes short, clear text.";

    if (tool === "bio") {
      systemPrompt =
        "You write catchy but short social media bios (max 150 characters), friendly but not cringe.";
    } else if (tool === "letter") {
      systemPrompt =
        "You are an expert letter writer. You write clear, properly formatted letters based on user inputs.";
    } else if (tool === "pitch") {
      systemPrompt =
        "You help write short persuasive pitches tailored to the audience and context.";
    } else if (tool === "cv") {
      systemPrompt =
        "You help generate short CV summaries and bullet points based on role, experience and skills.";
    }

    const userPrompt = buildUserPrompt(tool, payload);
    const fullPrompt = systemPrompt + "\n\n" + userPrompt;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    });

    const text =
      response?.output_text ??
      response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Sorry, I could not generate text.";

    return NextResponse.json({ text });
  } catch (e) {
    console.error("AI ROUTE ERROR RAW:", e);
    console.error("AI ROUTE ERROR MESSAGE:", e?.message);
    return NextResponse.json(
      { error: e?.message || "AI generation failed" },
      { status: 500 }
    );
  }
}

function buildUserPrompt(tool, payload) {
  if (tool === "bio") {
    return `User description: ${payload.bioInput}. Generate 1 catchy social media bio.`;
  }

  if (tool === "letter") {
    return `
Write a ${payload.letterType} letter.

To: ${payload.toPerson}
From: ${payload.fromPerson}

Body (my rough message):
${payload.letterBody}

Rewrite it as a polished, well‑formatted letter in plain text.
`;
  }

  if (tool === "pitch") {
    return `
Type of pitch: ${payload.pitchType}
Audience: ${payload.audienceType}
Details: ${payload.textInput}

Write a short, punchy pitch (4–7 sentences).
`;
  }

   if (tool === "cv") {
  return `
You are a CV writer. Use this info to create a clean, job-ready CV in this exact structure:

FULL NAME (uppercase): ${payload.fullName || "Full Name"}
Address line (e.g. area, city, state): ${payload.location || "Not provided"}
Phone: ${payload.contactInfo || "Not provided"}
Email: ${payload.email || "Not provided"}

Write the CV in this plain text layout:

[LINE 1] FULL NAME (uppercase, on its own line)
[LINE 2] Address (e.g. Lifecamp, Gwarinpa, Abuja)
[LINE 3] Tel: ...   Email: ...

Then blank line, then:

CAREER OBJECTIVE
Single short paragraph (1–2 lines).

PROFESSIONAL SUMMARY
Short paragraph (3–4 lines) describing personality and key strengths.
EDUCATION
- ${payload.eduSchool || "School name"}, ${payload.location || "City"}
  ${payload.eduDegree || "Qualification"} .......................... ${payload.eduYear || "Year"}
${payload.eduSchool2
  ? `- ${payload.eduSchool2}, ${payload.location || "City"}
  ${payload.eduQual2 || "Senior School Certificate"} .......................... ${payload.eduYear2 || "Year"}`
  : ""}
WORK EXPERIENCE
${payload.expCompany1
  ? `- ${payload.expCompany1}, ${payload.location || "Location"}
  Role: ${payload.expRole1 || "Job Title"} ............................... ${payload.expYear1 || "Year"}
  ${payload.expDuties1
    ? payload.expDuties1
        .split("\n")
        .filter(Boolean)
        .map((d) => `  - ${d}`)
        .join("\n")
    : ""}`
  : ""}

${payload.expCompany2
  ? `- ${payload.expCompany2}, ${payload.location || "Location"}
  Role: ${payload.expRole2 || "Job Title"} ............................... ${payload.expYear2 || "Year"}
  ${payload.expDuties2
    ? payload.expDuties2
        .split("\n")
        .filter(Boolean)
        .map((d) => `  - ${d}`)
        .join("\n")
    : ""}`
  : ""}
REFERENCES
Available on request

Use only line breaks, bullets (-) and dots for spacing like above, no markdown, no extra decorations.
`;
}

  // default for unknown tools
  return "Generate some helpful text.";
}