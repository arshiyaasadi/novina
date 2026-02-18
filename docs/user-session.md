# Logged-in user and global DTO

## Definition

The user who has signed in is represented by a single **DTO (Data Transfer Object)** at the global level. This DTO is held in the **Zustand store** (`useUserStore`) and optionally persisted in `localStorage` under the key `loggedInUser`.

## LoggedInUserDto fields

| Field         | Type   | Description                                      |
|---------------|--------|--------------------------------------------------|
| `mobile`      | string | Mobile number                                    |
| `nationalId`  | string | National ID                                      |
| `firstName`   | string | First name                                       |
| `lastName`    | string | Last name                                        |
| `birthDate`   | string | Birth date in **Shamsi** format (e.g. `1370/05/15`) |

Birth date is entered in the UI in Shamsi (year/month/day).

## Implementation locations

- **Type (TypeScript):** `src/domains/auth/types/index.ts` — `LoggedInUserDto`
- **Store (Zustand):** `src/shared/store/user-store.ts` — `useUserStore`
  - `user`: current user or `null`
  - `setUser(user)`: set user and persist to localStorage
  - `clearUser()`: clear user and remove from localStorage
  - `hydrate()`: read from localStorage and populate the store (e.g. after page load)

## Usage in components

```ts
import { useUserStore } from "@/shared/store/user-store";

// Read
const user = useUserStore((s) => s.user);

// Update after login or completing verification
useUserStore.getState().setUser({
  mobile: "09123456789",
  nationalId: "1234567890",
  firstName: "Ali",
  lastName: "Ahmadi",
  birthDate: "1370/05/15",
});

// Logout
useUserStore.getState().clearUser();
```

## Hydrating the store

On pages that need the logged-in user (e.g. profile, dashboard), call hydrate once in `useEffect`:

```ts
useEffect(() => {
  useUserStore.getState().hydrate();
}, []);
```

This ensures that if the user logged in in another tab or before a refresh, the value is read from localStorage and the store is updated.
