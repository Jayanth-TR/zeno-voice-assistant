import os
hf_offline = os.getenv("HF_HUB_OFFLINE")
if hf_offline is not None:
    os.environ["HF_HUB_OFFLINE"] = hf_offline

tf_offline = os.getenv("TRANSFORMERS_OFFLINE")
if tf_offline is not None:
    os.environ["TRANSFORMERS_OFFLINE"] = tf_offline

import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv

reconfigure_stdout = getattr(sys.stdout, "reconfigure", None)
if callable(reconfigure_stdout):
    reconfigure_stdout(line_buffering=True)

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))
load_dotenv(backend_dir / ".env")

from langchain_core.messages import HumanMessage
from app.agents.graph import conversation_graph, build_response_messages, model

test_cases = [
    {
        "industry": "E-commerce & D2C",
        "challenge_id": "cart_recovery",
        "question": "How can I recover more revenue from abandoned carts?",
    },
    {
        "industry": "Banking & Fintech",
        "challenge_id": "fd_conversion",
        "question": "Which customers are most likely to open an FD this month?",
    },
    {
        "industry": "Insurance",
        "challenge_id": "policy_renewals",
        "question": "How do I increase my renewal rate?",
    }
]

async def run_industry_test():
    print("=" * 80, flush=True)
    print("STARTING TEST OF INDUSTRY EXPERIENCE CENTER FLOW (PDF QUESTIONS)", flush=True)
    print("=" * 80, flush=True)

    for i, tc in enumerate(test_cases, start=1):
        ind = tc["industry"]
        ch_id = tc["challenge_id"]
        q = tc["question"]

        print(f"\n" + "#" * 80, flush=True)
        print(f"CASE {i}: [{ind}] {q} (Challenge: {ch_id})", flush=True)
        print("#" * 80, flush=True)

        state = await conversation_graph.ainvoke({
            "messages": [HumanMessage(content=q)],
            "industry": ind,
            "challenge_id": ch_id
        })

        print(f"  Route: {state.get('route')}", flush=True)
        print(f"  Chunks found: {len(state.get('sources', []))}", flush=True)
        for s in state.get("sources", [])[:2]:
            print(f"    - [{s.get('hybrid_score', 0):.2f}] {s.get('source')} (p.{s.get('page')})", flush=True)

        messages = build_response_messages(state)
        response = await model.ainvoke(messages)
        print(f"\n[GENERATED ZENO ANSWER]:", flush=True)
        print(response.content, flush=True)
        print("-" * 80, flush=True)

if __name__ == "__main__":
    asyncio.run(run_industry_test())
