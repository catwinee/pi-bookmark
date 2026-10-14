# Local customization

This checkout is loaded directly by Pi from:

`/home/Catwine/.pi/agent/local-packages/pi-bookmark`

- Upstream: `git@github.com:vaultboy001/pi-bookmark.git`
- Base: upstream commit `66762c3` (package version 0.1.5).
- Local branch: `local/no-footer-marker`.
- Change: clear the `pi-bookmark` footer status rather than rendering the pin triangle. Bookmark commands, shortcuts, and storage are unchanged.
- Bookmark data remains at `~/.pi/agent/pi-bookmark/bookmarks.json`.

Pi's personal `settings.json` uses this directory instead of `npm:pi-bookmark`. No additional runtime dependencies are required; the manifest's peer dependencies are supplied by Pi.

After editing, run `/reload` in each running Pi session (or restart it).

To review upstream updates manually:

```bash
cd ~/.pi/agent/local-packages/pi-bookmark
git fetch upstream
git log --oneline HEAD..upstream/main
git diff HEAD...upstream/main -- extensions package.json
```

If the updates are wanted, merge `upstream/main`, resolve any conflicts while preserving the hidden footer status, and run `/reload`. Nothing is pushed automatically. Pi package updates should not replace files in this local checkout.
