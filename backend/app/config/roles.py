from enum import Enum

class Role(str, Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"

# Liste (tuple) des valeurs
ROLE_VALUES: tuple[str, ...] = tuple(r.value for r in Role)
