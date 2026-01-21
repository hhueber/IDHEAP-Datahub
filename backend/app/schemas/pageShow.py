from typing import Any, Dict, List, Optional


from pydantic import BaseModel


class ShowMetaActions(BaseModel):
    can_edit: bool = False
    can_delete: bool = False


class ShowMetaField(BaseModel):
    key: str
    label: str
    kind: str = "text"
    group: Optional[str] = None


class ShowMeta(BaseModel):
    entity: str
    title_key: str
    hide_keys: List[str] = []
    fields: List[ShowMetaField] = []
    languages: Optional[Dict[str, str]] = None
    actions: ShowMetaActions = ShowMetaActions()


class ShowResponse(BaseModel):
    success: bool
    detail: str
    meta: Optional[ShowMeta] = None
    data: Optional[Dict[str, Any]] = None
