import type { PolishMode } from './types';

export const UNSAFE_REFUSAL_TOKEN = '__UNSAFE_POLISH_REQUEST__';

const MODE_INSTRUCTIONS: Record<PolishMode, string> = {
  clearer: 'Improve clarity, punctuation, organization, and readability. Keep approximately the same tone and length.',
  polished: 'Make the message professional and well structured. Preserve warmth, humor, and personality. Do not make it stiff or corporate.',
  shorter: 'Reduce unnecessary repetition. Preserve all important facts, questions, intent, and essential context.'
};

export const SYSTEM_INSTRUCTION = `Rewrite only the sender's contact message according to the requested mode.

Always preserve the sender's meaning, names, stated facts, questions, humor, personality, and level of warmth. Correct obvious speech-to-text punctuation and sentence-boundary issues. Make the writing natural, not corporate or generically AI-written. Do not make the sender unnaturally formal. Never invent facts, opportunities, relationships, deadlines, promises, credentials, or commitments. Do not add a greeting or sign-off unless the original included one. Return only the revised message with no commentary or explanation.

If the message asks you to improve a credible threat, targeted hateful harassment, sexual exploitation, a scam, impersonation, instructions for wrongdoing, malicious coercion, or other deliberate harm, return exactly ${UNSAFE_REFUSAL_TOKEN} and nothing else.`;

export function buildUserInstruction(mode: PolishMode, message: string) {
  return `Mode: ${mode}\nMode requirements: ${MODE_INSTRUCTIONS[mode]}\n\nMessage:\n${message}`;
}
