import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quest-DHKF83NV.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var FALLBACK_QUESTIONS = [
	{
		q: "What is the powerhouse of the cell?",
		a: "Mitochondria",
		options: [
			"Mitochondria",
			"Nucleus",
			"Ribosome",
			"Golgi apparatus"
		]
	},
	{
		q: "Which hormone lowers blood sugar?",
		a: "Insulin",
		options: [
			"Insulin",
			"Glucagon",
			"Cortisol",
			"Adrenaline"
		]
	},
	{
		q: "What is the basic unit of life?",
		a: "Cell",
		options: [
			"Cell",
			"Atom",
			"Tissue",
			"Organ"
		]
	},
	{
		q: "Which organ produces bile?",
		a: "Liver",
		options: [
			"Liver",
			"Pancreas",
			"Stomach",
			"Kidney"
		]
	},
	{
		q: "What does DNA stand for?",
		a: "Deoxyribonucleic acid",
		options: [
			"Deoxyribonucleic acid",
			"Diribonucleic acid",
			"Dual nucleic acid",
			"Deoxyribose acid"
		]
	},
	{
		q: "Resting membrane potential of a typical neuron?",
		a: "-70 mV",
		options: [
			"-70 mV",
			"0 mV",
			"+30 mV",
			"-90 mV"
		]
	}
];
function shuffle(arr) {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
function localQuestFromNotes(notes) {
	const clean = notes.replace(/\s+/g, " ").trim();
	const snippet = clean.slice(0, 220) || "the quiet laws of the living body";
	const sentences = clean.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 24 && s.length < 180).slice(0, 8);
	return {
		title: "The Valley of Quiet Study",
		sourcePreview: snippet,
		questions: sentences.length >= 4 ? sentences.slice(0, 6).map((s, i) => {
			const words = s.replace(/[^\w\s]/g, "").split(" ").filter((w) => w.length > 4);
			const key = words[Math.min(2, words.length - 1)] ?? "knowledge";
			return {
				q: `From your notes: ${s.replace(new RegExp(key, "i"), "______")}`,
				a: key,
				options: shuffle([
					key,
					words[0] ?? "tissue",
					words[1] ?? "organ",
					FALLBACK_QUESTIONS[i % FALLBACK_QUESTIONS.length].a
				]).slice(0, 4)
			};
		}) : FALLBACK_QUESTIONS,
		chapters: [
			{
				title: "Chapter 1 — The Gate",
				text: `Dawn settles over a small valley farm. A wooden gate creaks open as you step onto the dirt path, a satchel of notes at your side.\n\nThe first page reads: “${snippet}${clean.length > 220 ? "…" : ""}”\n\nA breeze moves the wheat. Somewhere beyond the orchard, red slimes wait to test whether you truly understand what you carry. This is not a dungeon. It is a farm that remembers.`
			},
			{
				title: "Chapter 2 — The Orchard",
				text: `Apple trees lean over the path. A farmer-spirit in a straw hat nods as you pass.\n\n“Knowledge is a crop,” they say. “You plant it, you tend it, then you harvest it under pressure.”\n\n${sentences[0] ? `You murmur a line from class: “${sentences[0]}” The trees seem to listen.` : "You walk the rows and let the facts settle into your hands."}\n\nRed slimes bounce between the parsnips — forgotten facts given form. Walk into one only when you are ready to prove you remember.`
			},
			{
				title: "Chapter 3 — The Cottage",
				text: `Smoke lifts from a stone chimney. Inside the cottage, a chalkboard is covered in the same ideas as your notes, rewritten as riddles.\n\n${sentences[1] ? `One riddle is almost a copy of your page: “${sentences[1]}”` : "You copy a few lines into your journal."}\n\nYour hands feel steadier. The valley is teaching you by making you live the lesson, not recite it. Chickens fuss in the coop. Crops glow when they are ready to pick.`
			},
			{
				title: "Chapter 4 — The Far Field",
				text: `At the edge of the farm a lantern marks the next field. Harvest the rows. Answer the guardians. Keep walking.\n\n${sentences[2] ? `The last note in your satchel is the one you came for: “${sentences[2]}”` : "You are not cramming. You are walking a path."}\n\nEvery correct answer is a step west, toward harvest. When you are ready, leave this story and step onto the farm.`
			}
		]
	};
}
function parseJsonObject(text) {
	const start = text.indexOf("{");
	const end = text.lastIndexOf("}");
	if (start < 0 || end <= start) return null;
	try {
		return JSON.parse(text.slice(start, end + 1));
	} catch {
		return null;
	}
}
var generateQuest_createServerFn_handler = createServerRpc({
	id: "700ae570ae81c755876adb38318d8f06d8b7a3b45f1eb495b27aafeb4d70e036",
	name: "generateQuest",
	filename: "src/lib/quest.ts"
}, (opts) => generateQuest.__executeServer(opts));
var generateQuest = createServerFn({ method: "POST" }).validator((input) => input).handler(generateQuest_createServerFn_handler, async ({ data }) => {
	const notes = (data.notes ?? "").slice(0, 8e3);
	const fallback = localQuestFromNotes(notes);
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey || notes.trim().length < 12) return {
		ok: true,
		quest: fallback
	};
	try {
		const res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: "grok-4.5",
				max_tokens: 1400,
				temperature: .7,
				messages: [{
					role: "system",
					content: "You write cozy farm-fantasy study stories. Return ONLY JSON with keys title, chapters (array of {title,text}), questions (array of {q,a,options} with exactly 4 options, a must be one of options). 4 short chapters. 6 questions drawn from the notes. No markdown."
				}, {
					role: "user",
					content: `Turn these study notes into a 4-chapter valley adventure and 6 quiz questions.\n\nNOTES:\n${notes}`
				}]
			})
		});
		if (!res.ok) return {
			ok: false,
			error: `AI ${res.status}`,
			quest: fallback
		};
		const parsed = parseJsonObject((await res.json()).choices?.[0]?.message?.content ?? "");
		if (!parsed) return {
			ok: true,
			quest: fallback
		};
		const chapters = Array.isArray(parsed.chapters) ? parsed.chapters.filter((c) => c?.title && c?.text).slice(0, 6) : fallback.chapters;
		const questions = Array.isArray(parsed.questions) ? parsed.questions.filter((q) => q?.q && q?.a && Array.isArray(q.options) && q.options.length >= 2).slice(0, 8) : fallback.questions;
		return {
			ok: true,
			quest: {
				title: typeof parsed.title === "string" ? parsed.title : fallback.title,
				chapters: chapters.length ? chapters : fallback.chapters,
				questions: questions.length ? questions : fallback.questions,
				sourcePreview: notes.slice(0, 220)
			}
		};
	} catch {
		return {
			ok: false,
			error: "AI unavailable",
			quest: fallback
		};
	}
});
var extractNotesFromImage_createServerFn_handler = createServerRpc({
	id: "c4335f0788cca946a59208c303074130e9d0f19a079f26fe75cc71a5e8c6c78d",
	name: "extractNotesFromImage",
	filename: "src/lib/quest.ts"
}, (opts) => extractNotesFromImage.__executeServer(opts));
var extractNotesFromImage = createServerFn({ method: "POST" }).validator((input) => input).handler(extractNotesFromImage_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Camera reading needs AI in this environment."
	};
	const url = data.imageDataUrl.slice(0, 12e5);
	try {
		const res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: "grok-4.5",
				max_tokens: 900,
				messages: [{
					role: "user",
					content: [{
						type: "text",
						text: "Extract all readable study notes, headings, and facts from this photo. Return plain text only, no commentary."
					}, {
						type: "image_url",
						image_url: { url }
					}]
				}]
			})
		});
		if (!res.ok) return {
			ok: false,
			error: `Could not read the photo (${res.status}).`
		};
		const text = (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
		if (!text) return {
			ok: false,
			error: "No text found in the photo."
		};
		return {
			ok: true,
			text
		};
	} catch {
		return {
			ok: false,
			error: "Could not read the photo."
		};
	}
});
//#endregion
export { extractNotesFromImage_createServerFn_handler, generateQuest_createServerFn_handler };
