from app.schemas.pageShow import (
    ShowChildColumn,
    ShowMeta,
    ShowMetaActions,
    ShowMetaChild,
    ShowMetaChildActions,
    ShowMetaField,
)


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
        children=[
            ShowMetaChild(
                key="communes",
                title="Communes",
                entity="commune",
                fk_field="district_uid",
                per_page=10,
                columns=[
                    ShowChildColumn(key="uid", label="UID", kind="number"),
                    ShowChildColumn(key="code", label="Code"),
                    ShowChildColumn(key="name", label="Name"),
                ],
                actions=ShowMetaChildActions(show=True, edit=False, delete=False),
            )
        ],
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
        children=[
            ShowMetaChild(
                key="districts",
                title="Districts",
                entity="district",
                fk_field="canton_uid",
                per_page=10,
                columns=[
                    ShowChildColumn(key="uid", label="UID", kind="number"),
                    ShowChildColumn(key="code", label="Code"),
                    ShowChildColumn(key="name", label="Name"),
                ],
                actions=ShowMetaChildActions(show=True, edit=False, delete=False),
            )
        ],
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
        children=[
            ShowMetaChild(
                key="questions",
                title="Questions per survey",
                entity="question_per_survey",
                fk_field="survey_uid",
                per_page=10,
                columns=[
                    ShowChildColumn(key="uid", label="UID", kind="number"),
                    ShowChildColumn(key="code", label="Code"),
                    ShowChildColumn(key="label", label="Label"),
                    ShowChildColumn(key="private", label="Private", kind="bool"),
                ],
                actions=ShowMetaChildActions(show=True, edit=True, delete=True),
            )
        ],
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
        children=[
            ShowMetaChild(
                key="answers",
                title="Answers",
                entity="answer",
                fk_field="question_uid",
                per_page=10,
                columns=[
                    ShowChildColumn(key="uid", label="UID", kind="number"),
                    ShowChildColumn(key="year", label="Year", kind="year"),
                    ShowChildColumn(key="commune_uid", label="Commune uid", kind="number"),
                    ShowChildColumn(key="option_uid", label="Option uid", kind="number"),
                    ShowChildColumn(key="value", label="Value"),
                ],
                actions=ShowMetaChildActions(show=True, edit=True, delete=True),
            ),
        ],
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
        children=[
            ShowMetaChild(
                key="questions_linked",
                title="Linked questions (per survey)",
                entity="question_per_survey",
                fk_field="question_global_uid",
                per_page=10,
                columns=[
                    ShowChildColumn(key="uid", label="UID", kind="number"),
                    ShowChildColumn(key="code", label="Code"),
                    ShowChildColumn(key="label", label="Label"),
                    ShowChildColumn(key="private", label="Private", kind="bool"),
                    ShowChildColumn(key="survey_uid", label="Survey uid", kind="number"),
                ],
                actions=ShowMetaChildActions(show=True, edit=True, delete=True),
            )
        ],
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
        children=[
            ShowMetaChild(
                key="options",
                title="Options",
                entity="option",
                fk_field="question_category_uid",
                per_page=10,
                columns=[
                    ShowChildColumn(key="uid", label="UID", kind="number"),
                    ShowChildColumn(key="value", label="Value"),
                    ShowChildColumn(key="label", label="Label"),
                ],
                actions=ShowMetaChildActions(show=True, edit=True, delete=True),
            ),
            ShowMetaChild(
                key="questions_global",
                title="Global questions",
                entity="question_global",
                fk_field="question_category_uid",
                per_page=10,
                columns=[
                    ShowChildColumn(key="uid", label="UID", kind="number"),
                    ShowChildColumn(key="label", label="Label"),
                ],
                actions=ShowMetaChildActions(show=True, edit=True, delete=True),
            ),
            ShowMetaChild(
                key="questions_per_survey",
                title="Questions per survey",
                entity="question_per_survey",
                fk_field="question_category_uid",
                per_page=10,
                columns=[
                    ShowChildColumn(key="uid", label="UID", kind="number"),
                    ShowChildColumn(key="code", label="Code"),
                    ShowChildColumn(key="label", label="Label"),
                    ShowChildColumn(key="private", label="Private", kind="bool"),
                    ShowChildColumn(key="survey_uid", label="Survey uid", kind="number"),
                ],
                actions=ShowMetaChildActions(show=True, edit=True, delete=True),
            ),
        ],
    ),
    "option": ShowMeta(
        entity="option",
        title_key="value",
        hide_keys=["uid"],
        fields=[
            ShowMetaField(key="value", label="Value"),
            ShowMetaField(key="label", label="Label"),
            ShowMetaField(key="question_category_uid", label="Category uid", kind="number"),
        ],
        languages={"de": "text_de", "fr": "text_fr", "en": "text_en", "it": "text_it", "ro": "text_ro"},
        actions=ShowMetaActions(can_edit=True, can_delete=True),
        children=[
            ShowMetaChild(
                key="answers",
                title="Answers",
                entity="answer",
                fk_field="option_uid",
                per_page=10,
                columns=[
                    ShowChildColumn(key="uid", label="UID", kind="number"),
                    ShowChildColumn(key="year", label="Year", kind="year"),
                    ShowChildColumn(key="question_uid", label="Question uid", kind="number"),
                    ShowChildColumn(key="commune_uid", label="Commune uid", kind="number"),
                    ShowChildColumn(key="value", label="Value"),
                ],
                actions=ShowMetaChildActions(show=True, edit=True, delete=True),
            ),
        ],
    ),
    "answer": ShowMeta(
        entity="answer",
        title_key="uid",  # ou "year"
        hide_keys=["uid"],
        fields=[
            ShowMetaField(key="year", label="Year", kind="year"),
            ShowMetaField(key="question_uid", label="Question uid", kind="number"),
            ShowMetaField(key="commune_uid", label="Commune uid", kind="number"),
            ShowMetaField(key="option_uid", label="Option uid", kind="number"),
            ShowMetaField(key="value", label="Value"),
        ],
        languages=None,
        actions=ShowMetaActions(can_edit=True, can_delete=True),
    ),
}


def get_meta_for_entity(entity: str) -> ShowMeta | None:
    return ENTITY_META.get(entity)
