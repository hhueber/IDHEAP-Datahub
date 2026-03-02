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


class ShowChildColumn(BaseModel):
    key: str
    label: str
    kind: str = "text"
    align: Optional[str] = None


class ShowMetaChildActions(BaseModel):
    show: bool = True
    edit: bool = False
    delete: bool = False


class ShowMetaChild(BaseModel):
    key: str
    title: str
    entity: str
    fk_field: str
    per_page: int = 10
    columns: List[ShowChildColumn]
    actions: ShowMetaChildActions = ShowMetaChildActions()


class ShowMeta(BaseModel):
    entity: str
    title_key: str
    hide_keys: List[str] = []
    fields: List[ShowMetaField] = []
    languages: Optional[Dict[str, str]] = None
    actions: Optional[ShowMetaActions] = None
    children: Optional[List[ShowMetaChild]] = None


class ShowResponse(BaseModel):
    success: bool
    detail: str
    meta: Optional[ShowMeta] = None
    data: Optional[Dict[str, Any]] = None


# réponse paginée pour un child
class ShowChildrenData(BaseModel):
    items: List[Dict[str, Any]]
    total: int
    page: int
    per_page: int
    pages: int


class ShowChildrenResponse(BaseModel):
    success: bool
    detail: str
    data: Optional[ShowChildrenData] = None
