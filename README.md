# FormForge 🚀

[![Built with React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-black.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-blue.svg)](https://prisma.io/)

**FormForge** is an AI-powered drag-and-drop form builder complete with analytics, public response collection, and Gemini-driven form generation. Built for the 24-Hour College Hackathon.

## ✨ Features

- **Drag & Drop Builder**: Intuitive visual canvas powered by `@dnd-kit`.
- **9 Field Types**: Text, Long Text, Email, Number, Dropdown, Multiple Choice, Checkboxes, Date, File Upload.
- **AI Form Generator**: Type a prompt, and Gemini API builds the full form structure instantly!
- **AI Field Suggester**: Get smart recommendations for the next logical field to add.
- **AI Insights**: Generate instant summaries of all responses using Gemini to spot trends.
- **Analytics Dashboard**: Real-time charts for submissions over time and option-field distributions.
- **Export Responses**: Download submission data as CSV with one click.
- **Premium UI**: Glassmorphism design and stunning dark-mode aesthetics using Tailwind + shadcn/ui.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand, @dnd-kit, Recharts.
- **Backend**: Node.js, Express.js, TypeScript.
- **Database**: PostgreSQL (Prisma ORM) - *Using SQLite for local development speed.*
- **AI**: Google Gemini API (`gemini-1.5-flash`).

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- npm or pnpm
- Gemini API Key

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/FormForge.git
cd FormForge

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment variables
In the `server/` directory, create a `.env` file:
```env
DATABASE_URL="file:./dev.db" # Local SQLite for dev
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
GEMINI_API_KEY="your-google-gemini-api-key"
```

In the `client/` directory, create a `.env` file:
```env
VITE_API_URL="http://localhost:3001/api"
```

### 3. Setup Database
```bash
cd server
npx prisma generate
npx prisma db push
```

### 4. Run the App
Start the backend API (from `/server`):
```bash
npm run dev
```

Start the frontend Vite app (from `/client`):
```bash
npm run dev
```

Your app will be automatically running at `http://localhost:5173`. Happy form building!

## 🚢 Deployment (Vercel + Render + Neon)

Ready for production?
1. **Database**: Spin up a free PostgreSQL DB on Neon.tech and get the connection URL.
2. **Backend**: Deploy the `server` directory as a Node.js Web Service on Render. Add env vars: `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`.
3. **Frontend**: Deploy the `client` directory on Vercel. Set the build command to `npm run build` and out dir to `dist`. Add env var `VITE_API_URL` pointing to the live Render backend link.

---
*Built with ❤️ in 24 hours.*
