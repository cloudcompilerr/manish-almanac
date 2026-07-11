# Quality Bar — manish-almanac collection documents

This is the standard every `collection/*.html` document is held to. It exists so quality doesn't drift as documents get added or edited. `consistent_hashing.html` is the reference exemplar — when in doubt, match its depth and structure.

## Who it's for

A reader who may know nothing about the topic going in, and needs to walk out able to hold their own in a FAANG-level system design or backend interview. Zero-to-hero: the opening has to work for a complete layman, the closing sections have to work for a senior engineer being cross-examined by a staff-level interviewer.

## Required structural elements

**Always required**, in roughly this order:

1. **Hook / problem framing** — open with a concrete failure scenario or a specific number, not an abstract definition. ("You have 3 servers... you add a 4th... your database receives 100x normal traffic and falls over.")
2. **Plain-English analogy** (`.analogy` block) — must work for someone with zero technical background. Real-world objects, not other technical concepts.
3. **Concept explanation in depth** (`.concept-grid` / `.concept-def`, or the document's equivalent term-by-term breakdown) — the actual mechanics, precisely enough that a reader could reconstruct the idea from memory.
4. **Comparison or decision table** (`.comp-table`) — the alternatives, their strengths, their real failure modes, and who actually uses each in production.
5. **At least one "interview trap" callout** (`.callout.cl-red`) — name the answer a candidate is tempted to give, and why it's wrong or incomplete.
6. **Named production internals** (`.sd-example`) — specific, real systems (Cassandra, Redis Cluster, DynamoDB, S3, Kafka, etc.), not generic "some systems do X." If you can't name a real system that does it, hedge or cut it.
7. **Interview decision framework** (`.step-block`) — a small number of concrete questions an interviewer would ask, each with the branching answer.
8. **Hard follow-up FAQ** (`.faq-item`) — the questions a strong interviewer asks after the candidate nails the basics. These should be genuinely hard, not restatements of section 3.
9. **Production failure modes** (`.k-cards`) — what actually breaks, how it's detected, how it's mitigated. Real incident *patterns*, not invented specific incidents presented as fact.
10. **Trade-off matrix** (`.matrix`, "what you gave up") — every real choice has a cost; state it plainly, and state when you'd switch.
11. **Quick reference** (closing table) — a scannable summary a reader can review the night before an interview.

**As-applicable** (skip or lighten for docs where it doesn't fit — meta/framework docs like `interview_framework.html`, or module-style docs like `module01_llm_foundations.html`, get a lighter structural bar than a deep system-internals doc; use judgment, but if you skip one of the 11, know why):

- Depth of "named production internals" scales down for docs that are inherently conceptual rather than about a specific system.
- Format may follow an established alternate convention already used by a document family (e.g. the Java/Python "rosetta stone" format in the module docs) rather than forcing `.concept-grid` where it doesn't fit — consistency within a document family beats forcing every doc into one template.

## Depth and density

No filler, no padding to hit a length. Density over volume: `consistent_hashing.html` earns every one of its ~450 lines. A document is done when the required elements are covered with real depth, not when it hits a line count. Thin is a real defect (`microservices.html`, `interview_framework.html`, `scalability.html`, `api_design.html`, `data_structures.html` were flagged thin as of 2026-07 — see git history for what "thin" meant at that snapshot).

## Anti-hallucination protocol

- **Every concrete numeric, versioned, or vendor-specific claim must be verified against a current authoritative source** (official docs, engineering blog, well-known spec) before it ships. "I'm fairly sure Redis Cluster uses 16,384 slots" is not suffient — check it.
- If a claim can't be verified, either cut it or hedge it honestly ("typically," "in most deployments," "commonly cited as") — never state an invented specific with false confidence.
- Production "failure mode" narratives should read as realistic patterns grounded in how the system actually works, not as a specific fabricated incident report presented as a real event unless it is a well-documented public incident.
- When two authoritative sources disagree on a number (e.g. a default that changed across versions), say so rather than picking one silently.

## Known bug classes — never reintroduce these

These have each actually happened in this codebase. Check for them explicitly before considering a document done:

- **Template artifacts rendering as visible text** — e.g. the `/p><p>` string that rendered as literal garbage on-page in 21 files (fixed 2026-07). Any edit involving paragraph splitting must produce valid `</p><p>` markup, not a mangled fragment.
- **Duplicate section ids** — breaks anchor links silently; the browser just uses the first match. Grep for `<section id="` and confirm every id is unique before finishing a file.
- **Whole-block copy-paste duplication** — six files had an entire "Failure Modes" section duplicated verbatim back-to-back (fixed 2026-07). If you copy a block as a starting point for a new section, immediately change its id and its content — don't leave two identical blocks in the same document.
- **CSS class name mismatches** — the `.k-cards` component has two naming conventions floating around this codebase: some files' CSS defines `.k-num`/`.k-title`, others define `.k-card-num`/`.k-card-title`. When the HTML uses one convention but the CSS defines the other, the numbered badge and title render as unstyled plain text with no visible error. Found in 9 files as of 2026-07 (microservices.html fixed; api_design, databases, data_structures, interview_framework, olap, scalability, security, streaming still affected — check `grep -c '\.k-num{'` vs `grep -c 'class="k-num"'` per file: a mismatch means the CSS block only defines `.k-card-num`/`.k-card-title` and needs renaming to `.k-num`/`.k-title` to match the HTML). Before finishing any file, spot check that every component's HTML class names actually appear in that file's own `<style>` block — a class used in markup but never defined in CSS renders with zero styling and no error.

## Before calling a document done

1. Every required element from the list above is present (or its absence is a deliberate, defensible call).
2. Every concrete claim has been checked against a current source.
3. `grep -c '<section id="'` ids are all unique; no duplicate blocks anywhere in the file.
4. No stray template artifacts (`grep` for the patterns above, and read the rendered page, not just the source).
5. The document would survive being read aloud start-to-finish without an expert wincing at an inaccuracy.
