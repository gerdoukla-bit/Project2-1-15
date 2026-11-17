# How the project is organised

One rule: **one feature = one file**. To add, change or remove a feature you touch that one file (plus one `<script>` line), never the whole project.

```
index.html            the public site shell: menu, routes, shared data loading. No feature screens live here any more (3 left to move: compare, hotel page, booking maths)
admin.html            command centre + company console shell
emails.html           email templates
vercel.json           hosting + security headers

blocks/               ONE FILE PER FEATURE  (see blocks/README.md for the full table)
  core.js             the tiny engine that loads blocks and keeps a broken one from breaking the page
  home.js  trips-list.js  trip-detail.js  signup.js  login-drop.js  account.js  dash.js
  offer-popup.js  preview.js  vault-intake.js  company-team.js  trip-request.js  chat.js
  photos.js  freshness.js  faq.js  legal.js  admin-*.js

css/                  ONE FILE PER LOOK AREA (nav, cards, forms, trip-detail …) — safe to restyle one at a time
sql/                  database changes, numbered in the order they were applied
supabase/functions/   server functions (extract, vault bridge, team)
vault/                the separate secure-upload project
tests/                one test per block:  node tests/<name>-test.js
research/             internal notes (competitors, leads). Never shown on the site
```

## Add a feature
1. Create `blocks/<name>.js`  2. add one `<script defer src="blocks/<name>.js">` line  3. add `tests/<name>-test.js`  4. add a row in `blocks/README.md`.

## Remove or switch off a feature
- Try it first without deleting: open the site with `?blocks_off=<name>` — the page shows its simple fallback.
- To remove: delete the file and its `<script>` line. Nothing else changes.

## What NOT to upload to GitHub
`*.before-*.html`, `index.new.html`, `research.zip` — these are local safety copies only.
