# AyurCare 
A modular MVP platform for Ayurvedic consultations where users can
- Discover Ayurvedic doctors by specialization and availability
- Book, view, and manage consultations
- Extend flows for cancellations/rescheduling

#### ✅ Link: https://ayurcare-web.vercel.app

#### Backend: https://github.com/Akash20x/ayurcare-backend

## 📝 Technologies
AyurCare is built using the following tech stack and additional libraries:

### Frontend
- Next.js
- Typescript
- Zustand
- React Query
- Axios
- TailwindCSS
- Shadcn
- Lucide React
- Zod
- React DayPicker
- Deploy on Vercel

### Backend
- ExpressJs
- PostgreSQL
- Prisma
- Jsonwebtoken
- BcryptJS
- Redis
- Jest
- Deploy on Render

## Project Requirements

### Functional Flows

### 1. Doctor Discovery

- Search by specialization and consultation mode (online/in-person)
- Backend-powered filtering and sorting by soonest availability

### 2. Slot Booking

- Lock slot for 5 minutes once selected
- Require user confirmation (mock OTP step)
- Release slot if not confirmed within the lock time

### 3. Reschedule Flow

- Allow rescheduling/cancellation more than 24 hours before the appointment
- Released slots become available to other users

### 4. Appointment Dashboard

- View upcoming and past appointments
- Filter by status: Booked, Completed, Cancelled


## ⭐ Author
- [@Akash Jain](https://github.com/Akash20x)

