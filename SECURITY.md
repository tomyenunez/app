# Seguridad de Dayxo

Estado: hardening pre-beta-pública (julio 2026). Este documento explica el
modelo de seguridad, qué está protegido y — importante — **qué NO se puede
proteger** en una app de este tipo, para no vivir con una falsa sensación de
seguridad.

## Arquitectura y superficie de ataque

- **React Native / Expo, sin WebView, sin HTML dinámico, sin `eval`, sin deep
  links.** El texto del usuario se renderiza en `<Text>`, que nunca interpreta
  markup → **el XSS clásico de navegador no aplica**. Verificado en el código.
- **Backend Supabase.** El cliente habla directo con Postgres usando la
  **anon/publishable key**. Toda la seguridad de los datos depende de **Row
  Level Security (RLS)** — por eso es el control #1.
- **Sin SQL injection:** el SDK de Supabase parametriza las queries; no hay SQL
  armado a mano. Los pocos filtros `.or()` con ids llevan validación de UUID.

## Qué protege realmente los datos

| Amenaza | Mitigación |
|---|---|
| Un usuario lee/edita datos de otro cambiando un id | **RLS por `auth.uid()`** en todas las tablas (`supabase/migrations/0006`) |
| Cualquiera consulta la base con la anon key | `anon` sin permisos en ninguna tabla (verificado: todo da 401) |
| Funciones que saltean RLS | RPCs `SECURITY DEFINER` con `search_path` fijo (auditar con 0005) |
| Datos basura / NaN / montos absurdos | Validación central (`app/utils/validation.ts`) + constraints en DB |
| Fuerza bruta de login / spam de cuentas | Rate limits de Supabase Auth (config Dashboard) + OTP de confirmación |
| Logs con datos sensibles en producción | `console.*` borrado del bundle de producción (babel) |
| Abuso de la RPC de borrar cuenta | `delete_own_account` usa `auth.uid()`, sin parámetros: solo te borrás a vos |

## ⚠️ Dos mitos importantes (tus pedidos, con la verdad)

### 1. "Ocultar las API keys para que no queden regaladas"
La **anon/publishable key NO se puede ocultar** en una app cliente. Cualquiera
con el teléfono puede sacarla del bundle o mirándola pasar por la red (un proxy
tipo Charles la muestra en 2 minutos). **Esto es normal y esperado** — la anon
key es *pública por diseño*, como la dirección de tu casa: que la sepan no
significa que puedan entrar.

Lo que de verdad protege es:
- Que sea **SOLO la anon key** (nunca la `service_role`). ✅ Verificado: no hay
  ninguna key privada en el código ni en el historial de git.
- Que **RLS** haga que la key sola no sirva para leer/escribir nada ajeno. ← el
  trabajo de `0006`.

Mejora de higiene aplicada: sacar la key del `eas.json` commiteado y ponerla en
**EAS Environment Variables** (no viaja en git). No la vuelve secreta, pero es
más prolijo. Ver `ENVIRONMENT.md`.

**Lo que NUNCA debe pasar:** que aparezca la `service_role` key, un secreto de
SMTP/Resend, o cualquier token privado en el cliente. Eso sí sería "regalar las
llaves". Hoy no pasa.

### 2. "Que no me puedan copiar el código / la app"
La verdad técnica: **no existe forma de impedir que copien una app móvil.**
- El código JS viaja compilado dentro de la app; alguien decidido lo puede
  extraer. Se puede **dificultar**, no impedir.
- Contra el "screenshot + prompt para clonar": **ninguna protección de código
  lo frena**, porque la UI la ven igual en la pantalla. Lo que se copia con
  screenshots es el *diseño*, no tu código.

Lo que SÍ se hizo para subir la barrera:
- **Minificación** (por defecto en producción) + **`console.*` borrado** → el
  código compilado queda ilegible y sin pistas.
- **Sin source maps en el dispositivo** (EAS los sube aparte para reportes de
  error; no van en la app).
- Sin comentarios ni info de debug en el bundle de producción.

**Dónde está tu verdadero "moat" (foso defensivo):** no en esconder el código,
sino en la ejecución, la marca, la comunidad de usuarios, el backend (que sí es
privado) y la velocidad de iteración. Un clon puede copiar pantallas; no puede
copiar tus usuarios ni tu ritmo.

## Pendientes / a revisar

- [ ] **Aplicar `0006_rls_hardening.sql`** (lo más importante — activa RLS).
- [ ] Correr `0005_security_audit.sql` y **blindar las tablas de GRUPOS** según
      el resultado (groups, group_members, group_invites, group_activity,
      shared_*) — su RLS no se pudo escribir a ciegas.
- [ ] Auditar las RPCs de grupos (`create_group`, `join_group_by_code`, etc.):
      que tengan `search_path` fijo y validen membresía.
- [ ] Configurar **rate limits de Auth** y CAPTCHA en el Dashboard.
- [ ] Verificar **policies del bucket `avatars`** (escritura solo en la carpeta
      propia `{uid}/`).
- [ ] Mover la anon key a EAS Environment Variables.

## Reportar una vulnerabilidad
Internamente: NO la subas en un commit público con el detalle. Avisá en privado
al dueño del repo, con reproducción e impacto. Rotá cualquier secreto expuesto
antes de hacer público el detalle.
