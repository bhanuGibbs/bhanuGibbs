from typing import Annotated

from pydantic import BeforeValidator, StringConstraints


def _empty_to_none(value: object) -> object:
    if isinstance(value, str) and not value.strip():
        return None
    return value


PhoneNumber = Annotated[
    Annotated[
        str,
        StringConstraints(pattern=r"^\d{10}$", min_length=10, max_length=10),
    ] | None,
    BeforeValidator(_empty_to_none),
]

Pincode = Annotated[
    Annotated[
        str,
        StringConstraints(pattern=r"^\d{6}$", min_length=6, max_length=6),
    ] | None,
    BeforeValidator(_empty_to_none),
]
