# css/ — the site's look, one file per area

`index.html` loads these in this order (order matters: later files can override earlier ones). Edit, replace or delete any file on its own;
no JavaScript changes are needed. Test: `node tests/css-split-test.js` (pages must render pixel-identical to the all-in-one version).

| File | What it styles |
|---|---|
| `base.css` | colours (`:root` variables), fonts, reset, buttons, shared bits |
| `nav.css` | top bar and language switch |
| `hero.css` | old hero + search box |
| `categories.css` | category cards |
| `cards.css` | trip card grid (image, price, badges) |
| `companies.css` | company cards / logos |
| `filters.css` | filter bar on the trips list |
| `trip-detail.css` | trip page: gallery, itinerary, hotels, price sidebar, reviews |
| `forms.css` | panels, inputs, sign-up forms |
| `dashboard.css` | client + company dashboards |
| `chat.css` | old chat styles (the new chat injects its own) |
| `misc.css` | toasts, tables, small utilities, mobile fixes |
| `polish.css` | premium polish layer (shadows, hover, focus) |
| `home.css` | home page sections: hero, categories, featured, trust, companies, how it works, company CTA, skeleton |

Rules for any restyle (by hand or by an AI tool): keep every class name and `id` (the JavaScript uses them), keep `dir="rtl"` working
(use `margin-inline-*` / `padding-inline-*` / `inset-inline-*`, never left/right), keep the phone layout (≤ 700 px), keep colours as `:root` variables in `base.css`.
