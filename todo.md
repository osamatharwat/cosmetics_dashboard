# Cosmetics Dashboard - Project TODO

## Phase 1: Design System & Database Schema
- [x] Design system setup (colors, typography, spacing)
- [x] Database schema design and migration
- [x] Create all required tables (products, batches, sales, expenses, users)

## Phase 2: Backend API
- [x] Product CRUD procedures
- [x] Batch management procedures
- [x] Sales management procedures
- [x] Expense tracking procedures
- [x] Analytics and reporting procedures
- [x] Cost calculation procedures
- [x] Backend form validation

## Phase 3: Frontend Layout
- [x] DashboardLayout component with sidebar navigation
- [x] Global theme setup (dark/light mode)
- [x] Navigation structure and routing
- [x] Authentication pages (login/register)

## Phase 4: Dashboard & Analytics
- [x] KPI cards (total sales, net profit, inventory value, best-sellers)
- [x] Sales-over-time chart
- [x] Profit-trend chart
- [x] Low-stock alerts
- [x] Expiring-batch alerts

## Phase 5: Production & Batch Management
- [x] Batch creation form with auto-calculated cost-per-unit
- [x] Batch list view with edit/delete
- [x] Batch detail view with profit analysis
- [x] FIFO batch linking support

## Phase 6: Inventory & Sales Management
- [x] Product management (add/edit/delete)
- [x] Inventory view with stock levels and values
- [x] Sales creation form with auto-calculated totals
- [x] Sales history with date filters
- [x] Profit-per-sale calculations

## Phase 7: Financials & Reporting
- [x] Expense tracking by category
- [x] Other income tracking
- [x] Monthly financial summary
- [x] Cash flow visualization
- [x] Export to CSV/Excel
- [x] Profit-per-product view
- [x] Profit-per-batch view

## Phase 8: Advanced Features
- [x] Cost breakdown and pricing tool
- [x] Suggested selling price calculator
- [x] In-app notifications for alerts
- [x] Dark mode toggle
- [x] Date range filters for reports
- [x] Form validation (frontend + backend)

## Phase 9: Testing & Delivery
- [x] Vitest unit tests (11 tests passing)
- [x] Integration testing
- [x] UI/UX polish and refinement
- [x] Final checkpoint and delivery


## Phase 10: Professional Accounting System Overhaul

### Accounting Architecture
- [ ] Implement double-entry bookkeeping principles
- [ ] Create journal entries table for all transactions
- [ ] Add account chart (Assets, Liabilities, Equity, Revenue, Expenses)
- [ ] Implement account reconciliation

### Cost Tracking & COGS
- [ ] Add material cost tracking per batch
- [ ] Implement labor cost allocation
- [ ] Add overhead cost distribution
- [ ] Calculate accurate COGS per product
- [ ] Track inventory valuation (FIFO/LIFO/Weighted Average)

### Automated Financial Relationships
- [ ] Discount impact on profit (automatic recalculation)
- [ ] Batch stock updates trigger inventory value changes
- [ ] Sales transactions auto-update COGS
- [ ] Expense categorization auto-updates financial statements
- [ ] Revenue recognition automation

### Financial Reports
- [ ] Income Statement (P&L) with proper structure
- [ ] Balance Sheet
- [ ] Cash Flow Statement
- [ ] Trial Balance
- [ ] General Ledger by account
- [ ] Profit & Loss by product/batch/customer

### Data Integrity & Validation
- [ ] Prevent negative inventory
- [ ] Validate all transactions balance
- [ ] Audit trail for all changes
- [ ] Transaction locking after period close
