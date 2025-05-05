from whoosh.index import open_dir
from whoosh.qparser import MultifieldParser

INDEX_DIR = "inventory_index"

def search_inventory(query_str, limit=10):
    ix = open_dir(INDEX_DIR)
    with ix.searcher() as searcher:
        parser = MultifieldParser(["Description", "Group", "Cost_Center"], schema=ix.schema)
        query = parser.parse(query_str)
        results = searcher.search(query, limit=limit)
        return [dict(hit) for hit in results]

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        results = search_inventory(" ".join(sys.argv[1:]))
        for r in results:
            print(r)
    else:
        print("Usage: python inv_search.py <search terms>")
