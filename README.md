# Quotation Generator

A modern, responsive quotation generator built with React, Vite, Tailwind CSS, React Hook Form, and react-pdf. This Phase 1 version is a frontend-only application that runs entirely in the browser.

## Features

- Modern and professional UI
- Company details form
- Customer details form
- Quotation details form
- Dynamic item table with automatic amount calculation
- Live summary calculations for subtotal, discount, GST, shipping, and grand total
- Terms and conditions section
- Signature upload with preview
- PDF preview and download

## Requirements

Before running the project, make sure you have the following installed:

- Node.js (recommended: LTS version)
- npm
- A modern web browser such as Chrome, Edge, or Firefox

## Tools and Libraries Used

### Frontend
- React
- Vite
- JavaScript
- Tailwind CSS

### Additional Libraries
- react-hook-form
- @react-pdf/renderer
- lucide-react
- react-hot-toast
- dayjs
- react-router-dom

## Project Structure

```text
src/
  components/
    Header
    CompanyDetailsForm
    CustomerDetailsForm
    QuotationDetailsForm
    ItemTable
    Summary
    TermsConditions
    SignatureUpload
    Footer
  pages/
    Home
  pdf/
    QuotationPDF
  utils/
    calculations.js
  constants/
    defaultValues.js
  App.jsx
  main.jsx
```

## Installation

1. Open your terminal
2. Navigate to the project folder
3. Install dependencies:

```bash
npm install --legacy-peer-deps
```

## How to Run

Start the development server:

```bash
npm run dev
ui:

 $env:Path = "$env:Path;C:\Program Files\nodejs"; Set-Location 'c:\Users\laxma\QuotationGenerator_UI'; & 'C:\Program Files\nodejs\node.exe' 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run dev -- --host 0.0.0.0 --port 3001

back end :

Set-Location 'c:\Users\laxma\QuotationGenerator_UI\backend\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

cd backend/backend
   py -m uvicorn app.main:app --host 127.0.0.1 --port 8000
 
 $env:Path = "$env:Path;C:\Program Files\nodejs"; Set-Location 'c:\Users\laxma\QuotationGenerator_UI'; & 'C:\Program Files\nodejs\node.exe' 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run build  

  cmd /c "cd /d c:\Users\laxma\QuotationGenerator_UI\backend\backend && py -m pip install -r requirements.txt && py -m uvicorn app.main:app --host 127.0.0.1 --port 8000" 

```

Then open the local URL shown in the terminal, usually:

```text
http://localhost:3000/
```

If port 3000 is busy, Vite may choose another port, such as 3001 or 3002.

## PDF Generation

The app generates a professional PDF using react-pdf. The PDF preview and download are available from the interface after filling in the quotation details.

## Notes

- This version is frontend-only
- No backend, database, or authentication is included
- The application is designed to be easily extended for future backend integration
