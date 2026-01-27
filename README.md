# 📄 Pdf2Sheet Auto

**Pdf2Sheet Auto** is an automation platform that converts **PDFs, CSVs, and Excel files into structured Google Sheets**.  
It eliminates manual data entry while providing visibility into usage, confidence, and subscription limits.

---

## 🖼️ Product Screenshots

> Add screenshots or GIFs of your product UI here

![Home](https://github.com/tanishkasharmaaa/PDF2Sheet_Auto/blob/main/frontend/public/Main.png)
![Dashboard](https://github.com/tanishkasharmaaa/PDF2Sheet_Auto/blob/main/frontend/public/Dashboard.png)
![Invoices Page](https://github.com/tanishkasharmaaa/PDF2Sheet_Auto/blob/main/frontend/public/Invoices.png)
![Pricing Page](https://github.com/tanishkasharmaaa/PDF2Sheet_Auto/blob/main/frontend/public/Pricing.png)
![Profile Page](https://github.com/tanishkasharmaaa/PDF2Sheet_Auto/blob/main/frontend/public/Profile.png)

📌 Create a `screenshots/` folder in your repo and place images there.

---

## 🚀 What is Pdf2Sheet Auto?

Pdf2Sheet Auto automatically:
- Extracts data from **PDF invoices**
- Parses **CSV & Excel files**
- Structures extracted data
- Pushes it directly into **Google Sheets**

It also tracks:
- Monthly invoice usage
- Extraction confidence
- Active subscription plan

---

## 🖥️ Frontend Overview

The frontend provides a complete and user-friendly interface to manage invoices, plans, and spreadsheets.

### Main Pages
- **Dashboard**
- **Invoices**
- **Pricing**
- **Profile**

---

## 📊 Dashboard

The **Dashboard** is the main control center for users.

### Features

### 📈 Invoice Usage
- Total invoices uploaded
- Remaining monthly quota
- Limits enforced based on subscription plan

### 🎯 Confidence Score
- Each processed invoice includes a **confidence score**
- Indicates extraction accuracy
- Helps users identify invoices needing manual review

### 💳 Current Plan
- Displays the active subscription plan
- Shows plan limits clearly

### ⬆️ Upload Invoices
- Upload **PDF, CSV, or Excel** files
- Supports multiple file uploads
- Real-time processing feedback

### 📂 Uploaded Invoices Preview
- Shows recently uploaded invoices
- Status indicators:
  - Pending
  - Processed
  - Failed
- Confidence score per invoice

---

## 🧾 Invoices Page

The **Invoices page** lists all uploaded invoices.

### Capabilities
- View complete invoice history
- See:
  - File name
  - Upload date
  - Processing status
  - Confidence score
- Helps with auditing and tracking

---

## 💰 Pricing Page

The **Pricing page** allows users to view and purchase subscription plans.

### Pricing Logic
- Users can only **upgrade** to higher plans
- Lower plans are disabled once upgraded
- Clean and intuitive upgrade experience

---

## 👤 Profile Page

The **Profile page** manages user settings and integrations.

### Google Spreadsheet Management
- Add Google Spreadsheets
- Edit existing spreadsheet details
- Delete spreadsheets
- Spreadsheet limits enforced by plan

### Subscription Information
- Current active plan
- Invoice limits
- Remaining usage

---

## 📦 Subscription Plans

### 🆓 Free Plan
- Limited invoice uploads
- 1 Google Spreadsheet
- Basic OCR
- Manual uploads only

---

### 🌱 Basic Plan
- Higher invoice limit
- Up to 3 Google Spreadsheets
- Faster OCR processing
- Email support

---

### 🚀 Pro Plan
- High or unlimited invoice uploads
- Unlimited Google Spreadsheets
- Advanced OCR
- Priority support
- Best for teams and businesses

---

## 🔄 How Pdf2Sheet Auto Works

```text
User Uploads File (PDF / CSV / Excel)
                ↓
Backend Receives & Queues File
                ↓
File Parsing & Data Extraction
                ↓
Confidence Score Generation
                ↓
Google Sheets Update
                ↓
Dashboard & Invoice List Updated
```

### 🛠 Tech Stack

* Frontend

 - React (Vite)

 - Chakra UI

 - Responsive Design

 - Fetch API

* Backend

 - Node.js

 - Express.js

 - MongoDB

 - JWT Authentication

 - Google Sheets API


### 📂 Frontend Folder Structure
    src/
    ├── components/
    ├── pages/
    │    ├── Dashboard.jsx
    │    ├── Invoices.jsx
    │    ├── Pricing.jsx
    │    └── Profile.jsx
    ├── services/
    ├── utils/
    └── main.jsx

### 🎯 Why Pdf2Sheet Auto?

    - Eliminates manual data entry

    - High accuracy with confidence tracking

    - Clear usage and plan visibility

    - Scales with business needs

    - Clean and modern UI

### 👨‍💻 Author

### Built with ❤️ by Tanishka Sharma