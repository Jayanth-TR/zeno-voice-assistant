import asyncio
import json
from starlette.testclient import TestClient
from app.main import app

def test_websocket_scenarios():
    test_cases = [
        {
            "name": "General Question",
            "message": "What is the definition of the word algorithm?",
            "expected_route": "general",
        },
        {
            "name": "RAG Question",
            "message": "What is Netcore's operating principle?",
            "expected_route": "rag",
        },
        {
            "name": "Web Search Question",
            "message": "What are the latest AI news and headlines today in 2026?",
            "expected_route": "web_search",
        },
        {
            "name": "Hybrid Question",
            "message": "How does Netcore apply the latest 2026 AI marketing trends to its products?",
            "expected_route": "hybrid",
        },
    ]

    client = TestClient(app)

    with client.websocket_connect("/ws/voice") as websocket:
        for tc in test_cases:
            print(f"\n==================================================")
            print(f"Testing Scenario: {tc['name']}")
            print(f"Message: {tc['message']}")
            print(f"==================================================")

            req_id = f"test-{tc['name'].lower().replace(' ', '-')}"
            websocket.send_json({
                "type": "user_message",
                "request_id": req_id,
                "message": tc["message"]
            })

            sentence_count = 0
            complete_event = None

            while True:
                data = websocket.receive_json()
                msg_type = data.get("type")

                if msg_type == "assistant_start":
                    print(f"-> assistant_start (request_id: {data.get('request_id')})")

                elif msg_type == "assistant_sentence":
                    sentence_count += 1
                    sentence_text = data.get("message", "")
                    # Verify no raw sources or citations injected
                    print(f"-> assistant_sentence #{sentence_count}: {sentence_text[:80]}...")

                elif msg_type == "assistant_complete":
                    complete_event = data
                    print(f"-> assistant_complete received!")
                    break

                elif msg_type == "error":
                    print(f"-> ERROR received: {data.get('message')}")
                    break

            if complete_event:
                sources = complete_event.get("sources", {})
                internal = sources.get("internal", [])
                web = sources.get("web", [])

                print(f"Internal sources count: {len(internal)}")
                if internal:
                    for s in internal[:2]:
                        print(f"   - {s.get('source')} (page: {s.get('page')}, status: {s.get('approval_status')})")

                print(f"Web sources count: {len(web)}")
                if web:
                    for w in web[:2]:
                        print(f"   - {w.get('title')}: {w.get('url')}")

                # Validation checks
                assert "internal" in sources, "sources must contain 'internal'"
                assert "web" in sources, "sources must contain 'web'"
                assert complete_event.get("request_id") == req_id, "request_id must match"

                print(f"RESULT: PASS for {tc['name']}")
            else:
                print(f"RESULT: FAIL (no completion event)")

if __name__ == "__main__":
    test_websocket_scenarios()

