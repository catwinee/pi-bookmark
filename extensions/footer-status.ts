import { stripVTControlCharacters } from "node:util";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { rgbColor, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import type { Bookmark } from "./store.js";

export const BOOKMARK_STATUS_ID = "pi-bookmark";
export const PINNED_COLOR = rgbColor(95, 175, 255);

/** Titles are user input: never let control sequences or newlines enter the footer. */
export function footerText(text: string): string {
	return stripVTControlCharacters(text).replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").replace(/\s+/g, " ").trim();
}

export function pinnedStatus(bookmark: Bookmark | undefined): string | undefined {
	if (!bookmark) return undefined;
	const title = footerText(bookmark.name ?? "") || footerText(bookmark.note) || footerText(bookmark.id).slice(0, 8);
	return title ? `Pinned · ${title}` : "Pinned";
}

/** Shared with the user's existing footer; never installs a competing setFooter(). */
export function renderPinnedFooterLine(
	left: string,
	status: string | undefined,
	width: number,
	theme: Pick<Theme, "fg" | "style">,
): string {
	if (width <= 0) return "";
	const label = status ? footerText(status) : "";
	if (!label) return truncateToWidth(theme.fg("dim", left), width, theme.fg("dim", "..."));

	// Preserve some path space on ordinary panes; on tiny panes prioritize Pinned.
	const rightRoom = width >= 20 ? Math.floor(width * 0.6) : width;
	const right = theme.style(truncateToWidth(label, rightRoom, rightRoom > 6 ? "…" : ""), { fg: PINNED_COLOR });
	const remaining = width - visibleWidth(right) - 2;
	const leftPart = remaining > 0 ? theme.fg("dim", truncateToWidth(left, remaining, "…")) : "";
	return leftPart + " ".repeat(Math.max(0, width - visibleWidth(leftPart) - visibleWidth(right))) + right;
}
