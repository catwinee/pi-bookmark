import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionCommandContext, ExtensionContext } from "@earendil-works/pi-coding-agent";
import extension from "../extensions/index.ts";
import { BOOKMARK_STATUS_ID } from "../extensions/footer-status.ts";
import { BookmarkStore } from "../extensions/store.ts";

test("pin, rename, unpin, shortcut, tool and session switches update the marker", async () => {
	const dir = await mkdtemp(join(tmpdir(), "pi-bookmark-status-test-"));
	const previous = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = dir;
	try {
		let name: string | undefined = "命名会话";
		let id = "session-a";
		const handlers = new Map<string, (event: unknown, ctx: ExtensionContext) => unknown>();
		const commands = new Map<string, (args: string, ctx: ExtensionCommandContext) => Promise<void>>();
		const statuses = new Map<string, string>();
		const shortcuts: Array<(ctx: ExtensionContext) => void | Promise<void>> = [];
		const tools: Array<(toolId: string, params: { action: "add" | "remove" | "list"; note?: string }, signal: undefined, update: undefined, ctx: ExtensionContext) => Promise<unknown>> = [];
		const pi = {
			getSessionName: () => name,
			on: (event: string, handler: (event: unknown, ctx: ExtensionContext) => unknown) => { handlers.set(event, handler); return () => {}; },
			registerCommand: (key: string, command: { handler: (args: string, ctx: ExtensionCommandContext) => Promise<void> }) => commands.set(key, command.handler),
			registerShortcut: (_key: string, shortcut: { handler: (ctx: ExtensionContext) => void | Promise<void> }) => shortcuts.push(shortcut.handler),
			registerTool: (tool: { execute: typeof tools[number] }) => tools.push(tool.execute),
		} as unknown as ExtensionAPI;
		const ctx = {
			mode: "tui", hasUI: true, cwd: dir,
			ui: { notify() {}, setStatus: (key: string, value?: string) => { if (value === undefined) statuses.delete(key); else statuses.set(key, value); } },
			sessionManager: {
				getSessionId: () => id, getSessionFile: () => join(dir, `${id}.jsonl`),
				getSessionName: () => name, getCwd: () => dir, getEntries: () => [],
			},
		} as unknown as ExtensionCommandContext;
		extension(pi);
		const marker = () => statuses.get(BOOKMARK_STATUS_ID);
		const emit = (event: string) => handlers.get(event)!({}, ctx);
		await emit("session_start");
		assert.equal(marker(), undefined);
		assert.deepEqual(BookmarkStore.default().load(), [], "never pins automatically");
		await commands.get("pin")!("书签备注", ctx);
		assert.equal(marker(), "Pinned · 命名会话");
		await commands.get("pin")!("", ctx);
		assert.equal(marker(), "Pinned · 命名会话");
		name = "重命名会话";
		await emit("session_info_changed");
		assert.equal(marker(), "Pinned · 重命名会话");
		name = undefined;
		await emit("session_info_changed");
		assert.equal(marker(), "Pinned · 书签备注");
		await commands.get("unpin")!("", ctx);
		assert.equal(marker(), undefined);
		await tools[0]("t1", { action: "add", note: "工具 pin" }, undefined, undefined, ctx);
		assert.equal(marker(), "Pinned · 工具 pin");
		await emit("session_shutdown");
		assert.equal(marker(), undefined);
		id = "session-b";
		await emit("session_start");
		assert.equal(marker(), undefined);
		id = "session-a";
		await emit("session_start");
		assert.equal(marker(), "Pinned · 工具 pin");
		await shortcuts[0](ctx);
		assert.equal(marker(), undefined);
		await shortcuts[0](ctx);
		assert.equal(marker(), "Pinned · session-");
		await tools[0]("t2", { action: "remove" }, undefined, undefined, ctx);
		assert.equal(marker(), undefined);
	} finally {
		if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = previous;
		await rm(dir, { recursive: true, force: true });
	}
});
