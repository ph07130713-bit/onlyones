# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Supabase Auth Setup

### Required `.env` variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Approved Redirect Domain

Supabase Auth uses OAuth redirects. In the Supabase Console:

1. Go to `Authentication` -> `URL Configuration`.
2. Add your app domain to `Site URL` (and any local dev URLs you use).
3. Add any additional redirect URLs under `Redirect URLs` if needed.

If your domain is not listed, Google sign-in will be blocked after login.

### Supabase Console Settings (Google OAuth)

Enable the Google provider and set your OAuth credentials:

1. `Authentication` -> `Providers` -> `Google` -> Enable.
2. Add your `Client ID` and `Client Secret`.
3. Add the Callback URL in the Google provider settings:

```
http://localhost:5173/auth/callback
https://<your-domain>/auth/callback
```

4. Add the Redirect URLs in `Authentication` -> `URL Configuration`:

```
http://localhost:5173/auth/callback
https://<your-domain>/auth/callback
```

### SQL: Create Tables

Run the following in the Supabase SQL editor:

```sql
-- Users
create table if not exists users (
  id text primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc', now()),
  quiz_completed boolean default false,
  subscription_status text default 'none'
);

-- StyleProfiles
create table if not exists style_profiles (
  user_id text references users(id),
  size_top text,
  size_bottom text,
  fit text,
  price_min int,
  price_max int,
  style_tags text[],
  color_tags text[],
  avoid_tags text[],
  primary key(user_id)
);

-- Feedback
create table if not exists feedback (
  id bigserial primary key,
  user_id text references users(id),
  item_id text,
  liked boolean,
  created_at timestamp with time zone default timezone('utc', now())
);
```

### Supabase CLI (Local Dev)

The Supabase CLI initializes local configuration and can run Supabase locally. The typical flow is:

```
supabase init
supabase start
```

After `supabase start`, use the printed `API URL` and `anon key` for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.

To apply migrations in `supabase/migrations`, use one of:

```
supabase db push
```

```
supabase migration up
```

Use the `supabase migration` commands to create and manage migrations.

See the Supabase CLI docs for details.

### Install and Run

```
npm i
npm run dev
```

Other scripts:

```
npm run build
npm run lint
npm run preview
```
