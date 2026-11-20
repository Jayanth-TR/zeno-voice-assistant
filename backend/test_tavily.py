import asyncio
import json

from app.tools.web_search import search_web


async def main():

    result = await search_web(
        query="Latest artificial intelligence trends in 2026",
        time_range="month",
        topic="news",
    )

    print("\n========== TAVILY SEARCH TEST ==========")

    print("Status:", result["status"])

    for index, item in enumerate(result["results"], start=1):

        print(f"\n--- RESULT {index} ---")
        print("Title:", item["title"])
        print("URL:", item["url"])
        print("Content:", item["content"][:500])

    print("\n========== SOURCES ==========")
    print(json.dumps(result["sources"], indent=2))

    print("\n========================================")


if __name__ == "__main__":
    asyncio.run(main())