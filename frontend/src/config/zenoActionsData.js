/**
 * What Zeno Does on Screen - Action Steps Configuration
 * Mapped directly from the Netcore Experience Center specification PDF.
 * Each question / challenge has exactly 3 action steps shown sequentially while Zeno analyzes.
 */

export const ZENO_ACTIONS_DATA = {
  ecommerce: {
    cart_recovery: {
      challenge_num: "1.1",
      question: "How can I recover more revenue from abandoned carts?",
      steps: [
        "Reading 3 cart-recovery journeys",
        "Matching 4.1L abandoned carts to the orders that followed",
        "Comparing recovery by the hour each reminder was sent",
      ],
      follow_ups: {
        "Who should get a morning reminder?": [
          "Extracting carts left between 9 PM and 2 AM in the last 7 days",
          "Filtering high-value carts worth over ₹1,000 with no order since",
          "Auditing 26,380 reachable users across WhatsApp, App Push & Email",
        ],
        "Plan the new reminder timing": [
          "Scheduling daytime reminders 1 hour after cart is left",
          "Holding late-night carts until 9 to 10 AM the next morning",
          "Setting Day 2 follow-up at each shopper's usual buying hour",
        ],
      },
    },
    repeat_buyers: {
      challenge_num: "1.2",
      question: "Which one-time buyers are most likely to buy again this quarter?",
      steps: [
        "Scoring 6.8L customers on recency, frequency and value",
        "Splitting one-time buyers by first-order discount and product",
        "Checking which past win-back campaigns worked",
      ],
      follow_ups: {
        "Build the win-back segment": [
          "Filtering one-time buyers from the last 60 days",
          "Selecting shoppers who paid full price or got under 20% off",
          "Compiling 52,310 unlapsed buyers across App Push, WhatsApp & Email",
        ],
        "What should the win-back look like?": [
          "Planning Day 20 usage tips and refill reminders",
          "Recommending Day 30 co-purchased product bundles",
          "Triggering Day 45 targeted offer for full-price buyers",
        ],
      },
    },
    sale_planning: {
      challenge_num: "1.3",
      question: "How should I plan campaigns for the year-end sale?",
      steps: [
        "Reading 2 years of sale-season campaigns",
        "Mapping orders by sale day and hour",
        "Checking message fatigue per user per day",
      ],
      follow_ups: {
        "Who's getting too many messages?": [
          "Scanning buyers receiving >4 promotional messages a day",
          "Identifying users who unsubscribed or muted push notifications",
          "Isolating 1,12,400 fatigued users to protect deliverability",
        ],
        "Give me the full plan as a report": [
          "Aggregating 214 campaigns and 9 journeys over 2 sale seasons",
          "Compiling early-access rules, fatigue limits and send-time windows",
          "Generating Deep Research Year-End Sale Plan report",
        ],
      },
    },
  },
  banking: {
    fd_conversion: {
      challenge_num: "2.1",
      question: "Which customers are most likely to open an FD this month?",
      steps: [
        "Reading 30 days of app and website activity for 18L customers",
        "Finding who checked FD rates or used the FD calculator",
        "Checking who already got an FD campaign",
      ],
      follow_ups: {
        "Build the FD intent segment": [
          "Filtering customers who viewed rates or calculator 2+ times in 14 days",
          "Excluding existing customers who have already booked an FD",
          "Building cohort of 8,940 high-intent users across SMS, WhatsApp & Push",
        ],
        "Which channel converts best?": [
          "Analyzing FD booking conversion rates across last 3 campaigns",
          "Comparing WhatsApp (4.8%), App Push (2.9%), Email (1.1%) and SMS (0.6%)",
          "Benchmarking conversion cost and recommendation ranking",
        ],
      },
    },
    journey_audit: {
      challenge_num: "2.2",
      question: "Review my live journeys. Which work best, which work worst, and where are they leaking?",
      steps: [
        "Reading 42 live journeys across loans, cards and FDs",
        "Tracing 6.2L customers through every step in the last 30 days",
        "Finding where people exit before the goal",
      ],
      follow_ups: {
        "Find every leak in this journey": [
          "Auditing dead-end single-SMS branch in no-app customer flow",
          "Flagging early exit occurring on app open before application submit",
          "Detecting 9% SMS DLT delivery failure and repeated Day 3/5 offers",
        ],
        "What should I change?": [
          "Adding WhatsApp and email follow-up steps to the no-app branch",
          "Configuring exit rule to fire only after completed application submit",
          "Replacing duplicate Day 5 offer with proactive callback option",
        ],
      },
    },
    dormancy_reactivation: {
      challenge_num: "2.3",
      question: "Find customers who've gone quiet but are worth reviving.",
      steps: [
        "Scanning 18L customers' app and campaign activity",
        "Finding who stopped engaging in the last 90 days",
        "Ranking them by past engagement",
      ],
      follow_ups: {
        "Build the revival segment": [
          "Filtering customers inactive for 60+ days with failed payment event",
          "Isolating 72,640 high-value dormant users with revival propensity",
          "Mapping reach across SMS (72,640), WhatsApp (51,200) & Push (22,870)",
        ],
        "Send me the deep-dive report": [
          "Analyzing 18L customers, 64 campaigns and 11 journeys over 90 days",
          "Quantifying dormancy velocity, last drop-off events & value at risk",
          "Generating Deep Research Dormancy Revival report",
        ],
      },
    },
  },
  insurance: {
    policy_renewals: {
      challenge_num: "3.1",
      question: "How do I increase my renewal rate?",
      steps: [
        "Reading renewal journeys for motor, health and term",
        "Checking 86K policies due in the next 30 days",
        "Comparing last year's renewals by reminder channel",
      ],
      follow_ups: {
        "Who should get WhatsApp now?": [
          "Filtering health insurance policies due in the next 15 days",
          "Selecting WhatsApp opted-in policyholders with no reminder sent",
          "Creating 9,840 priority WhatsApp cohort for instant reminder send",
        ],
        "When should reminders go out?": [
          "Analyzing renewal rates across D-30, D-15, D-7, D-3 and Grace period",
          "Highlighting 7 days before due date (D-7) as peak 27% renewal window",
          "Rebalancing reminder schedules away from generic early D-30 sends",
        ],
      },
    },
    cross_selling: {
      challenge_num: "3.2",
      question: "Which of my policyholders should I pitch a second policy to?",
      steps: [
        "Reading 30 days of website and app activity for 9.4L policyholders",
        "Finding who viewed term, health or ULIP plans",
        "Checking who already has a follow-up or an open call-centre lead",
      ],
      follow_ups: {
        "Build the cross-sell segment": [
          "Filtering policyholders browsing term or ULIP plans 2+ times in 30 days",
          "Excluding anyone with an active call-centre lead or recent interaction",
          "Assembling 9,870 high-propensity policyholders across WhatsApp & Email",
        ],
        "Plan the follow-up": [
          "Sequencing Day 0 WhatsApp with personalized premium calculator link",
          "Adding Day 2 callback request button routed to SME team",
          "Sending Day 5 plan comparison email while skipping pending renewals",
        ],
      },
    },
    campaign_roi: {
      challenge_num: "3.3",
      question: "Which channels actually drove policy sales last quarter?",
      steps: [
        "Reading 140 campaigns across 5 channels",
        "Matching campaign conversions by channel",
        "Comparing cost per conversion",
      ],
      follow_ups: {
        "Who still needs SMS?": [
          "Filtering customers with no mobile app and no WhatsApp opt-in",
          "Selecting policyholders who converted via SMS in the past year",
          "Isolating 21,700 critical SMS-dependent users to cut redundant spend",
        ],
        "Send me the quarterly ROI report": [
          "Auditing 140 campaigns and 5 marketing channels over last quarter",
          "Calculating cost per policy and conversion efficiency per channel",
          "Generating Deep Research Quarterly Channel ROI report",
        ],
      },
    },
  },
};

export const DEFAULT_INDUSTRY_STEPS = {
  ecommerce: [
    "Reading app and website shopper journeys",
    "Analyzing cart, checkout and purchase patterns",
    "Checking segment engagement and conversion metrics",
  ],
  banking: [
    "Reading 30 days of app and website activity for customer base",
    "Auditing product engagement, journeys and conversion funnels",
    "Checking channel effectiveness across SMS, WhatsApp & Push",
  ],
  insurance: [
    "Reading policyholder journeys and renewal activity",
    "Auditing renewal, cross-sell and campaign performance",
    "Evaluating channel conversion efficiency across channels",
  ],
  default: [
    "Analyzing customer data and interaction history",
    "Retrieving Netcore AI knowledge and benchmarks",
    "Synthesizing actionable recommendations",
  ],
};

/**
 * Resolves the 3 "What Zeno does on screen" action steps for a question.
 */
export function getZenoActionsForQuestion(questionText, challengeId, industryId) {
  if (!questionText && !challengeId) {
    return DEFAULT_INDUSTRY_STEPS[industryId] || DEFAULT_INDUSTRY_STEPS.default;
  }

  const cleanQ = (questionText || "").toLowerCase().trim();
  const indKey = (industryId || "").toLowerCase();

  // 1. Direct challenge lookup if challengeId provided
  if (challengeId) {
    for (const [ind, challenges] of Object.entries(ZENO_ACTIONS_DATA)) {
      if (challenges[challengeId]) {
        const ch = challenges[challengeId];

        // Check if questionText matches a follow-up
        if (cleanQ && ch.follow_ups) {
          for (const [fuQ, fuSteps] of Object.entries(ch.follow_ups)) {
            const cleanFu = fuQ.toLowerCase().trim();
            if (cleanQ === cleanFu || cleanQ.includes(cleanFu) || cleanFu.includes(cleanQ)) {
              return fuSteps;
            }
          }
        }
        return ch.steps;
      }
    }
  }

  // 2. Search all industries and challenges by question content
  for (const [ind, challenges] of Object.entries(ZENO_ACTIONS_DATA)) {
    for (const [cId, ch] of Object.entries(challenges)) {
      const mainQ = ch.question.toLowerCase().trim();
      if (cleanQ === mainQ || cleanQ.includes(mainQ) || mainQ.includes(cleanQ)) {
        return ch.steps;
      }
      if (ch.follow_ups) {
        for (const [fuQ, fuSteps] of Object.entries(ch.follow_ups)) {
          const cleanFu = fuQ.toLowerCase().trim();
          if (cleanQ === cleanFu || cleanQ.includes(cleanFu) || cleanFu.includes(cleanQ)) {
            return fuSteps;
          }
        }
      }
    }
  }

  // 3. Keyword matching fallbacks
  if (cleanQ.includes("cart") || cleanQ.includes("abandon")) {
    return ZENO_ACTIONS_DATA.ecommerce.cart_recovery.steps;
  }
  if (cleanQ.includes("one-time") || cleanQ.includes("repeat") || cleanQ.includes("win-back")) {
    return ZENO_ACTIONS_DATA.ecommerce.repeat_buyers.steps;
  }
  if (cleanQ.includes("sale") || cleanQ.includes("season") || cleanQ.includes("campaigns")) {
    return ZENO_ACTIONS_DATA.ecommerce.sale_planning.steps;
  }
  if (cleanQ.includes("fd") || cleanQ.includes("deposit") || cleanQ.includes("rates")) {
    return ZENO_ACTIONS_DATA.banking.fd_conversion.steps;
  }
  if (cleanQ.includes("journey") || cleanQ.includes("leak") || cleanQ.includes("worst")) {
    return ZENO_ACTIONS_DATA.banking.journey_audit.steps;
  }
  if (cleanQ.includes("quiet") || cleanQ.includes("dormant") || cleanQ.includes("reviv")) {
    return ZENO_ACTIONS_DATA.banking.dormancy_reactivation.steps;
  }
  if (cleanQ.includes("renewal") || cleanQ.includes("lapse") || cleanQ.includes("grace")) {
    return ZENO_ACTIONS_DATA.insurance.policy_renewals.steps;
  }
  if (cleanQ.includes("second policy") || cleanQ.includes("cross-sell") || cleanQ.includes("pitch")) {
    return ZENO_ACTIONS_DATA.insurance.cross_selling.steps;
  }
  if (cleanQ.includes("spend") || cleanQ.includes("roi") || cleanQ.includes("drove policy")) {
    return ZENO_ACTIONS_DATA.insurance.campaign_roi.steps;
  }

  // 4. Fallback to industry default or general default
  return DEFAULT_INDUSTRY_STEPS[indKey] || DEFAULT_INDUSTRY_STEPS.default;
}
