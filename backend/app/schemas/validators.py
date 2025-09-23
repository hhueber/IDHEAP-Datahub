from typing import Annotated
import re


from pydantic import AfterValidator


_NAME_RE = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'\-]+$")


def _validate_full_name(v: str) -> str:
    v = " ".join(v.split()).strip()
    if "<" in v or ">" in v:
        raise ValueError("full_name ne doit pas contenir '<' ni '>'")
    if not _NAME_RE.match(v):
        raise ValueError("full_name contient des caractères non autorisés")
    return v


def _validate_password(v: str) -> str:
    if len(v) < 10:
        raise ValueError("Mot de passe trop court (min. 10 caractères)")
    if "<" in v or ">" in v:
        raise ValueError("Le mot de passe ne doit pas contenir '<' ni '>'")
    if not re.search(r"[A-Z]", v):
        raise ValueError("Le mot de passe doit contenir au moins une majuscule")
    if not re.search(r"[a-z]", v):
        raise ValueError("Le mot de passe doit contenir au moins une minuscule")
    if not re.search(r"\d", v):
        raise ValueError("Le mot de passe doit contenir au moins un chiffre")
    if not re.search(r"[^\w\s]", v):
        raise ValueError("Le mot de passe doit contenir au moins un caractère spécial")
    return v


FullNameStr = Annotated[str, AfterValidator(_validate_full_name)]
PasswordStr = Annotated[str, AfterValidator(_validate_password)]
