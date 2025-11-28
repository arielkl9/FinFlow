# FinFlow - Personal Finance Management Dashboard

A comprehensive personal finance management application built with React, Express, and SQLite. Track income, expenses, debts, loans, assets, and get smart suggestions to optimize your financial health.

## ✨ Features

### Dashboard
- **KPI Cards**: Real-time view of Total Income, Fixed Expenses, Debt Payments, and Net Cash Flow
- **Debt Trends Chart**: Line chart showing debt payment history over 12 months
- **Expense Breakdown**: Pie chart visualizing expense distribution
- **User Comparison**: Bar chart comparing income vs expenses per family member (Family View)
- **Smart Suggestions**: AI-powered recommendations for debt payoff optimization

### Multi-User Support
- **User Profiles**: Track finances for individual family members
- **Family View**: Aggregate view of all household finances
- **Household Account**: Shared expenses tracked separately
- **Easy Switching**: Global dropdown to switch between views

### Financial Records Management
- **Income Tracking**: Salary, freelance, investments
- **Fixed Expenses**: Rent, property tax, insurance
- **Variable Utilities**: Electricity, water, gas (variable monthly amounts)
- **Debt Payments**: Loans and credit card payments

### Debt Manager
- **Static Loans**: Track mortgages, car loans, student loans with fixed payments
- **Variable Debts**: Credit cards, overdrafts with flexible monthly payments
- **Temporary Debts**: One-time debts that are paid in full
- **Payment History**: Track what you paid each month

### Assets & Investments
- **Emergency Fund**: Track savings goals
- **Education Fund**: Save for education expenses
- **ESPP**: Employee Stock Purchase Plan tracking
- **RSU**: Restricted Stock Units with vesting schedules
- **Stocks**: Individual stock holdings
- **Transaction History**: Track deposits, withdrawals, buys, sells, vests

### Workflow Automation
- **Start New Month**: One-click month transition
- **Static Payments**: Auto-fill recurring amounts
- **Custom Categories**: Add/remove categories via settings

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js + Express |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma |

## 📁 Project Structure

```
FinFlow/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── seed.js            # Database initialization
│   │   └── dev.db             # SQLite database (gitignored)
│   ├── server.js              # Express API server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/               # API client functions
│   │   ├── components/
│   │   │   ├── Assets/        # Asset management
│   │   │   ├── Charts/        # Recharts visualizations
│   │   │   ├── Common/        # Shared components
│   │   │   ├── Dashboard/     # Dashboard + KPI cards
│   │   │   ├── Debts/         # Debt management
│   │   │   ├── Layout/        # Sidebar + TopBar
│   │   │   ├── Loans/         # Loan management
│   │   │   ├── Modals/        # Settings modals
│   │   │   ├── Records/       # Financial records
│   │   │   └── Setup/         # Monthly setup wizard
│   │   ├── hooks/             # React hooks (useFinanceData)
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Tailwind + custom styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 18+ 
- npm or yarn

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/FinFlow.git
cd FinFlow

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Create database and apply schema
npx prisma db push

# (Optional) Initialize with default categories
npm run db:seed
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# API running at http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App running at http://localhost:5173
```

### 4. Open the App
Navigate to `http://localhost:5173`

---

## 🌐 Deployment

### Option 1: Deploy to Railway (Recommended - Full Stack)

Railway can host both frontend and backend with a PostgreSQL database.

#### Backend Deployment

1. **Update `backend/prisma/schema.prisma` for PostgreSQL:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. **Deploy to Railway:**
   - Connect GitHub repo
   - Add PostgreSQL database
   - Set `DATABASE_URL` environment variable
   - Deploy backend folder

#### Frontend Deployment

1. **Create `.env` in frontend:**
```env
VITE_API_URL=https://your-backend.railway.app/api
```

2. **Deploy to Vercel/Netlify:**
   - Connect GitHub repo
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Add `VITE_API_URL` environment variable

---

### Option 2: Deploy to Render

#### Backend (Web Service)
1. Create new Web Service
2. Connect GitHub repo, select `backend` folder
3. Build Command: `npm install && npx prisma generate && npx prisma db push`
4. Start Command: `npm start`
5. Add PostgreSQL database and set `DATABASE_URL`

#### Frontend (Static Site)
1. Create new Static Site
2. Connect GitHub repo, select `frontend` folder
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Add `VITE_API_URL` environment variable

---

### Option 3: Deploy with Docker

#### `backend/Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

#### `frontend/Dockerfile`
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### `docker-compose.yml` (root folder)
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: finflow
      POSTGRES_PASSWORD: finflow_password
      POSTGRES_DB: finflow
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://finflow:finflow_password@db:5432/finflow
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Run with: `docker-compose up --build`

---

## 🔧 Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `PORT` | API server port | `3001` |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `/api` (proxied) |

---

## 📊 Database Schema

### Core Models

**User** - Family members + Household system account
```
id, name, isSystemAccount, createdAt, updatedAt
```

**Category** - Financial categories
```
id, name, type, isRecurring, isStatic, isHousehold, defaultAmount
Types: Income | Fixed Expense | Utility | Static Loan | Dynamic Debt
```

**FinancialRecord** - Monthly entries
```
id, userId, categoryId, amount, monthYear (YYYY-MM), note
```

**Loan** - Fixed monthly payment loans
```
id, userId, name, totalPrincipal, remainingBalance, interestRate, monthlyPayment
```

**Debt** - Variable paydown debts (credit cards)
```
id, userId, name, currentBalance, creditLimit, minimumPayment, isTemporary
```

**DebtPayment** - Monthly debt payments
```
id, debtId, amount, monthYear, note
```

**Asset** - Investments and savings
```
id, userId, name, type, currentValue, costBasis, targetAmount, monthlyContribution
Types: emergency_fund | education_fund | espp | rsu | stock | savings | other
```

**AssetTransaction** - Asset activity history
```
id, assetId, type, amount, units, pricePerUnit, date, note
Types: deposit | withdraw | buy | sell | vest | dividend | contribution
```

---

## 🔌 API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/household` - Get household account
- `POST /api/users` - Create user
- `DELETE /api/users/:id` - Delete user

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Financial Records
- `GET /api/records?userId=&monthYear=` - Get records
- `POST /api/records` - Create/update record
- `POST /api/records/bulk` - Bulk update
- `DELETE /api/records/:id` - Delete record

### Loans
- `GET /api/loans` - Get all loans
- `POST /api/loans` - Create loan
- `PUT /api/loans/:id` - Update loan
- `DELETE /api/loans/:id` - Delete loan

### Variable Debts
- `GET /api/variable-debts` - Get all debts
- `POST /api/variable-debts` - Create debt
- `PUT /api/variable-debts/:id` - Update debt
- `DELETE /api/variable-debts/:id` - Delete debt
- `POST /api/variable-debts/:id/payment` - Record payment
- `POST /api/variable-debts/:id/pay-full` - Pay debt in full

### Assets
- `GET /api/assets` - Get all assets
- `GET /api/assets/summary` - Get asset summary
- `GET /api/assets/:id` - Get single asset
- `POST /api/assets` - Create asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset
- `POST /api/assets/:id/transaction` - Add transaction

### Dashboard
- `GET /api/dashboard/summary` - KPI summary
- `GET /api/dashboard/expense-breakdown` - Pie chart data
- `GET /api/dashboard/debt-trends` - 12-month trends
- `GET /api/dashboard/user-comparison` - Family comparison
- `GET /api/dashboard/smart-suggestion` - Debt payoff advice
- `GET /api/dashboard/debt-overview` - Total debt info

### Workflow
- `GET /api/workflow/months` - Available months
- `POST /api/workflow/start-new-month` - Initialize new month
- `GET /api/workflow/month-status` - Setup progress
- `GET /api/workflow/setup-categories` - Categories for setup wizard

---

## 💡 Smart Suggestion Algorithm

Analyzes your finances and recommends optimal debt repayment:

1. Calculate net surplus (income - all expenses)
2. If surplus > 0, find highest interest debt
3. Calculate payoff acceleration potential
4. Show months saved + interest saved

---

## 🎨 Design System

- **Primary**: Navy gradient (#102a43 → #0a1929)
- **Accent Colors**: 
  - Emerald (income/positive)
  - Coral (expenses/debt)
  - Violet (loans)
  - Amber (utilities)
- **Typography**: Outfit (sans), JetBrains Mono (numbers)
- **Effects**: Glass morphism, gradient borders

---

## 📝 License

MIT License - feel free to use for personal or commercial projects.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ for Financial Freedom
