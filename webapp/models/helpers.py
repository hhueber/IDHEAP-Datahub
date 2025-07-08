"""
Define a consistent naming convention for SQLAlchemy schema constructs.
Using these templates helps ensure that database objects like indexes,
unique constraints, foreign keys, and primary keys follow a predictable
and collision-free naming pattern across all tables.
"""
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
