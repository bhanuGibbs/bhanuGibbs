# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Small and medium-sized business owners, shop owners, retailers, wholesalers, freelancers, consultants, and service providers — primarily in India. Their employees and staff who manage billing operations and customer records. Users range from individual freelancers to growing businesses. They do not have accounting or technical expertise and need a simple platform for daily billing activities.

## Product Purpose

KeelBill Ledger is a professional billing and business management workspace that makes creating quotations and invoices, managing customers and products, calculating GST, generating professional PDF documents, and tracking payments easier from one centralized platform. It helps business owners spend less time managing paperwork and more time growing their businesses.

## Positioning

Unlike spreadsheets or fragmented tools, KeelBill Ledger connects customer records, product information, quotations, invoices, and payment tracking into a unified workflow. Users can reuse saved customer and product details, generate documents quickly, maintain consistent company branding, and monitor business activity through a dashboard — all without requiring accounting expertise. The key differentiators are simplicity, ease of use, professional document generation, centralized business records, and affordability.

## Operating Context

- Indian market with GST (Goods and Services Tax) compliance: CGST, SGST, IGST, GSTIN, HSN and SAC codes.
- Daily billing operations: creating quotations, converting to invoices, tracking payments, managing outstanding balances.
- Business records management: customer database, product catalog, document history.
- Multi-device access: desktop for detailed work, tablet and mobile for on-the-go access.

## Capabilities and Constraints

**Confirmed functionality:**
- Quotation and invoice creation with PDF generation
- Customer management with reusable records
- Product catalog with SKU, HSN/SAC codes, and pricing
- GST calculations (CGST, SGST, IGST)
- Payment tracking and outstanding balance monitoring
- Sales dashboard with business activity overview
- Company branding: uploaded logos and signatures on documents
- User authentication with JWT, role-based access (Admin, Super Admin)
- Document numbering and professional PDF formats with tax breakdowns

**Technical constraints:**
- Preserve existing React/Vite frontend and Python FastAPI backend
- Preserve database integrations, API contracts, and authentication
- Do not remove features, change database schemas, modify backend APIs, or alter GST and financial calculations during UI improvements
- Maintain existing invoice and quotation PDF formats including company details, logos, signatures, tax breakdowns, and document numbering

**Visual constraints:**
- Professional, minimal, and modern visual style with neutral grey and white foundation
- Subtle borders, clean typography, consistent spacing, restrained colors
- Avoid excessive shadows, gradients, decorative elements, and unnecessary borders
- Responsive layouts for desktop, tablet, and mobile browsers
- Accessible: readable contrast, clear form labels, intuitive navigation

## Brand Commitments

- Product name: **KeelBill Ledger** (must remain unchanged)
- App branding in UI: "Ledger" with subtitle "Billing workspace"
- Professional tone — the product serves business users who need reliability and clarity

## Evidence on Hand

- Existing full-stack codebase with React/Vite frontend and FastAPI backend
- README.md with stack documentation and run instructions
- DEPLOYMENT_GUIDE.md for Vercel, Render, and Neon deployment
- Docker and Docker Compose configuration for local and production deployment
- No external brand assets (logo files, style guides) beyond what users upload per account

## Product Principles

1. **Simplicity first** — Professional billing should not require accounting expertise. Every interaction should be intuitive for a non-technical business owner.
2. **Unified workflow** — Customer, product, document, and payment data live together so users never switch contexts or duplicate entry.
3. **GST compliance by default** — Indian tax calculations are accurate, clear, and require no manual configuration beyond entering rates.
4. **Professional output** — Generated documents reflect the user's business identity with consistent branding, not generic templates.
5. **Accessibility across devices** — The workspace works equally well on a desktop in an office and a phone at a market stall.

## Accessibility & Inclusion

Readable contrast, clear form labels, and intuitive navigation are required. The product serves users with varying levels of technical literacy, so interface language should be plain and actions should be self-evident.
