from __future__ import annotations

from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session
from app.schemas.quotation import (
    InvoicePaymentStatusUpdate,
    QuotationCreate,
    QuotationRead,
    QuotationSubmit,
    QuotationUpdate,
)
from app.services.customer_service import CustomerService
from app.services.pdf_service import PDFService
from app.services.product_service import ProductService
from app.services.quotation_service import QuotationService
from app.utils.pdf_generator import generate_pdf_from_data, render_template

router = APIRouter(prefix="/quotations", tags=["Quotations"])


async def _resolve_quotation_product(item_data, product_service, company_id, current_user):
    if item_data.product_id:
        product = await product_service.get_product(str(item_data.product_id))
        if (
            not product
            or str(product.company_id) != company_id
            or str(product.created_by_id) != current_user["id"]
        ):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
        return product

    product_name = item_data.product_name or "Product"
    product = None
    if item_data.sku:
        product = await product_service.repository.get_by_sku(
            item_data.sku, company_id, current_user["id"]
        )
    if not product:
        product = await product_service.repository.get_by_name_and_company(
            product_name, company_id, current_user["id"]
        )
    if not product:
        product = await product_service.create_product(
            name=product_name,
            price=item_data.unit_price,
            description=item_data.description,
            sku=item_data.sku,
            gst_percentage=item_data.gst,
            unit=item_data.unit,
            hsn_code=item_data.hsn_code,
            company_id=company_id,
            created_by_id=current_user["id"],
        )
    return product


@router.get("/form", response_class=HTMLResponse)
async def quotation_form() -> HTMLResponse:
    """Render the quotation input form."""
    html = render_template("quotation_form.html", {})
    return HTMLResponse(content=html)


@router.post("/form")
async def generate_quotation_pdf_from_form(request: Request) -> Response:
    """Generate a PDF from submitted quotation form data."""
    try:
        form = await request.form()
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Form parsing failed. Install 'python-multipart' in the running environment and restart the server.",
        ) from exc

    product_names = form.getlist("product_name")
    quantities = form.getlist("quantity")
    unit_prices = form.getlist("unit_price")

    items = []
    for name, qty, price in zip(product_names, quantities, unit_prices):
        if not name:
            continue

        try:
            quantity = int(qty)
            unit_price = Decimal(price)
        except (ValueError, InvalidOperation):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid quantity or unit price for product '{name}'.",
            )

        if quantity <= 0 or unit_price < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quantity must be positive and price must be non-negative for product '{name}'.",
            )

        items.append(
            {
                "product_name": name,
                "quantity": quantity,
                "unit_price": str(unit_price),
                "total_price": str(unit_price * quantity),
            }
        )

    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one valid product line is required to generate a quotation.",
        )

    total_amount = sum(Decimal(item["total_price"]) for item in items)

    context = {
        "quotation": {
            "reference_number": form.get("reference_number", "Q-0001"),
            "title": form.get("title", "Quotation"),
            "description": form.get("description", ""),
            "issued_at": form.get("issued_at", ""),
            "total_amount": str(total_amount),
        },
        "company": {
            "name": form.get("company_name", ""),
            "address": form.get("company_address", ""),
            "email": form.get("company_email", ""),
        },
        "customer": {
            "name": form.get("customer_name", ""),
            "email": form.get("customer_email", ""),
        },
        "items": items,
    }

    pdf_bytes = generate_pdf_from_data(context)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=quotation_{context['quotation']['reference_number']}.pdf"},
    )


@router.post("/submit", response_model=QuotationRead, status_code=status.HTTP_201_CREATED)
async def submit_quotation(
    payload: QuotationSubmit,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> QuotationRead:
    """Create a new quotation from form-style data and persist it."""
    if current_user["role"] not in {"Super Admin", "Admin", "Manager", "Sales"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    if not current_user["company_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company profile is required before creating quotations.",
        )

    company_id = current_user["company_id"]
    customer_service = CustomerService(session)
    product_service = ProductService(session)
    quotation_service = QuotationService(session)

    existing_customer = None
    if payload.customer.email:
        existing_customer = await customer_service.repository.get_by_email(
            payload.customer.email, company_id, current_user["id"]
        )
    if not existing_customer and payload.customer.name:
        existing_customer = await customer_service.repository.get_by_name_and_company(
            payload.customer.name, company_id, current_user["id"]
        )

    if existing_customer:
        customer = await customer_service.update_customer(
            customer_id=str(existing_customer.id),
            name=payload.customer.name,
            email=payload.customer.email,
            phone_number=payload.customer.phone_number,
            address=payload.customer.address,
            company_name=payload.customer.company_name,
            gstin=payload.customer.gstin,
            country=payload.customer.country,
            state=payload.customer.state,
            city=payload.customer.city,
            pincode=payload.customer.pincode,
        )
    else:
        customer = await customer_service.create_customer(
            name=payload.customer.name,
            email=payload.customer.email,
            phone_number=payload.customer.phone_number,
            address=payload.customer.address,
            company_name=payload.customer.company_name,
            company_id=company_id,
            gstin=payload.customer.gstin,
            country=payload.customer.country,
            state=payload.customer.state,
            city=payload.customer.city,
            pincode=payload.customer.pincode,
            created_by_id=current_user["id"],
        )

    line_items = []
    for item_data in payload.items:
        product = await _resolve_quotation_product(item_data, product_service, company_id, current_user)

        line_items.append(
            {
                "product_id": str(product.id),
                "item_name": item_data.product_name or product.name,
                "description": item_data.description,
                "unit": item_data.unit,
                "quantity": item_data.quantity,
                "unit_price": item_data.unit_price,
                "discount": item_data.discount,
                "gst": item_data.gst,
            }
        )

    quotation = await quotation_service.create_quotation(
        reference_number=payload.reference_number,
        title=payload.title,
        description=payload.description,
        customer_id=str(customer.id),
        company_id=company_id,
        issued_at=payload.issued_at.isoformat(),
        items=line_items,
        created_by_id=current_user["id"],
        created_by_username=current_user["username"],
        shipping_amount=payload.shipping_amount,
    )
    return QuotationRead.from_orm(quotation)


@router.post("/draft", response_model=QuotationRead, status_code=status.HTTP_201_CREATED)
async def create_quotation_draft(
    payload: QuotationSubmit,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> QuotationRead:
    """Create or update a draft quotation for preview."""
    if current_user["role"] not in {"Super Admin", "Admin", "Manager", "Sales"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    if not current_user["company_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company profile is required before creating quotations.",
        )

    company_id = current_user["company_id"]
    customer_service = CustomerService(session)
    product_service = ProductService(session)
    quotation_service = QuotationService(session)

    existing_customer = None
    if payload.customer.email:
        existing_customer = await customer_service.repository.get_by_email(
            payload.customer.email, company_id, current_user["id"]
        )
    if not existing_customer and payload.customer.name:
        existing_customer = await customer_service.repository.get_by_name_and_company(
            payload.customer.name, company_id, current_user["id"]
        )

    if existing_customer:
        customer = await customer_service.update_customer(
            customer_id=str(existing_customer.id),
            name=payload.customer.name,
            email=payload.customer.email,
            phone_number=payload.customer.phone_number,
            address=payload.customer.address,
            company_name=payload.customer.company_name,
            gstin=payload.customer.gstin,
            country=payload.customer.country,
            state=payload.customer.state,
            city=payload.customer.city,
            pincode=payload.customer.pincode,
        )
    else:
        customer = await customer_service.create_customer(
            name=payload.customer.name,
            email=payload.customer.email,
            phone_number=payload.customer.phone_number,
            address=payload.customer.address,
            company_name=payload.customer.company_name,
            company_id=company_id,
            gstin=payload.customer.gstin,
            country=payload.customer.country,
            state=payload.customer.state,
            city=payload.customer.city,
            pincode=payload.customer.pincode,
            created_by_id=current_user["id"],
        )

    line_items = []
    for item_data in payload.items:
        product = await _resolve_quotation_product(item_data, product_service, company_id, current_user)

        line_items.append(
            {
                "product_id": str(product.id),
                "quantity": item_data.quantity,
                "unit_price": item_data.unit_price,
                "item_name": item_data.product_name or product.name,
                "description": item_data.description,
                "unit": item_data.unit,
                "discount": item_data.discount,
                "gst": item_data.gst,
            }
        )

    quotation = await quotation_service.find_or_create_draft(
        reference_number=payload.reference_number,
        title=payload.title,
        description=payload.description,
        customer_id=str(customer.id),
        company_id=company_id,
        issued_at=payload.issued_at.isoformat(),
        items=line_items,
        created_by_id=current_user["id"],
        created_by_username=current_user["username"],
        valid_until=payload.valid_until.isoformat() if payload.valid_until else None,
        notes=payload.notes,
        terms=payload.terms,

        shipping_amount=payload.shipping_amount,
    )
    return QuotationRead.from_orm(quotation)


@router.post("/{quotation_id}/finalize", response_model=QuotationRead)
async def finalize_quotation(
    quotation_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> QuotationRead:
    """Finalize a draft quotation and allocate a stable number."""
    if current_user["role"] not in {"Super Admin", "Admin", "Manager", "Sales"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    if not current_user["company_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company profile is required before finalizing quotations.",
        )

    service = QuotationService(session)
    quotation = await service.finalize_quotation(
        quotation_id, current_user["company_id"], current_user["id"]
    )
    return QuotationRead.from_orm(quotation)


@router.post("/", response_model=QuotationRead, status_code=status.HTTP_201_CREATED)
async def create_quotation(
    payload: QuotationCreate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> QuotationRead:
    """Create a new quotation."""
    if current_user["role"] not in {"Super Admin", "Admin", "Manager", "Sales"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    if not current_user["company_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company profile is required before creating quotations.",
        )

    company_id = current_user["company_id"]
    if payload.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation company must match the authenticated user's company.",
        )

    service = QuotationService(session)
    quotation = await service.create_quotation(
        reference_number=payload.reference_number,
        title=payload.title,
        description=payload.description,
        customer_id=payload.customer_id,
        company_id=company_id,
        issued_at=payload.issued_at.isoformat(),
        items=[item.model_dump() for item in payload.items],
        created_by_id=current_user["id"],
        created_by_username=current_user["username"],
    )
    return QuotationRead.from_orm(quotation)


@router.get("/", response_model=list[QuotationRead])
async def list_quotations(
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[QuotationRead]:
    """List quotations for the authenticated user's company."""
    if not current_user["company_id"]:
        return []
    service = QuotationService(session)
    quotations = await service.list_quotations(current_user["company_id"], current_user["id"])
    return [QuotationRead.from_orm(quotation) for quotation in quotations]


@router.get("/{quotation_id}", response_model=QuotationRead)
async def get_quotation(
    quotation_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> QuotationRead:
    """Get a single quotation by ID for the authenticated user's company."""
    if not current_user["company_id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")

    service = QuotationService(session)
    quotation = await service.get_quotation(quotation_id)
    if not quotation or str(quotation.company_id) != current_user["company_id"] or str(quotation.created_by_id) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")

    return QuotationRead.from_orm(quotation)


@router.put("/{quotation_id}", response_model=QuotationRead)
async def update_quotation(
    quotation_id: str,
    payload: QuotationUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> QuotationRead:
    """Update a quotation for the authenticated user's company."""
    if current_user["role"] not in {"Super Admin", "Admin", "Manager", "Sales"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    if not current_user["company_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company profile is required before updating quotations.",
        )

    service = QuotationService(session)
    quotation = await service.update_quotation(
        quotation_id=quotation_id,
        company_id=current_user["company_id"],
        title=payload.title,
        description=payload.description,
        issued_at=payload.issued_at.isoformat() if payload.issued_at else None,
        items=[item.model_dump() for item in payload.items] if payload.items is not None else None,
        status=payload.status,
        valid_until=payload.valid_until.isoformat() if payload.valid_until else None,
        notes=payload.notes,
        terms=payload.terms,
        currency=payload.currency,
        shipping_amount=payload.shipping_amount,
        user_id=current_user["id"],
    )
    return QuotationRead.from_orm(quotation)


@router.patch("/{quotation_id}/payment-status", response_model=QuotationRead)
async def update_invoice_payment_status(
    quotation_id: str,
    payload: InvoicePaymentStatusUpdate,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> QuotationRead:
    """Mark an owned finalized invoice as paid or unpaid."""
    if current_user["role"] not in {"Super Admin", "Admin", "Manager", "Sales"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )
    if not current_user["company_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company profile is required before updating invoice status.",
        )

    quotation = await QuotationService(session).update_invoice_payment_status(
        quotation_id=quotation_id,
        company_id=current_user["company_id"],
        user_id=current_user["id"],
        status=payload.status,
    )
    return QuotationRead.from_orm(quotation)


@router.delete("/{quotation_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_quotation(
    quotation_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    """Delete a quotation for the authenticated user's company."""
    if current_user["role"] not in {"Super Admin", "Admin", "Manager", "Sales"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges.",
        )

    if not current_user["company_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company profile is required before deleting quotations.",
        )

    service = QuotationService(session)
    quotation = await service.get_quotation(quotation_id)
    if not quotation or str(quotation.company_id) != current_user["company_id"] or str(quotation.created_by_id) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")

    await service.delete_quotation(quotation_id, current_user["id"])


@router.get("/{quotation_id}/pdf")
async def download_quotation_pdf(
    quotation_id: str,
    current_user: dict[str, str] = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    """Generate a PDF for a quotation and return it as a download."""
    if not current_user["company_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company profile is required to download a quotation PDF.",
        )

    service = QuotationService(session)
    try:
        quotation, items, customer, company, products = await service.get_quotation_with_details(quotation_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if str(quotation.company_id) != current_user["company_id"] or str(quotation.created_by_id) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")

    pdf_service = PDFService()
    pdf_bytes = pdf_service.render_quotation_pdf(
        quotation=quotation,
        customer=customer,
        company=company,
        items=items,
        products=products,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=quotation_{quotation.reference_number}.pdf"},
    )
