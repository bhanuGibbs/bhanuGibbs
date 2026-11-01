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
            pattern=r"^[A-Za-z0-9][A-Za-z0-9\s'.-]*$",
            min_length=1,
            max_length=255,
        ),
    ] | None,
    BeforeValidator(_empty_to_none),
]


PhoneNumber = Annotated[
    Annotated[
        str,
        StringConstraints(pattern=r"^\+?[0-9]{6,15}$", min_length=6, max_length=15),
    ] | None,
    BeforeValidator(_empty_to_none),
]

Pincode = Annotated[
    Annotated[
        str,
        StringConstraints(pattern=r"^[A-Za-z0-9]{3,10}$", min_length=3, max_length=10),
    ] | None,
    BeforeValidator(_empty_to_none),
]

Gstin = Annotated[
    Annotated[
        str,
        StringConstraints(
            pattern=r"^[A-Za-z0-9]{1,20}$",
            min_length=1,
            max_length=20,
        ),
    ] | None,
    BeforeValidator(_empty_to_none),
]

HsnCode = Annotated[
    Annotated[
        str,
        StringConstraints(pattern=r"^[A-Za-z0-9]{2,8}$", min_length=2, max_length=8),
    ] | None,
    BeforeValidator(_empty_to_none),
]
