from typing import Any, Dict, List, Literal, Optional


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

    relation_type: Literal["direct", "association"] = "direct"

    # direct relation
    fk_field: Optional[str] = None

    # association relation
    association_table: Optional[str] = None
    association_source_field: Optional[str] = None
    association_target_field: Optional[str] = None
    target_uid_field: str = "uid"

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


class ShowInsightsResponse(BaseModel):
    success: bool
    detail: str
    data: Optional[Dict[str, Any]] = None


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


class ShowInsightsMapChildLayer(BaseModel):
    child_key: str
    child_title: str
    child_entity: str
    features: List[Dict[str, Any]] = []
