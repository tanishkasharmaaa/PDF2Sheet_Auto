# PDF2Sheet Auto – System Architecture

## 1. Introduction

**PDF2Sheet Auto** is an automated invoice extraction and reconciliation system that eliminates manual data entry from invoices (PDF, Excel, CSV) into Google Sheets. Users upload or forward invoices, and the system extracts structured data and appends it to user-linked spreadsheets with minimal intervention.

**Supported Inputs**

* Scanned & digital PDFs (OCR via Tesseract.js)
* Excel files (.xlsx, .xls)
* CSV files

**Key Capabilities**

* Multi-currency detection (₹, $, €, etc.)
* Batch processing (multiple invoices per request)
* Vendor-specific extraction rules
* Duplicate detection
* Confidence-based auto-processing
* Multi-user, multi-spreadsheet support

---

## 2. High-Level Architecture

The system follows an **event-driven, modular backend architecture** designed for scalability and accuracy. Incoming invoice uploads trigger asynchronous processing pipelines. Each invoice is processed independently to ensure fault isolation.

**Core Layers**

* API Layer (Authentication, Uploads)
* Processing Layer (Parsing, OCR, Extraction)
* Business Rules Layer (Vendor mapping, duplicate checks)
* Integration Layer (Google Sheets)
* Persistence Layer (MongoDB)

---

## 3. Authentication & User Context

* All requests are authenticated (JWT-based).
* Each invoice is processed **within a user context**.
* Users can connect **one or more Google Spreadsheets**.
* Invoices are always written to the spreadsheet mapped to the authenticated user.

**User Model Responsibilities**

* Subscription tier & invoice limits
* Connected Google Spreadsheet IDs
* Usage tracking (invoices uploaded)

---

## 4. Upload & Ingestion Pipeline

### File Upload

* Handled using `multer` with `memoryStorage`
* Supports:

  * `single` upload (`req.file`)
  * `multiple` uploads (`req.files`)

### Accepted File Types

* PDF (`application/pdf`)
* Excel (`.xlsx`, `.xls`)
* CSV (`.csv`)

File type is detected using file extension + MIME type.

---

## 5. Invoice Processing Pipeline

Each uploaded file passes through the following stages:

1. **File Type Detection**

   * PDF / Excel / CSV

2. **Parsing Strategy Selection**

   * PDF → OCR + text extraction
   * Excel → Buffer-based parsing
   * CSV → Buffer-based parsing

3. **Data Extraction**

   * Invoice Number
   * Invoice Date
   * Total Amount
   * Vendor (via sender email or rules)

4. **Vendor Mapping (Optional)**

   * Regex-based extraction rules per vendor
   * Improves accuracy for recurring invoices

5. **Duplicate Detection**

   * Based on `invoiceNumber`
   * Prevents duplicate spreadsheet entries

6. **Confidence Scoring**

   * Invoice Number → 30%
   * Invoice Date → 30%
   * Total Amount → 40%

7. **Final Decision**

   * `AUTO_PROCESSED` (≥ 0.8)
   * `NEEDS_REVIEW` (< 0.8)

---

## 6. OCR & PDF Handling

* PDFs are temporarily written to disk
* Converted to images using `pdftoppm`
* OCR performed via `tesseract.js`
* Temporary files are cleaned after processing

**Fallback Strategy**

* If vendor rules fail, generic regex extraction is applied

---

## 7. Spreadsheet Integration

* Google Sheets integration via OAuth 2.0
* Each user selects a target spreadsheet
* Auto-processed invoices are appended immediately
* Failed or duplicate invoices are logged but skipped

**Reliability Features**

* Retry logic
* Idempotent writes
* Row-level append (no overwrites)

---

## 8. Subscription & Usage Limits

| Tier  | Invoice Limit |
| ----- | ------------- |
| Free  | 20            |
| Basic | 200           |
| Pro   | Unlimited     |

* Limits enforced before processing
* Partial batch processing supported

---

## 9. System Flow Diagram

```mermaid
flowchart LR
    Upload[User Uploads Invoice(s)] --> API[Authenticated API]
    API --> Queue[Async Processing Loop]
    Queue --> Detect[Detect File Type]
    Detect -->|PDF| OCR[OCR Processing]
    Detect -->|Excel/CSV| Parser[Structured Parser]
    OCR --> Extract[Field Extraction]
    Parser --> Extract
    Extract --> Vendor[Vendor Mapping Rules]
    Vendor --> Duplicate[Duplicate Check]
    Duplicate -->|New| Sheet[Google Sheets Append]
    Duplicate -->|Duplicate| Skip[Skip & Log]
    Extract --> Confidence[Confidence Scoring]
```

---

## 10. Database Models

* **User** – auth, subscription, spreadsheets
* **InvoiceExtraction** – extracted invoice data
* **VendorMapping** – vendor-specific regex rules

---

## 11. Extensibility & Future Enhancements

* ML-based field detection
* Auto-learning vendor rules
* Background job queues (BullMQ / RabbitMQ)
* Admin dashboard for review & corrections
* Webhook & email ingestion support

---

## 12. Summary

PDF2Sheet Auto is designed as a **robust, scalable, and extensible invoice automation platform**. Its modular architecture allows seamless support for new file formats, smarter extraction logic, and enterprise-scale workloads while maintaining accuracy and user isolation.
