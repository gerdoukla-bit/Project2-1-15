# Wijha blocks

A block is one feature in one plain `.js` file under `/blocks/`. The page asks the registry for a block's HTML at a named
**slot**. If the block is missing, switched off or crashes, only that slot is affected; the rest of the page keeps working.

No build step, no framework, no new hosts. CSP stays `script-src 'self' 'unsafe-inline'`.

## Files

| File | Page | What it is |
|---|---|---|
| `core.js` | both | The registry, error boundary, disable switch, shared API. Loaded first, as a normal script. |
| `legal.js` | index | Terms / privacy / cookies / refund pages and the cookie notice |
| `faq.js` | index | Offer FAQ accordion |
| `photos.js` | index | "Photos from previous trips" section |
| `freshness.js` | index | "Price confirmed 3 days ago" stamp on cards and the trip page |
| `admin-faq.js` | admin | FAQ tab of the offer editor |
| `admin-photos.js` | admin | Photos tab of the offer editor |
| `admin-freshness.js` | admin | "Confirm still valid" button, bulk confirm, "needs update" list |

## How a page loads them

```html
<script src="blocks/core.js"></script>                       <!-- first, not deferred: the registry must exist -->
<script>window.Wijha=window.Wijha||{block(){},host(){},html(){return ''},mount(){},use(){return null},status(){return {}}};</script>
<script defer src="blocks/faq.js"></script>                  <!-- every block: defer -->
```

The one-line stub means that even if `core.js` itself fails to load, the page still renders (without blocks).
The page registers what blocks may use, once, with `Wijha.host({...})` (see the end of the script in `index.html` / `admin.html`).

## Add a new block in 5 steps

1. **Create `/blocks/<name>.js`** (lower-case, hyphens; admin blocks start with `admin-`). Wrap it in `(function(){ ... })();`.
2. **Register it**:
   ```js
   Wijha.block('my-feature', {
     version: '1.0.0',                       // bump on every change
     deps: [],                               // optional: other block names that must be ready first
     slots:   { 'detail.my-feature': (ctx, api) => `<section>...${api.esc(ctx.trip.name)}</section>` },
     actions: { save: async (arg, el, ev, api) => { await api.post('table', {...}); api.toast('Saved'); } },
     expose:  { somePublicHelper() {} },     // optional: what other code may call via Wijha.use('my-feature')
     init(api) { }                           // optional: one-time setup (may return a promise)
   });
   ```
3. **Put a slot in the page** where it should appear: `${Wijha.html('detail.my-feature', {trip:x})}` in the template.
   Pass data in `ctx`; do not let the block read page globals. Use `{quiet:true}` as a third argument for small decorations
   (a stamp on a card) so a failure shows nothing instead of a note.
4. **Add the script tag** to the page head: `<script defer src="blocks/my-feature.js"></script>`.
5. **Test it** (checklist below), then upload `blocks/my-feature.js` plus the changed page.

Events: in block HTML write `data-wb-click="my-feature.save|42"` (also `data-wb-input`, `data-wb-change`) instead of `onclick="..."`.
The part before the dot is the block, then the action name, then `|` and an optional argument string (the handler gets `(arg, el, event, api)`).
Handlers run inside the same error boundary.

## What a block receives (`api`)

`api.lang` ('ar'|'en', always current), `api.t(ar, en)`, `api.esc(s)`, `api.toast(msg, isError)`, `api.go('#/path')`,
`api.setTitle(t)`, `api.refresh(scope)` (ask the page to redraw), `api.get(path)`, `api.post(table,row)`, `api.patch(path,body)`,
`api.del(path)`, `api.rpc(fn,args)` (the page provides the ones that make sense for it; the public site only has `get` and `post`),
`api.x` (page extras, e.g. the admin image helpers), `api.use(otherBlock)`, `api.log(...)`, `api.name`, `api.version`.

## Conventions

- **Naming.** Block name = file name without `.js`. Slots are `<area>.<what>` (`detail.faq`, `trip.fresh`, `offers.fresh.panel`, `editor.faq`, `page.legal`).
  Actions are verbs (`add`, `del`, `confirm`). One slot has exactly one owner.
- **Only through `api`.** No reaching into the page's globals (`L`, `S`, `ED`, `TRIPS`...). If a block needs something, the page passes it in `ctx` or `Wijha.host({extras})`.
- **No new external hosts, no `eval`, no inline `<script>` in block HTML.** Same-origin file only.
- **Data.** Mapping a database column into the page's objects stays in the page (`mapOffer`, `hydrate`); the block receives the mapped value. A block may also fetch its own data (`admin-freshness` does).
- **Never print `null` / `undefined`.** Treat every field as possibly missing.
- **Both languages and RTL** (public blocks). Check 390 px and 1280 px.
- **Shared storage keys** are a contract: `wijha_consent`, `wijha_sid` (legal block writes, page reads), `wijha_blocks_off`.
- **Version.** Bump `version` on every edit and add a line to `TEST-HISTORY.md`.
- Blocks must not throw at load time outside `Wijha.block(...)`. Anything inside `init`, a slot or an action is already guarded.

## What happens when a block fails

- `init`, a slot render or an action throws (or rejects): the error goes to `console.error('[wijha-block:<name>] ...')`,
  and the slot shows "This section is temporarily unavailable" (Arabic: "هذا القسم غير متاح مؤقتاً"). Nothing is re-thrown.
- The block file does not load (404): the slot stays empty, then shows the same note about 4 seconds after the page loaded.
- Inspect: `Wijha.status()` in the browser console -> `{faq:{version,state,error},...}` (states: ready, off, failed, blocked, pending).

## Switch a block off (debugging, or while a bug is fixed)

Any one of these, with a block name or a comma list (`*` = all blocks):

- URL: `https://wijha.example/?blocks_off=faq,photos#/trips` (or put it after the `#`)
- Browser console: `localStorage.setItem('wijha_blocks_off','faq')` then reload. Remove with `localStorage.removeItem('wijha_blocks_off')`.
- In code, before the block scripts: `window.BLOCKS_OFF=['faq']`.

A switched-off block renders nothing and no note. Other blocks are unaffected.
Hard kill for everyone: delete its `<script defer ...>` line from the page (the slot then stays empty).

## Test checklist (before uploading)

```
node tests/admin-tour.js /home/claude/wijha                  # 0 errors (also: ... company)
node tests/blocks-test.js                                    # ALL PASS (failure isolation, disable switch, freshness, admin)
```
plus the older scripts in `/tmp/claude-0/` (null-scan, legal-test, csp-test, faq-test, photo-test, up-test, home-func, audit-fixes-test, admin-audit-test).

By hand, for a new or changed block:
1. Opens with the console empty (no red errors) in Arabic and English, at 390 px and 1280 px.
2. Break it on purpose (throw inside the slot): the note appears in its place and the rest of the page works.
3. `?blocks_off=<name>`: the block disappears and nothing else changes.
4. Empty / missing data renders nothing or a sensible line, never `null`/`undefined`.
5. Loaded from the real server (not `file://`): the Network tab shows `/blocks/<name>.js` as 200 `application/javascript` and the console has no CSP message.
6. Version bumped.
