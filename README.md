# Potager - Garden Management App

A React web application for managing your vegetable and fruit garden. Track plants, garden plots, and plantings all in one place.

## Features

- **Authentication**: User registration and login with JWT tokens
- **Plants Management**: Browse available plants with details like planting months, harvest time, watering needs, and sunlight requirements
- **Garden Plots Management**: Create and manage garden plots with dimensions, soil type, and sunlight exposure
- **Plantings Management**: Track your plantings from planning to harvest, with status updates

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query (React Query)** - Server state management
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 20.14.0 or higher
- Backend API running at `http://127.0.0.1:8080`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
/src
  /api          - API client functions
  /components   - Reusable UI components
  /hooks        - Custom React hooks
  /pages        - Page components
  /types        - TypeScript type definitions
```

## API Integration

The application connects to the Potager backend API. See the [SPEC.md](./SPEC.md) for detailed frontend specifications and the backend Swagger documentation at `http://127.0.0.1:8080/swagger/index.html`.

## Mobile Support

The application is fully responsive and works on mobile devices, tablets, and desktops.

## Default Route

When you first access the application, you'll be redirected to the login page. After logging in, you'll be taken to the Plants page.
