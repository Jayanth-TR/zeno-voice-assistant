from app.rag.pdf_processor import collection

results = collection.get(
    where={
        "file_type": "pdf"
    },
    include=["documents", "metadatas"]
)

print("Total PDF chunks:", len(results["ids"]))

for document, metadata in zip(
    results["documents"][:5],
    results["metadatas"][:5]
):
    print("\nFilename:", metadata["source"])
    print("Page:", metadata["page"])
    print("Chunk:", metadata["chunk_index"])
    print("Content:", document[:300])