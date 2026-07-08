# Variables de entorno · Dayxo

## Públicas (van en el bundle del cliente — es esperado)

Sólo variables con prefijo `EXPO_PUBLIC_*`. Quedan **visibles** en la app
compilada; nunca pongas un secreto acá.

| Variable | Qué es | Dónde se saca |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Dashboard → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key. **Pública por diseño**: la protege RLS, no el secreto. | Dashboard → Project Settings → API |

Se cargan desde `.env` (local, ignorado por git). Copiá `.env.example` → `.env`.

## Secretas (NUNCA en el cliente ni en `EXPO_PUBLIC_*`)

| Secreto | Dónde va |
|---|---|
| `service_role` key de Supabase | Supabase Edge Function secrets / backend propio |
| SMTP / Resend / webhook secrets | Supabase secrets |
| Claves privadas Apple/Google (.p8/.p12) | EAS secrets (`eas secret:create`) |
| Cualquier API key de terceros con costo | EAS secrets / backend |

## Reglas

1. Si una variable es secreta y aparece con prefijo `EXPO_PUBLIC_`, **es un bug**:
   termina en el bundle.
2. Rotá de inmediato cualquier secreto que se haya commiteado alguna vez.
3. La anon key se puede rotar en el Dashboard si querés (no es obligatorio, es
   pública), pero el `service_role` **jamás** debe tocar el repo.

## Ambientes (recomendado a futuro)

Separar proyectos Supabase y configs por ambiente con `eas.json`:
- `development` → proyecto Supabase de pruebas, logs ON.
- `preview` (TestFlight) → producción, logs OFF.
- `production` (App Store) → producción, logs OFF.
