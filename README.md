# 🧠 Product Management System with AI Enrichment

A simple web platform to manage and enrich SKU/product data using AI (OpenAI GPT-4o).

---

## 📁 Project Structure

 ├── backend # NestJS backend API with AI integration 
 ├── frontend # Next.js frontend with Tailwind CSS 
 └── .prettierrc # Code formatter config

---

## ✅ Features Implemented

### 1. Import Products from CSV or Excel
Supports `.csv` and `.xlsx` file uploads.

Gracefully handles:
- Corrupted or invalid files
- Missing required headers (e.g. `Product Name`)
- Duplicate SKUs (e.g. based on barcode)
- Inconsistent formats or empty rows

### 2. Define Properties to Enrich (Attributes)

Attribute types supported:
- `short_text`: under 50 characters
- `long_text`: long plain text
- `rich_text`: formatted HTML content
- `number`: numeric values
- `single_select`: choose from predefined list
- `multiple_select`: select multiple options
- `measure`: value + unit (e.g., 100 USD, 5 cm)

Additional features:
- Custom attribute creation supported via form modal
- Duplicate attribute names are prevented
- Attributes can be removed

### 3. Attribute Management
- Add/remove attributes via modal
- View all attributes with delete functionality
- Reuse attributes across uploads

### 4. Product List Page
- Display imported products with dynamic attributes

Features:
- Pagination (5 per page)
- Debounced search (name, brand, barcode, attributes)
- Filter by any attribute values
- Edit attribute values inline (modal)
- Select individual products via checkbox

### 5. AI Enrichment Functionality
- Uses **OpenAI GPT-4o** via prompt completion
- Enriches only missing fields for selected products
- Prompt includes name, brand, barcode, and image
- Enrichment runs only on checked rows
- Auto-updates enriched values in the list

---

## 🧪 Tech Stack

| Layer        | Technology               |
|--------------|--------------------------|
| Frontend     | Next.js 14 (App Router)  |
| Styling      | Tailwind CSS             |
| Backend      | NestJS (Node.js)         |
| Database     | PostgreSQL (via TypeORM) |
| File Parsing | `xlsx` npm library       |
| AI Service   | OpenAI GPT-4o (chat API) |
| Upload       | CSV / Excel via Multer   |

---

## ⚙️ How to Run

### Prerequisites
- Node.js
- PostgreSQL database
- OpenAI API key

### 1. Backend

```bash
cd backend
npm install

# create .env with DB + OpenAI keys
npm run start:dev
```

### 2. Frontend
```bash
cd frontend
npm install

# create .env.local with NEXT_PUBLIC_API_URL
npm run dev
```

## 📦 API Routes (Backend)

| Route                                      | Method | Description                             |
|-------------------------------------------|--------|-----------------------------------------|
| `/uploads`                                | POST   | Upload a product file (CSV/XLSX)        |
| `/uploads/:uploadId/products`             | GET    | Get paginated products                  |
| `/uploads/:uploadId/enrich`               | POST   | Enrich selected products via OpenAI     |
| `/attributes`                             | GET    | Get all attributes                      |
| `/attributes`                             | POST   | Create new attribute                    |
| `/attributes/:id`                         | DELETE | Delete attribute                        |
| `/uploads/:uploadId/attributes`           | POST   | Assign attributes to an upload          |
| `/uploads/:uploadId/products/:id`         | PATCH  | Update attributes manually     


## 📈 Scalability Considerations

- Designed to support **10K - 1M SKUs**
- **Pagination** and **search** are handled server-side
- **Selective enrichment** avoids mass GPT calls
- **Optimized database usage** via indexing and filtered queries
- **Lightweight UI** with efficient modal rendering and interaction