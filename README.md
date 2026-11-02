# مواصلات إسكندرية

من أي حتة لأي حتة في إسكندرية

## Current delivery

This is a tested functional foundation, not a completed production transportation service.

- React/TypeScript/Vite Arabic RTL interface, light/dark themes, Lucide icons and mobile safe areas.
- Arabic place normalization, local fuzzy search, swap, recent searches, optional geolocation.
- MapLibre/OpenFreeMap street map on WebGL2 devices. Leaflet region diagram when WebGL2 is unavailable; explicitly labeled as schematic. Place coordinates are approximate area centers, not verified boarding stops.
- Transport directory reads only published verified Firestore records. No fabricated production lines, prices, times, schedules or service statuses are seeded.
- Graph routing has independent time/cost/transfer objectives, walking limits, cycle handling and inactive/unverified filtering. Unknown price does not produce a total. Edge fare means incremental segment fare; do not import whole-line fares on every edge. Waiting estimates must already be included in source-supported durations.
- Clearly separate illustrative Sidi Bishr–Raml journey. Its dashed line is not a verified transport alignment.
- Local bookmarks, first-load splash, service worker caching of visited app assets, offline notice.
- Optional Firebase Auth/Firestore adapter; callable Functions source for reports, applications, region-limited proposals, moderation, draft creation, contributor assignment and reviewed publication.
- Admin entry validates custom claims; all privileged operations are also checked on the server. Approval of a submission never directly publishes data.

## Run and test

Use Node 22. `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm build`.
Functions: `npm --prefix functions ci`, `npm --prefix functions run build`.
Deployable frontend output: `dist/`. `vercel.json` is provided for Vercel deployment.

## Firebase activation required

No Firebase account/project was supplied or provisioned, and no live database or Functions were deployed. No existing database was modified.

1. Select the target Firestore database/edition and region before provisioning. The source assumes native Firestore SDK/rules semantics; verify edition compatibility first.
2. Enable Google and email/password Authentication and authorized domains.
3. Register the web app. Copy `.env.example` to an ignored environment file and set `VITE_FIREBASE_CONFIG`. Firebase web config is public project configuration; never put service-account credentials in frontend variables.
4. Configure Firebase App Check reCAPTCHA and `VITE_RECAPTCHA_SITE_KEY`. Callables enforce App Check; keep enforcement enabled.
5. Run Security Rules emulator tests against the selected edition, review rules and indexes, then deploy rules/Functions to the explicit project ID. Do not overwrite any existing rules without merging and reviewing current access requirements.
6. Bootstrap the first admin with the Admin SDK from a trusted operator environment using a custom claim `role: 'super_admin'`; no client or user profile can self-assign this claim.
7. Populate only reviewed source-backed transport records. All fare and status mutations need audited admin publication.

## Security status

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for server-only transit publication, owner-only user data and default-deny private collections. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

The rules and Functions compile as application source, but Rules emulator syntax/security testing and live Firebase end-to-end testing are blocked by missing Firebase project access/tooling. They have not been deployed and must not be represented as production-validated.

Static adversarial review: live-record writes denied to every client; role injection through profile fields rejected by allowlisted schema; owner hijacking/extra fields/oversized names denied; user PII owner-only; submissions server-only; callable rates and duplicates transaction-controlled; public reads limited to published verified transit documents; rejected/pending submissions cannot become production data through client writes. These are code-review findings, not emulator test results.

## Remaining production scope

Full structured route/stop/fare editors, geometry drawing and ordered-stop editing; routing-graph compilation from route variants with fare boarding semantics; all three recommendations side by side; verified pedestrian routing and geocoding; fare effective dates/history; complete approval comparisons/clarifications/rollback UI; evidence uploads; contributor reputation; cross-device favorite synchronization; FCM push subscriptions; PWA raster icons and full iOS/Android install validation; emulator security and live integration testing; operational monitoring and verified transportation data import.

No feature in this remaining list should be presented as already active.

## Maps

OpenFreeMap usage and attribution: https://openfreemap.org/ and https://openfreemap.org/quick_start/ . Attribution remains visible. No map tile prefetching/offline street-map caching. Set `VITE_MAP_STYLE_URL` for a separately licensed provider if needed.

## Imported user fare documents — 29 October 2026

The 18 supplied screenshots include two exact duplicate pairs; 16 distinct images are retained byte-for-byte under `public/data-sources/`. `src/sourceCatalog.json` contains 163 manually transcribed fare entries (local, regional, tram replacement, general fare bands and taxi meter rates), linked to the source image and SHA-256. This is real source-provided reference data, separate from the demonstration and live verified transport records. The document date printed on the pages is March 2026. No claim is made that these prices or services were independently reverified today. No origin expansion is made for ambiguous names such as المحطة or الموقف. Fare bands are not assigned to arbitrary routes. Records remain `operatingStatus: unknown` and `routingEligible: false` until current service availability and routing details are reviewed. The directory provides Arabic text search, category filters, pagination and source-image inspection without requiring Firebase. The original assertion that no fare data had been supplied was incorrect; the imported catalog corrects that omission.

## Owner-supplied boarding guide (October 2026 update)
26 route descriptions from the owner's submitted code are isolated in `src/rideGuide.ts`.
They are displayed as pending-review descriptions, never active routing edges. Blanket
`verified` flags, line numbers, fabricated proportional segment times, hardcoded walking
distances, accessibility assertions and contributor identities were not imported.
Descriptions include directional endpoint instructions, clickable ordered areas, searchable
mode directory, area overview maps and locally saved/reopenable descriptions. Maps show
approximate area centers, not boarding coordinates or pedestrian navigation. Reverse and
intermediate segments deliberately do not inherit endpoint boarding instructions. Only exact
source-catalog fare labels match; whole-line fares do not automatically price subsegments.

Outstanding for navigation-grade service: independently verify each direction's actual stops,
coordinates, road geometry, active operation, segment fare rules and travel/wait measurements;
publish via the authenticated backend after review. The Firebase production connection and
full administrative workflows remain outstanding as described above.

## City editorial content and daily widgets

`src/cityContent.ts` contains 24 concise editorial records researched on 2026-10-30. Each records its primary source and review date. They are displayed when Firebase is unconfigured; configured deployments use the published backend collection instead. Local administration can prepare copies, but cannot publish changes. No editorial record is automatically added to the transportation graph. Existing local workspaces are preserved.

`HomeWidgets` requests Open-Meteo (weather/sunrise/sunset), AlAdhan (Egyptian calculation method 5, standard Asr), and ExchangeRate-API (EGP base). Dates use Africa/Cairo, not the visitor timezone. Displayed currency values are the reciprocal of EGP-base rates, for one foreign currency unit. They are indicative daily rates, not bank bid/ask quotes. All providers are attributed in the UI. Requests time out after 12 seconds. Cached values and failed refreshes are labelled. Weather is cached for 30 minutes; rates and same-day prayers for 24 hours. Day changes refresh date-specific feeds.

Provider availability and quotas are outside this app. Open-Meteo's free endpoint is for non-commercial use: configure a suitable licensed service before commercial operation. No paid subscription or API credential has been created. News and event records are a dated editorial snapshot, not an automatically refreshed news feed. Event status is derived from its timestamp; listed times are formatted in Africa/Cairo.
