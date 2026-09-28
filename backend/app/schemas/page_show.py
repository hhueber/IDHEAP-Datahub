from typing import Any, Literal


from pydantic import BaseModel


class ShowMetaActions(BaseModel):
    can_edit: bool = False
    can_delete: bool = False


class ShowMetaField(BaseModel):
    key: str
    label: str
    kind: str = "text"
    group: str | None = None


class ShowChildColumn(BaseModel):
    key: str
    label: str
    kind: str = "text"
    align: str | None = None


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
    fk_field: str | None = None

    # association relation
    association_table: str | None = None
    association_source_field: str | None = None
    association_target_field: str | None = None
    target_uid_field: str = "uid"

    per_page: int = 10
    columns: list[ShowChildColumn]
    actions: ShowMetaChildActions = ShowMetaChildActions()


class ShowMeta(BaseModel):
    entity: str
    title_key: str
    hide_keys: list[str] = []
    fields: list[ShowMetaField] = []
    languages: dict[str, str] | None = None
    actions: ShowMetaActions | None = None
    children: list[ShowMetaChild] | None = None


class ShowResponse(BaseModel):
    success: bool
    detail: str
    meta: ShowMeta | None = None
    data: dict[str, Any] | None = None


# réponse paginée pour un child
class ShowInsightsResponse(BaseModel):
    success: bool
    detail: str
    data: dict[str, Any] | None = None


class ShowChildrenData(BaseModel):
    items: list[dict[str, Any]]
    total: int
    page: int
    per_page: int
    pages: int


class ShowChildrenResponse(BaseModel):
    success: bool
    detail: str
    data: ShowChildrenData | None = None


class ShowInsightsMapChildLayer(BaseModel):
    child_key: str
    child_title: str
    child_entity: str
    features: list[dict[str, Any]] = []
