import assert from "node:assert/strict";
import { test } from "node:test";
import { stripVTControlCharacters } from "node:util";
import { rgbColor, styleText, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { footerText, pinnedStatus, PINNED_COLOR, renderPinnedFooterLine } from "../extensions/footer-status.ts";
import type { Bookmark } from "../extensions/store.ts";

const bookmark: Bookmark = {
	id: "12345678-abcd", path: "/tmp/session.jsonl", cwd: "/project", name: "会话名字",
	note: "pin 备注", preview: "a very long prompt should not appear in the footer", createdAt: "", updatedAt: "",
};
const theme: Parameters<typeof renderPinnedFooterLine>[3] = {
	fg: (_color, text) => styleText(text, { fg: rgbColor(120, 120, 120) }, "truecolor"),
	style: (text, options) => {
		assert.deepEqual(options.fg, PINNED_COLOR);
		return styleText(text, { fg: PINNED_COLOR }, "truecolor");
	},
};

test("Pinned label prefers session name, then note, then short ID; unpinned has no marker", () => {
	assert.equal(pinnedStatus(bookmark), "Pinned · 会话名字");
	assert.equal(pinnedStatus({ ...bookmark, name: " " }), "Pinned · pin 备注");
	assert.equal(pinnedStatus({ ...bookmark, name: undefined, note: "" }), "Pinned · 12345678");
	assert.equal(pinnedStatus(undefined), undefined);
});
test("titles cannot inject terminal escape sequences or extra rows", () => {
	assert.equal(footerText("\x1b[31mred\x1b[0m\n\t name\x1b]2;bad-title\x07"), "red name");
	assert.equal(pinnedStatus({ ...bookmark, name: "\x1b[2J\r\n" }), "Pinned · pin 备注");
});
test("blue label is right aligned without overflowing wide or tiny panes", () => {
	for (const name of ["会话名字", "中文 📌 名字 ".repeat(30), "e\u0301".repeat(100)]) {
		for (const width of [0, 1, 5, 6, 10, 19, 20, 40, 80, 120]) {
			const line = renderPinnedFooterLine("~/Workspace/project (main)", `Pinned · ${name}`, width, theme);
			assert.ok(visibleWidth(line) <= width);
			assert.ok(!line.includes("\n"));
			if (width > 0) {
				assert.equal(visibleWidth(line), width);
				assert.ok(line.includes("\x1b[38;2;95;175;255m"));
				assert.ok(!stripVTControlCharacters(line).endsWith(" "));
			}
			if (width >= 6) assert.ok(stripVTControlCharacters(line).includes("Pinned"));
		}
	}
});
test("an unpinned footer is byte-for-byte the original path/name rendering", () => {
	const left = "~/Workspace/project (main) • 未 pin 的名字";
	for (const width of [1, 20, 80]) {
		assert.equal(renderPinnedFooterLine(left, undefined, width, theme), truncateToWidth(theme.fg("dim", left), width, theme.fg("dim", "...")));
	}
});
