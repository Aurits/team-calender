# Automation & Integration for Team Operations
### A practical, plain-language guide for builders

*How teams connect their tools and automate the boring parts — the top platforms, the most common
patterns, and real examples you can open and learn from. Written so you can hand it to a non-technical
teammate and they'll still follow it.*

---

**Reading time:** ~15 minutes · **Who it's for:** anyone who just built (or wants to build) a tool that
links apps together and automates work — like *Cadence*, your team-scheduling app.

> **Plain definition first.**
> **Automation** = letting software do a repeated task for you (no human clicking).
> **Integration** = connecting two or more apps so they share data automatically.
> Most useful tools do *both*: "when something happens in App A, do something in App B."

> **Where your project fits.** *Cadence* connects a **Next.js app** to a **Google Sheet** through a
> **Google Apps Script web app**, and a **dashboard rebuilds itself** every time the data changes.
> In the language of this guide, that's three patterns at once: *spreadsheet-as-database*,
> *app-over-data*, and *automatic daily digest*. You built the "developer / code-first" version. This
> guide shows you the rest of the map.

---

## Contents

1. [A 2-minute primer (the words you'll see everywhere)](#1-a-2-minute-primer)
2. [Top 10 platforms & tools](#2-top-10-platforms--tools)
3. [Top 10 automation patterns](#3-top-10-automation-patterns)
4. [Top 10 example projects to learn from](#4-top-10-example-projects-to-learn-from)
5. [No-code vs code-first: which to choose](#5-no-code-vs-code-first-which-to-choose)
6. [Where it's heading: AI agents & MCP](#6-where-its-heading-ai-agents--mcp)
7. [How Cadence maps, and what to try next](#7-how-cadence-maps-and-what-to-try-next)
8. [If you only do three things](#8-if-you-only-do-three-things)
9. [Glossary](#9-glossary)
10. [Sources & accuracy note](#10-sources--accuracy-note)

---

## 1. A 2-minute primer

A handful of words come up again and again. Learn these and the rest is easy:

| Word | What it really means (plain) |
|------|------------------------------|
| **API** | A "menu" an app offers so other software can read or change its data. |
| **Webhook** | A phone call *from* an app the moment something happens ("a form was just submitted!"). |
| **Trigger → Action** | The shape of almost every automation: *when X happens (trigger), do Y (action)*. |
| **No-code / low-code** | You build by clicking and connecting boxes, writing little or no code. |
| **Code-first** | You build by writing code — more effort, far more control. (This is Cadence.) |
| **iPaaS** | "Integration Platform as a Service" — a paid cloud tool whose whole job is connecting apps (e.g. Workato). |
| **Source of truth** | The one place the real data lives, that everything else reads from (your Google Sheet). |
| **MCP** | "Model Context Protocol" — a new standard that lets AI assistants safely use your tools and data. |

> **Mental model for the whole field:** every tool below is just a fancier, friendlier way of doing
> *"when X happens, move/transform some data, then do Y"* — the same thing your Apps Script does in code.

---

## 2. Top 10 platforms & tools

Each card uses the same six lines so you can compare them quickly.

### 1. Zapier — the friendly connector
- **In one line:** the easiest way to connect two popular apps with no code.
- **Best for:** simple "when X, do Y" flows across the widest range of apps (~8,000).
- **Style:** No-code.
- **How it works:** pick a trigger app, pick an action app, map the fields. Done.
- **Cost:** free tier (~100 tasks/month); paid plans bill **per task** (each action counts), from ~$20/mo.
- **Pick it when** you want something working in 10 minutes. **Skip it when** logic gets complex or volume makes per-task pricing expensive.

### 2. Make (formerly Integromat) — the visual powerhouse
- **In one line:** like Zapier, but you draw the flow on a canvas and it handles complex logic better.
- **Best for:** multi-step flows with branches, loops, and data reshaping.
- **Style:** Low-code (visual).
- **How it works:** drag "modules" onto a canvas and wire them together; watch data flow through.
- **Cost:** bills **per operation** (usually cheaper per step than Zapier); generous free tier.
- **Pick it when** Zapier feels too limited. **Skip it when** you need true code or a non-technical user must own it.

### 3. n8n — the open-source favorite for developers
- **In one line:** a powerful visual automation tool you can **run yourself for free**.
- **Best for:** technical teams who want control, custom code steps, and no per-task bill.
- **Style:** Low-code **and** code-friendly (drop in JavaScript/Python); **open-source / self-hostable**.
- **How it works:** node-based canvas like Make, but you can self-host it and write code in any node.
- **Cost:** **free** if you host it yourself; cloud plans from ~$20–24/mo (billed per *workflow execution*, not per step).
- **Pick it when** you want power + ownership + predictable cost. **Skip it when** nobody can maintain a server (use their cloud) or you need zero technical effort.

### 4. Microsoft Power Automate — the Microsoft-office automator
- **In one line:** automation built into the Microsoft 365 world.
- **Best for:** teams living in Outlook, Teams, SharePoint, and Excel; plus desktop **robot automation (RPA)**.
- **Style:** Low-code.
- **How it works:** templates and a flow designer tightly wired into Microsoft apps.
- **Cost:** per-user or per-flow plans (~$15/user/mo), partly included in some Microsoft 365 licenses.
- **Pick it when** your company runs on Microsoft. **Skip it when** you're not in that ecosystem (licensing gets confusing).

### 5. Google Apps Script — free automation inside Google — *this is Cadence's engine*
- **In one line:** write small JavaScript programs that control Google Sheets, Docs, Gmail, Calendar, Drive.
- **Best for:** automating Google Workspace and building small web apps/dashboards (exactly what you did).
- **Style:** **Code-first** (JavaScript).
- **How it works:** code runs on Google's servers, started by triggers (a time of day, an edit, or a web request).
- **Cost:** **free** (with daily usage limits/quotas).
- **Pick it when** your data lives in Google and you can write a little code. **Skip it when** you need heavy non-Google integrations or to avoid code entirely.

### 6. Pipedream — the developer's glue
- **In one line:** connect APIs and webhooks fast, mixing ready-made steps with your own code.
- **Best for:** developers wiring services together with a little custom logic.
- **Style:** Developer-first (code + no-code steps).
- **How it works:** a workflow of steps; any step can be your own Node.js/Python.
- **Cost:** generous free tier; usage-based after.
- **Pick it when** you're technical and want speed + flexibility. **Skip it when** a non-developer must build/own it.

### 7. Airtable — the spreadsheet that's really a database
- **In one line:** a friendly database with built-in automations and simple app screens.
- **Best for:** using a **database as your source of truth** (like your Sheet) with nicer structure, plus light internal apps.
- **Style:** Low-code (Automations + "Interfaces"); has AI features.
- **How it works:** your data lives in tables; automations and mini-apps sit right on top.
- **Cost:** free tier; paid ~$20–24/user/month.
- **Pick it when** you want Cadence's "sheet as database" idea but more structured and no code. **Skip it when** you need a fully custom UI or hit row/scale limits.

### 8. Retool — fast internal apps over your data — *Cadence's "app layer" twin*
- **In one line:** build internal tools (dashboards, admin panels) by dragging components onto your database/API.
- **Best for:** developers who want a custom UI in hours, not weeks.
- **Style:** Developer low-code; also has Workflows (scheduled jobs) and AI/agents.
- **How it works:** connect a data source, drop in tables/forms/buttons, add a little code where needed.
- **Cost:** free tier; paid ~$10–50/user/month.
- **Pick it when** you'd otherwise hand-build an internal UI (like Cadence's pages). **Skip it when** you want full design control or to avoid per-seat pricing.

### 9. Workato — the enterprise integrator
- **In one line:** heavy-duty, governed automation for big companies.
- **Best for:** large orgs connecting many serious systems with security and oversight.
- **Style:** Enterprise iPaaS (low-code "recipes"); adds AI agents.
- **How it works:** prebuilt connectors + recipes, with admin controls and audit trails.
- **Cost:** enterprise/custom (expensive).
- **Pick it when** you're a large team with budget and compliance needs. **Skip it when** you're small — it's overkill.

### 10. Tray.ai (Tray.io) — flexible enterprise automation
- **In one line:** a flexible enterprise integration platform now leaning into AI agents.
- **Best for:** companies wanting customizable enterprise workflows.
- **Style:** Enterprise low-code iPaaS.
- **How it works:** a visual builder with deep configuration and AI-agent features.
- **Cost:** enterprise/custom.
- **Pick it when** you've outgrown SMB tools and want flexibility. **Skip it when** you're cost-sensitive or small.

> **The layer beneath all ten:** **webhooks + APIs.** Every platform here is ultimately making HTTP
> calls and catching webhooks — the exact thing your Apps Script does by hand. Understanding this
> layer is what lets you escape a no-code tool's limits when you hit them.

> **Also worth knowing:** **Activepieces** (open-source, AI-first, a Zapier alternative) ·
> **Slack Workflow Builder** (no-code automation *inside* Slack) · **Latenode / Pabbly / Zoho Flow**
> (cheaper connectors) · **IFTTT** (consumer-grade) · **Whalesync / Unito / 2sync** (purpose-built
> two-way data sync).

---

## 3. Top 10 automation patterns

A **pattern** is a reusable recipe. Once you recognise these, you'll see them everywhere.

| # | Pattern | What it does | Quick example | Good tools | Difficulty |
|---|---------|--------------|---------------|-----------|:---------:|
| 1 | **Form → sheet/DB → notify** | Capture an input, store it, ping the team | Google Form → row in Sheets → Slack message | Zapier, Make, Apps Script | ⭐ Easy |
| 2 | **Calendar ↔ database sync** | Keep a calendar and a database matched both ways | Notion task ⇄ Google Calendar event | n8n, Whalesync, Apps Script | ⭐⭐ Medium |
| 3 | **Daily digest / standup dashboard** | On a schedule, assemble "today" and share it | 8am "who's where today" to Slack / a dashboard | **Apps Script (Cadence)**, n8n | ⭐⭐ Medium |
| 4 | **Approval workflow** | Route a request to an approver and record the decision | Time-off request → manager approves → status updates | Power Automate, Slack, Make | ⭐⭐ Medium |
| 5 | **Onboarding / offboarding** | Auto-provision (or remove) accounts and access | New hire → create email, Slack invite, doc access | Power Automate, Workato | ⭐⭐⭐ Harder |
| 6 | **CRM ↔ helpdesk sync** | Keep customer records consistent across tools | New Salesforce contact ⇄ Zendesk user | Workato/Tray, Unito | ⭐⭐⭐ Harder |
| 7 | **Alerting / on-call** | Watch a signal and escalate with rules | Server down → page on-call via Slack/PagerDuty | n8n, Make, native monitors | ⭐⭐ Medium |
| 8 | **Sheet/Doc as source of truth** | A spreadsheet/DB powers an app or workflow | A Sheet backs your scheduling app | **Apps Script (Cadence)**, Airtable | ⭐⭐ Medium |
| 9 | **Auto-report generation** | Pull numbers, format, and deliver on a schedule | Weekly metrics → formatted Slack/PDF/email | **Apps Script + Sheets (Cadence)**, n8n | ⭐⭐ Medium |
| 10 | **AI summarize & triage** | Let AI condense or sort messages/tickets | Summarize a busy Slack channel each evening | n8n AI nodes, Zapier AI, MCP agent | ⭐⭐⭐ Newer |

> You already shipped **#3, #8, and #9** — in code. The others are natural next steps to explore.

---

## 4. Top 10 example projects to learn from

Real, openable links. Reading other people's automations is the fastest way to learn.

1. **Google Workspace Apps Script samples** *(closest to Cadence)*
   Official sample scripts for Sheets/Docs/Gmail/Calendar.
   <https://github.com/googleworkspace/apps-script-samples> · <https://developers.google.com/apps-script/samples>
2. **n8n workflow template library**
   Hundreds of ready-made, readable automations.
   <https://n8n.io/workflows/> · <https://docs.n8n.io/workflows/templates/>
3. **awesome-n8n-templates** *(community, categorized)*
   <https://github.com/enescingoz/awesome-n8n-templates>
4. **n8n itself (open-source)** *(read a real automation engine; self-host it)*
   <https://github.com/n8n-io/n8n>
5. **n8n "2-way Notion ↔ Google Calendar" template** *(the calendar↔DB sync pattern, end to end)*
   <https://n8n.io/workflows/2351-2-way-sync-notion-and-google-calendar/>
6. **MCP reference servers (Anthropic)** *(official AI-tool connectors: Slack, Drive, GitHub…)*
   <https://github.com/modelcontextprotocol/servers> · <https://modelcontextprotocol.io/examples>
7. **awesome-mcp-servers** *(a directory of the MCP ecosystem)*
   <https://github.com/appcypher/awesome-mcp-servers>
8. **Slack MCP server** *(a clean, focused integration to study)*
   <https://github.com/korotovsky/slack-mcp-server>
9. **mcp-agent** *(framework for building AI agents on top of MCP)*
   <https://github.com/lastmile-ai/mcp-agent>
10. **No-code template galleries** *(browse for ideas, then rebuild in code)*
    Slack Workflow Builder <https://docs.slack.dev/workflows/workflow-builder/> · Zapier / Make / Airtable
    galleries · **Activepieces** (open-source) <https://github.com/activepieces/activepieces>

---

## 5. No-code vs code-first: which to choose

You chose **code-first** for Cadence. Here's the honest trade-off, in plain terms.

| What matters | No-code / low-code | Code-first *(Cadence)* |
|--------------|--------------------|------------------------|
| **Speed to first version** | 🟢 Minutes | 🟡 You build it |
| **How far it can go** | 🟡 Hits a wall on complex logic | 🟢 No ceiling — it's code |
| **Ongoing cost** | 🔴 Grows with usage (per task/seat) | 🟢 Often free/cheap (Apps Script is free) |
| **Lock-in** | 🔴 Logic lives in their app | 🟢 Your code, your repo — portable |
| **Who can maintain it** | 🟢 Non-technical people | 🟡 Needs a developer |
| **Visibility / testing** | 🟡 Their run logs | 🟢 Full logs, tests, version history |

**Simple decision rule:**
1. **Prototyping an idea?** → start **no-code** (fastest proof).
2. **Hit a wall** (logic too complex, bill too high, or it must be a real product)? → go **code-first**.
3. **Most mature setups are hybrid:** a reliable code core, with a no-code or AI step bolted on for the fuzzy parts.

> **Why Cadence is correctly code-first:** it's a real product with a custom UI and a shared team
> source-of-truth. Per-task billing and drag-and-drop UI limits would have fought you. The trade you
> accepted — you maintain the code — is the right one here.

---

## 6. Where it's heading: AI agents & MCP

The next shift is automations that can *think a little*, not just follow fixed steps.

- **Old way:** *"When X happens, do exactly Y, then Z."* Rigid, predictable.
- **New way:** give an **AI agent** a goal and a set of tools, and let it **decide the steps**.
- **MCP (Model Context Protocol)** — opened up by Anthropic in late 2024 — is becoming the **"USB-C for
  AI tools"**: one standard way to safely connect an AI to your apps and data. Adoption spread quickly
  across the industry through 2025. The official server collection (Slack, Drive, GitHub…) is a great
  study set: <https://modelcontextprotocol.io> · <https://github.com/modelcontextprotocol/servers>
- **The tools are adapting:** n8n, Zapier, and Make now offer AI-agent building blocks; enterprise
  players (Workato, Tray) are repositioning around agents too.
- **The pragmatic sweet spot is hybrid:** keep anything that *must be reliable* as plain deterministic
  steps, and use AI only where judgment helps (summarize, classify, draft).
- **One caution:** connecting an AI to your tools/data widens your **security surface**. Treat MCP
  server permissions and authentication seriously — it's an active area in 2025–2026.

---

## 7. How Cadence maps, and what to try next

**What you've already built (in code):**
- Pattern **#8** — a Google Sheet as the team's source of truth.
- Pattern **#3** — a dashboard that rebuilds on every change.
- Pattern **#9** — auto-generated report/visuals (charts + bars on the Overview).

**Three natural next experiments, easiest first:**

1. **Post the daily Overview to Slack (Pattern #1 + #3).**
   *Easiest.* A no-code Make/Zapier/n8n flow (or an Apps Script time-trigger) sends the morning snapshot
   to a Slack channel. Big team value, minimal effort.

2. **Sync entries to Google Calendar (Pattern #2).**
   *Medium.* Use Apps Script's `CalendarApp` to mirror each scheduled block into Google Calendar — this
   closes a loop the original design doc deferred ("Outlook/calendar sync").

3. **Add an AI question box over your Sheet (Pattern #10 / MCP).**
   *Newer.* A small MCP server (or AI node) that answers plain questions like *"who's overloaded today?"*
   or *"where is everyone this afternoon?"* — the agentic version of your Overview.

---

## 8. If you only do three things

1. **Browse two galleries** for ideas: the **n8n templates** and the **Apps Script samples** (links in §4).
2. **Ship one Slack notification** of your daily Overview — your fastest win (§7, experiment 1).
3. **Read one MCP server** (e.g. the Slack one) to understand where AI automation is going (§4, #8).

---

## 9. Glossary

- **API** — a way for apps to talk to each other programmatically.
- **Webhook** — an instant notification an app sends when an event happens.
- **Trigger / Action** — the cause and the effect in an automation.
- **No-code / Low-code** — building by configuring, not coding.
- **Code-first** — building by writing software (more control, more effort).
- **iPaaS** — a paid cloud platform dedicated to connecting apps.
- **RPA** — software "robots" that click through apps like a person (useful for systems without APIs).
- **Source of truth** — the single authoritative place your data lives.
- **MCP (Model Context Protocol)** — an open standard for connecting AI assistants to tools and data.
- **AI agent** — an AI given a goal and tools, allowed to choose its own steps.

---

## 10. Sources & accuracy note

**Platforms & comparisons:** zapier.com, make.com, **n8n.io / docs.n8n.io / blog.n8n.io**,
learn.microsoft.com (Power Automate), **developers.google.com/apps-script** & workspace.google.com,
pipedream.com, workato.com, tray.ai, airtable.com, retool.com, activepieces.com,
automationatlas.io (Apps Script vs Zapier, 2026), workflowpick.com (Zapier pricing).
**Patterns & templates:** **n8n.io/workflows**, docs.n8n.io/workflows/templates,
github.com/enescingoz/awesome-n8n-templates, slack.com / docs.slack.dev (Workflow Builder),
whalesync.com / unito.io / 2sync.com (sync).
**Examples & AI/MCP:** github.com/googleworkspace/apps-script-samples, github.com/n8n-io/n8n,
**modelcontextprotocol.io** & github.com/modelcontextprotocol/servers,
github.com/appcypher/awesome-mcp-servers, github.com/korotovsky/slack-mcp-server,
github.com/lastmile-ai/mcp-agent, anthropic.com.

> **Accuracy:** this was assembled from a multi-agent research run (search → fetch → adversarial
> verification across 100+ agents); the final auto-synthesis step was stopped early by request, so the
> report was compiled from the gathered, verified sources plus domain knowledge. **Prices, free-tier
> limits, and connector counts change often and are vendor-reported — confirm them on the live pricing
> page before you rely on a specific number.**

---

*End of report.*
