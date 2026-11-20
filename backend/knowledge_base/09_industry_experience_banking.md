# Industry Experience Center: Banking & Fintech

**Category:** Industry Experience Center  
**Industry:** Banking & Fintech  
**Source Document:** Industry Experience Center PDF  
**Knowledge Type:** Challenge Solutions, Benchmarks, Segmentation & Success Stories  

---

## Overview
Netcore's Agentic Marketing Platform powers BFSI institutions to optimize customer acquisition, deposit mobilization (FDs), loan funnel conversion, and dormancy reactivation through real-time behavioral intent detection, automated journey audits, and multi-channel orchestration.

---

## Challenge 2.1: Customers Check FD Rates but Don't Book

- **Challenge ID:** `banking_fd_conversion`
- **Core Problem:** 11,200 high-intent banking customers repeatedly check Fixed Deposit (FD) rates or calculate returns, yet 80% never receive an intent-triggered follow-up because banks rely on generic batch emails.
- **User Question:** *"Which customers are most likely to open an FD this month?"*
- **What Zeno Analyzes On-Screen:**
  - Audits 30 days of mobile app and website telemetry across 18 Lakh banking customers.
  - Detects users viewing FD rate comparison tables or interacting with the FD interest calculator.
  - Identifies who has already been targeted with marketing campaigns.

### Key Findings & Insights
- **Headline:** **11,200 customers checked FD rates 2+ times this month. Only 1 in 5 heard from you.**
- **Detail:** Customers who return to the FD rates page book fixed deposits **4x more often** than one-time visitors. However, bank marketing campaigns currently blast the entire base generically by email.
- **FD Booking Rate Within 30 Days (By FD Page Visits):**
  - **No Visits:** 0.4% booking rate
  - **1 Visit:** 1.8% booking rate
  - **2 to 3 Visits:** 6.1% booking rate
  - **4+ Visits:** 9.7% booking rate (Highest intent segment)
- **Data Tag:** Grounded in data.

### Follow-up 1: "Build the FD intent segment"
- **Action:** Autonomous natural-language cohort generation.
- **Segment Definition:** *"Customers who viewed FD rates or the FD calculator 2+ times in the last 14 days and haven't booked an FD."*
- **Reachable Cohort Size:** 8,940 customers
- **Cross-Channel Reach:**
  - SMS: 8,940 customers
  - WhatsApp: 7,310 customers
  - App Push: 5,620 customers
- **Next Step:** View & Save Segment in CDP.

### Follow-up 2: "Which channel converts best?"
- **Channel Conversion Comparison (Last 3 FD Campaigns):**
  - **WhatsApp:** 4.8% conversion rate (Highest converting channel)
  - **App Push:** 2.9% conversion rate
  - **Email:** 1.1% conversion rate
  - **SMS:** 0.6% conversion rate
- **Strategic Recommendation:** Lead with personalized WhatsApp messaging mentioning the exact tenure/rate the customer browsed, followed by app push.
- **Business Impact:**
  - Analysis Time: 37 seconds (vs. 3 days with analytics team).
  - Projected Growth: **+18% FD bookings this quarter**.
- **Featured Success Story:** **Equitas Bank** — Achieved **50% increase in FD conversions** using personalized WhatsApp journeys ([Case Study](https://netcore.ai/success-story/equitas-growth-1-5x-digital-adoption/)).

---

## Challenge 2.2: Too Many Journeys, No Idea Which Ones Leak

- **Challenge ID:** `banking_journey_audit`
- **Core Problem:** Banks run dozens of complex automated customer journeys across loans, credit cards, and deposits, but lack automated bottleneck diagnostics to discover where applicants drop off.
- **User Question:** *"Review my live journeys. Which work best, which work worst, and where are they leaking?"*
- **What Zeno Analyzes On-Screen:**
  - Inspects 42 live lifecycle journeys across personal loans, credit cards, home loans, and fixed deposits.
  - Traces 6.2 Lakh customers step-by-step through every journey node over the past 30 days.
  - Maps drop-off stages and friction points prior to goal completion.

### Key Findings & Insights
- **Headline:** **Personal loan is your weakest journey. 38% of people in it get nothing after Day 1.**
- **Detail:** Customers without the mobile app enter a "no app" branch that terminates after a single SMS. In contrast, the top-performing journey—FD renewal—converts 4x better.
- **Goal Conversion Benchmarks Across Live Journeys:**
  - **FD Renewal:** 14.2% conversion (Top performing)
  - **Card Activation:** 11.8% conversion
  - **Digital Onboarding:** 9.6% conversion
  - **Home Loan:** 4.1% conversion
  - **Personal Loan:** 3.4% conversion (Weakest journey)
- **Data Tag:** Grounded in data.

### Follow-up 1: "Find every leak in this journey"
- **Node-by-Node Audit Diagnostic:**
  - **Dead End (Flagged):** "No app" branch abruptly stops after one SMS.
  - **Early Exit (Flagged):** Users exit immediately upon app open before starting application.
  - **Delivery Failure (Flagged):** 9% of SMS messages bounce because template is not DLT-registered.
  - **Repetition Fatigue (Flagged):** Day 3 and Day 5 blast the identical creative offer.
  - **Passed Checks:** Goal tracking and cross-channel frequency capping functioning properly.

### Follow-up 2: "What should I change?"
- **Recommended Action Plan:**
  1. Add rich WhatsApp and Email follow-up steps to the "no app" branch.
  2. Adjust exit rule so users only exit after application submission (not on initial app open).
  3. Register and verify SMS templates on the telecom DLT portal to resolve the 9% bounce rate.
  4. On Day 5, offer an instant 1-click callback from a loan advisor instead of re-sending the same offer.
- **Business Impact:**
  - Analysis Time: 45 seconds (vs. 1 week auditing node-by-node in spreadsheets).
  - Projected Growth: **+22% personal loan applications**.
- **Featured Success Story:** **Shriram Finance** — Generated **171% higher ROI** across loan and deposit funnels and reduced acquisition cost by 22% ([Case Study](https://netcore.ai/success-story/shriram-finance-171-roi-increase-agentic-marketing/)).

---

## Challenge 2.3: Customers Go Quiet and You Find Out Late

- **Challenge ID:** `banking_dormancy_reactivation`
- **Core Problem:** Millions of bank customers become dormant every quarter, but churn alerts only trigger months later when accounts are already inactive.
- **User Question:** *"Find customers who've gone quiet but are worth reviving."*
- **What Zeno Analyzes On-Screen:**
  - Scans 18 Lakh customers' app engagement, web visits, and transactional telemetry.
  - Identifies accounts that ceased activity over the previous 90 days.
  - Ranks dormant users by historical customer lifetime value (LTV).

### Key Findings & Insights
- **Headline:** **38% of customers went quiet immediately following a failed payment.**
- **Detail:** 1.9 Lakh customers stopped transacting within 90 days. A failed UPI or debit card transaction was the single most frequent terminating event.
- **Last Event Before Disengagement:**
  - **Failed Payment (UPI/Card):** 38% of dormant users (Leading disengagement trigger)
  - **No Clear Operational Reason:** 24% of dormant users
  - **App Update Release:** 21% of dormant users
  - **Service Fee SMS Alert:** 17% of dormant users
- **Data Tag:** Grounded in data.

### Follow-up 1: "Build the revival segment"
- **Segment Definition:** *"Customers inactive for 60+ days whose last recorded event was a failed payment."*
- **Reachable Cohort Size:** 72,640 customers
- **Cross-Channel Reach:**
  - SMS: 72,640 customers
  - WhatsApp: 51,200 customers
  - App Push: 22,870 customers

### Follow-up 2: "Send me the deep-dive report"
- **Action:** Generates a Deep Research Report titled *"Dormancy Deep-Dive"*.
- **Report Modules:** Churn timeline, Root cause triggers, Total deposits/balances at risk, Channel accessibility, and 3-step reactivation blueprint.
- **Coverage:** Covers 18 Lakh customers, 64 campaigns, and 11 journeys over the past 90 days.
- **Business Impact:**
  - Analysis Time: 46 seconds (vs. 1 week with BI and data engineering).
  - Projected Growth: **+6% customer reactivation within 60 days**.
- **Featured Success Story:** **ClearTax** — Achieved **73% lift in returning users** during peak tax season using Netcore's unified customer engagement stack ([Case Study](https://netcore.ai/success-story/cleartax-73-percent-login-growth-with-netcore-agentic-marketing/)).
