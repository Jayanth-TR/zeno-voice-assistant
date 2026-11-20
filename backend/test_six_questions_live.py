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

questions = [
    "What are the agents available in Netcore?",
    "How many agents does Netcore have?",
    "Could you explain these six agents?",
    "What does the Audience Agent do?",
    "How does the Decisioning Agent work?",
    "How do all six agents work together?",
]

async def run_test():
    print("=" * 80, flush=True)
    print("STARTING TEST OF 6 AGENT QUESTIONS", flush=True)
    print("=" * 80, flush=True)

    for i, q in enumerate(questions, start=1):
        print(f"\n" + "#" * 80, flush=True)
        print(f"QUESTION {i}: {q}", flush=True)
        print("#" * 80, flush=True)

        # 1. Run LangGraph pipeline
        state = await conversation_graph.ainvoke({
            "messages": [HumanMessage(content=q)]
        })

        print(f"\n[PIPELINE INFO]", flush=True)
        print(f"  Route: {state.get('route')}", flush=True)
        print(f"  Rewritten Query: {state.get('rewritten_query')}", flush=True)
        print(f"  Retrieval Status: {state.get('retrieval_status')}", flush=True)

        print(f"\n[RETRIEVAL DEBUG OUTPUT & APPROVAL METADATA]", flush=True)
        sources = state.get("sources", [])
        print(f"  Total internal chunks retrieved: {len(sources)}", flush=True)
        for idx, s in enumerate(sources, start=1):
            source_file = s.get("source")
            page = s.get("page")
            approval = s.get("approval_status")
            score = s.get("hybrid_score")
            print(f"  Chunk {idx}: source='{source_file}' | page={page} | approval='{approval}' | score={score}", flush=True)

        # 2. Build final prompt and generate response
        messages = build_response_messages(state)
        response = await model.ainvoke(messages)
        answer = response.content

        print(f"\n[FINAL GENERATED ANSWER]", flush=True)
        print("-" * 80, flush=True)
        print(answer, flush=True)
        print("-" * 80, flush=True)

if __name__ == "__main__":
    asyncio.run(run_test())
