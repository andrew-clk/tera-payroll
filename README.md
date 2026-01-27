# Tera Payroll Hub

A modern payroll management system for part-time staff at Tera Diet, built with React, TypeScript, and PostgreSQL.

## Features

- 📊 **Dashboard** - Real-time overview of payroll stats and pending actions
- 👥 **Part-Timers Management** - Complete staff database with contact and banking details
- 📅 **Events Scheduling** - Calendar and list views for event management
- ⏰ **Attendance Tracking** - Clock-in/out records with hour calculations
- 💰 **Payroll Processing** - Automated payroll generation with allowances and bonuses
- 📱 **Mobile Responsive** - Fully optimized for mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS, Radix UI
- **Database**: PostgreSQL (Neon), Drizzle ORM
- **State Management**: TanStack React Query
- **Charts**: Recharts
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)

### Installation

```sh
# Clone the repository
git clone https://github.com/andrew-clk/tera-payroll-hub.git

# Navigate to project directory
cd tera-payroll-hub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL

# Push database schema
npm run db:push

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

### Database Scripts

```sh
npm run db:push      # Push schema to database
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Drizzle Studio (database GUI)
```

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import project to Vercel
3. Add `VITE_DATABASE_URL` environment variable
4. Deploy

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="your_postgres_connection_string"
VITE_DATABASE_URL="your_postgres_connection_string"
```

## License

MIT
