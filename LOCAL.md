# Local customization

## Checkout and installation

The original repository was **moved**, not copied or linked, to:

`/home/Catwine/Workspace/pi-bookmark`

- Upstream: `git@github.com:vaultboy001/pi-bookmark.git`
- Upstream base: `66762c3` (package version 0.1.5).
- Previous customization: `ff2b444` on `local/no-footer-marker` (kept as a rollback branch).
- Current development branch: `local/pinned-footer`.
- Pi's `~/.pi/agent/settings.json` loads the Workspace path.
- Bookmark data remains at `~/.pi/agent/pi-bookmark/bookmarks.json`; migration does not move or modify this data.

## Pinned marker

The plugin publishes plain status text under `pi-bookmark`:

`Pinned · <name>`

Title priority: session name (`/name`), then `/pin` note, then the first eight
characters of the session ID. It does not use a potentially private prompt preview
as a footer title. Control sequences and line breaks are stripped.

Pin/unpin commands, the shortcut, the model tool, session rename, session start
and shutdown refresh/clear the marker. Nothing is pinned automatically.

The existing custom footer owns the actual layout:

`~/.pi/agent/extensions/dpsk-footer.ts`

It imports the shared `extensions/footer-status.ts` helper, renders the marker in
blue (`#5fafff`) on the **right of the first row**, and excludes it from the generic
third status row. A pinned session name is not duplicated on the left. Unpinned
sessions retain their original first-row layout. Token/provider/model statistics
on the second row are unchanged. Long titles/paths are truncated using terminal
column widths; tiny panes prioritize the pin marker.

No competing `setFooter()` is installed by pi-bookmark. Without the custom footer
integration, Pi can still show the plain status in its normal extension-status row.

The external footer changes are recorded in `integrations/dpsk-footer.patch`.
It is documentation for reproducing this local integration, not an auto-applied
installer. The import assumes the Workspace path above; update it if moving again.
Before deleting this checkout, remove that helper import/integration from the
custom footer as well as removing the package from settings.

Run `/reload` in each running Pi session after updating either file.

## Validation

```sh
npm ci --ignore-scripts
npm run check
```

Development packages are pinned to the local Pi 1.1.0 family. Runtime peers are
still supplied by Pi. Tests use temporary bookmark stores and never pin/unpin real
sessions. Manual QA: `/pin note`, `/name new-name`, `/unpin`, switch sessions, and
resize the pane; verify the second row and other extension statuses are unchanged.

## Upstream updates

```sh
cd ~/Workspace/pi-bookmark
 git fetch upstream
 git log --oneline HEAD..upstream/main
 git diff HEAD...upstream/main -- extensions package.json
```

Merge upstream only after review, preserving the status-provider/custom-footer
integration. Nothing is committed or pushed automatically, and local package
updates do not replace this checkout.
