# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are Chilean organizations looking for a small, hands-on software and AI studio. They value close collaboration, thoughtful execution, and a partner that stays involved until the software works in practice.

## Product Purpose

BipBop Labs designs and builds software with clients rather than at arm's length. The studio succeeds by starting a small number of well-matched client relationships and turning difficult operational problems into software that genuinely works for the people using it.

Revi is BipBop Labs' flagship project. It helps applicants and municipal reviewers navigate Chilean building-permit regulations by reading architectural plans and documents and guiding both sides through the process.

## Positioning

BipBop Labs takes on few projects at a time, shapes them collaboratively, and remains closely involved until they work in their real operating context. Its position combines a small studio's care and continuity with the ability to deliver production software and applied AI.

## Operating Context

The studio is based in Santiago, Chile and works primarily with Chilean organizations. The public site introduces the studio, presents current work, and invites well-matched prospective clients to begin a conversation.

Revi is developed with the Cámara Chilena de la Construcción (CChC). It supports applicants for building permits and reviewers in municipal Direcciones de Obras Municipales (DOM), while leaving formal review roles and decisions with those people. The site is bilingual, with Spanish as the server-rendered default and English available to visitors.

## Capabilities and Constraints

- BipBop Labs builds bespoke software, internal tools, and applied-AI products.
- Revi reads architectural plans and supporting documents, helps detect observations against regulation, and guides applicants and municipal reviewers.
- Revi is an assistant, not a replacement for municipal reviewers or their decisions.
- Recruitment is currently closed; existing candidate administration and interview scheduling remain operational.
- Public product claims, project status, municipal coverage, and other evidence must remain synchronized with their source data and SEO surfaces.
- The site runs on TanStack Start, React, Vite, Nitro, Tailwind CSS, and a Node server.

## Brand Commitments

- Name: BipBop Labs.
- Tagline: “Software hecho con cariño, pensado contigo y construido a tu lado.”
- Voice: warm, direct, modest, collaborative, and precise; avoid inflated agency claims.
- The penguin head in `public/brand/head.svg` is the logo. The full-body penguin is deprecated as an identity mark and is limited to the landing-page hero.
- Brand source assets and generation rules are documented in `STYLE.md`; generated assets must not be edited by hand.

## Evidence on Hand

- Revi is the flagship project and is presented with real product details, participating municipalities, press coverage, and CChC attribution in `src/routes/revi.tsx`, `src/data/municipios.ts`, and `src/data/revi-press.ts`.
- Current studio and project imagery is under `public/brand/`.
- Brand source files and usage constraints are documented in `STYLE.md`.
- The public site must not fabricate customers, testimonials, benchmarks, pricing, press, deployment claims, or product capabilities beyond the evidence in the repository.

## Product Principles

1. Take on fewer, better-matched projects and give each one sustained attention.
2. Shape the work with clients and users, not merely for them.
3. Stay close through real-world adoption, not just delivery.
4. Make complex systems feel humane without hiding consequential decisions.
5. Let concrete work and verifiable outcomes carry the story.

## Accessibility & Inclusion

The public experience must work responsively, preserve semantic structure and keyboard access, respect reduced-motion preferences, and support both Spanish and English without treating English as the default for the Chilean audience.
