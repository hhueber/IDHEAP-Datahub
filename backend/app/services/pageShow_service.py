from typing import Any, Dict


from sqlalchemy.inspection import inspect


def serialize_columns(obj: Any, exclude: set[str] | None = None) -> Dict[str, Any]:
    exclude = exclude or set()
    mapper = inspect(obj.__class__)
    out: Dict[str, Any] = {}

    for col in mapper.columns:
        key = col.key
        if key in exclude:
            continue
        out[key] = getattr(obj, key)

    # cas spécial : Option.label est une property (label_)
    if obj.__class__.__name__ == "Option" and "label" not in exclude:
        out["label"] = getattr(obj, "label", None)

    return out
