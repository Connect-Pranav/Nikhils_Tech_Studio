# Task for Claude Code: restyle NIKHILs TECH STUDIO OS with the 21st.dev "Prism" look

Reference template (Mohammad Shehadeh, 21st.dev): https://21st.dev/@mohammadshehadeh/templates/prism
Treat it as visual inspiration. Do not copy its text, images or assets 1:1. Check the template's own license on that page before reusing any code.

## 1. Connect the 21st MCP (the person does this once, never paste the key in a chat)
1. Get a free key at https://21st.dev/mcp
2. Run in the project folder:
   `claude mcp add --transport http 21st https://21st.dev/api/mcp --header "x-api-key: <YOUR_KEY>"`
3. Restart Claude Code, run `/mcp` and confirm `21st` is connected. Tools: `search`, `get_component`, `generate` (only if AI is enabled on the account), `get_inspiration`, `search_logo`.
4. Use `search` / `get_component` / `get_inspiration` to study the Prism template and similar hero/nav/pill components.

## 2. Hard constraints (do not break)
- Static site, flat repo root, vanilla **ES5** JS (no arrow functions, no const/let in loops, no modules, no build step). Zero cost: no paid APIs or services.
- 21st components are React + Tailwind. **Translate them into plain CSS + vanilla JS.** Do not add React, Tailwind, npm or a bundler.
- Keep the existing glass design tokens (`--bg --s1 --s2 --ln --tx --mu --ac ...` in glass.css, light and dark themes).
- Icons come only from the inline-mask subset in icons.css. Add a new icon there only if missing.
- Must still work at 320px, 375px, 390px and 1280px with no horizontal scroll. Respect `prefers-reduced-motion`.
- Do not touch the sync engine or backend: shared.js, localsrv.js, requests.js logic, backend-Code.gs.

## 3. What to build
A. **Welcome hero (first priority)**: splash.css / splash.js / the `#splash` block in index.html. Already a dark green "botanical" glow hero with a glass pill top bar, big headline `Welcome, <Name>` (name from `nts_rq_cfg.who`), a primary pill button and a progress line; auto-enters after about 4.4s, tap or any key skips, once per session. Bring it closer to the Prism look: richer layered foliage glow, glass pill nav, tag chip, headline typography, secondary pill button, subtle entrance motion. Keep the greeting `Welcome, <connected name>`.
B. **Optional, only after A is approved**: apply the same pill/glass language to the top nav (`#hd`, `#nav`) and the page headers. Do not restructure pages.

## 4. Acceptance checks
- No JS errors in the console; splash shows once per session, skips on tap/key, removes itself from the DOM.
- 320 / 390 / 1280 widths: no overflow, button reachable, text not clipped (italic descenders have room).
- Notification bell, Dal Abba bubble and the sidebar Connection button still work and are not covered by the splash after it ends.
- Lighthouse-style sanity: no layout shift when the splash leaves.

## 5. Delivery
Upload sequence used by this team (GitHub web, no CLI): delete old file, upload new, wait 2 minutes, hard refresh (Ctrl+Shift+R). List every file you changed at the end.

## 6. Current state and known gaps (be honest in your final report)
- Shared requests backend (Apps Script + Sheet) works in the owner's tests; `backend-Code.gs` is the deployed script (pure ASCII). Script property `TEAM_KEY` must be set in Apps Script. Web-app access must be "Anyone", execute as "Me", and every code change needs a new deployment version.
- `requests.js` contains a "migrate this device's local requests to the shared backend" feature that was written but **never tested**. Test it or leave it alone.
- Tasks, leads and inventory are still saved per device only.
- Real iPhone and real 3D Dal Abba were not tested by the previous session.
