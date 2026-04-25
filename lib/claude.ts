import Anthropic from "@anthropic-ai/sdk";
import { getPath, getRelated, getSubject } from "./tree";
import type { MCQ } from "./db";

const COURSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    content: {
      type: "string",
      description:
        "The full course body in Markdown. Multiple sections with H2 headings, written in clear, engaging prose. No quiz inside.",
    },
    questions: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: { type: "string" },
          },
          correct_index: { type: "integer", minimum: 0, maximum: 3 },
          explanation: { type: "string" },
        },
        required: ["question", "options", "correct_index", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "content", "questions"],
  additionalProperties: false,
};

export type GeneratedCourse = {
  title: string;
  content: string;
  questions: MCQ[];
};

export async function generateCourse(subjectId: string): Promise<GeneratedCourse> {
  const subject = getSubject(subjectId);
  if (!subject) throw new Error(`Unknown subject: ${subjectId}`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  const path = getPath(subjectId).map((s) => s.name).join(" > ");
  const related = getRelated(subjectId).map((s) => s.name);

  const prompt = `Write a self-contained introductory course on "${subject.name}".

Context in the knowledge tree: ${path}
Description: ${subject.blurb}
${related.length ? `Related fields: ${related.join(", ")}` : ""}

Course requirements (Quantic-MBA-style):
- Mainly text — clear, engaging prose with concrete examples and intuitions.
- Roughly 800-1200 words.
- Markdown with 4-6 H2 sections (## headings). No H1.
- Build understanding from first principles; assume no prior knowledge of this specific topic.
- End the content body BEFORE the quiz — the quiz lives in a separate field.

After the content, write exactly 5 multiple-choice questions:
- Each has 4 plausible options (one correct, three distractors).
- Test understanding, not trivia or memorization.
- Provide a one-sentence explanation of why the correct answer is right.`;

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      format: {
        type: "json_schema",
        schema: COURSE_SCHEMA,
      },
    },
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text in Claude response");
  }
  const parsed = JSON.parse(textBlock.text) as GeneratedCourse;
  return parsed;
}
