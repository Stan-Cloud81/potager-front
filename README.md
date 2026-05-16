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
- Backend API running (default: `http://localhost:8080`)

### Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your API URL:
```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

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

The application connects to the Potager backend API.

## Mobile Support

The application is fully responsive and works on mobile devices, tablets, and desktops.
