import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import dotenv
dotenv.load_dotenv(os.path.join(backend_dir, ".env"))
os.environ.setdefault("TAVILY_API_KEY", "mock_key")
os.environ.setdefault("OPENAI_API_KEY", "mock_key")
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

import asyncio
from unittest.mock import AsyncMock, patch
from langchain_core.messages import AIMessageChunk
from starlette.testclient import TestClient
from app.main import app

async def mock_astream_generator(chunks):
    for chunk in chunks:
        yield AIMessageChunk(content=chunk)

def test_four_scenarios_mocked():
    client = TestClient(app)

    scenarios = [
        {
            "name": "General Question",
            "message": "What is an algorithm?",
            "mock_graph_state": {
                "route": "general",
                "retrieved_context": "",
                "web_context": "",
                "sources": [],
                "web_sources": [],
                "retrieval_status": "not_requested",
                "web_status": "not_requested",
                "messages": [],
            },
            "stream_chunks": ["An algorithm is a ", "step-by-step procedure ", "for solving a problem."],
            "expected_internal_count": 0,
            "expected_web_count": 0,
        },
        {
            "name": "RAG Question",
            "message": "What is Netcore's operating principle?",
            "mock_graph_state": {
                "route": "rag",
                "retrieved_context": "Humans Imagine. Agents Optimize for Outcomes.",
                "web_context": "",
                "sources": [
                    {
                        "source": "01_company_overview.md",
                        "page": None,
                        "file_type": "knowledge_base",
                        "approval_status": "requires_validation",
                        "document_id": None,
                        "hybrid_score": 0.85,
                    }
                ],
                "web_sources": [],
                "retrieval_status": "success",
                "web_status": "not_requested",
                "messages": [],
            },
            "stream_chunks": ["Netcore's operating principle is ", "Humans Imagine, Agents Optimize for Outcomes."],
            "expected_internal_count": 1,
            "expected_web_count": 0,
        },
        {
            "name": "Web Search Question",
            "message": "What are the latest AI news today?",
            "mock_graph_state": {
                "route": "web_search",
                "retrieved_context": "",
                "web_context": "Recent AI advancements in 2026...",
                "sources": [],
                "web_sources": [
                    {
                        "title": "TechCrunch AI News",
                        "url": "https://techcrunch.com/category/artificial-intelligence/",
                    }
                ],
                "retrieval_status": "not_requested",
                "web_status": "success",
                "messages": [],
            },
            "stream_chunks": ["Today in AI news, ", "models are demonstrating stronger reasoning."],
            "expected_internal_count": 0,
            "expected_web_count": 1,
        },
        {
            "name": "Hybrid Question",
            "message": "How does Netcore utilize latest agent trends?",
            "mock_graph_state": {
                "route": "hybrid",
                "retrieved_context": "Netcore agentic marketing agents...",
                "web_context": "Autonomous marketing agents in 2026...",
                "sources": [
                    {
                        "source": "03_ai_agents.md",
                        "page": 1,
                        "file_type": "knowledge_base",
                        "approval_status": "client_approved",
                        "document_id": None,
                        "hybrid_score": 0.91,
                    }
                ],
                "web_sources": [
                    {
                        "title": "Marketing Week 2026",
                        "url": "https://marketingweek.com/agentic-trends",
                    }
                ],
                "retrieval_status": "success",
                "web_status": "success",
                "messages": [],
            },
            "stream_chunks": ["Netcore integrates autonomous agents ", "aligned with current 2026 agentic trends."],
            "expected_internal_count": 1,
            "expected_web_count": 1,
        },
    ]

    for scenario in scenarios:
        print(f"\n==========================================")
        print(f"RUNNING: {scenario['name']}")
        print(f"==========================================")

        with patch("app.main.conversation_graph.ainvoke", new_callable=AsyncMock) as mock_graph, \
             patch("app.main.model") as mock_model, \
             patch("app.main.generate_sentence_tts", new_callable=AsyncMock) as mock_tts:

            mock_graph.return_value = scenario["mock_graph_state"]
            mock_tts.return_value = "bW9ja19hdWRpb19kYXRh"  # mock base64 audio
            chunks_to_send = list(scenario["stream_chunks"])
            mock_model.astream.side_effect = lambda *a, chunks=chunks_to_send, **kw: mock_astream_generator(chunks)

            with client.websocket_connect("/ws/voice") as ws:
                req_id = f"req-{scenario['name'].replace(' ', '-').lower()}"
                ws.send_json({
                    "type": "user_message",
                    "request_id": req_id,
                    "message": scenario["message"],
                })

                sentences = []
                complete_event = None

                while True:
                    data = ws.receive_json()
                    msg_type = data.get("type")

                    if msg_type == "assistant_start":
                        assert data.get("request_id") == req_id
                        print(f"  [OK] Received assistant_start")

                    elif msg_type == "assistant_sentence":
                        assert data.get("request_id") == req_id
                        sentence = data.get("message")
                        sentences.append(sentence)
                        print(f"  [OK] Sentence: \"{sentence}\"")
                        # Verify NO source URLs or metadata in sentence text
                        assert "http://" not in sentence and "https://" not in sentence
                        assert "01_company_overview" not in sentence

                    elif msg_type == "assistant_audio":
                        assert data.get("request_id") == req_id
                        assert "audio" in data and len(data["audio"]) > 0
                        print(f"  [OK] Received assistant_audio for sentence {data.get('sentence_index')}")

                    elif msg_type == "assistant_complete":
                        complete_event = data
                        print(f"  [OK] Received assistant_complete")
                        break

                    elif msg_type == "error":
                        raise RuntimeError(f"Unexpected error: {data}")

                # Validate assistant_complete payload
                assert complete_event is not None
                assert complete_event.get("request_id") == req_id
                sources = complete_event.get("sources")
                assert sources is not None, "assistant_complete must have 'sources'"
                assert "internal" in sources, "'sources' must have 'internal'"
                assert "web" in sources, "'sources' must have 'web'"

                internal = sources["internal"]
                web = sources["web"]

                print(f"  -> Internal sources: {len(internal)} (expected {scenario['expected_internal_count']})")
                print(f"  -> Web sources: {len(web)} (expected {scenario['expected_web_count']})")

                assert len(internal) == scenario["expected_internal_count"]
                assert len(web) == scenario["expected_web_count"]

                if internal:
                    assert internal[0]["source"] == scenario["mock_graph_state"]["sources"][0]["source"]
                if web:
                    assert web[0]["url"] == scenario["mock_graph_state"]["web_sources"][0]["url"]

                print(f"PASSED: {scenario['name']}")

if __name__ == "__main__":
    test_four_scenarios_mocked()
    print("\nALL 4 SCENARIOS PASSED SUCCESSFULLY!")
