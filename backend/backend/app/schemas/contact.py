from pydantic import BaseModel, Field, EmailStr


class ContactForm(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr = Field(..., max_length=255)
    mobile: str = Field(..., min_length=6, max_length=15)
    message: str = Field(..., min_length=1, max_length=2048)
