import type { ChatChannel } from "./types";

/** Channel names and what each chat is for. */
export const CHANNEL_COPY: Record<ChatChannel, { label: string; blurb: string }> = {
  farm: { label: "Farm", blurb: "Alerts, readings and equipment" },
  money: { label: "Money", blurb: "Income and expenses" },
  ask: { label: "Ask", blurb: "Questions about fish and plants" },
};

/** Tap-to-send suggestions. They are sent in English and shown in the chosen language. */
export const CHIPS: Record<ChatChannel, string[]> = {
  farm: ["How is my farm?", "Any alerts?", "What is running?", "Turn on aeration", "Turn off irrigation", "Turn on the pump"],
  money: ["I sold something", "I spent money", "How much profit this month?", "Show my expenses"],
  ask: [],
};

export const WELCOME: Record<ChatChannel, string> = {
  farm: "Hello! I'm Tulun VIEM. I will message you here when something on the farm needs attention. You can also ask how the farm is doing, or tell me to turn equipment on or off.",
  money: "Tell me what you earned or spent, for example “Sold 5 kg lettuce for $15” or “Bought fish feed $12”. I will ask you to confirm before I save it.",
  ask: "Hello! I'm Tulun VIEM. Ask about fish, plants or alerts. I only answer from the VIEM manual.",
};
