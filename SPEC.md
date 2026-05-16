# Garden App – Frontend Spec (React)

## 1. Purpose

This document defines the frontend application for the Garden App.

It is designed to:

* Consume the backend API
* Provide a clear and usable UI for garden management
* Be easily usable with AI tools (Claude, ChatGPT)

Backend reference:

* Swagger: [http://127.0.0.1:8080/swagger/index.html](http://127.0.0.1:8080/swagger/index.html)

---

## 2. How AI Must Use This Document

### Hard Rules

* NEVER invent API fields not defined in backend
* ALWAYS rely on Swagger as source of truth for API
* DO NOT duplicate backend logic
* UI must reflect backend constraints exactly
* If API behavior is unclear → ask, do not guess

### Output Expectations

When generating frontend code:

* Use React (functional components)
* Use TypeScript (mandatory)
* Keep components simple and composable
* Avoid unnecessary state complexity

---

## 3. Tech Stack

### Core

* React
* TypeScript
* Vite (or similar modern bundler)

### State Management

* React Query (server state)
* Minimal local state (useState)

### Styling

* Tailwind CSS (preferred)

### HTTP

* fetch or axios

---

## 4. Project Structure

```
/src
  /api            → API calls
  /components     → reusable UI components
  /features       → domain features (plants, plantings, plots)
  /pages          → route-level pages
  /types          → TypeScript types (from backend)
  /hooks          → custom hooks
```

---

## 5. Data Models (Frontend Types)

Types MUST match backend exactly.

### Plant

```ts
type Plant = {
  id: string
  name: string
  type: "vegetable" | "fruit"
  variety: string
  planting_months: number[]
  harvest_time_days: number
  watering_frequency: "low" | "medium" | "high"
  sunlight_requirement: "low" | "partial" | "full"
}
```

---

### GardenPlot

```ts
type GardenPlot = {
  id: string
  name: string
  width: number
  length: number
  soil_type: "clay" | "sandy" | "loamy"
  sunlight_exposure: "low" | "partial" | "full"
}
```

---

### Planting

```ts
type Planting = {
  id: string
  plant_id: string
  plot_id: string
  planted_at: string
  expected_harvest: string
  status: "planned" | "planted" | "harvested"
}
```

---

## 6. API Layer

All API calls MUST go through `/api`.

Example:

```ts
export const createPlant = async (data: Omit<Plant, "id">) => {
  const res = await fetch("/api/v1/plants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) throw new Error("Failed to create plant")

  return res.json()
}
```

Rules:

* No API calls inside components
* Always handle errors

---

## 7. State Management

Use React Query for all server interactions.

Example:

```ts
const { data, isLoading } = useQuery({
  queryKey: ["plants"],
  queryFn: getPlants,
})
```

Rules:

* No manual caching
* No duplicated state

---

## 8. UI Structure

### Pages

* PlantsPage
* PlantingsPage
* GardenPlotsPage

### Components

* Forms (create/edit)
* Lists (tables/cards)
* Filters

---

## 9. Forms & Validation

* Validate required fields
* Enforce enums (dropdowns)
* Do not allow invalid input

Example:

* planting_months → select multiple (1–12)

---

## 10. Error Handling

* Show user-friendly messages
* Log technical errors in console

---

## 11. AI Rules (CRITICAL)

When generating frontend code:

* Use backend API exactly
* Do not invent fields
* Keep components small
* Separate logic (hooks) from UI
* Avoid over-engineering

---

## 12. Development Workflow

When adding a feature:

1. Check Swagger
2. Define TypeScript types
3. Implement API function
4. Create hook (React Query)
5. Build UI component

---

## 13. Future Improvements

* Add routing (React Router)
* Add authentication
* Add mobile responsiveness

---

## 14. Changelog

### v0.1

* Initial frontend specification
