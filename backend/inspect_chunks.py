
import chromadb

client = chromadb.PersistentClient(path="vector_store")

collection = client.get_collection(
    name="netcore_knowledge"
)

results = collection.get(
    where={"topic": "customer_success"},
    include=["documents", "metadatas"],
)

print("Total customer-success chunks:", len(results["documents"]))

for document, metadata in zip(
    results["documents"],
    results["metadatas"],
):
    print("\n" + "=" * 80)
    print("CHUNK:", metadata["chunk_index"])
    print("SECTION:", metadata["section"])
    print("=" * 80)
    print(document)
