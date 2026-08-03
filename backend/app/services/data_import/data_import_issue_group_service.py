from collections import Counter, defaultdict
from typing import Any


MAX_SAMPLE_VALUES = 5


def build_issue_groups(
    *,
    import_id: str,
    analysis: dict[str, Any],
    issues_by_column: dict[str, list[dict[str, Any]]],
) -> dict[str, Any]:
    columns_by_index = _build_columns_by_index(analysis)
    grouped: dict[tuple[int, str, str, str | None], list[dict[str, Any]]] = defaultdict(list)

    for raw_column_index, issues in issues_by_column.items():
        fallback_column_index = _safe_int(raw_column_index, default=-1)

        for issue in issues:
            column_index = _safe_int(
                issue.get("column_index"),
                default=fallback_column_index,
            )

            if column_index < 0:
                continue

            key = (
                column_index,
                str(issue.get("code") or "unknown_issue"),
                str(issue.get("severity") or "warning"),
                issue.get("expected_type"),
            )

            grouped[key].append(issue)

    groups = [
        _build_group_payload(
            key=key,
            issues=issues,
            columns_by_index=columns_by_index,
        )
        for key, issues in grouped.items()
    ]

    groups.sort(
        key=lambda group: (
            0 if group["severity"] == "error" else 1,
            -group["count"],
            group["column_index"],
            group["code"],
        )
    )

    total_issues = sum(group["count"] for group in groups)
    blocking_issues = sum(group["count"] for group in groups if group["severity"] == "error")
    warning_issues = sum(group["count"] for group in groups if group["severity"] == "warning")

    return {
        "import_id": import_id,
        "total_groups": len(groups),
        "total_issues": total_issues,
        "blocking_issues": blocking_issues,
        "warning_issues": warning_issues,
        "groups": groups,
    }


def _build_columns_by_index(
    analysis: dict[str, Any],
) -> dict[int, dict[str, Any]]:
    columns_by_index: dict[int, dict[str, Any]] = {}

    for column in analysis.get("columns_summary") or []:
        column_index = _safe_int(column.get("index"), default=-1)

        if column_index >= 0:
            columns_by_index[column_index] = column

    return columns_by_index


def _build_group_payload(
    *,
    key: tuple[int, str, str, str | None],
    issues: list[dict[str, Any]],
    columns_by_index: dict[int, dict[str, Any]],
) -> dict[str, Any]:
    column_index, code, severity, expected_type = key
    column = columns_by_index.get(column_index, {})

    affected_rows = {_safe_int(issue.get("row_index"), default=-1) for issue in issues}
    affected_rows.discard(-1)

    sample_values = _build_sample_values(issues)

    return {
        "id": _build_group_id(
            column_index=column_index,
            code=code,
            severity=severity,
            expected_type=expected_type,
        ),
        "code": code,
        "severity": severity if severity in {"warning", "error"} else "warning",
        "message_key": str(issues[0].get("message_key") if issues else "dataImport.issues.unknown"),
        "section": column.get("section") or "unclassified",
        "column_index": column_index,
        "column_name": (column.get("original_name") or column.get("normalized_name") or f"Column {column_index}"),
        "detected_type": column.get("detected_type") or "text",
        "expected_type": expected_type,
        "count": len(issues),
        "affected_rows": len(affected_rows),
        "sample_values": sample_values,
    }


def _build_sample_values(
    issues: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    counter: Counter[str | None] = Counter()

    for issue in issues:
        value = issue.get("actual_value")

        if value is None:
            normalized_value = None
        else:
            normalized_value = str(value).strip()

        counter[normalized_value] += 1

    return [
        {
            "value": value,
            "count": count,
        }
        for value, count in counter.most_common(MAX_SAMPLE_VALUES)
    ]


def _build_group_id(
    *,
    column_index: int,
    code: str,
    severity: str,
    expected_type: str | None,
) -> str:
    expected = expected_type or "none"

    return f"{column_index}:{code}:{severity}:{expected}"


def _safe_int(value: Any, *, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default
