# 🛠️ INNOVEX: Technical Implementation Guide

This document outlines the architecture, feature breakdown, and step-by-step implementation strategy for the four core dashboards of the INNOVEX platform, built using **Next.js 16**, **Supabase**, and the **Groq AI Engine**.

---

## 🏗️ 0. Global Setup & Data Foundation

Before building individual dashboards, the global data structure must be established.

### 0.1 The RS ID System (Primary Key)

Every user across all dashboards is tied together by an `RS_ID`.

- **Implementation:** In Supabase, the `profiles` table uses `id uuid primary key default uuid_generate_v4()`. We alias this UUID in the UI as the "RS ID".
- **Auth Routing:** Use Next.js Middleware (`middleware.ts`) to read the user's role from their Supabase JWT and redirect them to the correct nested layout (e.g., `/app/(dashboards)/student`).

### 0.2 The AI Matchmaking Pipeline

All matchmaking across dashboards relies on this standard pipeline:

1. **Embedding generation:** User data (skills, startup idea) is sent to **Hugging Face (`gte-small`)** to generate a mathematical vector.
2. **Vector Storage/Search:** The vector is saved in **Supabase** using the `pgvector` extension.
3. **Reasoning:** When a match is found via nearest-neighbor search, the top results are sent to **Groq (Llama 3.3 70B)** to generate the "Explainable Reason" (e.g., _Why is this a good match?_).

---

## 🎓 1. Student Dashboard

**Goal:** Gamify the innovation journey and connect students with mentors/investors.

### Core Features & Implementation

- **Dynamic Avatar & Streak System:**
- **How to Build:** Use the `@dotlottie/react-player` library. Store the student's `avatar_state` (e.g., "idle", "excited", "running") in Supabase.
- **Logic:** When a student logs in or updates a startup status, a Next.js Server Action updates their "Innovation Score". A real-time Supabase subscription listens for this change and triggers the Lottie state machine to change the animation to "excited".

- **Startup Status Tracker (Idea → MVP → Funded):**
- **How to Build:** A visual stepper component. Updating the status triggers a Server Action (`updateStartupStage()`) that uses Next.js 16's `revalidateTag('startup-data')` to instantly update the UI without a page reload.

- **Daily Missions & XP Rewards:**
- **How to Build:** Generate personalized missions dynamically.
- **Model Used:** **Groq API (Llama 3.1 8B Instant)**. Its high speed generates 3 short missions daily based on the student's current startup stage (e.g., "Draft your problem statement today").

- **One-Click Social Sharing (LinkedIn/WhatsApp):**
- **How to Build:** Create a standard UI button that triggers the **LinkedIn Share API** (using standard OAuth flow) and a **WhatsApp Deep Link** (`https://wa.me/?text=I just reached MVP stage on INNOVEX!`).

---

## 🧑‍🏫 2. Mentor Dashboard

**Goal:** Maximize mentor efficiency by curating highly compatible mentees and visualizing ecosystem trends.

### Core Features & Implementation

- **Suggested Mentees (AI Compatibility):**
- **How to Build:** The UI displays a card for each suggested student. The card prominently features the "Compatibility Score" (percentage) and the "Reasoning Factor".
- **Models Used:** Supabase `pgvector` (cosine similarity) for the percentage score. **Groq (Llama 3.3 70B)** parses the matched profiles and returns a 2-sentence explanation of why the mentor is a good fit.

- **Meeting Scheduler & Mentee Management:**
- **How to Build:** A simple calendar UI. Instead of building a complex video system, integrate **Google Calendar API** to generate Meet links, or simply use WhatsApp Deep Links to instantly open a chat with the mentee.

- **Domain Trend Analytics:**
- **How to Build:** Use a charting library like **Tremor** or **Recharts**.
- **Data Flow:** A Supabase RPC (Remote Procedure Call) aggregates the domains of all student startups the mentor is advising (e.g., 60% FinTech, 40% EdTech) and passes it to the chart component.

---

## 💼 3. Investor Dashboard

**Goal:** Provide a vetted, data-backed pipeline of campus startups ready for funding.

### Core Features & Implementation

- **Investment Pipeline Tracking:**
- **How to Build:** Implement a Kanban board UI (using a lightweight drag-and-drop library like `dnd-kit`). Columns represent stages: "Bookmarked," "In Talks," "Due Diligence," "Invested."
- **Data Flow:** Stored in an `investor_pipeline` junction table in Supabase linking the Investor's RS ID with the Startup's ID.

- **Recommended Startups & Growth Insights:**
- **How to Build:** Investors define their thesis (e.g., "Seed stage AI startups"). The vector search filters the `startups` table.
- **Models Used:** **Groq (Llama 3.3 70B)**. Instead of just matching, the LLM reads the student's entire "Activity Timeline" and generates a concise "Growth Insight" paragraph (e.g., _"This team has won 3 hackathons in 6 months and recently shipped an MVP."_).

---

## 🏛️ 4. Admin Intelligence Dashboard

**Goal:** Give institutional leaders a macro-view of ecosystem health for accreditations (like NIRF) and branding.

### Core Features & Implementation

- **Ecosystem Overview & Innovation KPIs:**
- **How to Build:** High-level metric cards displaying total active RS IDs, cumulative Innovation Scores, and total funding raised.
- **Performance:** Since this aggregates thousands of rows, use Next.js 16 **Cache Components**. Calculate these KPIs once every hour via a cron job (using Vercel Cron) and store the result in a `kpi_cache` table to ensure the dashboard loads instantly.

- **Startup Stage Distribution:**
- **How to Build:** A donut chart showing the funnel (Idea -> MVP -> Revenue). Fetched via a simple SQL `GROUP BY` query in Supabase.

- **AI Growth Insights & Predictions:**
- **How to Build:** The "Crown Jewel" feature for admins. It tells them _where_ the campus is heading.
- **Models Used:** **Groq (Llama 3.3 70B)**. Once a week, a background function feeds aggregated, anonymized ecosystem data (e.g., "Trending domains: AI 40%, Web3 10%") into Llama 3.3. The LLM generates a strategic report (e.g., _"Recommendation: Increase Web3 workshops as student interest is outpacing mentor availability"_).

---

## 🔐 5. Security & Deployment

- **Environment Variables:** Ensure `GROQ_API_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` are secured.
- **Row Level Security (RLS):** Crucial in Supabase. Ensure Students can only update their own row using their `RS_ID`, while Admins have read access to the whole ecosystem.
- **Deployment:** Deploy the Next.js App Router on **Vercel** for zero-config Server Actions and optimal Edge caching.
