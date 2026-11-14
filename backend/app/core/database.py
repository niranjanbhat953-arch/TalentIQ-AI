import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseRepository:
    """
    Unified database repository supporting Cloud Firestore and
    high-fidelity persisted local storage for development/offline testing.
    """
    def __init__(self):
        self._firestore_client = None
        self._local_db_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "storage", "local_db.json"
        )
        self._local_storage: Dict[str, Dict[str, Any]] = {
            "users": {},
            "jobs": {},
            "resumes": {},
            "screeningRuns": {},
            "candidateResults": {},
            "interviewQuestionSets": {},
            "activityLogs": {},
            "settings": {},
        }
        self._init_backend()

    def _init_backend(self):
        try:
            from google.cloud import firestore
            if settings.FIREBASE_CREDENTIALS_PATH or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
                self._firestore_client = firestore.Client(project=settings.FIREBASE_PROJECT_ID)
                logger.info(f"Connected to Cloud Firestore for project '{settings.FIREBASE_PROJECT_ID}'")
                return
        except Exception as e:
            logger.info(f"Cloud Firestore direct client not active: {e}. Using persisted local repository.")

        # Load local database if exists
        if os.path.exists(self._local_db_path):
            try:
                with open(self._local_db_path, "r", encoding="utf-8") as f:
                    self._local_storage = json.load(f)
            except Exception as e:
                logger.warning(f"Error loading local_db.json: {e}")

    def _persist_local(self):
        if self._firestore_client is None:
            try:
                os.makedirs(os.path.dirname(self._local_db_path), exist_ok=True)
                with open(self._local_db_path, "w", encoding="utf-8") as f:
                    json.dump(self._local_storage, f, indent=2, default=str)
            except Exception as e:
                logger.warning(f"Failed to persist local database: {e}")

    async def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        if self._firestore_client:
            try:
                doc = self._firestore_client.collection(collection).document(doc_id).get()
                if doc.exists:
                    data = doc.to_dict()
                    data["id"] = doc.id
                    return data
                return None
            except Exception as e:
                logger.error(f"Firestore get_document error: {e}")

        # Local storage lookup
        return self._local_storage.get(collection, {}).get(doc_id)

    async def set_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        data["id"] = doc_id
        if "updatedAt" not in data:
            data["updatedAt"] = datetime.now(timezone.utc).isoformat()

        if self._firestore_client:
            try:
                self._firestore_client.collection(collection).document(doc_id).set(data)
                return data
            except Exception as e:
                logger.error(f"Firestore set_document error: {e}")

        # Local storage update
        if collection not in self._local_storage:
            self._local_storage[collection] = {}
        self._local_storage[collection][doc_id] = data
        self._persist_local()
        return data

    async def update_document(self, collection: str, doc_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        updates["updatedAt"] = datetime.now(timezone.utc).isoformat()
        
        if self._firestore_client:
            try:
                doc_ref = self._firestore_client.collection(collection).document(doc_id)
                doc_ref.update(updates)
                doc = doc_ref.get()
                if doc.exists:
                    d = doc.to_dict()
                    d["id"] = doc.id
                    return d
                return None
            except Exception as e:
                logger.error(f"Firestore update_document error: {e}")

        existing = self._local_storage.get(collection, {}).get(doc_id)
        if not existing:
            return None
        existing.update(updates)
        self._local_storage[collection][doc_id] = existing
        self._persist_local()
        return existing

    async def delete_document(self, collection: str, doc_id: str) -> bool:
        if self._firestore_client:
            try:
                self._firestore_client.collection(collection).document(doc_id).delete()
                return True
            except Exception as e:
                logger.error(f"Firestore delete_document error: {e}")

        if collection in self._local_storage and doc_id in self._local_storage[collection]:
            del self._local_storage[collection][doc_id]
            self._persist_local()
            return True
        return False

    async def query_documents(
        self,
        collection: str,
        filters: Optional[List[tuple]] = None,
        order_by: Optional[str] = None,
        descending: bool = True,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        filters: list of (field, operator, value) e.g. [("ownerId", "==", uid)]
        """
        if self._firestore_client:
            try:
                query = self._firestore_client.collection(collection)
                if filters:
                    for field, op, val in filters:
                        query = query.where(field, op, val)
                if order_by:
                    direction = firestore.Query.DESCENDING if descending else firestore.Query.ASCENDING
                    query = query.order_by(order_by, direction=direction)
                if limit:
                    query = query.limit(limit)
                
                results = []
                for doc in query.stream():
                    d = doc.to_dict()
                    d["id"] = doc.id
                    results.append(d)
                return results
            except Exception as e:
                logger.error(f"Firestore query error: {e}")

        # Local storage querying
        items = list(self._local_storage.get(collection, {}).values())
        if filters:
            for field, op, val in filters:
                if op == "==":
                    items = [it for it in items if it.get(field) == val]
                elif op == "!=":
                    items = [it for it in items if it.get(field) != val]
                elif op == "in":
                    items = [it for it in items if it.get(field) in val]
                elif op == ">=":
                    items = [it for it in items if it.get(field) is not None and it.get(field) >= val]
                elif op == "<=":
                    items = [it for it in items if it.get(field) is not None and it.get(field) <= val]

        if order_by:
            items.sort(key=lambda x: str(x.get(order_by, "")), reverse=descending)

        if limit:
            items = items[:limit]

        return items

db = DatabaseRepository()
