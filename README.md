# Qasim Medicos — Frontend

A production-ready React + Vite + Tailwind CSS frontend for the Qasim Medicos pharmacy management SaaS. Mobile-first, role-aware, and ready to deploy on **Vercel** as a separate project from the backend.

---

## 📦 Tech Stack

- **Framework:** React 18 + Vite 5
- **Styling:** Tailwind CSS 3
- **Routing:** React Router v6
- **State:** Zustand (with persist)
- **HTTP:** Axios (with interceptors)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Toasts:** React Hot Toast

---

## 📁 Project Structure

```
qasim-medicos-frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   ├── client.js          # Axios instance + interceptors
│   │   └── index.js           # API modules (auth, medicines, sales, etc.)
│   ├── components/
│   │   ├── layout/            # Sidebar, Header, BottomNav, DashboardLayout
│   │   └── ui/                # Button, Input, Select, Card, Modal, Spinner, EmptyState
│   ├── pages/                 # All 23 screens (lazy-loaded)
│   ├── routes/
│   │   └── ProtectedRoute.jsx # Auth + role guard
│   ├── store/
│   │   └── auth.js            # Zustand auth store
│   ├── utils/
│   │   └── format.js          # Currency, date, CSV, print helpers
│   ├── App.jsx                # Routes
│   ├── main.jsx               # Entry
│   └── index.css              # Tailwind + design system
├── .env.example
├── vercel.json                # Vercel SPA config
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🎨 Design System

| Token       | Value     |
|-------------|-----------|
| Primary     | #2563EB   |
| Secondary   | #14B8A6   |
| Success     | #22C55E   |
| Warning     | #F59E0B   |
| Danger      | #EF4444   |
| Background  | #F8FAFC   |
| Card        | #FFFFFF   |
| Text (ink)  | #0F172A   |
| Border      | #E2E8F0   |
| Font        | Inter     |
| Radius      | 16px      |

---

## 🔗 Where to Put Your Backend API URL

Create a `.env` file in the **frontend root** (next to `package.json`):

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000
```

- **Local dev:** `http://localhost:5000` (your backend local URL)
- **Production:** Your deployed backend URL, e.g. `https://qasim-medicos-backend.vercel.app`

> ⚠️ All Vite env vars must start with `VITE_`. The frontend reads `import.meta.env.VITE_API_URL` to build API requests.

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and set backend URL
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:5000

# 3. Start dev server
npm run dev
```

App runs at **http://localhost:5173**

> Make sure your backend is running on `http://localhost:5000` (see backend README) and MongoDB is seeded.

---

## 🌐 Deploy Frontend to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial frontend commit"
git branch -M main
git remote add origin https://github.com/<your-username>/qasim-medicos-frontend.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to https://vercel.com → **Login** → **Add New** → **Project**
2. Import your `qasim-medicos-frontend` repository
3. Vercel auto-detects Vite (Framework Preset: **Vite**)

### Step 3: Configure Environment Variables

In Vercel project settings → **Settings → Environment Variables**:

| Key              | Value                                                  |
|-------------------|--------------------------------------------------------|
| `VITE_API_URL`    | Your deployed backend URL, e.g. `https://qasim-medicos-backend-xxxx.vercel.app` |
| `VITE_APP_NAME`   | `Qasim Medicos` (optional)                             |

### Step 4: Deploy

- Click **Deploy**
- Build command: `npm run build` (auto-detected)
- Output directory: `dist` (auto-detected)
- Your app will be live at: `https://qasim-medicos-frontend-xxxx.vercel.app`

### Step 5: Update Backend CORS

Once you have your frontend URL, add it to your **backend** Vercel project's environment variables:

```
CLIENT_URL=https://qasim-medicos-frontend-xxxx.vercel.app
```

Redeploy the backend to apply.

---

## 📱 Pages & Routes

| Route                  | Page                  | Roles                |
|------------------------|-----------------------|----------------------|
| `/login`               | Login                 | Public               |
| `/dashboard`           | Dashboard             | All                  |
| `/pos`                 | Point of Sale         | Owner, Cashier       |
| `/medicines`           | Medicines list        | All                  |
| `/medicines/new`       | Add medicine          | Owner, Manager       |
| `/medicines/:id`       | Medicine detail       | All                  |
| `/medicines/:id/edit`  | Edit medicine         | Owner, Manager       |
| `/categories`          | Categories            | Owner, Manager       |
| `/suppliers`           | Suppliers             | Owner, Manager       |
| `/customers`           | Customers             | All                  |
| `/sales`               | Sales list            | All                  |
| `/sales/:id`           | Invoice / Sale detail | All                  |
| `/purchases`           | Purchases list        | Owner, Manager       |
| `/purchases/new`       | New purchase          | Owner, Manager       |
| `/purchases/:id`       | View purchase         | Owner, Manager       |
| `/inventory`           | Inventory management  | Owner, Manager       |
| `/expenses`            | Expenses              | Owner, Manager       |
| `/reports`             | Reports & Analytics   | Owner, Manager       |
| `/users`               | User management       | Owner                |
| `/settings`            | Pharmacy settings     | Owner, Manager       |
| `/profile`             | My profile            | All                  |

---

## 📱 Responsive Behavior

- **Mobile (< 1024px):** Bottom navigation + hamburger menu
- **Tablet/Desktop (≥ 1024px):** Left sidebar + top header
- Breakpoints: 320px, 375px, 390px, 414px, 768px, 1024px, 1440px

---

## 🔐 Default Login Credentials

After seeding the backend:

| Role    | Email                          | Password    |
|---------|--------------------------------|-------------|
| Owner   | owner@qasimmedicos.com         | Owner@123   |
| Manager | manager@qasimmedicos.com       | Manager@123 |
| Cashier | cashier@qasimmedicos.com       | Cashier@123 |

---

## 🛡️ Production Checklist

- [ ] Set `VITE_API_URL` to your deployed backend URL
- [ ] Update backend `CLIENT_URL` to your frontend URL
- [ ] Change default passwords (via Users screen)
- [ ] Test login flow end-to-end
- [ ] Verify POS workflow completes
- [ ] Check mobile bottom navigation

---

## 🆘 Troubleshooting

**Blank page after deploy:**
- Check browser console for errors
- Verify `VITE_API_URL` is set in Vercel env vars (must start with `VITE_`)
- Redeploy after adding env vars

**API calls fail with CORS:**
- Add your frontend URL to backend `CLIENT_URL` env var
- Redeploy backend

**401 on every request:**
- Backend JWT secret may have changed — log out and back in
- Check that backend `JWT_SECRET` env var is consistent

**Charts not rendering:**
- Check browser console — usually a data shape issue
- Ensure backend is returning data (test `/api/dashboard/overview` directly)

---

Built with ❤️ for **Qasim Medicos**.
