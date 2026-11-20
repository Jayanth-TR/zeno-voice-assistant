export const HOLOBOX_DEMO_DATA = {
  "ind": [
    {
      "name": "E-commerce & D2C",
      "stories": [
        "Bacca Bucci",
        "Mulmul",
        "Anveshan",
        "BigHaat",
        "IGP",
        "Myntra",
        "AJIO",
        "GRT Jewellers"
      ],
      "ch": [
        {
          "title": "Cart recovery has stopped recovering",
          "will": "find what's going on · build the segment · plan next steps",
          "q": "How can I recover more revenue from abandoned carts?",
          "steps": [
            "Reading 3 cart-recovery journeys",
            "Matching 4.1L abandoned carts to the orders that followed",
            "Comparing recovery by the hour each reminder was sent"
          ],
          "head": "Carts left after 9 PM recover 2x better when the reminder goes at 9 AM, not at midnight.",
          "detail": "Your first reminder goes 1 hour after the cart is left. So 31% of abandoned cart value gets its reminder between 10 PM and 2 AM, when few people open it.",
          "ctitle": "Cart recovery rate by hour the reminder was sent",
          "bars": [
            {
              "l": "9 AM",
              "v": 11.2,
              "s": "11.2%",
              "h": true,
              "m": ""
            },
            {
              "l": "12 PM",
              "v": 10.4,
              "s": "10.4%",
              "h": false,
              "m": ""
            },
            {
              "l": "3 PM",
              "v": 9.1,
              "s": "9.1%",
              "h": false,
              "m": ""
            },
            {
              "l": "6 PM",
              "v": 9.8,
              "s": "9.8%",
              "h": false,
              "m": ""
            },
            {
              "l": "9 PM",
              "v": 7.6,
              "s": "7.6%",
              "h": false,
              "m": ""
            },
            {
              "l": "12 AM",
              "v": 4.9,
              "s": "4.9%",
              "h": true,
              "m": "Late-night carts"
            }
          ],
          "fu": [
            {
              "type": "segment",
              "q": "Who should get a morning reminder?",
              "does": "Builds a segment from one sentence",
              "sentence": "Carts left between 9 PM and 2 AM in the last 7 days, worth over ₹1,000, with no order since",
              "users": "26,380",
              "ch": [
                {
                  "n": "WhatsApp",
                  "v": "21,150"
                },
                {
                  "n": "App push",
                  "v": "19,840"
                },
                {
                  "n": "Email",
                  "v": "24,900"
                }
              ]
            },
            {
              "type": "plan",
              "q": "Plan the new reminder timing",
              "does": "Plans the next steps",
              "title": "Recommended reminder timing",
              "items": [
                {
                  "k": "Daytime",
                  "t": "Keep the reminder 1 hour after the cart is left"
                },
                {
                  "k": "Late night",
                  "t": "Hold it until 9 to 10 AM the next morning"
                },
                {
                  "k": "Day 2",
                  "t": "Second reminder at each shopper's usual buying hour"
                },
                {
                  "k": "Skip",
                  "t": "Items already bought or now out of stock"
                }
              ]
            }
          ],
          "time": "38 sec",
          "usual": "2 days across 3 dashboards",
          "impact": "+7% cart revenue, ~₹21L a month",
          "story": "Mulmul"
        },
        {
          "title": "One-time buyers never come back",
          "will": "find what's going on · build the segment · plan next steps",
          "q": "Which one-time buyers are most likely to buy again this quarter?",
          "steps": [
            "Scoring 6.8L customers on recency, frequency and value",
            "Splitting one-time buyers by first-order discount and product",
            "Checking which past win-back campaigns worked"
          ],
          "head": "Full-price first-timers are 3x likelier to buy again than deep-discount first-timers.",
          "detail": "62% of one-time buyers lapse within 45 days. Most of them came in on a 40%+ sale code and were never going to buy at full price.",
          "ctitle": "Repeat purchase rate by first-order discount",
          "bars": [
            {
              "l": "Full price",
              "v": 31,
              "s": "31%",
              "h": true,
              "m": ""
            },
            {
              "l": "Under 20% off",
              "v": 24,
              "s": "24%",
              "h": false,
              "m": ""
            },
            {
              "l": "20-40% off",
              "v": 15,
              "s": "15%",
              "h": false,
              "m": ""
            },
            {
              "l": "Over 40% off",
              "v": 9,
              "s": "9%",
              "h": true,
              "m": ""
            }
          ],
          "fu": [
            {
              "type": "segment",
              "q": "Build the win-back segment",
              "does": "Builds a segment from one sentence",
              "sentence": "One-time buyers from the last 60 days who paid full price or got under 20% off, and haven't lapsed yet",
              "users": "52,310",
              "ch": [
                {
                  "n": "App push",
                  "v": "40,120"
                },
                {
                  "n": "WhatsApp",
                  "v": "38,800"
                },
                {
                  "n": "Email",
                  "v": "49,750"
                }
              ]
            },
            {
              "type": "plan",
              "q": "What should the win-back look like?",
              "does": "Plans the next steps",
              "title": "Recommended win-back plan",
              "items": [
                {
                  "k": "Day 20",
                  "t": "Usage tips or a refill reminder for what they bought"
                },
                {
                  "k": "Day 30",
                  "t": "Products most often bought with their first item"
                },
                {
                  "k": "Day 45",
                  "t": "A small offer, only for full-price buyers who haven't returned"
                },
                {
                  "k": "Skip",
                  "t": "Deep-discount first-timers: bring them back in the next sale"
                }
              ]
            }
          ],
          "time": "44 sec",
          "usual": "1 week of RFM work in spreadsheets",
          "impact": "+3.1 pts repeat rate in 90 days",
          "story": "BigHaat"
        },
        {
          "title": "Sale-season planning is guesswork",
          "will": "find what's going on · build the segment · write a report",
          "q": "How should I plan campaigns for the year-end sale?",
          "steps": [
            "Reading 2 years of sale-season campaigns",
            "Mapping orders by sale day and hour",
            "Checking message fatigue per user per day"
          ],
          "head": "Last year, 47% of sale orders came in early access and day 1. Your biggest sends went out on day 3.",
          "detail": "By day 3 most buyers had already bought. Unsubscribes doubled in the second half of the sale.",
          "ctitle": "Share of sale orders by day, last year",
          "bars": [
            {
              "l": "Early",
              "v": 9,
              "s": "9%",
              "h": true,
              "m": ""
            },
            {
              "l": "Day 1",
              "v": 38,
              "s": "38%",
              "h": true,
              "m": ""
            },
            {
              "l": "Day 2",
              "v": 21,
              "s": "21%",
              "h": false,
              "m": ""
            },
            {
              "l": "Day 3",
              "v": 14,
              "s": "14%",
              "h": false,
              "m": "Biggest send"
            },
            {
              "l": "Day 4",
              "v": 10,
              "s": "10%",
              "h": false,
              "m": ""
            },
            {
              "l": "Day 5",
              "v": 8,
              "s": "8%",
              "h": false,
              "m": ""
            }
          ],
          "fu": [
            {
              "type": "segment",
              "q": "Who's getting too many messages?",
              "does": "Builds a segment from one sentence",
              "sentence": "Users who got more than 4 messages a day during last year's sale and then unsubscribed or muted push",
              "users": "1,12,400",
              "ch": [
                {
                  "n": "App push",
                  "v": "86,200"
                },
                {
                  "n": "WhatsApp",
                  "v": "41,300"
                },
                {
                  "n": "Email",
                  "v": "97,800"
                }
              ]
            },
            {
              "type": "report",
              "q": "Give me the full plan as a report",
              "does": "Writes a Deep Research report",
              "title": "Year-end sale plan",
              "screens": [
                {
                  "n": 1,
                  "t": "Orders by sale day"
                },
                {
                  "n": 2,
                  "t": "Early-access plan"
                },
                {
                  "n": 3,
                  "t": "Fatigue limits"
                },
                {
                  "n": 4,
                  "t": "Send-time windows"
                },
                {
                  "n": 5,
                  "t": "Channel mix"
                }
              ],
              "cov": "Covers 214 campaigns and 9 journeys from the last two sale seasons."
            }
          ],
          "time": "52 sec",
          "usual": "3 days building the plan deck",
          "impact": "-22% unsubscribes in sale week",
          "story": "Bacca Bucci"
        }
      ]
    },
    {
      "name": "Banking & Fintech",
      "stories": [
        "Shriram Finance",
        "Equitas Bank",
        "ClearTax"
      ],
      "ch": [
        {
          "title": "Customers check FD rates but don't book",
          "will": "find what's going on · build the segment · compare channels",
          "q": "Which customers are most likely to open an FD this month?",
          "steps": [
            "Reading 30 days of app and website activity for 18L customers",
            "Finding who checked FD rates or used the FD calculator",
            "Checking who already got an FD campaign"
          ],
          "head": "11,200 customers checked FD rates 2+ times this month. Only 1 in 5 heard from you.",
          "detail": "Customers who come back to the FD rates page book about 4x more than one-time visitors. Your FD campaign goes to the whole base by email.",
          "ctitle": "FD booked within 30 days, by visits to the FD rates page",
          "bars": [
            {
              "l": "No visit",
              "v": 0.4,
              "s": "0.4%",
              "h": false,
              "m": ""
            },
            {
              "l": "1 visit",
              "v": 1.8,
              "s": "1.8%",
              "h": false,
              "m": ""
            },
            {
              "l": "2-3 visits",
              "v": 6.1,
              "s": "6.1%",
              "h": true,
              "m": ""
            },
            {
              "l": "4+ visits",
              "v": 9.7,
              "s": "9.7%",
              "h": true,
              "m": ""
            }
          ],
          "fu": [
            {
              "type": "segment",
              "q": "Build the FD intent segment",
              "does": "Builds a segment from one sentence",
              "sentence": "Customers who viewed FD rates or the FD calculator 2+ times in the last 14 days and haven't booked an FD",
              "users": "8,940",
              "ch": [
                {
                  "n": "SMS",
                  "v": "8,940"
                },
                {
                  "n": "WhatsApp",
                  "v": "7,310"
                },
                {
                  "n": "App push",
                  "v": "5,620"
                }
              ]
            },
            {
              "type": "chart",
              "q": "Which channel converts best?",
              "does": "Compares the options and recommends",
              "ctitle": "FD booking rate by channel, last 3 FD campaigns",
              "bars": [
                {
                  "l": "WhatsApp",
                  "v": 4.8,
                  "s": "4.8%",
                  "h": true,
                  "m": ""
                },
                {
                  "l": "App push",
                  "v": 2.9,
                  "s": "2.9%",
                  "h": false,
                  "m": ""
                },
                {
                  "l": "Email",
                  "v": 1.1,
                  "s": "1.1%",
                  "h": false,
                  "m": ""
                },
                {
                  "l": "SMS",
                  "v": 0.6,
                  "s": "0.6%",
                  "h": false,
                  "m": ""
                }
              ],
              "rec": "Lead with WhatsApp, and mention the tenure they looked at."
            }
          ],
          "time": "37 sec",
          "usual": "3 days with the analytics team",
          "impact": "+18% FD bookings this quarter",
          "story": "Equitas Bank"
        },
        {
          "title": "Too many journeys, no idea which ones leak",
          "will": "find what's going on · run the checks · plan next steps",
          "q": "Review my live journeys. Which work best, which work worst, and where are they leaking?",
          "steps": [
            "Reading 42 live journeys across loans, cards and FDs",
            "Tracing 6.2L customers through every step in the last 30 days",
            "Finding where people exit before the goal"
          ],
          "head": "Personal loan is your weakest journey. 38% of people in it get nothing after day 1.",
          "detail": "Customers without your app go down the \"no app\" branch, which stops after one SMS. Your best journey, FD renewal, converts 4x better.",
          "ctitle": "Goal conversion, best and worst live journeys",
          "bars": [
            {
              "l": "FD renewal",
              "v": 14.2,
              "s": "14.2%",
              "h": true,
              "m": ""
            },
            {
              "l": "Card activation",
              "v": 11.8,
              "s": "11.8%",
              "h": false,
              "m": ""
            },
            {
              "l": "Onboarding",
              "v": 9.6,
              "s": "9.6%",
              "h": false,
              "m": ""
            },
            {
              "l": "Home loan",
              "v": 4.1,
              "s": "4.1%",
              "h": false,
              "m": ""
            },
            {
              "l": "Personal loan",
              "v": 3.4,
              "s": "3.4%",
              "h": true,
              "m": ""
            }
          ],
          "fu": [
            {
              "type": "checks",
              "q": "Find every leak in this journey",
              "does": "Runs the checks and flags issues",
              "items": [
                {
                  "t": "\"No app\" branch stops after one SMS",
                  "tag": "Dead end",
                  "ok": false
                },
                {
                  "t": "People exit on app open, before they apply",
                  "tag": "Early exit",
                  "ok": false
                },
                {
                  "t": "9% of SMS fail: template not DLT-registered",
                  "tag": "Delivery",
                  "ok": false
                },
                {
                  "t": "Day 3 and day 5 repeat the same offer",
                  "tag": "Repetition",
                  "ok": false
                },
                {
                  "t": "Goal tracking and frequency caps set up",
                  "tag": "Passed",
                  "ok": true
                }
              ]
            },
            {
              "type": "plan",
              "q": "What should I change?",
              "does": "Plans the next steps",
              "title": "Suggested changes, in order",
              "items": [
                {
                  "k": "Add",
                  "t": "WhatsApp and email steps to the \"no app\" branch"
                },
                {
                  "k": "Fix",
                  "t": "Exit only after the application is submitted"
                },
                {
                  "k": "Fix",
                  "t": "Register the SMS template on DLT"
                },
                {
                  "k": "Change",
                  "t": "Day 5: offer a callback instead of the same offer"
                }
              ]
            }
          ],
          "time": "45 sec",
          "usual": "1 week auditing journeys one by one",
          "impact": "+22% personal loan applications",
          "story": "Shriram Finance"
        },
        {
          "title": "Customers go quiet and you find out late",
          "will": "find what's going on · build the segment · write a report",
          "q": "Find customers who've gone quiet but are worth reviving.",
          "steps": [
            "Scanning 18L customers' app and campaign activity",
            "Finding who stopped engaging in the last 90 days",
            "Ranking them by past engagement"
          ],
          "head": "38% went quiet right after a failed payment.",
          "detail": "1.9L customers stopped engaging in 90 days. A failed UPI or card transaction is the most common last event.",
          "ctitle": "Last event before going quiet",
          "bars": [
            {
              "l": "Failed payment",
              "v": 38,
              "s": "38%",
              "h": true,
              "m": ""
            },
            {
              "l": "No clear reason",
              "v": 24,
              "s": "24%",
              "h": false,
              "m": ""
            },
            {
              "l": "App update",
              "v": 21,
              "s": "21%",
              "h": false,
              "m": ""
            },
            {
              "l": "Fee SMS",
              "v": 17,
              "s": "17%",
              "h": false,
              "m": ""
            }
          ],
          "fu": [
            {
              "type": "segment",
              "q": "Build the revival segment",
              "does": "Builds a segment from one sentence",
              "sentence": "Customers inactive for 60+ days whose last event was a failed payment",
              "users": "72,640",
              "ch": [
                {
                  "n": "SMS",
                  "v": "72,640"
                },
                {
                  "n": "WhatsApp",
                  "v": "51,200"
                },
                {
                  "n": "App push",
                  "v": "22,870"
                }
              ]
            },
            {
              "type": "report",
              "q": "Send me the deep-dive report",
              "does": "Writes a Deep Research report",
              "title": "Dormancy deep-dive",
              "screens": [
                {
                  "n": 1,
                  "t": "Who went quiet"
                },
                {
                  "n": 2,
                  "t": "Last events"
                },
                {
                  "n": 3,
                  "t": "Value at risk"
                },
                {
                  "n": 4,
                  "t": "Channel reach"
                },
                {
                  "n": 5,
                  "t": "Next steps"
                }
              ],
              "cov": "Covers 18L customers, 64 campaigns and 11 journeys from the last 90 days."
            }
          ],
          "time": "46 sec",
          "usual": "1 week with the analytics team",
          "impact": "+6% reactivation in 60 days",
          "story": "ClearTax"
        }
      ]
    },
    {
      "name": "Insurance",
      "stories": [
        "ICICI Life Insurance"
      ],
      "ch": [
        {
          "title": "Renewals lapse in the grace period",
          "will": "find what's going on · build the segment · find the best time",
          "q": "How do I increase my renewal rate?",
          "steps": [
            "Reading renewal journeys for motor, health and term",
            "Checking 86K policies due in the next 30 days",
            "Comparing last year's renewals by reminder channel"
          ],
          "head": "Health renewals with a WhatsApp reminder renew 2.3x more. Only 31% get one.",
          "detail": "Across motor, health and term, health has the biggest gap. SMS-only reminders are still the default there.",
          "ctitle": "Renewal rate by reminder channel",
          "bars": [
            {
              "l": "SMS only",
              "v": 24,
              "s": "24%",
              "h": false,
              "m": ""
            },
            {
              "l": "Email",
              "v": 29,
              "s": "29%",
              "h": false,
              "m": ""
            },
            {
              "l": "WhatsApp",
              "v": 55,
              "s": "55%",
              "h": true,
              "m": ""
            },
            {
              "l": "Agent call",
              "v": 61,
              "s": "61%",
              "h": false,
              "m": ""
            }
          ],
          "fu": [
            {
              "type": "segment",
              "q": "Who should get WhatsApp now?",
              "does": "Builds a segment from one sentence",
              "sentence": "Health policies due in 15 days, WhatsApp opted in, with no WhatsApp reminder sent yet",
              "users": "9,840",
              "ch": [
                {
                  "n": "WhatsApp",
                  "v": "9,840"
                },
                {
                  "n": "SMS",
                  "v": "9,840"
                },
                {
                  "n": "Email",
                  "v": "8,210"
                }
              ]
            },
            {
              "type": "chart",
              "q": "When should reminders go out?",
              "does": "Analyses the pattern and recommends",
              "ctitle": "Renewal rate by reminder timing",
              "bars": [
                {
                  "l": "D-30",
                  "v": 8,
                  "s": "8%",
                  "h": false,
                  "m": ""
                },
                {
                  "l": "D-15",
                  "v": 19,
                  "s": "19%",
                  "h": false,
                  "m": ""
                },
                {
                  "l": "D-7",
                  "v": 27,
                  "s": "27%",
                  "h": true,
                  "m": ""
                },
                {
                  "l": "D-3",
                  "v": 21,
                  "s": "21%",
                  "h": false,
                  "m": ""
                },
                {
                  "l": "Grace",
                  "v": 11,
                  "s": "11%",
                  "h": false,
                  "m": ""
                }
              ],
              "rec": "Best: 7 days before due. Most reminders now go at D-30 and in grace."
            }
          ],
          "time": "40 sec",
          "usual": "3 days stitching reports",
          "impact": "+4.5 pts health renewal rate",
          "story": "ICICI Life Insurance"
        },
        {
          "title": "Policyholders never buy a second policy",
          "will": "find what's going on · build the segment · plan next steps",
          "q": "Which of my policyholders should I pitch a second policy to?",
          "steps": [
            "Reading 30 days of website and app activity for 9.4L policyholders",
            "Finding who viewed term, health or ULIP plans",
            "Checking who already has a follow-up or an open call-centre lead"
          ],
          "head": "14,600 policyholders looked at term or ULIP plans this month. 82% got no follow-up.",
          "detail": "Policyholders who come back to a plan page or use the premium calculator buy a second policy far more often. Your cross-sell campaign goes out once a quarter, to everyone.",
          "ctitle": "Second policy bought within 60 days, by browsing",
          "bars": [
            {
              "l": "No visit",
              "v": 0.6,
              "s": "0.6%",
              "h": false,
              "m": ""
            },
            {
              "l": "Viewed once",
              "v": 2.1,
              "s": "2.1%",
              "h": false,
              "m": ""
            },
            {
              "l": "Viewed 2+ times",
              "v": 5.4,
              "s": "5.4%",
              "h": true,
              "m": ""
            },
            {
              "l": "Used calculator",
              "v": 8.9,
              "s": "8.9%",
              "h": true,
              "m": ""
            }
          ],
          "fu": [
            {
              "type": "segment",
              "q": "Build the cross-sell segment",
              "does": "Builds a segment from one sentence",
              "sentence": "Policyholders who viewed term or ULIP plans 2+ times in 30 days, with no open call-centre lead",
              "users": "9,870",
              "ch": [
                {
                  "n": "WhatsApp",
                  "v": "7,940"
                },
                {
                  "n": "Email",
                  "v": "9,120"
                },
                {
                  "n": "SMS",
                  "v": "9,870"
                }
              ]
            },
            {
              "type": "plan",
              "q": "Plan the follow-up",
              "does": "Plans the next steps",
              "title": "Recommended follow-up",
              "items": [
                {
                  "k": "Day 0",
                  "t": "WhatsApp about the plan they viewed, with a premium calculator link"
                },
                {
                  "k": "Day 2",
                  "t": "\"Request a callback\" button that creates a call-centre lead"
                },
                {
                  "k": "Day 5",
                  "t": "Email comparing the plans they looked at"
                },
                {
                  "k": "Skip",
                  "t": "Anyone with a renewal due in 30 days: renew first"
                }
              ]
            }
          ],
          "time": "42 sec",
          "usual": "1 week of analysis",
          "impact": "+20% second-policy sales",
          "story": "ICICI Life Insurance"
        },
        {
          "title": "Hard to tell which campaigns earn their spend",
          "will": "find what's going on · build the segment · write a report",
          "q": "Which channels actually drove policy sales last quarter?",
          "steps": [
            "Reading 140 campaigns across 5 channels",
            "Matching campaign conversions by channel",
            "Comparing cost per conversion"
          ],
          "head": "SMS takes 34% of spend but drives 9% of conversions.",
          "detail": "WhatsApp and email convert far better per rupee, and SMS is still the default for most renewals.",
          "ctitle": "Conversions per ₹1L spent",
          "bars": [
            {
              "l": "WhatsApp",
              "v": 46,
              "s": "46",
              "h": true,
              "m": ""
            },
            {
              "l": "Email",
              "v": 31,
              "s": "31",
              "h": false,
              "m": ""
            },
            {
              "l": "App push",
              "v": 28,
              "s": "28",
              "h": false,
              "m": ""
            },
            {
              "l": "SMS",
              "v": 9,
              "s": "9",
              "h": true,
              "m": ""
            }
          ],
          "fu": [
            {
              "type": "segment",
              "q": "Who still needs SMS?",
              "does": "Builds a segment from one sentence",
              "sentence": "Customers with no app, no WhatsApp opt-in, who converted on SMS in the last year",
              "users": "21,700",
              "ch": [
                {
                  "n": "SMS",
                  "v": "21,700"
                },
                {
                  "n": "Email",
                  "v": "14,300"
                },
                {
                  "n": "WhatsApp",
                  "v": "0"
                }
              ]
            },
            {
              "type": "report",
              "q": "Send me the quarterly ROI report",
              "does": "Writes a Deep Research report",
              "title": "Quarterly channel ROI",
              "screens": [
                {
                  "n": 1,
                  "t": "Spend vs conversions"
                },
                {
                  "n": 2,
                  "t": "Cost per policy"
                },
                {
                  "n": 3,
                  "t": "Channel overlap"
                },
                {
                  "n": 4,
                  "t": "What to cut"
                },
                {
                  "n": 5,
                  "t": "What to scale"
                }
              ],
              "cov": "Covers 140 campaigns and 5 channels from the last quarter."
            }
          ],
          "time": "47 sec",
          "usual": "1 week at quarter end",
          "impact": "Same sales on ~25% less SMS spend",
          "story": "ICICI Life Insurance"
        }
      ]
    }
  ],
  "stories": {
    "Bacca Bucci": {
      "line": "3X ↑ CRM Revenue Share with Agentic Marketing",
      "url": "https://netcore.ai/success-story/bacca-bucci-15x-roi-agentic-marketing/",
      "n": 37,
      "d": "M0 0h7v1h-7zM8 0h2v1h-2zM14 0h2v1h-2zM17 0h1v1h-1zM19 0h4v1h-4zM26 0h1v1h-1zM30 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM10 1h10v1h-10zM21 1h1v1h-1zM24 1h1v1h-1zM30 1h1v1h-1zM36 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h6v1h-6zM16 2h1v1h-1zM18 2h2v1h-2zM21 2h1v1h-1zM25 2h1v1h-1zM27 2h1v1h-1zM30 2h1v1h-1zM32 2h3v1h-3zM36 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM9 3h1v1h-1zM13 3h2v1h-2zM17 3h1v1h-1zM20 3h2v1h-2zM25 3h1v1h-1zM28 3h1v1h-1zM30 3h1v1h-1zM32 3h3v1h-3zM36 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h1v1h-1zM11 4h2v1h-2zM15 4h2v1h-2zM18 4h2v1h-2zM22 4h1v1h-1zM25 4h2v1h-2zM30 4h1v1h-1zM32 4h3v1h-3zM36 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM9 5h3v1h-3zM16 5h1v1h-1zM20 5h1v1h-1zM22 5h2v1h-2zM30 5h1v1h-1zM36 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM30 6h7v1h-7zM10 7h1v1h-1zM12 7h1v1h-1zM17 7h2v1h-2zM22 7h1v1h-1zM25 7h1v1h-1zM28 7h1v1h-1zM0 8h1v1h-1zM3 8h7v1h-7zM12 8h4v1h-4zM26 8h2v1h-2zM29 8h1v1h-1zM32 8h1v1h-1zM34 8h3v1h-3zM0 9h3v1h-3zM5 9h1v1h-1zM8 9h3v1h-3zM12 9h3v1h-3zM16 9h1v1h-1zM18 9h1v1h-1zM22 9h2v1h-2zM26 9h2v1h-2zM31 9h3v1h-3zM35 9h1v1h-1zM1 10h4v1h-4zM6 10h5v1h-5zM15 10h6v1h-6zM23 10h1v1h-1zM26 10h2v1h-2zM31 10h1v1h-1zM36 10h1v1h-1zM3 11h3v1h-3zM8 11h1v1h-1zM10 11h1v1h-1zM14 11h1v1h-1zM16 11h2v1h-2zM19 11h2v1h-2zM23 11h1v1h-1zM26 11h2v1h-2zM29 11h1v1h-1zM31 11h2v1h-2zM34 11h3v1h-3zM1 12h3v1h-3zM5 12h3v1h-3zM9 12h8v1h-8zM20 12h1v1h-1zM22 12h3v1h-3zM28 12h1v1h-1zM30 12h2v1h-2zM36 12h1v1h-1zM3 13h1v1h-1zM8 13h1v1h-1zM11 13h1v1h-1zM13 13h1v1h-1zM15 13h2v1h-2zM18 13h1v1h-1zM20 13h2v1h-2zM23 13h1v1h-1zM25 13h4v1h-4zM32 13h2v1h-2zM0 14h2v1h-2zM5 14h4v1h-4zM14 14h2v1h-2zM18 14h3v1h-3zM27 14h2v1h-2zM32 14h3v1h-3zM36 14h1v1h-1zM0 15h2v1h-2zM3 15h3v1h-3zM8 15h7v1h-7zM20 15h1v1h-1zM22 15h3v1h-3zM27 15h5v1h-5zM33 15h4v1h-4zM2 16h3v1h-3zM6 16h2v1h-2zM9 16h1v1h-1zM15 16h1v1h-1zM17 16h3v1h-3zM22 16h6v1h-6zM29 16h2v1h-2zM34 16h2v1h-2zM0 17h1v1h-1zM3 17h2v1h-2zM8 17h1v1h-1zM12 17h1v1h-1zM17 17h1v1h-1zM21 17h2v1h-2zM25 17h1v1h-1zM27 17h1v1h-1zM29 17h1v1h-1zM31 17h1v1h-1zM34 17h1v1h-1zM0 18h1v1h-1zM4 18h1v1h-1zM6 18h1v1h-1zM9 18h1v1h-1zM11 18h2v1h-2zM14 18h1v1h-1zM16 18h1v1h-1zM18 18h2v1h-2zM21 18h1v1h-1zM23 18h1v1h-1zM25 18h3v1h-3zM30 18h2v1h-2zM34 18h1v1h-1zM36 18h1v1h-1zM4 19h1v1h-1zM7 19h1v1h-1zM11 19h2v1h-2zM14 19h3v1h-3zM19 19h2v1h-2zM22 19h4v1h-4zM28 19h5v1h-5zM36 19h1v1h-1zM0 20h1v1h-1zM2 20h1v1h-1zM4 20h3v1h-3zM8 20h1v1h-1zM10 20h2v1h-2zM17 20h1v1h-1zM19 20h2v1h-2zM23 20h2v1h-2zM27 20h1v1h-1zM29 20h4v1h-4zM2 21h3v1h-3zM9 21h1v1h-1zM12 21h1v1h-1zM14 21h2v1h-2zM17 21h3v1h-3zM23 21h1v1h-1zM25 21h3v1h-3zM29 21h1v1h-1zM32 21h1v1h-1zM34 21h1v1h-1zM0 22h4v1h-4zM6 22h1v1h-1zM8 22h5v1h-5zM14 22h2v1h-2zM20 22h1v1h-1zM22 22h2v1h-2zM27 22h2v1h-2zM31 22h1v1h-1zM33 22h1v1h-1zM36 22h1v1h-1zM3 23h1v1h-1zM10 23h1v1h-1zM12 23h5v1h-5zM18 23h2v1h-2zM24 23h1v1h-1zM26 23h2v1h-2zM30 23h5v1h-5zM1 24h6v1h-6zM9 24h1v1h-1zM11 24h1v1h-1zM13 24h1v1h-1zM15 24h1v1h-1zM17 24h1v1h-1zM19 24h2v1h-2zM22 24h3v1h-3zM28 24h1v1h-1zM30 24h1v1h-1zM35 24h2v1h-2zM0 25h2v1h-2zM3 25h3v1h-3zM7 25h1v1h-1zM9 25h2v1h-2zM13 25h2v1h-2zM18 25h2v1h-2zM23 25h1v1h-1zM26 25h3v1h-3zM32 25h2v1h-2zM0 26h4v1h-4zM5 26h2v1h-2zM8 26h1v1h-1zM13 26h1v1h-1zM15 26h1v1h-1zM17 26h2v1h-2zM22 26h1v1h-1zM24 26h1v1h-1zM26 26h2v1h-2zM29 26h2v1h-2zM34 26h3v1h-3zM0 27h1v1h-1zM2 27h4v1h-4zM7 27h2v1h-2zM12 27h3v1h-3zM16 27h1v1h-1zM19 27h1v1h-1zM23 27h2v1h-2zM27 27h1v1h-1zM30 27h2v1h-2zM33 27h3v1h-3zM0 28h1v1h-1zM2 28h1v1h-1zM4 28h1v1h-1zM6 28h1v1h-1zM11 28h1v1h-1zM14 28h2v1h-2zM19 28h1v1h-1zM22 28h4v1h-4zM27 28h6v1h-6zM34 28h1v1h-1zM36 28h1v1h-1zM8 29h1v1h-1zM11 29h1v1h-1zM13 29h1v1h-1zM15 29h1v1h-1zM17 29h5v1h-5zM25 29h2v1h-2zM28 29h1v1h-1zM32 29h1v1h-1zM34 29h2v1h-2zM0 30h7v1h-7zM8 30h1v1h-1zM11 30h5v1h-5zM17 30h3v1h-3zM23 30h1v1h-1zM25 30h1v1h-1zM28 30h1v1h-1zM30 30h1v1h-1zM32 30h1v1h-1zM36 30h1v1h-1zM0 31h1v1h-1zM6 31h1v1h-1zM8 31h6v1h-6zM16 31h1v1h-1zM22 31h1v1h-1zM25 31h1v1h-1zM27 31h2v1h-2zM32 31h1v1h-1zM35 31h1v1h-1zM0 32h1v1h-1zM2 32h3v1h-3zM6 32h1v1h-1zM8 32h2v1h-2zM11 32h2v1h-2zM14 32h1v1h-1zM16 32h1v1h-1zM18 32h1v1h-1zM21 32h2v1h-2zM26 32h7v1h-7zM36 32h1v1h-1zM0 33h1v1h-1zM2 33h3v1h-3zM6 33h1v1h-1zM8 33h2v1h-2zM13 33h1v1h-1zM20 33h1v1h-1zM22 33h2v1h-2zM26 33h2v1h-2zM29 33h2v1h-2zM36 33h1v1h-1zM0 34h1v1h-1zM2 34h3v1h-3zM6 34h1v1h-1zM17 34h2v1h-2zM20 34h4v1h-4zM25 34h3v1h-3zM29 34h1v1h-1zM32 34h2v1h-2zM36 34h1v1h-1zM0 35h1v1h-1zM6 35h1v1h-1zM9 35h2v1h-2zM12 35h1v1h-1zM14 35h2v1h-2zM17 35h1v1h-1zM22 35h3v1h-3zM26 35h1v1h-1zM29 35h2v1h-2zM32 35h1v1h-1zM34 35h3v1h-3zM0 36h7v1h-7zM8 36h1v1h-1zM12 36h3v1h-3zM16 36h1v1h-1zM18 36h3v1h-3zM23 36h1v1h-1zM28 36h1v1h-1zM30 36h2v1h-2zM33 36h1v1h-1zM36 36h1v1h-1z"
    },
    "Mulmul": {
      "line": "28% Repeat Purchase Rate with Agentic Marketing",
      "url": "https://netcore.ai/success-story/mulmul-676-whatsapp-revenue-agentic-marketing/",
      "n": 37,
      "d": "M0 0h7v1h-7zM8 0h1v1h-1zM10 0h2v1h-2zM13 0h1v1h-1zM15 0h1v1h-1zM18 0h1v1h-1zM21 0h2v1h-2zM30 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM11 1h1v1h-1zM14 1h2v1h-2zM19 1h1v1h-1zM21 1h1v1h-1zM30 1h1v1h-1zM36 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h3v1h-3zM12 2h3v1h-3zM16 2h1v1h-1zM19 2h1v1h-1zM21 2h1v1h-1zM24 2h2v1h-2zM30 2h1v1h-1zM32 2h3v1h-3zM36 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM11 3h1v1h-1zM14 3h4v1h-4zM19 3h3v1h-3zM23 3h1v1h-1zM25 3h1v1h-1zM27 3h2v1h-2zM30 3h1v1h-1zM32 3h3v1h-3zM36 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h2v1h-2zM13 4h1v1h-1zM15 4h2v1h-2zM19 4h1v1h-1zM21 4h2v1h-2zM26 4h1v1h-1zM30 4h1v1h-1zM32 4h3v1h-3zM36 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM10 5h6v1h-6zM20 5h4v1h-4zM26 5h1v1h-1zM30 5h1v1h-1zM36 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM30 6h7v1h-7zM10 7h2v1h-2zM18 7h1v1h-1zM22 7h1v1h-1zM25 7h1v1h-1zM28 7h1v1h-1zM0 8h1v1h-1zM3 8h6v1h-6zM10 8h1v1h-1zM17 8h1v1h-1zM22 8h1v1h-1zM24 8h1v1h-1zM26 8h4v1h-4zM32 8h1v1h-1zM34 8h3v1h-3zM1 9h3v1h-3zM7 9h1v1h-1zM9 9h2v1h-2zM12 9h2v1h-2zM16 9h1v1h-1zM18 9h2v1h-2zM22 9h2v1h-2zM26 9h2v1h-2zM29 9h1v1h-1zM31 9h5v1h-5zM1 10h2v1h-2zM4 10h3v1h-3zM9 10h2v1h-2zM12 10h2v1h-2zM15 10h3v1h-3zM20 10h1v1h-1zM23 10h2v1h-2zM26 10h3v1h-3zM32 10h1v1h-1zM34 10h1v1h-1zM36 10h1v1h-1zM0 11h2v1h-2zM5 11h1v1h-1zM7 11h1v1h-1zM10 11h1v1h-1zM13 11h2v1h-2zM16 11h2v1h-2zM20 11h1v1h-1zM23 11h1v1h-1zM26 11h1v1h-1zM29 11h1v1h-1zM33 11h4v1h-4zM1 12h1v1h-1zM3 12h2v1h-2zM6 12h4v1h-4zM13 12h3v1h-3zM19 12h2v1h-2zM22 12h3v1h-3zM27 12h2v1h-2zM30 12h2v1h-2zM33 12h1v1h-1zM36 12h1v1h-1zM1 13h1v1h-1zM4 13h1v1h-1zM10 13h1v1h-1zM13 13h3v1h-3zM18 13h1v1h-1zM20 13h2v1h-2zM23 13h1v1h-1zM25 13h4v1h-4zM32 13h2v1h-2zM35 13h1v1h-1zM0 14h1v1h-1zM3 14h2v1h-2zM6 14h4v1h-4zM11 14h2v1h-2zM15 14h3v1h-3zM19 14h3v1h-3zM25 14h4v1h-4zM30 14h1v1h-1zM32 14h5v1h-5zM0 15h1v1h-1zM2 15h1v1h-1zM5 15h1v1h-1zM8 15h1v1h-1zM10 15h1v1h-1zM12 15h2v1h-2zM15 15h1v1h-1zM20 15h1v1h-1zM23 15h2v1h-2zM27 15h2v1h-2zM30 15h2v1h-2zM33 15h4v1h-4zM2 16h1v1h-1zM4 16h3v1h-3zM8 16h3v1h-3zM12 16h4v1h-4zM18 16h2v1h-2zM22 16h2v1h-2zM25 16h3v1h-3zM29 16h3v1h-3zM34 16h1v1h-1zM2 17h4v1h-4zM7 17h3v1h-3zM14 17h1v1h-1zM18 17h5v1h-5zM25 17h1v1h-1zM27 17h1v1h-1zM29 17h1v1h-1zM31 17h1v1h-1zM4 18h3v1h-3zM9 18h1v1h-1zM12 18h1v1h-1zM16 18h2v1h-2zM19 18h1v1h-1zM21 18h1v1h-1zM23 18h6v1h-6zM30 18h1v1h-1zM32 18h3v1h-3zM36 18h1v1h-1zM1 19h4v1h-4zM9 19h1v1h-1zM11 19h1v1h-1zM14 19h3v1h-3zM18 19h2v1h-2zM22 19h2v1h-2zM25 19h1v1h-1zM27 19h7v1h-7zM36 19h1v1h-1zM0 20h1v1h-1zM2 20h3v1h-3zM6 20h4v1h-4zM12 20h1v1h-1zM14 20h1v1h-1zM17 20h1v1h-1zM19 20h2v1h-2zM23 20h2v1h-2zM27 20h1v1h-1zM29 20h5v1h-5zM0 21h2v1h-2zM9 21h1v1h-1zM11 21h1v1h-1zM14 21h6v1h-6zM21 21h1v1h-1zM23 21h1v1h-1zM25 21h3v1h-3zM29 21h1v1h-1zM32 21h1v1h-1zM34 21h1v1h-1zM0 22h2v1h-2zM3 22h1v1h-1zM6 22h1v1h-1zM8 22h2v1h-2zM11 22h3v1h-3zM15 22h2v1h-2zM20 22h4v1h-4zM27 22h2v1h-2zM31 22h1v1h-1zM33 22h1v1h-1zM35 22h2v1h-2zM0 23h1v1h-1zM4 23h1v1h-1zM7 23h2v1h-2zM13 23h2v1h-2zM17 23h1v1h-1zM19 23h1v1h-1zM24 23h1v1h-1zM26 23h2v1h-2zM30 23h6v1h-6zM3 24h1v1h-1zM6 24h3v1h-3zM12 24h1v1h-1zM14 24h1v1h-1zM17 24h4v1h-4zM23 24h2v1h-2zM30 24h2v1h-2zM36 24h1v1h-1zM0 25h1v1h-1zM2 25h1v1h-1zM5 25h1v1h-1zM7 25h1v1h-1zM9 25h4v1h-4zM17 25h2v1h-2zM23 25h1v1h-1zM26 25h4v1h-4zM32 25h1v1h-1zM0 26h2v1h-2zM3 26h5v1h-5zM10 26h1v1h-1zM13 26h1v1h-1zM15 26h1v1h-1zM19 26h2v1h-2zM22 26h1v1h-1zM26 26h2v1h-2zM29 26h2v1h-2zM32 26h1v1h-1zM34 26h3v1h-3zM0 27h1v1h-1zM2 27h1v1h-1zM7 27h1v1h-1zM9 27h2v1h-2zM12 27h1v1h-1zM16 27h1v1h-1zM19 27h2v1h-2zM30 27h1v1h-1zM32 27h4v1h-4zM0 28h1v1h-1zM3 28h2v1h-2zM6 28h1v1h-1zM8 28h3v1h-3zM13 28h3v1h-3zM19 28h1v1h-1zM22 28h4v1h-4zM27 28h6v1h-6zM34 28h1v1h-1zM8 29h3v1h-3zM15 29h3v1h-3zM19 29h2v1h-2zM26 29h1v1h-1zM28 29h1v1h-1zM32 29h1v1h-1zM34 29h1v1h-1zM0 30h7v1h-7zM8 30h4v1h-4zM15 30h5v1h-5zM21 30h3v1h-3zM25 30h2v1h-2zM28 30h1v1h-1zM30 30h1v1h-1zM32 30h1v1h-1zM35 30h2v1h-2zM0 31h1v1h-1zM6 31h1v1h-1zM8 31h2v1h-2zM11 31h4v1h-4zM16 31h1v1h-1zM18 31h1v1h-1zM22 31h1v1h-1zM25 31h1v1h-1zM27 31h2v1h-2zM32 31h1v1h-1zM35 31h1v1h-1zM0 32h1v1h-1zM2 32h3v1h-3zM6 32h1v1h-1zM8 32h2v1h-2zM11 32h1v1h-1zM13 32h1v1h-1zM16 32h1v1h-1zM18 32h1v1h-1zM24 32h1v1h-1zM26 32h7v1h-7zM35 32h2v1h-2zM0 33h1v1h-1zM2 33h3v1h-3zM6 33h1v1h-1zM8 33h5v1h-5zM14 33h1v1h-1zM18 33h2v1h-2zM23 33h1v1h-1zM26 33h2v1h-2zM29 33h2v1h-2zM33 33h2v1h-2zM36 33h1v1h-1zM0 34h1v1h-1zM2 34h3v1h-3zM6 34h1v1h-1zM9 34h2v1h-2zM12 34h1v1h-1zM14 34h1v1h-1zM17 34h1v1h-1zM20 34h4v1h-4zM25 34h3v1h-3zM29 34h1v1h-1zM32 34h2v1h-2zM36 34h1v1h-1zM0 35h1v1h-1zM6 35h1v1h-1zM12 35h2v1h-2zM15 35h1v1h-1zM17 35h1v1h-1zM19 35h1v1h-1zM22 35h1v1h-1zM26 35h1v1h-1zM29 35h2v1h-2zM32 35h5v1h-5zM0 36h7v1h-7zM8 36h2v1h-2zM11 36h1v1h-1zM13 36h1v1h-1zM16 36h1v1h-1zM19 36h2v1h-2zM23 36h1v1h-1zM28 36h2v1h-2zM31 36h1v1h-1zM36 36h1v1h-1z"
    },
    "Anveshan": {
      "line": "94% ↑ Conversions with Intent-Led Agentic Targeting",
      "url": "https://netcore.ai/success-story/anveshan-13x-whatsapp-roi-netcore-ai-propensity-model/",
      "n": 41,
      "d": "M0 0h7v1h-7zM8 0h3v1h-3zM12 0h1v1h-1zM18 0h3v1h-3zM23 0h1v1h-1zM28 0h5v1h-5zM34 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h2v1h-2zM11 1h3v1h-3zM15 1h3v1h-3zM21 1h3v1h-3zM26 1h1v1h-1zM28 1h1v1h-1zM30 1h1v1h-1zM32 1h1v1h-1zM34 1h1v1h-1zM40 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM14 2h1v1h-1zM18 2h1v1h-1zM21 2h3v1h-3zM25 2h2v1h-2zM29 2h1v1h-1zM31 2h2v1h-2zM34 2h1v1h-1zM36 2h3v1h-3zM40 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h3v1h-3zM12 3h3v1h-3zM18 3h1v1h-1zM20 3h3v1h-3zM24 3h1v1h-1zM32 3h1v1h-1zM34 3h1v1h-1zM36 3h3v1h-3zM40 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM9 4h5v1h-5zM17 4h3v1h-3zM21 4h1v1h-1zM27 4h2v1h-2zM31 4h1v1h-1zM34 4h1v1h-1zM36 4h3v1h-3zM40 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM10 5h1v1h-1zM12 5h2v1h-2zM16 5h1v1h-1zM18 5h2v1h-2zM21 5h1v1h-1zM29 5h3v1h-3zM34 5h1v1h-1zM40 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM30 6h1v1h-1zM32 6h1v1h-1zM34 6h7v1h-7zM8 7h3v1h-3zM13 7h6v1h-6zM22 7h2v1h-2zM26 7h1v1h-1zM29 7h1v1h-1zM31 7h1v1h-1zM0 8h1v1h-1zM2 8h2v1h-2zM5 8h3v1h-3zM9 8h3v1h-3zM13 8h7v1h-7zM21 8h1v1h-1zM23 8h1v1h-1zM26 8h1v1h-1zM29 8h2v1h-2zM34 8h1v1h-1zM37 8h1v1h-1zM39 8h2v1h-2zM0 9h5v1h-5zM7 9h2v1h-2zM14 9h1v1h-1zM16 9h1v1h-1zM19 9h2v1h-2zM22 9h4v1h-4zM28 9h1v1h-1zM30 9h5v1h-5zM36 9h1v1h-1zM38 9h3v1h-3zM0 10h1v1h-1zM3 10h1v1h-1zM6 10h1v1h-1zM8 10h1v1h-1zM10 10h1v1h-1zM12 10h1v1h-1zM14 10h3v1h-3zM22 10h4v1h-4zM28 10h1v1h-1zM30 10h1v1h-1zM33 10h1v1h-1zM38 10h2v1h-2zM4 11h1v1h-1zM8 11h3v1h-3zM14 11h2v1h-2zM18 11h1v1h-1zM25 11h1v1h-1zM27 11h1v1h-1zM32 11h3v1h-3zM36 11h1v1h-1zM39 11h2v1h-2zM2 12h8v1h-8zM11 12h3v1h-3zM15 12h3v1h-3zM22 12h2v1h-2zM25 12h1v1h-1zM29 12h1v1h-1zM31 12h1v1h-1zM35 12h1v1h-1zM37 12h2v1h-2zM40 12h1v1h-1zM0 13h1v1h-1zM2 13h1v1h-1zM10 13h1v1h-1zM12 13h1v1h-1zM14 13h2v1h-2zM21 13h3v1h-3zM26 13h1v1h-1zM28 13h2v1h-2zM32 13h1v1h-1zM34 13h1v1h-1zM38 13h1v1h-1zM40 13h1v1h-1zM0 14h1v1h-1zM4 14h1v1h-1zM6 14h1v1h-1zM9 14h1v1h-1zM12 14h2v1h-2zM15 14h1v1h-1zM21 14h1v1h-1zM24 14h2v1h-2zM27 14h3v1h-3zM31 14h1v1h-1zM34 14h1v1h-1zM36 14h1v1h-1zM38 14h1v1h-1zM40 14h1v1h-1zM1 15h3v1h-3zM8 15h1v1h-1zM14 15h3v1h-3zM19 15h4v1h-4zM24 15h1v1h-1zM26 15h1v1h-1zM28 15h1v1h-1zM34 15h1v1h-1zM36 15h2v1h-2zM39 15h1v1h-1zM4 16h1v1h-1zM6 16h7v1h-7zM14 16h1v1h-1zM18 16h2v1h-2zM21 16h5v1h-5zM27 16h1v1h-1zM30 16h1v1h-1zM36 16h2v1h-2zM1 17h2v1h-2zM5 17h1v1h-1zM10 17h1v1h-1zM12 17h2v1h-2zM15 17h1v1h-1zM17 17h2v1h-2zM20 17h1v1h-1zM23 17h2v1h-2zM27 17h2v1h-2zM32 17h2v1h-2zM35 17h1v1h-1zM38 17h2v1h-2zM0 18h2v1h-2zM3 18h1v1h-1zM6 18h1v1h-1zM9 18h2v1h-2zM12 18h1v1h-1zM17 18h1v1h-1zM21 18h1v1h-1zM24 18h5v1h-5zM30 18h1v1h-1zM32 18h3v1h-3zM36 18h2v1h-2zM0 19h1v1h-1zM3 19h3v1h-3zM7 19h3v1h-3zM15 19h1v1h-1zM19 19h1v1h-1zM22 19h2v1h-2zM25 19h2v1h-2zM28 19h3v1h-3zM33 19h1v1h-1zM35 19h1v1h-1zM37 19h3v1h-3zM1 20h2v1h-2zM4 20h3v1h-3zM9 20h2v1h-2zM15 20h1v1h-1zM18 20h1v1h-1zM20 20h1v1h-1zM22 20h1v1h-1zM24 20h3v1h-3zM28 20h1v1h-1zM31 20h1v1h-1zM34 20h1v1h-1zM36 20h1v1h-1zM38 20h2v1h-2zM0 21h4v1h-4zM10 21h2v1h-2zM13 21h4v1h-4zM18 21h6v1h-6zM28 21h1v1h-1zM31 21h10v1h-10zM1 22h1v1h-1zM3 22h8v1h-8zM13 22h1v1h-1zM15 22h2v1h-2zM21 22h1v1h-1zM23 22h2v1h-2zM29 22h2v1h-2zM33 22h3v1h-3zM37 22h3v1h-3zM1 23h2v1h-2zM4 23h2v1h-2zM10 23h1v1h-1zM15 23h2v1h-2zM18 23h2v1h-2zM23 23h1v1h-1zM25 23h2v1h-2zM28 23h1v1h-1zM30 23h2v1h-2zM33 23h3v1h-3zM39 23h1v1h-1zM4 24h1v1h-1zM6 24h3v1h-3zM12 24h1v1h-1zM14 24h2v1h-2zM17 24h1v1h-1zM22 24h1v1h-1zM24 24h2v1h-2zM29 24h1v1h-1zM38 24h1v1h-1zM1 25h1v1h-1zM3 25h3v1h-3zM8 25h1v1h-1zM11 25h2v1h-2zM17 25h3v1h-3zM22 25h1v1h-1zM24 25h9v1h-9zM34 25h1v1h-1zM37 25h2v1h-2zM40 25h1v1h-1zM1 26h3v1h-3zM5 26h2v1h-2zM9 26h3v1h-3zM13 26h2v1h-2zM16 26h1v1h-1zM19 26h3v1h-3zM24 26h3v1h-3zM30 26h4v1h-4zM35 26h3v1h-3zM40 26h1v1h-1zM0 27h3v1h-3zM4 27h1v1h-1zM10 27h3v1h-3zM14 27h1v1h-1zM19 27h1v1h-1zM21 27h2v1h-2zM24 27h1v1h-1zM26 27h1v1h-1zM31 27h3v1h-3zM35 27h1v1h-1zM37 27h1v1h-1zM0 28h1v1h-1zM6 28h2v1h-2zM15 28h1v1h-1zM18 28h1v1h-1zM21 28h3v1h-3zM25 28h2v1h-2zM28 28h1v1h-1zM30 28h3v1h-3zM36 28h2v1h-2zM40 28h1v1h-1zM4 29h1v1h-1zM7 29h1v1h-1zM11 29h2v1h-2zM14 29h3v1h-3zM18 29h2v1h-2zM22 29h1v1h-1zM24 29h1v1h-1zM26 29h1v1h-1zM28 29h4v1h-4zM35 29h1v1h-1zM39 29h1v1h-1zM0 30h1v1h-1zM2 30h2v1h-2zM5 30h2v1h-2zM10 30h2v1h-2zM13 30h1v1h-1zM15 30h1v1h-1zM20 30h2v1h-2zM23 30h2v1h-2zM27 30h3v1h-3zM32 30h4v1h-4zM3 31h2v1h-2zM9 31h2v1h-2zM12 31h1v1h-1zM16 31h2v1h-2zM20 31h1v1h-1zM24 31h1v1h-1zM29 31h3v1h-3zM34 31h1v1h-1zM36 31h3v1h-3zM1 32h1v1h-1zM3 32h1v1h-1zM6 32h2v1h-2zM10 32h2v1h-2zM13 32h1v1h-1zM16 32h4v1h-4zM21 32h1v1h-1zM23 32h2v1h-2zM28 32h3v1h-3zM32 32h7v1h-7zM40 32h1v1h-1zM8 33h4v1h-4zM13 33h4v1h-4zM19 33h2v1h-2zM23 33h1v1h-1zM28 33h2v1h-2zM32 33h1v1h-1zM36 33h1v1h-1zM39 33h2v1h-2zM0 34h7v1h-7zM8 34h1v1h-1zM10 34h3v1h-3zM15 34h3v1h-3zM21 34h4v1h-4zM26 34h1v1h-1zM30 34h3v1h-3zM34 34h1v1h-1zM36 34h1v1h-1zM0 35h1v1h-1zM6 35h1v1h-1zM8 35h2v1h-2zM11 35h2v1h-2zM14 35h2v1h-2zM18 35h5v1h-5zM24 35h6v1h-6zM32 35h1v1h-1zM36 35h1v1h-1zM39 35h1v1h-1zM0 36h1v1h-1zM2 36h3v1h-3zM6 36h1v1h-1zM9 36h1v1h-1zM11 36h1v1h-1zM15 36h2v1h-2zM18 36h1v1h-1zM21 36h3v1h-3zM27 36h1v1h-1zM32 36h5v1h-5zM38 36h2v1h-2zM0 37h1v1h-1zM2 37h3v1h-3zM6 37h1v1h-1zM8 37h1v1h-1zM12 37h1v1h-1zM14 37h1v1h-1zM18 37h2v1h-2zM25 37h1v1h-1zM27 37h3v1h-3zM36 37h2v1h-2zM39 37h1v1h-1zM0 38h1v1h-1zM2 38h3v1h-3zM6 38h1v1h-1zM8 38h1v1h-1zM10 38h3v1h-3zM14 38h1v1h-1zM16 38h1v1h-1zM19 38h1v1h-1zM24 38h1v1h-1zM26 38h1v1h-1zM30 38h1v1h-1zM32 38h1v1h-1zM35 38h1v1h-1zM38 38h3v1h-3zM0 39h1v1h-1zM6 39h1v1h-1zM9 39h1v1h-1zM11 39h4v1h-4zM16 39h2v1h-2zM21 39h2v1h-2zM24 39h1v1h-1zM30 39h1v1h-1zM32 39h1v1h-1zM34 39h1v1h-1zM36 39h2v1h-2zM39 39h1v1h-1zM0 40h7v1h-7zM8 40h1v1h-1zM10 40h4v1h-4zM15 40h3v1h-3zM19 40h5v1h-5zM25 40h1v1h-1zM30 40h5v1h-5zM39 40h1v1h-1z"
    },
    "BigHaat": {
      "line": "98% ↑ Orders from Existing Farmer Base",
      "url": "https://netcore.ai/success-story/bighaat-25-roi-retention-customer-engagement/",
      "n": 37,
      "d": "M0 0h7v1h-7zM8 0h1v1h-1zM13 0h1v1h-1zM15 0h3v1h-3zM21 0h2v1h-2zM26 0h1v1h-1zM30 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h2v1h-2zM11 1h1v1h-1zM14 1h1v1h-1zM16 1h6v1h-6zM28 1h1v1h-1zM30 1h1v1h-1zM36 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h1v1h-1zM10 2h2v1h-2zM13 2h1v1h-1zM16 2h1v1h-1zM18 2h1v1h-1zM20 2h2v1h-2zM25 2h1v1h-1zM27 2h1v1h-1zM30 2h1v1h-1zM32 2h3v1h-3zM36 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM10 3h8v1h-8zM19 3h3v1h-3zM23 3h1v1h-1zM25 3h1v1h-1zM27 3h2v1h-2zM30 3h1v1h-1zM32 3h3v1h-3zM36 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h2v1h-2zM14 4h6v1h-6zM21 4h2v1h-2zM26 4h1v1h-1zM30 4h1v1h-1zM32 4h3v1h-3zM36 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM9 5h2v1h-2zM12 5h1v1h-1zM15 5h3v1h-3zM20 5h1v1h-1zM23 5h1v1h-1zM25 5h1v1h-1zM30 5h1v1h-1zM36 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM30 6h7v1h-7zM11 7h1v1h-1zM14 7h2v1h-2zM18 7h1v1h-1zM22 7h1v1h-1zM25 7h1v1h-1zM28 7h1v1h-1zM0 8h1v1h-1zM3 8h7v1h-7zM11 8h1v1h-1zM14 8h1v1h-1zM16 8h3v1h-3zM24 8h1v1h-1zM26 8h4v1h-4zM32 8h1v1h-1zM34 8h3v1h-3zM2 9h3v1h-3zM9 9h1v1h-1zM12 9h3v1h-3zM17 9h3v1h-3zM22 9h3v1h-3zM27 9h2v1h-2zM31 9h2v1h-2zM34 9h2v1h-2zM2 10h3v1h-3zM6 10h3v1h-3zM11 10h3v1h-3zM17 10h2v1h-2zM23 10h2v1h-2zM26 10h2v1h-2zM32 10h3v1h-3zM36 10h1v1h-1zM0 11h1v1h-1zM2 11h1v1h-1zM8 11h2v1h-2zM12 11h4v1h-4zM17 11h1v1h-1zM20 11h1v1h-1zM24 11h1v1h-1zM26 11h2v1h-2zM29 11h1v1h-1zM31 11h1v1h-1zM33 11h4v1h-4zM0 12h1v1h-1zM6 12h2v1h-2zM19 12h2v1h-2zM22 12h3v1h-3zM28 12h1v1h-1zM30 12h2v1h-2zM33 12h1v1h-1zM36 12h1v1h-1zM2 13h2v1h-2zM5 13h1v1h-1zM7 13h1v1h-1zM9 13h1v1h-1zM15 13h1v1h-1zM17 13h2v1h-2zM20 13h2v1h-2zM23 13h1v1h-1zM25 13h4v1h-4zM32 13h2v1h-2zM35 13h1v1h-1zM0 14h2v1h-2zM6 14h3v1h-3zM10 14h1v1h-1zM12 14h1v1h-1zM15 14h1v1h-1zM17 14h1v1h-1zM19 14h2v1h-2zM25 14h6v1h-6zM32 14h5v1h-5zM1 15h1v1h-1zM4 15h2v1h-2zM8 15h1v1h-1zM10 15h2v1h-2zM13 15h1v1h-1zM20 15h1v1h-1zM22 15h3v1h-3zM27 15h5v1h-5zM33 15h4v1h-4zM1 16h1v1h-1zM5 16h2v1h-2zM11 16h4v1h-4zM16 16h5v1h-5zM22 16h2v1h-2zM25 16h1v1h-1zM27 16h1v1h-1zM30 16h2v1h-2zM34 16h1v1h-1zM0 17h2v1h-2zM3 17h1v1h-1zM8 17h2v1h-2zM12 17h1v1h-1zM14 17h1v1h-1zM16 17h7v1h-7zM25 17h3v1h-3zM29 17h1v1h-1zM31 17h1v1h-1zM33 17h1v1h-1zM2 18h1v1h-1zM4 18h1v1h-1zM6 18h1v1h-1zM9 18h2v1h-2zM12 18h2v1h-2zM15 18h1v1h-1zM19 18h1v1h-1zM21 18h1v1h-1zM23 18h1v1h-1zM25 18h3v1h-3zM30 18h1v1h-1zM32 18h1v1h-1zM36 18h1v1h-1zM0 19h6v1h-6zM8 19h1v1h-1zM10 19h2v1h-2zM19 19h1v1h-1zM22 19h1v1h-1zM25 19h1v1h-1zM27 19h4v1h-4zM32 19h2v1h-2zM36 19h1v1h-1zM1 20h2v1h-2zM4 20h4v1h-4zM12 20h1v1h-1zM15 20h3v1h-3zM20 20h1v1h-1zM24 20h1v1h-1zM29 20h5v1h-5zM1 21h2v1h-2zM5 21h1v1h-1zM10 21h1v1h-1zM12 21h1v1h-1zM14 21h3v1h-3zM18 21h2v1h-2zM23 21h1v1h-1zM26 21h2v1h-2zM29 21h1v1h-1zM32 21h1v1h-1zM34 21h1v1h-1zM0 22h1v1h-1zM2 22h1v1h-1zM5 22h3v1h-3zM9 22h2v1h-2zM15 22h1v1h-1zM17 22h2v1h-2zM20 22h1v1h-1zM22 22h2v1h-2zM25 22h4v1h-4zM31 22h1v1h-1zM33 22h1v1h-1zM35 22h2v1h-2zM0 23h2v1h-2zM3 23h1v1h-1zM5 23h1v1h-1zM7 23h4v1h-4zM12 23h1v1h-1zM17 23h3v1h-3zM24 23h1v1h-1zM26 23h2v1h-2zM29 23h1v1h-1zM31 23h4v1h-4zM36 23h1v1h-1zM1 24h1v1h-1zM3 24h1v1h-1zM6 24h1v1h-1zM9 24h3v1h-3zM13 24h1v1h-1zM15 24h6v1h-6zM23 24h2v1h-2zM28 24h1v1h-1zM30 24h2v1h-2zM36 24h1v1h-1zM0 25h1v1h-1zM2 25h2v1h-2zM7 25h1v1h-1zM10 25h1v1h-1zM12 25h1v1h-1zM14 25h1v1h-1zM16 25h3v1h-3zM23 25h1v1h-1zM27 25h3v1h-3zM32 25h1v1h-1zM34 25h1v1h-1zM0 26h2v1h-2zM3 26h1v1h-1zM5 26h3v1h-3zM9 26h1v1h-1zM11 26h3v1h-3zM16 26h1v1h-1zM18 26h3v1h-3zM22 26h1v1h-1zM26 26h2v1h-2zM29 26h4v1h-4zM34 26h3v1h-3zM0 27h1v1h-1zM2 27h1v1h-1zM4 27h2v1h-2zM8 27h1v1h-1zM11 27h1v1h-1zM13 27h3v1h-3zM18 27h1v1h-1zM28 27h1v1h-1zM30 27h1v1h-1zM32 27h1v1h-1zM34 27h1v1h-1zM0 28h1v1h-1zM3 28h4v1h-4zM9 28h1v1h-1zM14 28h1v1h-1zM16 28h1v1h-1zM22 28h1v1h-1zM24 28h2v1h-2zM28 28h7v1h-7zM8 29h1v1h-1zM10 29h1v1h-1zM13 29h3v1h-3zM18 29h3v1h-3zM26 29h1v1h-1zM28 29h1v1h-1zM32 29h1v1h-1zM34 29h1v1h-1zM0 30h7v1h-7zM8 30h1v1h-1zM12 30h1v1h-1zM14 30h2v1h-2zM19 30h1v1h-1zM21 30h3v1h-3zM25 30h1v1h-1zM28 30h1v1h-1zM30 30h1v1h-1zM32 30h1v1h-1zM35 30h2v1h-2zM0 31h1v1h-1zM6 31h1v1h-1zM8 31h1v1h-1zM13 31h2v1h-2zM17 31h2v1h-2zM22 31h1v1h-1zM25 31h4v1h-4zM32 31h1v1h-1zM0 32h1v1h-1zM2 32h3v1h-3zM6 32h1v1h-1zM8 32h1v1h-1zM12 32h1v1h-1zM15 32h1v1h-1zM24 32h1v1h-1zM26 32h7v1h-7zM36 32h1v1h-1zM0 33h1v1h-1zM2 33h3v1h-3zM6 33h1v1h-1zM8 33h1v1h-1zM10 33h1v1h-1zM12 33h3v1h-3zM16 33h1v1h-1zM18 33h2v1h-2zM22 33h2v1h-2zM26 33h2v1h-2zM29 33h2v1h-2zM33 33h1v1h-1zM36 33h1v1h-1zM0 34h1v1h-1zM2 34h3v1h-3zM6 34h1v1h-1zM10 34h1v1h-1zM13 34h1v1h-1zM15 34h4v1h-4zM21 34h3v1h-3zM25 34h3v1h-3zM29 34h1v1h-1zM32 34h1v1h-1zM36 34h1v1h-1zM0 35h1v1h-1zM6 35h1v1h-1zM10 35h2v1h-2zM16 35h2v1h-2zM19 35h2v1h-2zM22 35h1v1h-1zM26 35h1v1h-1zM30 35h1v1h-1zM32 35h5v1h-5zM0 36h7v1h-7zM8 36h1v1h-1zM10 36h2v1h-2zM15 36h2v1h-2zM19 36h2v1h-2zM28 36h4v1h-4zM36 36h1v1h-1z"
    },
    "IGP": {
      "line": "95% Less Analysis Time with Insight Agent",
      "url": "https://netcore.ai/success-story/igp-3x-email-ctr-uplift-netcore-insight-agent/",
      "n": 37,
      "d": "M0 0h7v1h-7zM11 0h3v1h-3zM16 0h8v1h-8zM25 0h1v1h-1zM28 0h1v1h-1zM30 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM9 1h1v1h-1zM12 1h1v1h-1zM15 1h1v1h-1zM18 1h1v1h-1zM20 1h1v1h-1zM24 1h4v1h-4zM30 1h1v1h-1zM36 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h1v1h-1zM10 2h2v1h-2zM14 2h1v1h-1zM20 2h4v1h-4zM28 2h1v1h-1zM30 2h1v1h-1zM32 2h3v1h-3zM36 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h1v1h-1zM12 3h2v1h-2zM16 3h2v1h-2zM22 3h2v1h-2zM25 3h2v1h-2zM30 3h1v1h-1zM32 3h3v1h-3zM36 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h2v1h-2zM11 4h2v1h-2zM16 4h8v1h-8zM30 4h1v1h-1zM32 4h3v1h-3zM36 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h1v1h-1zM13 5h1v1h-1zM15 5h1v1h-1zM17 5h1v1h-1zM20 5h1v1h-1zM26 5h3v1h-3zM30 5h1v1h-1zM36 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM30 6h7v1h-7zM8 7h3v1h-3zM13 7h1v1h-1zM15 7h1v1h-1zM18 7h5v1h-5zM26 7h3v1h-3zM0 8h1v1h-1zM2 8h5v1h-5zM10 8h1v1h-1zM12 8h3v1h-3zM16 8h2v1h-2zM19 8h1v1h-1zM22 8h1v1h-1zM24 8h4v1h-4zM30 8h5v1h-5zM1 9h2v1h-2zM5 9h1v1h-1zM7 9h2v1h-2zM12 9h2v1h-2zM15 9h1v1h-1zM19 9h3v1h-3zM23 9h1v1h-1zM26 9h1v1h-1zM28 9h2v1h-2zM31 9h1v1h-1zM34 9h2v1h-2zM0 10h1v1h-1zM3 10h2v1h-2zM6 10h2v1h-2zM11 10h1v1h-1zM13 10h5v1h-5zM20 10h1v1h-1zM27 10h3v1h-3zM31 10h1v1h-1zM33 10h1v1h-1zM35 10h2v1h-2zM0 11h3v1h-3zM4 11h1v1h-1zM7 11h1v1h-1zM10 11h1v1h-1zM12 11h1v1h-1zM14 11h2v1h-2zM19 11h4v1h-4zM24 11h1v1h-1zM26 11h3v1h-3zM31 11h1v1h-1zM33 11h1v1h-1zM36 11h1v1h-1zM4 12h1v1h-1zM6 12h3v1h-3zM12 12h4v1h-4zM17 12h1v1h-1zM23 12h4v1h-4zM29 12h2v1h-2zM32 12h5v1h-5zM0 13h1v1h-1zM2 13h1v1h-1zM5 13h1v1h-1zM11 13h1v1h-1zM13 13h2v1h-2zM16 13h1v1h-1zM19 13h1v1h-1zM23 13h1v1h-1zM28 13h1v1h-1zM31 13h1v1h-1zM4 14h1v1h-1zM6 14h1v1h-1zM8 14h2v1h-2zM13 14h4v1h-4zM20 14h2v1h-2zM26 14h2v1h-2zM30 14h4v1h-4zM35 14h2v1h-2zM1 15h4v1h-4zM10 15h2v1h-2zM15 15h2v1h-2zM18 15h1v1h-1zM21 15h4v1h-4zM30 15h3v1h-3zM35 15h2v1h-2zM0 16h3v1h-3zM4 16h1v1h-1zM6 16h3v1h-3zM11 16h1v1h-1zM14 16h2v1h-2zM17 16h3v1h-3zM22 16h1v1h-1zM24 16h4v1h-4zM29 16h4v1h-4zM34 16h1v1h-1zM0 17h3v1h-3zM4 17h1v1h-1zM8 17h2v1h-2zM12 17h2v1h-2zM15 17h2v1h-2zM18 17h3v1h-3zM23 17h1v1h-1zM25 17h1v1h-1zM31 17h1v1h-1zM34 17h2v1h-2zM4 18h4v1h-4zM9 18h2v1h-2zM13 18h1v1h-1zM18 18h1v1h-1zM20 18h3v1h-3zM27 18h1v1h-1zM29 18h3v1h-3zM35 18h2v1h-2zM3 19h2v1h-2zM7 19h1v1h-1zM9 19h1v1h-1zM13 19h2v1h-2zM16 19h1v1h-1zM18 19h1v1h-1zM21 19h2v1h-2zM26 19h7v1h-7zM36 19h1v1h-1zM1 20h1v1h-1zM4 20h5v1h-5zM11 20h3v1h-3zM17 20h2v1h-2zM20 20h1v1h-1zM22 20h4v1h-4zM27 20h4v1h-4zM32 20h3v1h-3zM2 21h2v1h-2zM5 21h1v1h-1zM9 21h2v1h-2zM13 21h2v1h-2zM16 21h8v1h-8zM28 21h2v1h-2zM33 21h1v1h-1zM1 22h2v1h-2zM4 22h1v1h-1zM6 22h1v1h-1zM10 22h8v1h-8zM22 22h1v1h-1zM25 22h1v1h-1zM27 22h3v1h-3zM31 22h3v1h-3zM35 22h2v1h-2zM3 23h2v1h-2zM7 23h2v1h-2zM10 23h1v1h-1zM13 23h4v1h-4zM19 23h1v1h-1zM21 23h4v1h-4zM26 23h1v1h-1zM28 23h1v1h-1zM30 23h3v1h-3zM35 23h2v1h-2zM1 24h2v1h-2zM4 24h3v1h-3zM10 24h3v1h-3zM14 24h1v1h-1zM16 24h1v1h-1zM18 24h1v1h-1zM22 24h1v1h-1zM24 24h3v1h-3zM28 24h3v1h-3zM32 24h1v1h-1zM34 24h1v1h-1zM36 24h1v1h-1zM0 25h1v1h-1zM2 25h4v1h-4zM7 25h1v1h-1zM9 25h1v1h-1zM11 25h1v1h-1zM13 25h1v1h-1zM15 25h1v1h-1zM17 25h5v1h-5zM23 25h3v1h-3zM28 25h1v1h-1zM33 25h1v1h-1zM0 26h1v1h-1zM3 26h1v1h-1zM5 26h2v1h-2zM8 26h1v1h-1zM10 26h1v1h-1zM12 26h1v1h-1zM15 26h2v1h-2zM20 26h1v1h-1zM25 26h3v1h-3zM29 26h2v1h-2zM32 26h1v1h-1zM34 26h3v1h-3zM0 27h1v1h-1zM2 27h1v1h-1zM4 27h1v1h-1zM7 27h2v1h-2zM10 27h3v1h-3zM15 27h1v1h-1zM20 27h3v1h-3zM26 27h1v1h-1zM28 27h1v1h-1zM30 27h1v1h-1zM35 27h1v1h-1zM0 28h1v1h-1zM4 28h7v1h-7zM12 28h1v1h-1zM14 28h2v1h-2zM17 28h4v1h-4zM22 28h1v1h-1zM24 28h9v1h-9zM34 28h2v1h-2zM8 29h1v1h-1zM10 29h2v1h-2zM13 29h2v1h-2zM19 29h2v1h-2zM22 29h2v1h-2zM25 29h4v1h-4zM32 29h2v1h-2zM0 30h7v1h-7zM11 30h2v1h-2zM15 30h1v1h-1zM18 30h1v1h-1zM20 30h2v1h-2zM25 30h2v1h-2zM28 30h1v1h-1zM30 30h1v1h-1zM32 30h1v1h-1zM34 30h3v1h-3zM0 31h1v1h-1zM6 31h1v1h-1zM8 31h1v1h-1zM10 31h1v1h-1zM13 31h3v1h-3zM18 31h4v1h-4zM26 31h1v1h-1zM28 31h1v1h-1zM32 31h2v1h-2zM35 31h2v1h-2zM0 32h1v1h-1zM2 32h3v1h-3zM6 32h1v1h-1zM8 32h6v1h-6zM18 32h2v1h-2zM22 32h1v1h-1zM24 32h9v1h-9zM34 32h2v1h-2zM0 33h1v1h-1zM2 33h3v1h-3zM6 33h1v1h-1zM8 33h1v1h-1zM11 33h3v1h-3zM15 33h2v1h-2zM18 33h2v1h-2zM21 33h3v1h-3zM26 33h1v1h-1zM28 33h3v1h-3zM32 33h1v1h-1zM36 33h1v1h-1zM0 34h1v1h-1zM2 34h3v1h-3zM6 34h1v1h-1zM8 34h1v1h-1zM11 34h4v1h-4zM17 34h2v1h-2zM21 34h2v1h-2zM24 34h2v1h-2zM27 34h1v1h-1zM33 34h1v1h-1zM35 34h2v1h-2zM0 35h1v1h-1zM6 35h1v1h-1zM11 35h2v1h-2zM14 35h1v1h-1zM16 35h1v1h-1zM20 35h2v1h-2zM23 35h2v1h-2zM26 35h3v1h-3zM32 35h1v1h-1zM36 35h1v1h-1zM0 36h7v1h-7zM8 36h1v1h-1zM10 36h3v1h-3zM14 36h1v1h-1zM16 36h2v1h-2zM22 36h1v1h-1zM25 36h2v1h-2zM29 36h2v1h-2zM32 36h1v1h-1zM34 36h3v1h-3z"
    },
    "Myntra": {
      "line": "3.8X ↑ Sessions with In-Inbox Discovery",
      "url": "https://netcore.ai/success-story/myntra-success-story/",
      "n": 33,
      "d": "M0 0h7v1h-7zM8 0h5v1h-5zM16 0h8v1h-8zM26 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h2v1h-2zM11 1h2v1h-2zM14 1h1v1h-1zM17 1h1v1h-1zM22 1h3v1h-3zM26 1h1v1h-1zM32 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM10 2h1v1h-1zM13 2h2v1h-2zM18 2h3v1h-3zM23 2h2v1h-2zM26 2h1v1h-1zM28 2h3v1h-3zM32 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h1v1h-1zM10 3h1v1h-1zM15 3h1v1h-1zM17 3h2v1h-2zM20 3h1v1h-1zM22 3h3v1h-3zM26 3h1v1h-1zM28 3h3v1h-3zM32 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM11 4h3v1h-3zM16 4h2v1h-2zM19 4h1v1h-1zM22 4h1v1h-1zM24 4h1v1h-1zM26 4h1v1h-1zM28 4h3v1h-3zM32 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM10 5h3v1h-3zM14 5h4v1h-4zM19 5h1v1h-1zM21 5h2v1h-2zM24 5h1v1h-1zM26 5h1v1h-1zM32 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h7v1h-7zM8 7h1v1h-1zM10 7h2v1h-2zM15 7h6v1h-6zM0 8h1v1h-1zM2 8h2v1h-2zM5 8h3v1h-3zM9 8h2v1h-2zM12 8h1v1h-1zM14 8h2v1h-2zM17 8h5v1h-5zM26 8h1v1h-1zM29 8h1v1h-1zM31 8h2v1h-2zM2 9h2v1h-2zM7 9h1v1h-1zM9 9h1v1h-1zM13 9h2v1h-2zM16 9h6v1h-6zM23 9h1v1h-1zM26 9h2v1h-2zM29 9h2v1h-2zM32 9h1v1h-1zM0 10h2v1h-2zM3 10h2v1h-2zM6 10h2v1h-2zM9 10h2v1h-2zM13 10h1v1h-1zM16 10h1v1h-1zM18 10h1v1h-1zM21 10h1v1h-1zM23 10h2v1h-2zM26 10h4v1h-4zM31 10h2v1h-2zM0 11h2v1h-2zM4 11h2v1h-2zM8 11h5v1h-5zM15 11h2v1h-2zM18 11h1v1h-1zM23 11h1v1h-1zM27 11h1v1h-1zM29 11h1v1h-1zM32 11h1v1h-1zM0 12h2v1h-2zM3 12h1v1h-1zM6 12h2v1h-2zM9 12h1v1h-1zM14 12h3v1h-3zM18 12h1v1h-1zM20 12h1v1h-1zM22 12h1v1h-1zM24 12h1v1h-1zM27 12h3v1h-3zM31 12h2v1h-2zM5 13h1v1h-1zM7 13h1v1h-1zM10 13h3v1h-3zM14 13h1v1h-1zM17 13h1v1h-1zM19 13h1v1h-1zM22 13h1v1h-1zM24 13h1v1h-1zM27 13h1v1h-1zM30 13h2v1h-2zM1 14h1v1h-1zM5 14h5v1h-5zM11 14h1v1h-1zM17 14h1v1h-1zM19 14h2v1h-2zM24 14h1v1h-1zM26 14h1v1h-1zM29 14h1v1h-1zM0 15h2v1h-2zM3 15h3v1h-3zM7 15h1v1h-1zM9 15h1v1h-1zM12 15h4v1h-4zM19 15h9v1h-9zM29 15h2v1h-2zM6 16h1v1h-1zM8 16h2v1h-2zM11 16h3v1h-3zM16 16h1v1h-1zM18 16h2v1h-2zM21 16h1v1h-1zM23 16h1v1h-1zM25 16h2v1h-2zM28 16h1v1h-1zM30 16h1v1h-1zM1 17h4v1h-4zM8 17h1v1h-1zM10 17h1v1h-1zM13 17h1v1h-1zM15 17h1v1h-1zM20 17h1v1h-1zM22 17h5v1h-5zM28 17h2v1h-2zM31 17h2v1h-2zM2 18h3v1h-3zM6 18h2v1h-2zM9 18h4v1h-4zM15 18h2v1h-2zM18 18h1v1h-1zM20 18h1v1h-1zM24 18h5v1h-5zM30 18h1v1h-1zM1 19h3v1h-3zM5 19h1v1h-1zM7 19h3v1h-3zM11 19h1v1h-1zM13 19h2v1h-2zM16 19h2v1h-2zM19 19h1v1h-1zM22 19h5v1h-5zM28 19h1v1h-1zM31 19h2v1h-2zM0 20h1v1h-1zM3 20h1v1h-1zM5 20h4v1h-4zM12 20h5v1h-5zM21 20h2v1h-2zM27 20h1v1h-1zM29 20h4v1h-4zM0 21h2v1h-2zM5 21h1v1h-1zM8 21h1v1h-1zM11 21h3v1h-3zM15 21h2v1h-2zM18 21h3v1h-3zM23 21h1v1h-1zM25 21h2v1h-2zM32 21h1v1h-1zM3 22h2v1h-2zM6 22h1v1h-1zM9 22h1v1h-1zM13 22h3v1h-3zM17 22h2v1h-2zM20 22h6v1h-6zM31 22h2v1h-2zM1 23h2v1h-2zM4 23h2v1h-2zM7 23h1v1h-1zM9 23h1v1h-1zM11 23h2v1h-2zM15 23h1v1h-1zM18 23h3v1h-3zM22 23h1v1h-1zM24 23h6v1h-6zM31 23h2v1h-2zM0 24h1v1h-1zM6 24h6v1h-6zM13 24h2v1h-2zM17 24h1v1h-1zM22 24h1v1h-1zM24 24h5v1h-5zM31 24h1v1h-1zM8 25h2v1h-2zM12 25h2v1h-2zM15 25h1v1h-1zM18 25h4v1h-4zM24 25h1v1h-1zM28 25h2v1h-2zM31 25h1v1h-1zM0 26h7v1h-7zM8 26h1v1h-1zM10 26h2v1h-2zM17 26h4v1h-4zM23 26h2v1h-2zM26 26h1v1h-1zM28 26h1v1h-1zM0 27h1v1h-1zM6 27h1v1h-1zM8 27h1v1h-1zM11 27h3v1h-3zM17 27h2v1h-2zM21 27h4v1h-4zM28 27h3v1h-3zM32 27h1v1h-1zM0 28h1v1h-1zM2 28h3v1h-3zM6 28h1v1h-1zM9 28h2v1h-2zM12 28h3v1h-3zM16 28h4v1h-4zM21 28h8v1h-8zM30 28h1v1h-1zM32 28h1v1h-1zM0 29h1v1h-1zM2 29h3v1h-3zM6 29h1v1h-1zM8 29h1v1h-1zM10 29h3v1h-3zM16 29h1v1h-1zM20 29h1v1h-1zM23 29h1v1h-1zM27 29h1v1h-1zM29 29h2v1h-2zM32 29h1v1h-1zM0 30h1v1h-1zM2 30h3v1h-3zM6 30h1v1h-1zM8 30h2v1h-2zM15 30h4v1h-4zM20 30h2v1h-2zM23 30h2v1h-2zM26 30h2v1h-2zM0 31h1v1h-1zM6 31h1v1h-1zM10 31h1v1h-1zM13 31h2v1h-2zM17 31h4v1h-4zM22 31h1v1h-1zM24 31h1v1h-1zM26 31h3v1h-3zM32 31h1v1h-1zM0 32h7v1h-7zM8 32h1v1h-1zM13 32h1v1h-1zM17 32h3v1h-3zM21 32h1v1h-1zM23 32h1v1h-1zM26 32h1v1h-1zM28 32h3v1h-3z"
    },
    "AJIO": {
      "line": "18% ↑ Revenue with an Interactive Valentine's Game",
      "url": "https://netcore.ai/success-story/ajio-valentines-day-amp-email-success-story/",
      "n": 37,
      "d": "M0 0h7v1h-7zM8 0h2v1h-2zM11 0h1v1h-1zM17 0h2v1h-2zM20 0h3v1h-3zM26 0h1v1h-1zM30 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM10 1h1v1h-1zM12 1h1v1h-1zM14 1h1v1h-1zM16 1h1v1h-1zM18 1h2v1h-2zM21 1h1v1h-1zM28 1h1v1h-1zM30 1h1v1h-1zM36 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h1v1h-1zM14 2h3v1h-3zM19 2h1v1h-1zM21 2h1v1h-1zM23 2h3v1h-3zM27 2h1v1h-1zM30 2h1v1h-1zM32 2h3v1h-3zM36 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM10 3h1v1h-1zM15 3h1v1h-1zM17 3h1v1h-1zM19 3h3v1h-3zM25 3h1v1h-1zM28 3h1v1h-1zM30 3h1v1h-1zM32 3h3v1h-3zM36 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h1v1h-1zM10 4h2v1h-2zM13 4h1v1h-1zM15 4h1v1h-1zM18 4h2v1h-2zM21 4h2v1h-2zM25 4h2v1h-2zM30 4h1v1h-1zM32 4h3v1h-3zM36 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM9 5h2v1h-2zM12 5h1v1h-1zM15 5h1v1h-1zM20 5h1v1h-1zM23 5h1v1h-1zM26 5h1v1h-1zM30 5h1v1h-1zM36 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM30 6h7v1h-7zM9 7h2v1h-2zM12 7h1v1h-1zM15 7h2v1h-2zM22 7h1v1h-1zM25 7h1v1h-1zM28 7h1v1h-1zM0 8h1v1h-1zM3 8h6v1h-6zM10 8h2v1h-2zM14 8h2v1h-2zM18 8h1v1h-1zM20 8h1v1h-1zM24 8h1v1h-1zM26 8h4v1h-4zM32 8h1v1h-1zM34 8h3v1h-3zM1 9h2v1h-2zM4 9h2v1h-2zM7 9h5v1h-5zM14 9h1v1h-1zM16 9h4v1h-4zM23 9h1v1h-1zM26 9h2v1h-2zM29 9h1v1h-1zM31 9h2v1h-2zM35 9h1v1h-1zM0 10h1v1h-1zM2 10h1v1h-1zM6 10h2v1h-2zM12 10h5v1h-5zM18 10h1v1h-1zM20 10h1v1h-1zM23 10h1v1h-1zM26 10h3v1h-3zM31 10h2v1h-2zM36 10h1v1h-1zM0 11h1v1h-1zM5 11h1v1h-1zM7 11h1v1h-1zM13 11h2v1h-2zM16 11h4v1h-4zM24 11h1v1h-1zM26 11h1v1h-1zM29 11h1v1h-1zM33 11h4v1h-4zM0 12h1v1h-1zM2 12h2v1h-2zM6 12h2v1h-2zM9 12h4v1h-4zM15 12h2v1h-2zM19 12h2v1h-2zM22 12h3v1h-3zM28 12h1v1h-1zM30 12h2v1h-2zM33 12h1v1h-1zM36 12h1v1h-1zM0 13h1v1h-1zM2 13h1v1h-1zM8 13h1v1h-1zM10 13h1v1h-1zM12 13h1v1h-1zM15 13h2v1h-2zM18 13h1v1h-1zM20 13h1v1h-1zM23 13h1v1h-1zM25 13h4v1h-4zM32 13h2v1h-2zM3 14h1v1h-1zM5 14h2v1h-2zM10 14h1v1h-1zM12 14h5v1h-5zM18 14h3v1h-3zM22 14h1v1h-1zM25 14h1v1h-1zM27 14h2v1h-2zM32 14h5v1h-5zM3 15h2v1h-2zM9 15h2v1h-2zM13 15h1v1h-1zM18 15h1v1h-1zM20 15h1v1h-1zM23 15h2v1h-2zM27 15h5v1h-5zM33 15h2v1h-2zM36 15h1v1h-1zM4 16h3v1h-3zM8 16h2v1h-2zM11 16h3v1h-3zM17 16h3v1h-3zM22 16h4v1h-4zM27 16h1v1h-1zM29 16h2v1h-2zM34 16h1v1h-1zM36 16h1v1h-1zM0 17h1v1h-1zM2 17h1v1h-1zM4 17h2v1h-2zM7 17h1v1h-1zM10 17h3v1h-3zM18 17h4v1h-4zM25 17h1v1h-1zM27 17h3v1h-3zM31 17h1v1h-1zM33 17h1v1h-1zM1 18h4v1h-4zM6 18h4v1h-4zM11 18h1v1h-1zM13 18h2v1h-2zM16 18h4v1h-4zM21 18h1v1h-1zM23 18h1v1h-1zM25 18h4v1h-4zM30 18h4v1h-4zM36 18h1v1h-1zM1 19h1v1h-1zM3 19h1v1h-1zM5 19h1v1h-1zM7 19h1v1h-1zM9 19h3v1h-3zM13 19h1v1h-1zM15 19h2v1h-2zM22 19h1v1h-1zM25 19h1v1h-1zM29 19h2v1h-2zM32 19h2v1h-2zM36 19h1v1h-1zM0 20h1v1h-1zM3 20h12v1h-12zM16 20h2v1h-2zM20 20h1v1h-1zM24 20h1v1h-1zM27 20h1v1h-1zM29 20h5v1h-5zM0 21h1v1h-1zM3 21h1v1h-1zM7 21h1v1h-1zM9 21h1v1h-1zM11 21h5v1h-5zM17 21h3v1h-3zM23 21h1v1h-1zM25 21h3v1h-3zM29 21h1v1h-1zM32 21h1v1h-1zM34 21h2v1h-2zM1 22h3v1h-3zM6 22h1v1h-1zM8 22h2v1h-2zM12 22h1v1h-1zM14 22h3v1h-3zM20 22h1v1h-1zM23 22h1v1h-1zM26 22h3v1h-3zM31 22h1v1h-1zM33 22h1v1h-1zM36 22h1v1h-1zM0 23h1v1h-1zM4 23h1v1h-1zM7 23h2v1h-2zM11 23h2v1h-2zM16 23h1v1h-1zM18 23h2v1h-2zM24 23h1v1h-1zM26 23h2v1h-2zM30 23h6v1h-6zM0 24h2v1h-2zM5 24h4v1h-4zM11 24h1v1h-1zM15 24h1v1h-1zM17 24h1v1h-1zM19 24h2v1h-2zM22 24h2v1h-2zM30 24h2v1h-2zM0 25h2v1h-2zM5 25h1v1h-1zM7 25h1v1h-1zM9 25h1v1h-1zM11 25h1v1h-1zM17 25h2v1h-2zM23 25h1v1h-1zM26 25h3v1h-3zM32 25h2v1h-2zM0 26h3v1h-3zM4 26h4v1h-4zM9 26h1v1h-1zM11 26h5v1h-5zM17 26h1v1h-1zM19 26h1v1h-1zM22 26h1v1h-1zM26 26h2v1h-2zM29 26h2v1h-2zM34 26h3v1h-3zM0 27h1v1h-1zM3 27h2v1h-2zM7 27h1v1h-1zM9 27h4v1h-4zM14 27h1v1h-1zM16 27h1v1h-1zM23 27h2v1h-2zM30 27h2v1h-2zM33 27h4v1h-4zM0 28h1v1h-1zM5 28h2v1h-2zM8 28h1v1h-1zM12 28h4v1h-4zM18 28h1v1h-1zM22 28h4v1h-4zM28 28h5v1h-5zM34 28h1v1h-1zM8 29h2v1h-2zM11 29h5v1h-5zM17 29h5v1h-5zM25 29h2v1h-2zM28 29h1v1h-1zM32 29h1v1h-1zM34 29h2v1h-2zM0 30h7v1h-7zM8 30h2v1h-2zM15 30h5v1h-5zM21 30h1v1h-1zM23 30h1v1h-1zM25 30h1v1h-1zM28 30h1v1h-1zM30 30h1v1h-1zM32 30h1v1h-1zM36 30h1v1h-1zM0 31h1v1h-1zM6 31h1v1h-1zM8 31h1v1h-1zM15 31h2v1h-2zM22 31h1v1h-1zM25 31h4v1h-4zM32 31h1v1h-1zM35 31h2v1h-2zM0 32h1v1h-1zM2 32h3v1h-3zM6 32h1v1h-1zM8 32h2v1h-2zM12 32h1v1h-1zM14 32h3v1h-3zM18 32h1v1h-1zM20 32h1v1h-1zM27 32h6v1h-6zM35 32h2v1h-2zM0 33h1v1h-1zM2 33h3v1h-3zM6 33h1v1h-1zM8 33h1v1h-1zM11 33h1v1h-1zM13 33h2v1h-2zM17 33h1v1h-1zM19 33h1v1h-1zM23 33h1v1h-1zM26 33h2v1h-2zM29 33h2v1h-2zM34 33h1v1h-1zM36 33h1v1h-1zM0 34h1v1h-1zM2 34h3v1h-3zM6 34h1v1h-1zM12 34h1v1h-1zM14 34h1v1h-1zM17 34h1v1h-1zM21 34h3v1h-3zM25 34h3v1h-3zM29 34h1v1h-1zM32 34h1v1h-1zM34 34h1v1h-1zM36 34h1v1h-1zM0 35h1v1h-1zM6 35h1v1h-1zM10 35h2v1h-2zM14 35h2v1h-2zM17 35h1v1h-1zM19 35h1v1h-1zM22 35h2v1h-2zM26 35h1v1h-1zM29 35h2v1h-2zM32 35h1v1h-1zM34 35h3v1h-3zM0 36h7v1h-7zM8 36h3v1h-3zM13 36h1v1h-1zM19 36h2v1h-2zM28 36h1v1h-1zM30 36h2v1h-2zM33 36h1v1h-1zM36 36h1v1h-1z"
    },
    "GRT Jewellers": {
      "line": "12X Digital Orders for a Six-Decade Heritage Jeweller",
      "url": "https://netcore.ai/success-story/grt-jewellers-12x-email-orders-primary-inbox/",
      "n": 37,
      "d": "M0 0h7v1h-7zM9 0h1v1h-1zM15 0h1v1h-1zM19 0h3v1h-3zM23 0h1v1h-1zM25 0h2v1h-2zM28 0h1v1h-1zM30 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM12 1h6v1h-6zM20 1h1v1h-1zM25 1h4v1h-4zM30 1h1v1h-1zM36 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h2v1h-2zM11 2h2v1h-2zM19 2h4v1h-4zM24 2h1v1h-1zM28 2h1v1h-1zM30 2h1v1h-1zM32 2h3v1h-3zM36 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h2v1h-2zM11 3h4v1h-4zM17 3h1v1h-1zM19 3h1v1h-1zM22 3h2v1h-2zM25 3h2v1h-2zM30 3h1v1h-1zM32 3h3v1h-3zM36 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h3v1h-3zM15 4h3v1h-3zM19 4h2v1h-2zM22 4h2v1h-2zM30 4h1v1h-1zM32 4h3v1h-3zM36 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h3v1h-3zM12 5h3v1h-3zM18 5h1v1h-1zM20 5h3v1h-3zM25 5h1v1h-1zM27 5h2v1h-2zM30 5h1v1h-1zM36 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM30 6h7v1h-7zM8 7h1v1h-1zM11 7h3v1h-3zM15 7h1v1h-1zM18 7h5v1h-5zM27 7h2v1h-2zM0 8h1v1h-1zM2 8h5v1h-5zM9 8h2v1h-2zM12 8h4v1h-4zM17 8h3v1h-3zM22 8h1v1h-1zM24 8h4v1h-4zM30 8h5v1h-5zM1 9h1v1h-1zM3 9h1v1h-1zM8 9h1v1h-1zM12 9h1v1h-1zM15 9h2v1h-2zM18 9h4v1h-4zM23 9h1v1h-1zM28 9h1v1h-1zM31 9h1v1h-1zM33 9h1v1h-1zM35 9h1v1h-1zM1 10h2v1h-2zM5 10h6v1h-6zM13 10h2v1h-2zM17 10h2v1h-2zM24 10h1v1h-1zM27 10h3v1h-3zM31 10h1v1h-1zM33 10h4v1h-4zM1 11h1v1h-1zM3 11h1v1h-1zM5 11h1v1h-1zM9 11h4v1h-4zM16 11h1v1h-1zM18 11h2v1h-2zM21 11h4v1h-4zM26 11h3v1h-3zM31 11h2v1h-2zM36 11h1v1h-1zM2 12h2v1h-2zM5 12h2v1h-2zM8 12h3v1h-3zM12 12h1v1h-1zM14 12h1v1h-1zM17 12h1v1h-1zM24 12h3v1h-3zM29 12h2v1h-2zM32 12h1v1h-1zM34 12h3v1h-3zM0 13h1v1h-1zM2 13h1v1h-1zM5 13h1v1h-1zM7 13h2v1h-2zM10 13h1v1h-1zM13 13h1v1h-1zM16 13h2v1h-2zM19 13h1v1h-1zM21 13h1v1h-1zM23 13h1v1h-1zM28 13h1v1h-1zM31 13h1v1h-1zM35 13h1v1h-1zM5 14h4v1h-4zM11 14h7v1h-7zM20 14h2v1h-2zM26 14h2v1h-2zM29 14h5v1h-5zM35 14h2v1h-2zM0 15h1v1h-1zM8 15h1v1h-1zM10 15h1v1h-1zM14 15h3v1h-3zM21 15h4v1h-4zM29 15h4v1h-4zM35 15h2v1h-2zM0 16h2v1h-2zM4 16h4v1h-4zM9 16h3v1h-3zM13 16h1v1h-1zM15 16h2v1h-2zM18 16h2v1h-2zM22 16h1v1h-1zM25 16h3v1h-3zM29 16h2v1h-2zM32 16h1v1h-1zM34 16h3v1h-3zM1 17h1v1h-1zM5 17h1v1h-1zM8 17h1v1h-1zM12 17h4v1h-4zM18 17h3v1h-3zM22 17h2v1h-2zM25 17h1v1h-1zM33 17h1v1h-1zM35 17h1v1h-1zM0 18h1v1h-1zM2 18h1v1h-1zM4 18h4v1h-4zM13 18h4v1h-4zM21 18h2v1h-2zM24 18h1v1h-1zM27 18h1v1h-1zM29 18h2v1h-2zM34 18h3v1h-3zM3 19h1v1h-1zM5 19h1v1h-1zM8 19h1v1h-1zM10 19h3v1h-3zM15 19h1v1h-1zM18 19h5v1h-5zM24 19h1v1h-1zM26 19h5v1h-5zM32 19h2v1h-2zM36 19h1v1h-1zM1 20h1v1h-1zM4 20h1v1h-1zM6 20h1v1h-1zM9 20h1v1h-1zM11 20h1v1h-1zM13 20h1v1h-1zM15 20h1v1h-1zM17 20h4v1h-4zM22 20h1v1h-1zM24 20h2v1h-2zM28 20h3v1h-3zM32 20h3v1h-3zM1 21h5v1h-5zM7 21h2v1h-2zM10 21h5v1h-5zM16 21h1v1h-1zM18 21h6v1h-6zM28 21h2v1h-2zM33 21h1v1h-1zM0 22h2v1h-2zM3 22h1v1h-1zM6 22h1v1h-1zM11 22h1v1h-1zM14 22h3v1h-3zM18 22h1v1h-1zM26 22h4v1h-4zM31 22h3v1h-3zM35 22h2v1h-2zM0 23h4v1h-4zM8 23h1v1h-1zM10 23h2v1h-2zM16 23h1v1h-1zM18 23h2v1h-2zM21 23h1v1h-1zM23 23h2v1h-2zM26 23h1v1h-1zM28 23h5v1h-5zM36 23h1v1h-1zM1 24h1v1h-1zM3 24h1v1h-1zM6 24h2v1h-2zM9 24h4v1h-4zM14 24h2v1h-2zM18 24h1v1h-1zM22 24h1v1h-1zM25 24h2v1h-2zM29 24h4v1h-4zM34 24h2v1h-2zM0 25h1v1h-1zM2 25h3v1h-3zM15 25h9v1h-9zM25 25h2v1h-2zM28 25h1v1h-1zM31 25h1v1h-1zM34 25h1v1h-1zM0 26h1v1h-1zM2 26h1v1h-1zM4 26h1v1h-1zM6 26h2v1h-2zM9 26h4v1h-4zM14 26h1v1h-1zM20 26h1v1h-1zM25 26h6v1h-6zM32 26h1v1h-1zM35 26h2v1h-2zM0 27h1v1h-1zM3 27h1v1h-1zM5 27h1v1h-1zM7 27h2v1h-2zM10 27h3v1h-3zM16 27h1v1h-1zM21 27h2v1h-2zM26 27h2v1h-2zM30 27h1v1h-1zM33 27h1v1h-1zM0 28h1v1h-1zM6 28h1v1h-1zM9 28h3v1h-3zM13 28h2v1h-2zM16 28h2v1h-2zM19 28h2v1h-2zM22 28h5v1h-5zM28 28h5v1h-5zM34 28h2v1h-2zM8 29h1v1h-1zM10 29h2v1h-2zM16 29h5v1h-5zM22 29h2v1h-2zM26 29h3v1h-3zM32 29h2v1h-2zM0 30h7v1h-7zM9 30h2v1h-2zM12 30h6v1h-6zM20 30h2v1h-2zM25 30h1v1h-1zM28 30h1v1h-1zM30 30h1v1h-1zM32 30h1v1h-1zM34 30h3v1h-3zM0 31h1v1h-1zM6 31h1v1h-1zM8 31h1v1h-1zM12 31h2v1h-2zM15 31h8v1h-8zM28 31h1v1h-1zM32 31h2v1h-2zM36 31h1v1h-1zM0 32h1v1h-1zM2 32h3v1h-3zM6 32h1v1h-1zM8 32h1v1h-1zM10 32h1v1h-1zM12 32h1v1h-1zM15 32h2v1h-2zM19 32h1v1h-1zM24 32h9v1h-9zM34 32h2v1h-2zM0 33h1v1h-1zM2 33h3v1h-3zM6 33h1v1h-1zM8 33h3v1h-3zM13 33h1v1h-1zM15 33h1v1h-1zM17 33h5v1h-5zM23 33h2v1h-2zM26 33h1v1h-1zM28 33h3v1h-3zM32 33h2v1h-2zM36 33h1v1h-1zM0 34h1v1h-1zM2 34h3v1h-3zM6 34h1v1h-1zM8 34h2v1h-2zM13 34h1v1h-1zM15 34h4v1h-4zM20 34h3v1h-3zM25 34h1v1h-1zM27 34h1v1h-1zM35 34h2v1h-2zM0 35h1v1h-1zM6 35h1v1h-1zM13 35h3v1h-3zM18 35h1v1h-1zM20 35h2v1h-2zM23 35h2v1h-2zM26 35h3v1h-3zM30 35h1v1h-1zM32 35h2v1h-2zM36 35h1v1h-1zM0 36h7v1h-7zM8 36h4v1h-4zM15 36h1v1h-1zM17 36h1v1h-1zM19 36h1v1h-1zM22 36h1v1h-1zM25 36h2v1h-2zM29 36h2v1h-2zM32 36h1v1h-1zM34 36h3v1h-3z"
    },
    "Shriram Finance": {
      "line": "171% ↑ ROI Across Loan and FD Funnels with Agentic Marketing",
      "url": "https://netcore.ai/success-story/shriram-finance-171-roi-increase-agentic-marketing/",
      "n": 37,
      "d": "M0 0h7v1h-7zM11 0h4v1h-4zM19 0h3v1h-3zM23 0h1v1h-1zM25 0h1v1h-1zM28 0h1v1h-1zM30 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM13 1h1v1h-1zM15 1h1v1h-1zM17 1h2v1h-2zM20 1h1v1h-1zM25 1h4v1h-4zM30 1h1v1h-1zM36 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h4v1h-4zM15 2h1v1h-1zM21 2h2v1h-2zM24 2h1v1h-1zM27 2h1v1h-1zM30 2h1v1h-1zM32 2h3v1h-3zM36 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h3v1h-3zM13 3h1v1h-1zM16 3h2v1h-2zM20 3h1v1h-1zM22 3h1v1h-1zM25 3h2v1h-2zM30 3h1v1h-1zM32 3h3v1h-3zM36 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h1v1h-1zM13 4h1v1h-1zM18 4h6v1h-6zM25 4h1v1h-1zM30 4h1v1h-1zM32 4h3v1h-3zM36 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h2v1h-2zM11 5h2v1h-2zM14 5h5v1h-5zM20 5h1v1h-1zM22 5h1v1h-1zM25 5h4v1h-4zM30 5h1v1h-1zM36 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM30 6h7v1h-7zM8 7h2v1h-2zM12 7h2v1h-2zM18 7h5v1h-5zM27 7h2v1h-2zM0 8h1v1h-1zM2 8h5v1h-5zM10 8h1v1h-1zM12 8h1v1h-1zM14 8h2v1h-2zM17 8h1v1h-1zM19 8h1v1h-1zM22 8h1v1h-1zM24 8h4v1h-4zM30 8h5v1h-5zM2 9h3v1h-3zM7 9h2v1h-2zM14 9h2v1h-2zM17 9h5v1h-5zM23 9h1v1h-1zM28 9h2v1h-2zM33 9h1v1h-1zM35 9h1v1h-1zM0 10h3v1h-3zM6 10h1v1h-1zM9 10h2v1h-2zM13 10h4v1h-4zM18 10h1v1h-1zM20 10h1v1h-1zM27 10h3v1h-3zM31 10h2v1h-2zM35 10h2v1h-2zM0 11h4v1h-4zM5 11h1v1h-1zM9 11h1v1h-1zM11 11h4v1h-4zM16 11h1v1h-1zM18 11h1v1h-1zM20 11h3v1h-3zM26 11h3v1h-3zM31 11h1v1h-1zM36 11h1v1h-1zM0 12h1v1h-1zM3 12h2v1h-2zM6 12h1v1h-1zM14 12h1v1h-1zM17 12h1v1h-1zM19 12h1v1h-1zM23 12h4v1h-4zM29 12h2v1h-2zM32 12h5v1h-5zM0 13h2v1h-2zM4 13h1v1h-1zM7 13h1v1h-1zM10 13h2v1h-2zM13 13h2v1h-2zM16 13h2v1h-2zM19 13h1v1h-1zM21 13h1v1h-1zM23 13h1v1h-1zM28 13h1v1h-1zM31 13h1v1h-1zM1 14h6v1h-6zM8 14h1v1h-1zM10 14h2v1h-2zM15 14h4v1h-4zM20 14h3v1h-3zM25 14h1v1h-1zM27 14h1v1h-1zM30 14h4v1h-4zM35 14h2v1h-2zM0 15h2v1h-2zM7 15h1v1h-1zM10 15h1v1h-1zM14 15h3v1h-3zM21 15h4v1h-4zM26 15h1v1h-1zM29 15h4v1h-4zM0 16h1v1h-1zM2 16h2v1h-2zM5 16h2v1h-2zM9 16h2v1h-2zM13 16h1v1h-1zM17 16h1v1h-1zM19 16h1v1h-1zM22 16h1v1h-1zM24 16h4v1h-4zM30 16h3v1h-3zM34 16h2v1h-2zM0 17h1v1h-1zM4 17h2v1h-2zM10 17h3v1h-3zM14 17h1v1h-1zM18 17h3v1h-3zM23 17h4v1h-4zM34 17h2v1h-2zM1 18h1v1h-1zM5 18h3v1h-3zM9 18h1v1h-1zM11 18h1v1h-1zM15 18h4v1h-4zM20 18h3v1h-3zM27 18h5v1h-5zM33 18h4v1h-4zM1 19h1v1h-1zM5 19h1v1h-1zM7 19h1v1h-1zM9 19h4v1h-4zM16 19h1v1h-1zM18 19h1v1h-1zM20 19h3v1h-3zM26 19h2v1h-2zM29 19h2v1h-2zM36 19h1v1h-1zM1 20h1v1h-1zM3 20h5v1h-5zM10 20h1v1h-1zM12 20h1v1h-1zM15 20h1v1h-1zM17 20h1v1h-1zM19 20h2v1h-2zM22 20h1v1h-1zM24 20h2v1h-2zM28 20h3v1h-3zM32 20h3v1h-3zM0 21h2v1h-2zM4 21h1v1h-1zM7 21h2v1h-2zM11 21h1v1h-1zM18 21h3v1h-3zM22 21h2v1h-2zM28 21h2v1h-2zM33 21h1v1h-1zM1 22h4v1h-4zM6 22h1v1h-1zM8 22h1v1h-1zM10 22h3v1h-3zM14 22h3v1h-3zM22 22h1v1h-1zM25 22h1v1h-1zM27 22h3v1h-3zM31 22h3v1h-3zM35 22h2v1h-2zM3 23h1v1h-1zM9 23h2v1h-2zM13 23h1v1h-1zM15 23h2v1h-2zM19 23h1v1h-1zM21 23h1v1h-1zM23 23h2v1h-2zM28 23h5v1h-5zM35 23h2v1h-2zM0 24h2v1h-2zM3 24h1v1h-1zM6 24h1v1h-1zM8 24h1v1h-1zM11 24h1v1h-1zM13 24h2v1h-2zM17 24h1v1h-1zM22 24h1v1h-1zM24 24h3v1h-3zM29 24h4v1h-4zM34 24h1v1h-1zM0 25h1v1h-1zM7 25h2v1h-2zM10 25h1v1h-1zM12 25h1v1h-1zM14 25h1v1h-1zM16 25h2v1h-2zM19 25h1v1h-1zM21 25h3v1h-3zM25 25h1v1h-1zM28 25h2v1h-2zM33 25h1v1h-1zM0 26h1v1h-1zM2 26h1v1h-1zM4 26h1v1h-1zM6 26h1v1h-1zM10 26h1v1h-1zM15 26h1v1h-1zM18 26h1v1h-1zM20 26h1v1h-1zM25 26h7v1h-7zM34 26h3v1h-3zM0 27h1v1h-1zM3 27h1v1h-1zM7 27h3v1h-3zM11 27h3v1h-3zM16 27h1v1h-1zM19 27h1v1h-1zM21 27h4v1h-4zM26 27h1v1h-1zM28 27h1v1h-1zM30 27h3v1h-3zM36 27h1v1h-1zM0 28h1v1h-1zM2 28h1v1h-1zM4 28h1v1h-1zM6 28h2v1h-2zM10 28h1v1h-1zM13 28h1v1h-1zM17 28h1v1h-1zM20 28h1v1h-1zM22 28h1v1h-1zM24 28h3v1h-3zM28 28h9v1h-9zM8 29h3v1h-3zM12 29h2v1h-2zM16 29h1v1h-1zM19 29h5v1h-5zM26 29h3v1h-3zM32 29h2v1h-2zM0 30h7v1h-7zM10 30h1v1h-1zM14 30h3v1h-3zM20 30h3v1h-3zM26 30h1v1h-1zM28 30h1v1h-1zM30 30h1v1h-1zM32 30h1v1h-1zM34 30h3v1h-3zM0 31h1v1h-1zM6 31h1v1h-1zM8 31h1v1h-1zM11 31h5v1h-5zM18 31h4v1h-4zM26 31h1v1h-1zM28 31h1v1h-1zM32 31h2v1h-2zM0 32h1v1h-1zM2 32h3v1h-3zM6 32h1v1h-1zM8 32h1v1h-1zM10 32h2v1h-2zM14 32h2v1h-2zM17 32h1v1h-1zM19 32h1v1h-1zM22 32h1v1h-1zM25 32h8v1h-8zM34 32h3v1h-3zM0 33h1v1h-1zM2 33h3v1h-3zM6 33h1v1h-1zM8 33h1v1h-1zM10 33h5v1h-5zM16 33h1v1h-1zM18 33h4v1h-4zM23 33h1v1h-1zM28 33h3v1h-3zM32 33h1v1h-1zM35 33h2v1h-2zM0 34h1v1h-1zM2 34h3v1h-3zM6 34h1v1h-1zM8 34h1v1h-1zM12 34h1v1h-1zM14 34h5v1h-5zM20 34h3v1h-3zM25 34h1v1h-1zM27 34h1v1h-1zM35 34h2v1h-2zM0 35h1v1h-1zM6 35h1v1h-1zM9 35h1v1h-1zM11 35h2v1h-2zM14 35h2v1h-2zM18 35h1v1h-1zM21 35h1v1h-1zM24 35h1v1h-1zM26 35h3v1h-3zM30 35h1v1h-1zM32 35h2v1h-2zM36 35h1v1h-1zM0 36h7v1h-7zM8 36h2v1h-2zM11 36h1v1h-1zM14 36h1v1h-1zM17 36h1v1h-1zM19 36h1v1h-1zM22 36h1v1h-1zM25 36h2v1h-2zM32 36h5v1h-5z"
    },
    "Equitas Bank": {
      "line": "50% ↑ FD Conversions with Personalised WhatsApp Journeys",
      "url": "https://netcore.ai/success-story/equitas-growth-1-5x-digital-adoption/",
      "n": 37,
      "d": "M0 0h7v1h-7zM9 0h1v1h-1zM12 0h1v1h-1zM14 0h1v1h-1zM16 0h1v1h-1zM18 0h1v1h-1zM20 0h2v1h-2zM23 0h1v1h-1zM25 0h1v1h-1zM28 0h1v1h-1zM30 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM9 1h2v1h-2zM12 1h2v1h-2zM19 1h1v1h-1zM25 1h3v1h-3zM30 1h1v1h-1zM36 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h1v1h-1zM12 2h1v1h-1zM15 2h1v1h-1zM19 2h4v1h-4zM24 2h1v1h-1zM27 2h2v1h-2zM30 2h1v1h-1zM32 2h3v1h-3zM36 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h1v1h-1zM11 3h7v1h-7zM19 3h1v1h-1zM22 3h2v1h-2zM25 3h3v1h-3zM30 3h1v1h-1zM32 3h3v1h-3zM36 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h6v1h-6zM15 4h2v1h-2zM19 4h2v1h-2zM22 4h2v1h-2zM30 4h1v1h-1zM32 4h3v1h-3zM36 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h1v1h-1zM11 5h2v1h-2zM18 5h1v1h-1zM20 5h1v1h-1zM22 5h1v1h-1zM27 5h2v1h-2zM30 5h1v1h-1zM36 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM30 6h7v1h-7zM8 7h3v1h-3zM14 7h1v1h-1zM19 7h4v1h-4zM26 7h3v1h-3zM0 8h1v1h-1zM2 8h5v1h-5zM11 8h1v1h-1zM15 8h1v1h-1zM18 8h3v1h-3zM22 8h1v1h-1zM24 8h5v1h-5zM30 8h5v1h-5zM1 9h1v1h-1zM3 9h3v1h-3zM7 9h6v1h-6zM14 9h3v1h-3zM21 9h1v1h-1zM23 9h1v1h-1zM28 9h2v1h-2zM31 9h1v1h-1zM35 9h1v1h-1zM0 10h2v1h-2zM3 10h1v1h-1zM6 10h2v1h-2zM9 10h3v1h-3zM14 10h1v1h-1zM18 10h1v1h-1zM20 10h1v1h-1zM24 10h1v1h-1zM27 10h3v1h-3zM31 10h1v1h-1zM34 10h3v1h-3zM3 11h1v1h-1zM9 11h2v1h-2zM13 11h1v1h-1zM16 11h1v1h-1zM21 11h2v1h-2zM26 11h2v1h-2zM31 11h1v1h-1zM36 11h1v1h-1zM0 12h1v1h-1zM3 12h1v1h-1zM5 12h3v1h-3zM12 12h2v1h-2zM17 12h1v1h-1zM24 12h3v1h-3zM29 12h2v1h-2zM32 12h1v1h-1zM34 12h3v1h-3zM1 13h4v1h-4zM9 13h1v1h-1zM12 13h3v1h-3zM16 13h2v1h-2zM19 13h1v1h-1zM23 13h1v1h-1zM25 13h1v1h-1zM28 13h1v1h-1zM31 13h1v1h-1zM35 13h1v1h-1zM2 14h5v1h-5zM9 14h2v1h-2zM13 14h1v1h-1zM15 14h3v1h-3zM20 14h1v1h-1zM22 14h1v1h-1zM26 14h2v1h-2zM31 14h3v1h-3zM35 14h2v1h-2zM3 15h1v1h-1zM5 15h1v1h-1zM9 15h1v1h-1zM12 15h1v1h-1zM15 15h4v1h-4zM21 15h1v1h-1zM23 15h2v1h-2zM30 15h3v1h-3zM35 15h1v1h-1zM4 16h1v1h-1zM6 16h4v1h-4zM11 16h1v1h-1zM13 16h2v1h-2zM16 16h1v1h-1zM19 16h1v1h-1zM25 16h1v1h-1zM27 16h1v1h-1zM30 16h3v1h-3zM34 16h2v1h-2zM1 17h1v1h-1zM3 17h1v1h-1zM5 17h1v1h-1zM7 17h1v1h-1zM9 17h1v1h-1zM11 17h5v1h-5zM18 17h1v1h-1zM20 17h1v1h-1zM23 17h1v1h-1zM25 17h1v1h-1zM28 17h1v1h-1zM35 17h1v1h-1zM2 18h1v1h-1zM6 18h2v1h-2zM11 18h1v1h-1zM14 18h3v1h-3zM19 18h1v1h-1zM21 18h2v1h-2zM24 18h1v1h-1zM27 18h5v1h-5zM33 18h1v1h-1zM35 18h2v1h-2zM0 19h1v1h-1zM3 19h2v1h-2zM7 19h2v1h-2zM10 19h1v1h-1zM13 19h3v1h-3zM19 19h4v1h-4zM24 19h1v1h-1zM26 19h1v1h-1zM28 19h5v1h-5zM36 19h1v1h-1zM3 20h2v1h-2zM6 20h1v1h-1zM8 20h2v1h-2zM11 20h2v1h-2zM14 20h2v1h-2zM17 20h1v1h-1zM19 20h2v1h-2zM22 20h1v1h-1zM24 20h2v1h-2zM27 20h4v1h-4zM32 20h3v1h-3zM3 21h1v1h-1zM7 21h1v1h-1zM10 21h1v1h-1zM12 21h1v1h-1zM14 21h1v1h-1zM18 21h3v1h-3zM22 21h2v1h-2zM25 21h1v1h-1zM28 21h2v1h-2zM33 21h1v1h-1zM0 22h4v1h-4zM6 22h2v1h-2zM9 22h1v1h-1zM12 22h1v1h-1zM14 22h3v1h-3zM18 22h1v1h-1zM22 22h1v1h-1zM26 22h4v1h-4zM31 22h3v1h-3zM35 22h2v1h-2zM1 23h1v1h-1zM3 23h1v1h-1zM5 23h1v1h-1zM7 23h2v1h-2zM10 23h1v1h-1zM13 23h2v1h-2zM19 23h1v1h-1zM21 23h4v1h-4zM26 23h1v1h-1zM28 23h5v1h-5zM3 24h5v1h-5zM9 24h2v1h-2zM14 24h2v1h-2zM18 24h1v1h-1zM20 24h2v1h-2zM25 24h2v1h-2zM29 24h2v1h-2zM32 24h1v1h-1zM34 24h1v1h-1zM36 24h1v1h-1zM0 25h1v1h-1zM2 25h1v1h-1zM7 25h1v1h-1zM12 25h6v1h-6zM21 25h1v1h-1zM23 25h1v1h-1zM25 25h1v1h-1zM28 25h1v1h-1zM33 25h2v1h-2zM0 26h1v1h-1zM5 26h2v1h-2zM8 26h1v1h-1zM10 26h2v1h-2zM14 26h1v1h-1zM18 26h1v1h-1zM20 26h1v1h-1zM25 26h7v1h-7zM33 26h1v1h-1zM35 26h2v1h-2zM0 27h1v1h-1zM3 27h1v1h-1zM8 27h2v1h-2zM12 27h1v1h-1zM14 27h1v1h-1zM16 27h1v1h-1zM21 27h3v1h-3zM26 27h2v1h-2zM30 27h1v1h-1zM33 27h1v1h-1zM0 28h1v1h-1zM2 28h8v1h-8zM11 28h1v1h-1zM13 28h1v1h-1zM16 28h2v1h-2zM20 28h1v1h-1zM22 28h5v1h-5zM28 28h9v1h-9zM8 29h1v1h-1zM10 29h1v1h-1zM13 29h2v1h-2zM16 29h2v1h-2zM19 29h5v1h-5zM26 29h3v1h-3zM32 29h2v1h-2zM35 29h1v1h-1zM0 30h7v1h-7zM11 30h1v1h-1zM15 30h3v1h-3zM20 30h2v1h-2zM28 30h1v1h-1zM30 30h1v1h-1zM32 30h1v1h-1zM34 30h3v1h-3zM0 31h1v1h-1zM6 31h1v1h-1zM8 31h2v1h-2zM12 31h2v1h-2zM15 31h1v1h-1zM17 31h5v1h-5zM26 31h1v1h-1zM28 31h1v1h-1zM32 31h2v1h-2zM35 31h1v1h-1zM0 32h1v1h-1zM2 32h3v1h-3zM6 32h1v1h-1zM8 32h1v1h-1zM11 32h1v1h-1zM15 32h2v1h-2zM19 32h1v1h-1zM21 32h1v1h-1zM24 32h9v1h-9zM34 32h3v1h-3zM0 33h1v1h-1zM2 33h3v1h-3zM6 33h1v1h-1zM8 33h1v1h-1zM13 33h1v1h-1zM15 33h1v1h-1zM18 33h1v1h-1zM20 33h2v1h-2zM23 33h1v1h-1zM28 33h3v1h-3zM32 33h1v1h-1zM34 33h1v1h-1zM36 33h1v1h-1zM0 34h1v1h-1zM2 34h3v1h-3zM6 34h1v1h-1zM8 34h4v1h-4zM13 34h4v1h-4zM19 34h1v1h-1zM21 34h2v1h-2zM24 34h2v1h-2zM27 34h1v1h-1zM35 34h2v1h-2zM0 35h1v1h-1zM6 35h1v1h-1zM12 35h4v1h-4zM18 35h4v1h-4zM26 35h5v1h-5zM32 35h2v1h-2zM36 35h1v1h-1zM0 36h7v1h-7zM8 36h3v1h-3zM12 36h2v1h-2zM15 36h1v1h-1zM17 36h1v1h-1zM19 36h1v1h-1zM22 36h1v1h-1zM25 36h2v1h-2zM30 36h1v1h-1zM32 36h1v1h-1zM34 36h3v1h-3z"
    },
    "ClearTax": {
      "line": "73% ↑ Returning Users in Peak Tax Season with Agentic Marketing",
      "url": "https://netcore.ai/success-story/cleartax-73-percent-login-growth-with-netcore-agentic-marketing/",
      "n": 41,
      "d": "M0 0h7v1h-7zM9 0h1v1h-1zM13 0h4v1h-4zM18 0h2v1h-2zM21 0h3v1h-3zM25 0h3v1h-3zM31 0h1v1h-1zM34 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM10 1h2v1h-2zM13 1h2v1h-2zM17 1h1v1h-1zM23 1h1v1h-1zM27 1h1v1h-1zM29 1h1v1h-1zM32 1h1v1h-1zM34 1h1v1h-1zM40 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM10 2h1v1h-1zM12 2h1v1h-1zM17 2h1v1h-1zM19 2h1v1h-1zM21 2h2v1h-2zM26 2h2v1h-2zM29 2h1v1h-1zM31 2h2v1h-2zM34 2h1v1h-1zM36 2h3v1h-3zM40 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM12 3h1v1h-1zM15 3h3v1h-3zM19 3h1v1h-1zM21 3h2v1h-2zM24 3h1v1h-1zM26 3h3v1h-3zM30 3h1v1h-1zM34 3h1v1h-1zM36 3h3v1h-3zM40 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM9 4h1v1h-1zM13 4h2v1h-2zM21 4h1v1h-1zM23 4h1v1h-1zM25 4h5v1h-5zM34 4h1v1h-1zM36 4h3v1h-3zM40 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h1v1h-1zM10 5h1v1h-1zM12 5h1v1h-1zM14 5h2v1h-2zM18 5h2v1h-2zM22 5h1v1h-1zM24 5h1v1h-1zM26 5h7v1h-7zM34 5h1v1h-1zM40 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM30 6h1v1h-1zM32 6h1v1h-1zM34 6h7v1h-7zM9 7h5v1h-5zM15 7h1v1h-1zM17 7h2v1h-2zM20 7h2v1h-2zM23 7h2v1h-2zM27 7h3v1h-3zM32 7h1v1h-1zM0 8h1v1h-1zM3 8h1v1h-1zM5 8h2v1h-2zM8 8h1v1h-1zM11 8h1v1h-1zM21 8h1v1h-1zM24 8h3v1h-3zM31 8h1v1h-1zM33 8h1v1h-1zM35 8h1v1h-1zM2 9h1v1h-1zM4 9h1v1h-1zM7 9h1v1h-1zM10 9h1v1h-1zM14 9h1v1h-1zM16 9h1v1h-1zM18 9h1v1h-1zM20 9h3v1h-3zM28 9h2v1h-2zM32 9h4v1h-4zM37 9h4v1h-4zM1 10h2v1h-2zM6 10h1v1h-1zM10 10h2v1h-2zM13 10h3v1h-3zM17 10h1v1h-1zM19 10h1v1h-1zM25 10h2v1h-2zM28 10h1v1h-1zM31 10h1v1h-1zM34 10h1v1h-1zM37 10h3v1h-3zM0 11h1v1h-1zM2 11h1v1h-1zM8 11h3v1h-3zM12 11h2v1h-2zM15 11h1v1h-1zM20 11h2v1h-2zM25 11h2v1h-2zM28 11h1v1h-1zM30 11h1v1h-1zM35 11h2v1h-2zM38 11h1v1h-1zM40 11h1v1h-1zM1 12h3v1h-3zM5 12h3v1h-3zM10 12h2v1h-2zM13 12h1v1h-1zM16 12h2v1h-2zM20 12h2v1h-2zM23 12h7v1h-7zM31 12h5v1h-5zM37 12h1v1h-1zM39 12h2v1h-2zM1 13h3v1h-3zM7 13h2v1h-2zM11 13h2v1h-2zM14 13h1v1h-1zM16 13h3v1h-3zM20 13h4v1h-4zM25 13h1v1h-1zM29 13h1v1h-1zM31 13h3v1h-3zM39 13h1v1h-1zM0 14h1v1h-1zM4 14h1v1h-1zM6 14h1v1h-1zM9 14h1v1h-1zM12 14h1v1h-1zM14 14h1v1h-1zM17 14h1v1h-1zM19 14h1v1h-1zM23 14h2v1h-2zM28 14h1v1h-1zM32 14h1v1h-1zM34 14h2v1h-2zM37 14h4v1h-4zM1 15h1v1h-1zM3 15h1v1h-1zM8 15h1v1h-1zM12 15h1v1h-1zM14 15h5v1h-5zM20 15h4v1h-4zM25 15h8v1h-8zM34 15h2v1h-2zM39 15h1v1h-1zM0 16h2v1h-2zM4 16h1v1h-1zM6 16h1v1h-1zM8 16h5v1h-5zM14 16h1v1h-1zM16 16h3v1h-3zM21 16h2v1h-2zM24 16h1v1h-1zM28 16h2v1h-2zM32 16h1v1h-1zM35 16h1v1h-1zM39 16h2v1h-2zM0 17h2v1h-2zM9 17h3v1h-3zM13 17h1v1h-1zM17 17h1v1h-1zM21 17h4v1h-4zM28 17h1v1h-1zM30 17h1v1h-1zM34 17h2v1h-2zM40 17h1v1h-1zM0 18h1v1h-1zM3 18h1v1h-1zM6 18h5v1h-5zM17 18h1v1h-1zM22 18h1v1h-1zM25 18h1v1h-1zM29 18h2v1h-2zM32 18h1v1h-1zM36 18h2v1h-2zM39 18h2v1h-2zM3 19h1v1h-1zM8 19h3v1h-3zM12 19h2v1h-2zM15 19h1v1h-1zM19 19h3v1h-3zM23 19h2v1h-2zM27 19h1v1h-1zM29 19h1v1h-1zM31 19h1v1h-1zM34 19h2v1h-2zM37 19h1v1h-1zM40 19h1v1h-1zM0 20h3v1h-3zM5 20h5v1h-5zM11 20h1v1h-1zM13 20h2v1h-2zM16 20h2v1h-2zM19 20h1v1h-1zM22 20h1v1h-1zM24 20h5v1h-5zM34 20h2v1h-2zM38 20h2v1h-2zM3 21h3v1h-3zM7 21h1v1h-1zM10 21h2v1h-2zM15 21h1v1h-1zM17 21h1v1h-1zM20 21h3v1h-3zM25 21h1v1h-1zM28 21h2v1h-2zM32 21h3v1h-3zM39 21h2v1h-2zM0 22h1v1h-1zM3 22h2v1h-2zM6 22h2v1h-2zM9 22h1v1h-1zM12 22h2v1h-2zM17 22h3v1h-3zM21 22h1v1h-1zM25 22h1v1h-1zM31 22h1v1h-1zM33 22h2v1h-2zM36 22h1v1h-1zM38 22h2v1h-2zM2 23h2v1h-2zM5 23h1v1h-1zM8 23h1v1h-1zM10 23h3v1h-3zM15 23h1v1h-1zM18 23h1v1h-1zM20 23h4v1h-4zM25 23h1v1h-1zM27 23h2v1h-2zM30 23h1v1h-1zM32 23h1v1h-1zM35 23h1v1h-1zM38 23h1v1h-1zM0 24h1v1h-1zM2 24h2v1h-2zM5 24h4v1h-4zM10 24h2v1h-2zM13 24h2v1h-2zM17 24h1v1h-1zM20 24h2v1h-2zM24 24h3v1h-3zM28 24h2v1h-2zM32 24h3v1h-3zM40 24h1v1h-1zM0 25h2v1h-2zM3 25h2v1h-2zM7 25h2v1h-2zM10 25h3v1h-3zM14 25h2v1h-2zM17 25h5v1h-5zM24 25h2v1h-2zM29 25h3v1h-3zM33 25h1v1h-1zM37 25h1v1h-1zM39 25h1v1h-1zM2 26h2v1h-2zM5 26h3v1h-3zM12 26h1v1h-1zM15 26h3v1h-3zM20 26h1v1h-1zM23 26h1v1h-1zM26 26h1v1h-1zM29 26h2v1h-2zM32 26h1v1h-1zM34 26h1v1h-1zM36 26h1v1h-1zM39 26h2v1h-2zM0 27h1v1h-1zM8 27h1v1h-1zM11 27h3v1h-3zM15 27h1v1h-1zM17 27h1v1h-1zM21 27h3v1h-3zM25 27h2v1h-2zM29 27h2v1h-2zM32 27h1v1h-1zM34 27h3v1h-3zM0 28h2v1h-2zM6 28h4v1h-4zM12 28h2v1h-2zM15 28h1v1h-1zM17 28h3v1h-3zM21 28h2v1h-2zM24 28h1v1h-1zM26 28h1v1h-1zM28 28h2v1h-2zM32 28h1v1h-1zM35 28h1v1h-1zM2 29h1v1h-1zM4 29h1v1h-1zM8 29h2v1h-2zM14 29h1v1h-1zM16 29h2v1h-2zM19 29h4v1h-4zM25 29h1v1h-1zM28 29h1v1h-1zM30 29h1v1h-1zM33 29h3v1h-3zM38 29h3v1h-3zM0 30h1v1h-1zM2 30h2v1h-2zM6 30h1v1h-1zM10 30h1v1h-1zM12 30h1v1h-1zM16 30h1v1h-1zM35 30h1v1h-1zM38 30h3v1h-3zM2 31h2v1h-2zM7 31h5v1h-5zM13 31h1v1h-1zM15 31h1v1h-1zM17 31h2v1h-2zM21 31h2v1h-2zM24 31h1v1h-1zM27 31h1v1h-1zM29 31h1v1h-1zM32 31h2v1h-2zM36 31h2v1h-2zM40 31h1v1h-1zM0 32h1v1h-1zM2 32h1v1h-1zM4 32h3v1h-3zM8 32h2v1h-2zM14 32h3v1h-3zM21 32h1v1h-1zM24 32h3v1h-3zM28 32h1v1h-1zM31 32h6v1h-6zM38 32h2v1h-2zM8 33h2v1h-2zM11 33h1v1h-1zM13 33h3v1h-3zM17 33h1v1h-1zM20 33h1v1h-1zM25 33h1v1h-1zM32 33h1v1h-1zM36 33h1v1h-1zM39 33h2v1h-2zM0 34h7v1h-7zM10 34h1v1h-1zM13 34h1v1h-1zM15 34h1v1h-1zM18 34h2v1h-2zM21 34h2v1h-2zM24 34h1v1h-1zM29 34h2v1h-2zM32 34h1v1h-1zM34 34h1v1h-1zM36 34h1v1h-1zM0 35h1v1h-1zM6 35h1v1h-1zM8 35h2v1h-2zM11 35h2v1h-2zM16 35h1v1h-1zM18 35h1v1h-1zM20 35h1v1h-1zM25 35h1v1h-1zM27 35h1v1h-1zM30 35h1v1h-1zM32 35h1v1h-1zM36 35h1v1h-1zM38 35h1v1h-1zM40 35h1v1h-1zM0 36h1v1h-1zM2 36h3v1h-3zM6 36h1v1h-1zM9 36h3v1h-3zM18 36h1v1h-1zM20 36h1v1h-1zM23 36h1v1h-1zM25 36h3v1h-3zM29 36h1v1h-1zM32 36h5v1h-5zM40 36h1v1h-1zM0 37h1v1h-1zM2 37h3v1h-3zM6 37h1v1h-1zM8 37h2v1h-2zM12 37h1v1h-1zM15 37h1v1h-1zM17 37h6v1h-6zM25 37h1v1h-1zM29 37h1v1h-1zM31 37h4v1h-4zM36 37h4v1h-4zM0 38h1v1h-1zM2 38h3v1h-3zM6 38h1v1h-1zM10 38h1v1h-1zM13 38h4v1h-4zM23 38h1v1h-1zM25 38h2v1h-2zM28 38h2v1h-2zM31 38h1v1h-1zM36 38h1v1h-1zM38 38h3v1h-3zM0 39h1v1h-1zM6 39h1v1h-1zM10 39h4v1h-4zM21 39h2v1h-2zM24 39h2v1h-2zM29 39h1v1h-1zM31 39h2v1h-2zM34 39h2v1h-2zM39 39h1v1h-1zM0 40h7v1h-7zM8 40h3v1h-3zM15 40h1v1h-1zM17 40h6v1h-6zM24 40h1v1h-1zM29 40h1v1h-1zM32 40h5v1h-5zM39 40h1v1h-1z"
    },
    "ICICI Life Insurance": {
      "line": "70% ↑ ULIP & Protection Revenue in One Quarter with Personalised Journeys",
      "url": "https://netcore.ai/success-story/icici-life-insurance-70-revenue-growth/",
      "n": 37,
      "d": "M0 0h7v1h-7zM13 0h2v1h-2zM16 0h3v1h-3zM20 0h2v1h-2zM23 0h1v1h-1zM25 0h1v1h-1zM28 0h1v1h-1zM30 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM10 1h2v1h-2zM18 1h2v1h-2zM24 1h4v1h-4zM30 1h1v1h-1zM36 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h2v1h-2zM15 2h2v1h-2zM19 2h6v1h-6zM30 2h1v1h-1zM32 2h3v1h-3zM36 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h2v1h-2zM12 3h1v1h-1zM15 3h3v1h-3zM19 3h1v1h-1zM22 3h1v1h-1zM25 3h3v1h-3zM30 3h1v1h-1zM32 3h3v1h-3zM36 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h1v1h-1zM11 4h1v1h-1zM13 4h3v1h-3zM18 4h3v1h-3zM22 4h2v1h-2zM30 4h1v1h-1zM32 4h3v1h-3zM36 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h1v1h-1zM10 5h1v1h-1zM15 5h2v1h-2zM18 5h1v1h-1zM20 5h1v1h-1zM22 5h1v1h-1zM26 5h3v1h-3zM30 5h1v1h-1zM36 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM30 6h7v1h-7zM8 7h1v1h-1zM10 7h3v1h-3zM16 7h1v1h-1zM19 7h4v1h-4zM26 7h3v1h-3zM0 8h1v1h-1zM2 8h5v1h-5zM9 8h4v1h-4zM15 8h1v1h-1zM18 8h3v1h-3zM22 8h1v1h-1zM25 8h4v1h-4zM30 8h5v1h-5zM1 9h2v1h-2zM10 9h7v1h-7zM21 9h3v1h-3zM26 9h1v1h-1zM28 9h1v1h-1zM31 9h1v1h-1zM33 9h3v1h-3zM0 10h2v1h-2zM4 10h3v1h-3zM9 10h2v1h-2zM17 10h2v1h-2zM20 10h1v1h-1zM27 10h3v1h-3zM32 10h1v1h-1zM35 10h2v1h-2zM0 11h2v1h-2zM3 11h2v1h-2zM7 11h1v1h-1zM12 11h1v1h-1zM14 11h1v1h-1zM16 11h1v1h-1zM21 11h3v1h-3zM26 11h3v1h-3zM31 11h2v1h-2zM36 11h1v1h-1zM0 12h1v1h-1zM2 12h1v1h-1zM6 12h1v1h-1zM13 12h2v1h-2zM17 12h1v1h-1zM24 12h3v1h-3zM29 12h2v1h-2zM32 12h5v1h-5zM0 13h1v1h-1zM3 13h3v1h-3zM8 13h1v1h-1zM10 13h1v1h-1zM14 13h1v1h-1zM16 13h4v1h-4zM21 13h1v1h-1zM23 13h1v1h-1zM28 13h1v1h-1zM31 13h1v1h-1zM1 14h2v1h-2zM5 14h2v1h-2zM11 14h3v1h-3zM15 14h3v1h-3zM20 14h1v1h-1zM22 14h1v1h-1zM25 14h3v1h-3zM30 14h4v1h-4zM35 14h2v1h-2zM0 15h1v1h-1zM2 15h1v1h-1zM5 15h1v1h-1zM8 15h1v1h-1zM11 15h5v1h-5zM17 15h2v1h-2zM21 15h4v1h-4zM29 15h1v1h-1zM31 15h2v1h-2zM35 15h2v1h-2zM0 16h1v1h-1zM3 16h2v1h-2zM6 16h3v1h-3zM13 16h1v1h-1zM16 16h1v1h-1zM19 16h1v1h-1zM22 16h1v1h-1zM24 16h4v1h-4zM29 16h2v1h-2zM32 16h1v1h-1zM34 16h2v1h-2zM1 17h1v1h-1zM3 17h1v1h-1zM7 17h6v1h-6zM14 17h2v1h-2zM17 17h2v1h-2zM20 17h1v1h-1zM22 17h2v1h-2zM25 17h1v1h-1zM31 17h1v1h-1zM34 17h2v1h-2zM0 18h4v1h-4zM6 18h2v1h-2zM9 18h2v1h-2zM12 18h1v1h-1zM14 18h3v1h-3zM18 18h2v1h-2zM21 18h2v1h-2zM27 18h1v1h-1zM29 18h3v1h-3zM33 18h4v1h-4zM3 19h2v1h-2zM7 19h1v1h-1zM9 19h4v1h-4zM14 19h2v1h-2zM19 19h4v1h-4zM26 19h2v1h-2zM29 19h2v1h-2zM36 19h1v1h-1zM6 20h1v1h-1zM8 20h1v1h-1zM12 20h1v1h-1zM15 20h1v1h-1zM17 20h1v1h-1zM19 20h2v1h-2zM22 20h4v1h-4zM27 20h4v1h-4zM32 20h1v1h-1zM34 20h1v1h-1zM0 21h1v1h-1zM3 21h1v1h-1zM8 21h1v1h-1zM10 21h1v1h-1zM13 21h2v1h-2zM16 21h1v1h-1zM18 21h6v1h-6zM28 21h2v1h-2zM33 21h1v1h-1zM6 22h3v1h-3zM10 22h1v1h-1zM12 22h1v1h-1zM14 22h2v1h-2zM18 22h1v1h-1zM21 22h2v1h-2zM26 22h8v1h-8zM36 22h1v1h-1zM0 23h2v1h-2zM4 23h2v1h-2zM7 23h1v1h-1zM10 23h3v1h-3zM14 23h3v1h-3zM19 23h1v1h-1zM21 23h1v1h-1zM23 23h2v1h-2zM26 23h1v1h-1zM28 23h5v1h-5zM35 23h2v1h-2zM0 24h2v1h-2zM5 24h7v1h-7zM18 24h1v1h-1zM22 24h1v1h-1zM24 24h3v1h-3zM28 24h1v1h-1zM30 24h1v1h-1zM32 24h1v1h-1zM34 24h3v1h-3zM0 25h2v1h-2zM3 25h1v1h-1zM7 25h1v1h-1zM9 25h3v1h-3zM14 25h3v1h-3zM21 25h1v1h-1zM23 25h3v1h-3zM31 25h1v1h-1zM33 25h1v1h-1zM0 26h1v1h-1zM2 26h1v1h-1zM6 26h1v1h-1zM8 26h6v1h-6zM17 26h2v1h-2zM25 26h6v1h-6zM32 26h1v1h-1zM34 26h3v1h-3zM0 27h1v1h-1zM3 27h1v1h-1zM8 27h4v1h-4zM13 27h2v1h-2zM16 27h1v1h-1zM21 27h2v1h-2zM26 27h1v1h-1zM28 27h1v1h-1zM30 27h1v1h-1zM36 27h1v1h-1zM0 28h1v1h-1zM2 28h1v1h-1zM4 28h1v1h-1zM6 28h3v1h-3zM10 28h1v1h-1zM12 28h1v1h-1zM14 28h1v1h-1zM17 28h1v1h-1zM20 28h1v1h-1zM22 28h1v1h-1zM24 28h9v1h-9zM34 28h1v1h-1zM8 29h4v1h-4zM13 29h2v1h-2zM16 29h5v1h-5zM22 29h2v1h-2zM25 29h4v1h-4zM32 29h2v1h-2zM0 30h7v1h-7zM10 30h4v1h-4zM15 30h3v1h-3zM20 30h2v1h-2zM25 30h2v1h-2zM28 30h1v1h-1zM30 30h1v1h-1zM32 30h1v1h-1zM34 30h3v1h-3zM0 31h1v1h-1zM6 31h1v1h-1zM8 31h4v1h-4zM13 31h9v1h-9zM28 31h1v1h-1zM32 31h2v1h-2zM0 32h1v1h-1zM2 32h3v1h-3zM6 32h1v1h-1zM8 32h1v1h-1zM11 32h1v1h-1zM13 32h1v1h-1zM16 32h1v1h-1zM19 32h1v1h-1zM24 32h9v1h-9zM34 32h3v1h-3zM0 33h1v1h-1zM2 33h3v1h-3zM6 33h1v1h-1zM8 33h1v1h-1zM10 33h1v1h-1zM12 33h1v1h-1zM14 33h2v1h-2zM17 33h2v1h-2zM21 33h1v1h-1zM23 33h1v1h-1zM26 33h1v1h-1zM28 33h3v1h-3zM32 33h1v1h-1zM36 33h1v1h-1zM0 34h1v1h-1zM2 34h3v1h-3zM6 34h1v1h-1zM8 34h2v1h-2zM13 34h4v1h-4zM18 34h1v1h-1zM20 34h3v1h-3zM25 34h1v1h-1zM27 34h1v1h-1zM35 34h2v1h-2zM0 35h1v1h-1zM6 35h1v1h-1zM9 35h1v1h-1zM11 35h3v1h-3zM15 35h1v1h-1zM19 35h3v1h-3zM26 35h1v1h-1zM28 35h2v1h-2zM32 35h1v1h-1zM36 35h1v1h-1zM0 36h7v1h-7zM8 36h1v1h-1zM11 36h3v1h-3zM15 36h1v1h-1zM17 36h3v1h-3zM22 36h1v1h-1zM25 36h3v1h-3zM29 36h2v1h-2zM32 36h1v1h-1zM34 36h3v1h-3z"
    }
  }
};
