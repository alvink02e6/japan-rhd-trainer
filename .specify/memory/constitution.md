<!--
Sync Impact Report (Temporary Review Metadata — remove before committing)
- Version change: template (unversioned) -> 1.0.0 (Initial Ratification)
- Modified principles:
  - Template Principle 1 -> I. Cognitive Transfer Over Visual Vanity (認知遷移優先於視覺炫技)
  - Template Principle 2 -> II. Mobile Web / PWA First & Universal Compatibility (行動網頁優先與全機型相容底線)
  - Template Principle 3 -> III. Zero Commercial Map API Marginal Cost (零商業地圖 API 邊際成本)
  - Template Principle 4 -> IV. Behavioral Validation & Measurable Instrumentation (行為實證與強制數據埋點)
  - Template Principle 5 -> V. Traffic-Rule Correctness & Test-First Verification (日本交通規則正確性與測試優先)
- Added sections:
  - Technical & Scope Constraints
  - Development Workflow & Quality Gates
  - Governance (populated from scaffold)
- Removed sections: None (replaced placeholder scaffold and example comments)
- Follow-up TODOs: None
-->

# Japan RHD Trainer (日本右駕自駕認知訓練 PWA) Constitution

## Core Principles

### I. Cognitive Transfer Over Visual Vanity (認知遷移優先於視覺炫技)

Every interaction, 3D scene, and scoring rule MUST prioritize measurable right-hand-drive cognitive
reflexes for Taiwan-to-Japan travelers: lane-left spatial positioning, right-hand turn-signal
versus left-hand wiper muscle-memory traps, Japanese traffic-signal differences (horizontal
green-left/red-right and two-row arrow lights `矢印式信号機`), mandatory full stops at `止まれ`,
and high-risk multi-lane right-turn yielding. Implementations MUST NOT adopt engine-less hand-rolled
shader stacks (such as Raw WebGPU/WGSL demos) or full-manual precision driving physics (such as
reverse parking or S-curve steering) that raise mobile touch frustration or maintenance burden
without proven learning transfer.

Rationale: Official Japan National Police Agency data shows foreign rental drivers incur 2.4–2.7x
higher right-turn accident rates than local drivers. Six-inch mobile touchscreens cannot replicate
steering-wheel torque or pedal feel, so cognitive rule recognition and spatial decision accuracy are
the only defensible training levers.

### II. Mobile Web / PWA First & Universal Compatibility (行動網頁優先與全機型相容底線)

All MVP capabilities MUST ship as a zero-install Mobile Web / PWA accessible directly from mobile
Safari, mobile Chrome, and major Taiwan social In-App Browsers (LINE, Facebook, Instagram). 3D
rendering MUST use a mature Web 3D engine defaulting to WebGL2 with stylized low-poly assets so
older OS versions and mid-to-low-tier smartphones run reliably without WebGPU hardware lock-in;
WebGPU MAY only be enabled as an optional progressive enhancement with automatic WebGL2 fallback.
The initial interactive entry screen MUST become usable within 3 seconds on standard 4G mobile
connections, and 3D scenes MUST degrade gracefully rather than crash under constrained memory.

Rationale: Overseas self-drive preparation is a low-frequency (1–2 trips/year) workflow driven by
LINE groups, Facebook communities, and search links. Mandatory native app downloads or WebGPU-only
device lockouts destroy top-of-funnel conversion before learning begins.

### III. Zero Commercial Map API Marginal Cost (零商業地圖 API 邊際成本)

Runtime user sessions MUST incur zero pay-per-use commercial mapping, routing, or Street View API
charges. Per-visitor infrastructure marginal cost MUST remain at or below NT$0.1 through static edge
hosting and curated modular Japan scenario assets. Arbitrary user-supplied real-world route
ingestion and continuous Street View streaming are strictly prohibited during the MVP phase.

Rationale: Prior open-source Street View driving simulators shut down public demos due to runaway
per-request API billing. Low-frequency travel tools cannot sustain variable mapping fees per user.

### IV. Behavioral Validation & Measurable Instrumentation (行為實證與強制數據埋點)

The MVP is governed as a 2–3 week Small Appetite behavioral validation experiment. Every user-facing
flow MUST emit anonymous, privacy-respecting telemetry events covering: session start, quiz and
drill completion, per-rule mistake breakdown (wiper mis-trigger, `止まれ` failure, wrong-way turn,
arrow-signal misread), post-session confidence pulse, diagnostic-card shares, friend-share unlocks,
and Fake Door / affiliate link clicks. Formal payment gateways, native App Store / Google Play
packaging, and Phase 2 content expansions (Hokkaido winter/snow, highway ETC, live co-op navigator)
MUST NOT begin until 30-day live telemetry clears the Go/No-Go gates: completion rate >= 50%, repeat
critical-error reduction >= 40%, Fake Door or friend-share unlock rate >= 10%, and post-session
confidence uplift >= 75%.

Rationale: Verbal survey answers suffer from courtesy bias; real behavioral completion and unlock
signals from live traffic are required before investing in multi-month content or payment overhead.

### V. Traffic-Rule Correctness & Test-First Verification (日本交通規則正確性與測試優先)

All Japanese traffic-rule state machines—including two-row arrow signal transitions, strict red-light
no-turn enforcement, `止まれ` full-stop validation, lane-correctness and right-turn yield scoring,
and turn-signal/wiper input mapping—MUST live in deterministic, UI-independent domain modules
verified by automated unit tests before or alongside scene integration. Every rule explanation
shown to learners MUST faithfully reflect Japan Road Traffic Act conventions and MUST display a
clear pre-trip educational disclaimer stating that the tool does not replace formal driver
licensing or serve as live in-car navigation.

Rationale: Incorrect traffic-rule feedback in a driving trainer creates direct real-world safety
liability; separating pure rule logic from 3D rendering ensures deterministic, auditable testing.

## Technical & Scope Constraints

- **Stack Baseline**: TypeScript, Mobile-first Web/PWA frontend, mature Web 3D engine (e.g.,
  Three.js or Babylon.js defaulting to WebGL2), and static edge hosting. Core MVP flows MUST work
  without user accounts or a heavy custom backend; only lightweight anonymous event ingestion is
  permitted.
- **Target Device & Browser Matrix**: Mobile Safari (iOS), Mobile Chrome (Android), and LINE /
  Facebook / Instagram In-App Browsers. Active drill views MUST prevent unintended browser
  pull-to-refresh, pinch-zoom, and edge-swipe back gestures, and MUST handle mobile audio unlock
  policies cleanly.
- **MVP Scope Ceiling (2–3 Weeks, Small Appetite)**: Strictly limited to:
  1. Dynamic Taiwan-vs-Japan traffic-signal quiz (8–10 animated scenarios + shareable diagnostic card).
  2. One stylized 3D first-person driving-range warmup (lane-left perspective, semi-assisted
     steering tolerance, right-hand turn-signal vs. left-hand wiper feedback).
  3. One to two Japan urban high-risk right-turn / `止まれ` / arrow-signal interactive scenarios.
  4. Zero-payment validation hooks: Fake Door locked cards for upcoming themes (Hokkaido snow,
     highway ETC), friend-share unlock flow, and disclosed non-intrusive travel affiliate links.
- **Privacy & Legal Guardrails**: Telemetry MUST NOT collect personally identifiable information
  (PII) or require login. Affiliate links MUST be clearly disclosed, and the pre-trip non-licensing
  safety disclaimer MUST be acknowledged or visibly presented prior to starting drills.

## Development Workflow & Quality Gates

- **Spec-Driven Delivery**: Every feature MUST progress sequentially through `/speckit-specify`,
  `/speckit-plan` (passing the Constitution Check), `/speckit-tasks`, `/speckit-implement`, and
  `/speckit-converge`.
- **Mandatory Release Gates**:
  1. Automated unit tests covering all traffic-rule state machines, scoring evaluators, and unlock
     state logic MUST pass 100%.
  2. Production build MUST complete with zero TypeScript or bundler errors and respect mobile asset
     bundle budgets defined during planning.
  3. Real-device smoke testing on at least one iOS device and one Android device—including launch
     inside LINE or Facebook In-App Browser—MUST verify WebGL2 initialization, touch lever
     responsiveness, and diagnostic-card sharing prior to public launch.
- **Complexity Tracking**: Any proposed addition of paid third-party APIs, custom backend services,
  raw custom WebGPU pipelines, native-app wrappers, or extra 3D scenarios beyond the MVP ceiling
  MUST be explicitly justified in the `Complexity Tracking` table of `plan.md` with rejected simpler
  alternatives.

## Governance

This constitution supersedes ad-hoc design preferences, convenience shortcuts, and unvalidated
feature requests. Every `/speckit-plan` review, pull request, and release check MUST explicitly
verify compliance against all five Core Principles and Technical & Scope Constraints.

Amendments require invoking `/speckit-constitution` with documented rationale, impact analysis on
active specifications and plans, and semantic versioning:
- **MAJOR**: Removing or fundamentally redefining an existing principle or mandatory constraint.
- **MINOR**: Adding a new principle/section or materially expanding governance gates.
- **PATCH**: Clarifications, wording refinements, or typo fixes that preserve normative intent.

A formal governance review MUST occur at the end of the 30-day post-MVP validation period to either
ratify Phase 2 commercialization/expansion principles or archive the experiment.

**Version**: 1.0.0 | **Ratified**: 2026-11-24 | **Last Amended**: 2026-11-24
