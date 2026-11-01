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
| `preview.js` | index | Preview of a not-yet-published offer exactly as the client sees it (route `#/preview/<offer_id>`): sticky banner, sign-in / not-allowed page, dashed "not entered" placeholder. Slots `preview.banner`, `preview.gate`, `preview.ph`. |
| `chat.js` | index | ONE inbox ("Messages / المحادثات") for clients and companies: floating button + docked panel (list -> thread -> composer). No slots; it mounts itself. See "chat (Run 13)" below. |
| `trip-request.js` | index | Tailored trip request (task #31): button beside the category buttons, form at `#/request`, client's requests + quotes on the account page, company inbox + quote/decline on the company dashboard. Slots `trips.request-cta`, `page.request`, `account.requests`, `dash.requests`. Data adapter `extras.tr` (`TR_HOST` in index.html) calls RPCs `wijha_submit_request`, `wijha_company_requests`, `wijha_send_quote`, `wijha_decline_request`. Test: `node tests/trip-request-test.js`. |
| `vault-intake.js` | both | "Secure file upload (new)" card (task #16): create/copy/revoke an upload link, list the files uploaded through it, convert to draft offers. Slots `dash.vault` (index `#/company`) and `intake.vault` (admin intake). One file serves both pages. |

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

## vault-intake (task #16) in short

Sits beside the old upload, replaces nothing. It calls only the edge function `wijha-vault-bridge` (actions `issue_link`, `revoke_link`, `list`, `import`) and then the existing `wijha-extract`, through page helpers passed in `Wijha.host({extras:{bridge, extract, review, reloadList}})` (they never throw; `status:0` = no connection). Bridge errors stay inside the card (503 "vault not configured" -> "خدمة رفع الملفات الآمنة غير مفعّلة بعد — تواصل مع وجهة"). Polling the file list every 15 s runs only while the card is on screen and the tab is visible. The upload page is another domain and is only shown as text, so the CSP is unchanged. Test: `node tests/vault-intake-test.js`. Kill switch: `?blocks_off=vault-intake` or remove its `<script>` line.

## preview (Run 12) in short

`index.html` route `#/preview/<offer_id>` reads the offer with the signed-in user's own token (site session, else the admin-console session; RLS decides; a company user must also match `profiles.company_id`), maps it with the same `mapOffer` / `hydrate(x, sel)` and renders it with the same template `detailView(x)` as `#/trip/<id>` (`detail(id)` is now a thin wrapper). In preview mode only (`window.__preview`), `pvE/pvLi/pvS` in the template draw dashed placeholders for empty fields through the block slot `preview.ph`; on the public route they return `''`, so the public page is unchanged (byte-identical in the test). The block draws the banner (status chip, extractor checks from `wijha_imports.payload.created[].checks` + per-field "needs your attention", Edit -> `admin.html?edit=<id>`, Send for review = PATCH `offers` `{status:'pending_review', review_state:'pending'}` for company users with a title and a price) and the gate pages. Not stored anywhere (no localStorage; only `sessionStorage.wijha_return='#/preview/<id>'` after pressing Sign in), `<meta name=robots content=noindex,nofollow,noarchive>` only while on the route. Save / compare / share / enquire / chat buttons are inert in preview. Page extras: `previewHref`, `pvPatch`, `pvReload`. Other places link to it: company dashboard ("offers not visible to clients" + import rows), vault-intake result (`data-vi-preview`), admin offers list / editor / import list (public link only for published + approved). Test: `node tests/preview-test.js`. Kill switch: `?blocks_off=preview` (the route then shows the normal page without banner/placeholders: do not use it on a live preview).

## chat (Run 13) in short

`blocks/chat.js` v1.0.0 is the only inbox on the public site: it replaces "استفساراتي" + "محادثاتي" (client) and the separate enquiries list (company). Messenger-style: a round button on the **end side of the screen** (bottom-LEFT in Arabic, bottom-RIGHT in English; nothing else lives in the bottom corners, and it lifts itself above the cookie notice, the compare bar and the mobile price bar when they would overlap) with an unread badge; it opens a docked panel (360x520 on desktop, full-height sheet at <=600 px, button hidden while the sheet is open) with the conversation list -> thread -> composer.

- **Data comes from the page, not from the block.** `Wijha.host({extras:{chat: CHAT_HOST}})` in `index.html` (adapter defined just above the "boot hook" of the live layer): `me() list() who() sub() tripId() unread() lastFrom() offer() messages() send() ensure() markRead() warn() showFab() signIn()`. It reuses the existing `wijha_threads` / `wijha_messages` tables, the RPC `wijha_mark_read` and the blocking message `t('warn')`. Demo mode (no Supabase) maps the same calls onto the local `THREADS`. No DB / edge change.
- **Behaviour.** Enter sends (Shift+Enter = new line, IME-safe), Escape closes. Optimistic send: the message shows at once as "sending"; on failure it stays with "Retry" / "Remove" (nothing is duplicated; a poll never runs while a send is in flight). A thread for an offer is only created when the first message is sent (`ensure`), so opening "Chat with the company" never leaves empty threads. A message the server marks `blocked` is shown struck-through with the blocking notice and a toast. Auto-scroll to the newest message unless the reader scrolled up. Everything is escaped (`dir="auto"` on bodies).
- **Polling.** 10 s only while the panel is open (current thread's messages, then the thread list; marks read when the thread is open and something new arrived), 45 s for the badge while it is closed, nothing while the tab is hidden, nothing for signed-out visitors (they get no button; "Chat with the company" on a trip page opens the panel with a sign-in prompt, no request is made).
- **Routes kept.** Any `<a href="#/chat/<id>">` (trip page button, account / dashboard rows) is intercepted and opens the widget in place; typing `#/chat/<id>` or `#/chat/new-<offer>` opens the widget over the account / company page (unknown id -> list). If the block is off or broken (`?blocks_off=chat`, 404, init throws) the old full-page chat is used and the old bell + 8 s poll come back.
- **Page hooks.** `startPoll()` / `stopPoll()` call `Wijha.use('chat').sync()` after sign-in / out, `applyLang()` calls `relang()`. Expose: `open(threadId) openOffer(offerId) close() sync() relang() unread() state()`.
- Admin console "المحادثات" tab is unchanged (it is the staff view across all threads).
- Test: `node tests/chat-test.js` (Playwright, mocked REST; also covers the Run 13 copy changes).

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
node tests/chat-test.js                                      # ALL PASS (chat widget + Run 13 copy)
```
plus the older scripts in `/tmp/claude-0/` (null-scan, legal-test, csp-test, faq-test, photo-test, up-test, home-func, audit-fixes-test, admin-audit-test).

By hand, for a new or changed block:
1. Opens with the console empty (no red errors) in Arabic and English, at 390 px and 1280 px.
2. Break it on purpose (throw inside the slot): the note appears in its place and the rest of the page works.
3. `?blocks_off=<name>`: the block disappears and nothing else changes.
4. Empty / missing data renders nothing or a sensible line, never `null`/`undefined`.
5. Loaded from the real server (not `file://`): the Network tab shows `/blocks/<name>.js` as 200 `application/javascript` and the console has no CSP message.
6. Version bumped.
