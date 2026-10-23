# AyurCare 
A modular MVP platform for Ayurvedic consultations where users can:
- Discover Ayurvedic doctors by specialization and availability
- View doctor profiles, consultation fees, and clinic locations 
- Book, view, cancel, and reschedule consultations
- Sign up and sign in with email/password or Google

#### ✅ Link: https://ayurcare-web.vercel.app

#### Backend: https://github.com/Akash20x/ayurcare-backend

## 📝 Technologies
AyurCare is built using the following tech stack and additional libraries:

### Frontend
- Next.js
- TypeScript
- Zustand
- React Query
- Axios
- TailwindCSS
- Shadcn
- Lucide React
- Zod
- React DayPicker
- Vitest
- Deploy on Vercel

### Backend
- ExpressJs
- MongoDB
- Prisma
- JSON Web Token
- BcryptJS
- Redis
- Jest
- Deploy on Vercel

## Project Requirements

### Functional Flows

### 1. Doctor Discovery

- Search doctors by name, specialization, or bio
- Backend-powered filtering and sorting by soonest availability

### 2. Slot Booking

- Select an available 30-minute appointment slot
- Lock slot for 5 minutes once selected
- Require OTP confirmation to complete the booking
- Release slot if not confirmed within the lock time

### 3. Reschedule Flow

- Allow rescheduling/cancellation more than 24 hours before the appointment
- Require selection of another available slot for rescheduling
- Released slots become available to other users

### 4. Appointment Dashboard

- View upcoming and past appointments
- View appointment details and current status
- Filter by status: Booked, Completed, Cancelled, Rescheduled

### 5. Authentication

- Register and sign in with email and password
- Automatically refresh expired access tokens
- Support Google sign-in

### 6. Admin Workspace

- Create and edit doctor profiles
- Create one-day and recurring doctor schedules
- View upcoming available slots across all doctors
- View today’s appointments
- View patient records and appointment history
- View upcoming appointments for each doctor


## ⭐ Author
- [@Akash Jain](https://github.com/Akash20x)

