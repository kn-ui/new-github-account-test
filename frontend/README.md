# Frontend (Vite/React) Environment Notes

- Only expose the Clerk publishable key to the browser:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

- Do NOT include `CLERK_SECRET_KEY` in the frontend `.env`. The secret key is server-only.
- Do NOT expose `VITE_HYGRAPH_ENDPOINT` or `VITE_HYGRAPH_TOKEN` to the frontend. All Hygraph writes happen on the server.
- Use the backend API base URL in production if needed:

```env
VITE_API_BASE_URL=https://your.api.example.com
```

The frontend uses `localStorage` `authToken` for the Authorization header and relies on the backend to validate Clerk tokens.