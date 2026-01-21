from app.schemas.pageShow import ShowMeta, ShowMetaActions, ShowMetaField


LANG_MAP = {"de": "Deutsch", "fr": "Français", "en": "English", "it": "Italiano", "ro": "Rumantsch"}

ENTITY_META = {
    "commune": ShowMeta(
        entity="commune",
        title_key="name",
        hide_keys=["uid"],
        fields=[
            ShowMetaField(key="code", label="Code", kind="text"),
            ShowMetaField(key="name", label="Name", kind="text"),
        ],
        languages={"de": "name_de", "fr": "name_fr", "en": "name_en", "it": "name_it", "ro": "name_ro"},
        actions=ShowMetaActions(can_edit=False, can_delete=False),
    ),
    "district": ShowMeta(
        entity="district",
        title_key="name",
        hide_keys=["uid"],
        fields=[
            ShowMetaField(key="code", label="Code"),
            ShowMetaField(key="name", label="Name"),
        ],
        languages={"de": "name_de", "fr": "name_fr", "en": "name_en", "it": "name_it", "ro": "name_ro"},
        actions=ShowMetaActions(can_edit=False, can_delete=False),
    ),
    "canton": ShowMeta(
        entity="canton",
        title_key="name",
        hide_keys=["uid"],
        fields=[
            ShowMetaField(key="code", label="Code"),
            ShowMetaField(key="ofs_id", label="OFS id", kind="number"),
            ShowMetaField(key="name", label="Name"),
        ],
        languages={"de": "name_de", "fr": "name_fr", "en": "name_en", "it": "name_it", "ro": "name_ro"},
        actions=ShowMetaActions(can_edit=False, can_delete=False),
    ),
    "survey": ShowMeta(
        entity="survey",
        title_key="name",
        hide_keys=["uid"],
        fields=[
            ShowMetaField(key="name", label="Name"),
            ShowMetaField(key="year", label="Year", kind="year"),
        ],
        languages=None,
        actions=ShowMetaActions(can_edit=True, can_delete=True),
    ),
    "question_per_survey": ShowMeta(
        entity="question_per_survey",
        title_key="label",
        hide_keys=["uid"],
        fields=[
            ShowMetaField(key="code", label="Code"),
            ShowMetaField(key="label", label="Label"),
            ShowMetaField(key="private", label="Private", kind="bool"),
            ShowMetaField(key="survey_uid", label="Survey uid", kind="number"),
            ShowMetaField(key="question_category_uid", label="Category uid", kind="number"),
            ShowMetaField(key="question_global_uid", label="Global uid", kind="number"),
        ],
        languages={"de": "text_de", "fr": "text_fr", "en": "text_en", "it": "text_it", "ro": "text_ro"},
        actions=ShowMetaActions(can_edit=True, can_delete=True),
    ),
    "question_global": ShowMeta(
        entity="question_global",
        title_key="label",
        hide_keys=["uid"],
        fields=[
            ShowMetaField(key="label", label="Label"),
            ShowMetaField(key="question_category_uid", label="Category uid", kind="number"),
        ],
        languages={"de": "text_de", "fr": "text_fr", "en": "text_en", "it": "text_it", "ro": "text_ro"},
        actions=ShowMetaActions(can_edit=True, can_delete=True),
    ),
    "question_category": ShowMeta(
        entity="question_category",
        title_key="label",
        hide_keys=["uid"],
        fields=[
            ShowMetaField(key="label", label="Label"),
        ],
        languages={"de": "text_de", "fr": "text_fr", "en": "text_en", "it": "text_it", "ro": "text_ro"},
        actions=ShowMetaActions(can_edit=True, can_delete=True),
    ),
    "option": ShowMeta(
        entity="option",
        title_key="value",
        hide_keys=["uid"],
        fields=[
            ShowMetaField(key="value", label="Value"),
            ShowMetaField(key="label", label="Label"),  # attention: property; si pas colonne => on gère côté serializer
            ShowMetaField(key="question_category_uid", label="Category uid", kind="number"),
        ],
        languages={"de": "text_de", "fr": "text_fr", "en": "text_en", "it": "text_it", "ro": "text_ro"},
        actions=ShowMetaActions(can_edit=True, can_delete=True),
    ),
}


def get_meta_for_entity(entity: str) -> ShowMeta | None:
    return ENTITY_META.get(entity)
