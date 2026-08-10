# BondEd

![BondEd Banner](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-orange?style=for-the-badge)

BondEd is a comprehensive, modern educational platform designed to enhance student learning through intelligent matchmaking, AI-assisted study sessions, and advanced analytics. Built as an undergraduate project, BondEd aims to revolutionize how students connect, collaborate, and learn in a digital environment.

## ✨ Key Features

- **Personalized Dashboards**: Get insights into your study habits, upcoming sessions, and pending connection requests.
- **Intelligent Partner Matching**: Find study partners tailored to your subjects and interests.
- **AI Voice Assistant**: Interact with a specialized AI study assistant to help you navigate complex topics.
- **Secure Authentication**: Built-in Multi-Factor Authentication (MFA), strict email verification, and secure onboarding flows.
- **Real-Time Study Sessions**: Schedule, manage, and review collaborative study sessions effortlessly.
- **Detailed Analytics**: Track your progress, session summaries, and engagement metrics over time.

---

## 🏗️ Architecture

BondEd is a full-stack application built using modern web technologies:

### Front-End
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: Framer Motion for animations, Lucide React for iconography
- **State & Auth**: Client-side Firebase Authentication (Google OAuth & Email/Password)

### Back-End
- **Environment**: Node.js with [Express](https://expressjs.com/)
- **Database**: PostgreSQL (or equivalent SQL database) managed via [Prisma ORM](https://www.prisma.io/)
- **Authentication**: JWT-based secure endpoints, Firebase Admin SDK
- **Email Service**: Nodemailer for transactional emails

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- A configured PostgreSQL Database
- Firebase Project configured for Authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yathavan-25/BondEd.git
   cd BondEd
   ```

2. **Set up the Back-End**
   ```bash
   cd back-end
   npm install
   ```
   Create a `.env` file in the `back-end` directory and add your environment variables:
   ```env
   DATABASE_URL="your_postgresql_database_url"
   PORT=5000
   # Add your Firebase and Email config here
   ```
   Run database migrations and generate Prisma client:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Set up the Front-End**
   ```bash
   cd ../front-end
   npm install
   ```
   Create a `.env.local` file in the `front-end` directory:
   ```env
   NEXT_PUBLIC_URL="http://localhost:5000"
   # Add your Firebase public config variables here
   ```
   Start the front-end development server:
   ```bash
   npm run dev
   ```

4. **View the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Security

BondEd takes user security seriously:
- **Protected Routes**: Strict `AuthGuard` implementation to prevent unauthorized access to the dashboard or bypassing the onboarding exam.
- **MFA (Multi-Factor Authentication)**: Opt-in 2FA via email verification codes.
- **Strict Linting**: The codebase adheres to strict ESLint standards with zero warnings to ensure code quality.

---

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Developed by Yathavan.
</p>
