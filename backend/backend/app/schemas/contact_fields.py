from typing import Annotated

from pydantic import BeforeValidator, StringConstraints


def _empty_to_none(value: object) -> object:
    if isinstance(value, str) and not value.strip():
        return None
    return value


NameField = Annotated[
    Annotated[
        str,
        StringConstraints(
            pattern=r"^[A-Za-z][A-Za-z\s'.-]*$",
            min_length=1,
            max_length=255,
        ),
    ] | None,
    BeforeValidator(_empty_to_none),
]


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

Gstin = Annotated[
    Annotated[
        str,
        StringConstraints(
            pattern=r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
            min_length=15,
            max_length=15,
        ),
    ] | None,
    BeforeValidator(_empty_to_none),
]

HsnCode = Annotated[
    Annotated[
        str,
        StringConstraints(pattern=r"^\d{2,8}$", min_length=2, max_length=8),
    ] | None,
    BeforeValidator(_empty_to_none),
]
