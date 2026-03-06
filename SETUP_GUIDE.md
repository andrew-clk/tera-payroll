# Tera Payroll Hub - Setup Guide

## ✅ Development Server is Running!

🎉 **Your app is now live at:** http://localhost:8080/

---

## 🔧 Next Steps: Database Configuration

The app is running but needs a database connection to work properly.

### 1. Create a Neon Database (Free)

1. Go to [Neon Console](https://console.neon.tech/)
2. Sign up or log in
3. Create a new project
4. Copy your connection string

### 2. Update Environment Variables

Open the `.env` file and replace the placeholder with your actual database URL:

```env
DATABASE_URL="postgresql://your_username:your_password@your_host.neon.tech/your_database?sslmode=require"
VITE_DATABASE_URL="postgresql://your_username:your_password@your_host.neon.tech/your_database?sslmode=require"
```

### 3. Push Database Schema

Run this command to create all tables in your database:

```bash
npm run db:push
```

### 4. Seed Sample Data (Optional)

To populate your database with sample data:

```bash
npm run db:seed
```

### 5. Restart the Development Server

```bash
npm run dev
```

---

## 🎨 What's Been Implemented

### ✅ Complete CRUD Operations
- **Part-Timers**: Add, edit, deactivate staff members
- **Events**: Create, edit, delete events with staff assignment
- **Attendance**: Clock-in, clock-out with automatic hours calculation

### ✅ Tera Diet Branding
- **Colors**:
  - Primary Blue: `#6CB4E8`
  - Orange Accent: `#F5A64A`
  - Yellow Warning: `#F9CC4B`
- **Logo**: Tera Diet logo in sidebar
- **Responsive**: Mobile-friendly design

### ✅ Features
- 📊 Dashboard with real-time stats
- 📅 Event calendar and list views
- 👥 Staff management with search
- ⏰ Attendance tracking
- 💰 Payroll management
- 📱 Fully responsive mobile design

---

## 📂 Available Commands

```bash
# Development
npm run dev              # Start dev server (already running!)
npm run build           # Build for production

# Database
npm run db:push         # Push schema to database
npm run db:generate     # Generate migration files
npm run db:migrate      # Run migrations
npm run db:seed         # Seed sample data
npm run db:studio       # Open Drizzle Studio (database GUI)

# Testing & Quality
npm run lint            # Run ESLint
npm test               # Run tests
```

---

## 🔍 Troubleshooting

### Database Connection Error
If you see "DATABASE_URL is not set" error:
1. Make sure `.env` file exists
2. Replace placeholder with your actual Neon database URL
3. Restart the dev server

### TypeScript Errors
```bash
npm run lint
```

### Port Already in Use
If port 8080 is busy:
1. Edit `vite.config.ts`
2. Change the port number
3. Restart server

---

## 🚀 Ready to Deploy?

### Vercel Deployment
1. Push code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add `VITE_DATABASE_URL` environment variable
4. Deploy!

---

## 📝 Notes

- **Database**: Currently using Neon PostgreSQL (serverless)
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **State**: TanStack React Query
- **ORM**: Drizzle ORM

Need help? Check the [README.md](README.md) for more details!
