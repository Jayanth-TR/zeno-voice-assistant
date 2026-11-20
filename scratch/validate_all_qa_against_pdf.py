import os
import sys

# Add backend to path
sys.path.insert(0, os.path.abspath("backend"))

from app.rag.retriever import retrieve_knowledge

TEST_SUITE = [
    # --- E-commerce & D2C ---
    {
        "industry": "ecommerce",
        "challenge_id": "ecommerce_cart_recovery",
        "question": "How can I recover more revenue from abandoned carts?",
        "expected_keywords": ["9 AM", "midnight", "2x", "4.1", "31%"],
    },
    {
        "industry": "ecommerce",
        "challenge_id": "ecommerce_cart_recovery",
        "question": "Who should get a morning reminder?",
        "expected_keywords": ["26,380", "1,000", "WhatsApp", "9 PM and 2 AM"],
    },
    {
        "industry": "ecommerce",
        "challenge_id": "ecommerce_cart_recovery",
        "question": "Plan the new reminder timing",
        "expected_keywords": ["9:00 AM", "1 hour", "Day 2", "21 Lakh"],
    },
    {
        "industry": "ecommerce",
        "challenge_id": "ecommerce_repeat_buyers",
        "question": "Which one-time buyers are most likely to buy again this quarter?",
        "expected_keywords": ["3x", "full-price", "62%", "45 days", "31%"],
    },
    {
        "industry": "ecommerce",
        "challenge_id": "ecommerce_repeat_buyers",
        "question": "Build the win-back segment",
        "expected_keywords": ["52,310", "60 days", "full price", "20%"],
    },
    {
        "industry": "ecommerce",
        "challenge_id": "ecommerce_repeat_buyers",
        "question": "What should the win-back look like?",
        "expected_keywords": ["Day 20", "Day 30", "Day 45", "3.1 percentage points"],
    },
    {
        "industry": "ecommerce",
        "challenge_id": "ecommerce_sale_planning",
        "question": "How should I plan campaigns for the year-end sale?",
        "expected_keywords": ["47%", "Day 1", "Day 3", "biggest"],
    },
    {
        "industry": "ecommerce",
        "challenge_id": "ecommerce_sale_planning",
        "question": "Who's getting too many messages?",
        "expected_keywords": ["1,12,400", "4 messages", "unsubscribed"],
    },
    {
        "industry": "ecommerce",
        "challenge_id": "ecommerce_sale_planning",
        "question": "Give me the full plan as a report",
        "expected_keywords": ["214 campaigns", "9 journeys", "-22%"],
    },

    # --- Banking & Fintech ---
    {
        "industry": "banking",
        "challenge_id": "banking_fd_conversion",
        "question": "Which customers are most likely to open an FD this month?",
        "expected_keywords": ["11,200", "FD rates", "1 in 5", "4x", "1.8%"],
    },
    {
        "industry": "banking",
        "challenge_id": "banking_fd_conversion",
        "question": "Build the FD intent segment",
        "expected_keywords": ["8,940", "14 days", "8,940", "7,310"],
    },
    {
        "industry": "banking",
        "challenge_id": "banking_fd_conversion",
        "question": "Which channel converts best?",
        "expected_keywords": ["4.8%", "0.6%", "2.9%", "+18%"],
    },
    {
        "industry": "banking",
        "challenge_id": "banking_journey_audit",
        "question": "Review my live journeys. Which work best, which work worst, and where are they leaking?",
        "expected_keywords": ["Personal loan", "38%", "Day 1", "3.4%", "14.2%"],
    },
    {
        "industry": "banking",
        "challenge_id": "banking_journey_audit",
        "question": "Find every leak in this journey",
        "expected_keywords": ["No app", "one SMS", "9%", "DLT", "Day 3 and Day 5"],
    },
    {
        "industry": "banking",
        "challenge_id": "banking_journey_audit",
        "question": "What should I change?",
        "expected_keywords": ["WhatsApp and Email", "DLT", "callback", "+22%"],
    },
    {
        "industry": "banking",
        "challenge_id": "banking_dormancy",
        "question": "Find customers who've gone quiet but are worth reviving.",
        "expected_keywords": ["38%", "failed payment", "1.9 Lakh", "90 days"],
    },
    {
        "industry": "banking",
        "challenge_id": "banking_dormancy",
        "question": "Build the revival segment",
        "expected_keywords": ["72,640", "60+", "failed payment", "72,640"],
    },
    {
        "industry": "banking",
        "challenge_id": "banking_dormancy",
        "question": "Send me the deep-dive report",
        "expected_keywords": ["18 Lakh", "64 campaigns", "+6%"],
    },

    # --- Insurance ---
    {
        "industry": "insurance",
        "challenge_id": "insurance_renewal_lapse",
        "question": "How do I increase my renewal rate?",
        "expected_keywords": ["Health", "WhatsApp", "2.3x", "31%", "55%"],
    },
    {
        "industry": "insurance",
        "challenge_id": "insurance_renewal_lapse",
        "question": "Who should get WhatsApp now?",
        "expected_keywords": ["9,840", "15 days", "WhatsApp"],
    },
    {
        "industry": "insurance",
        "challenge_id": "insurance_renewal_lapse",
        "question": "When should reminders go out?",
        "expected_keywords": ["7 days", "D-7", "27%", "+4.5"],
    },
    {
        "industry": "insurance",
        "challenge_id": "insurance_second_policy",
        "question": "Which of my policyholders should I pitch a second policy to?",
        "expected_keywords": ["14,600", "82%", "term or ULIP", "second policy"],
    },
    {
        "industry": "insurance",
        "challenge_id": "insurance_second_policy",
        "question": "Build the cross-sell segment",
        "expected_keywords": ["9,870", "30 days", "7,940"],
    },
    {
        "industry": "insurance",
        "challenge_id": "insurance_second_policy",
        "question": "Plan the follow-up",
        "expected_keywords": ["Day 0", "Day 2", "Day 5", "+20%"],
    },
    {
        "industry": "insurance",
        "challenge_id": "insurance_campaign_roi",
        "question": "Which channels actually drove policy sales last quarter?",
        "expected_keywords": ["34%", "9%", "46", "9"],
    },
    {
        "industry": "insurance",
        "challenge_id": "insurance_campaign_roi",
        "question": "Who still needs SMS?",
        "expected_keywords": ["21,700", "no app", "WhatsApp"],
    },
    {
        "industry": "insurance",
        "challenge_id": "insurance_campaign_roi",
        "question": "Send me the quarterly ROI report",
        "expected_keywords": ["140 campaigns", "5 channels", "25%"],
    },
]

def run_tests():
    passed = 0
    total = len(TEST_SUITE)
    print(f"=== VALIDATING ALL {total} QUESTIONS ACROSS 3 INDUSTRIES AGAINST PDF DATA ===\n", flush=True)
    
    for i, item in enumerate(TEST_SUITE):
        q = item["question"]
        ind = item["industry"]
        ch_id = item["challenge_id"]
        
        # In production App.jsx top_k=8 is used
        results = retrieve_knowledge(
            query=f"{q} {ind} {ch_id}",
            top_k=8,
            min_hybrid_score=0.1,
            industry=ind,
            challenge_id=ch_id,
        )
        
        ctx = "\n".join([r.get("content", "") for r in results])
        sources = [r.get("source", "") for r in results]
        
        missing = [kw for kw in item["expected_keywords"] if kw.lower() not in ctx.lower()]
        has_approved_doc = any("industry_experience" in str(s).lower() for s in sources)
        
        if not missing and has_approved_doc:
            passed += 1
            print(f"[{i+1:02d}/{total}] PASS | [{ind.upper()}] {q}", flush=True)
        else:
            print(f"[{i+1:02d}/{total}] FAIL | [{ind.upper()}] {q} | Missing: {missing}", flush=True)

    print(f"\nFINAL RESULT: {passed}/{total} tests PASSED grounded in PDF data.", flush=True)

if __name__ == "__main__":
    run_tests()
