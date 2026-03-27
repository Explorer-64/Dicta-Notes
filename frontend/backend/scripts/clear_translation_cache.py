"""One-time script to clear all entries from the translationCache Firestore collection."""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

import firebase_admin
from firebase_admin import credentials, firestore

sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
if not sa_json:
    print("ERROR: FIREBASE_SERVICE_ACCOUNT not set in .env")
    sys.exit(1)

sa_dict = json.loads(sa_json)
cred = credentials.Certificate(sa_dict)
firebase_admin.initialize_app(cred)
db = firestore.client()

collection = db.collection("translationCache")
deleted = 0

while True:
    docs = collection.limit(500).get()
    if not docs:
        break
    batch = db.batch()
    for doc in docs:
        batch.delete(doc.reference)
        deleted += 1
    batch.commit()
    print(f"Deleted {deleted} entries so far...")
    if len(docs) < 500:
        break

print(f"Done. Cleared {deleted} translation cache entries.")
