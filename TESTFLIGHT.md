# Subir Dayxo a TestFlight — paso a paso

Leyenda: 🟢 = ya lo dejé listo en el código · 🔵 = lo hacés vos.

---

## Fase 0 — Requisitos previos (🔵 vos)

- [ ] **Apple Developer Program** pago y activo ($99/año). *(en curso — ver nota de pago desde Argentina)*
- [ ] **Cuenta de Expo** gratis → crear en https://expo.dev (la vas a usar para EAS).
- [ ] **Ícono de la app 1024×1024 px** (PNG, sin transparencia). ⚠️ **Falta.** Ver "Ícono" abajo.

## Fase 1 — Configuración del proyecto

- 🟢 **`eas.json` creado** con 3 perfiles: `development`, `preview`, `production`.
- 🔵 **Ícono**: cuando tengas el PNG 1024×1024, guardalo en `assets/icon.png` y avisame
      que agrego el campo `"icon"` en `app.json`. (Sin ícono el build sale con el
      logo gris de Expo y Apple lo rechaza para la Store.)
- 🔵 **Commiteá tu código antes de buildear.** EAS Build sube lo que está en git;
      los cambios sin commitear **no entran** al build. Guardá primero.

## Fase 2 — Instalar y loguear EAS (🔵 vos, en la compu)

```bash
npm install -g eas-cli      # instala la CLI de EAS
eas login                   # entrás con tu cuenta de Expo
eas init                    # linkea el proyecto y agrega projectId a app.json
```

## Fase 3 — Build de producción (🔵 vos corren · 🤖 EAS lo compila en la nube)

```bash
eas build --platform ios --profile production
```
- La primera vez te pregunta por credenciales de Apple → elegí **"Let EAS manage
  your credentials"** → login con tu Apple ID → EAS crea y maneja los
  certificados y el provisioning solo (no tenés que tocar nada en el portal de Apple).
- Tarda ~15–30 min. Cuando termina, queda un `.ipa` en la nube (EAS te da un link).

## Fase 4 — Subir el build a TestFlight (🔵 vos)

```bash
eas submit --platform ios --profile production --latest
```
- Te pide tu **Apple ID** y, si tenés 2FA, una **app-specific password**
  (se genera en https://account.apple.com → Sign-In and Security → App-Specific Passwords).
- Si la app no existe todavía en App Store Connect, **EAS te ofrece crearla** — decí que sí.

## Fase 5 — App Store Connect (🔵 vos, en el navegador)

En https://appstoreconnect.apple.com:
1. **My Apps → (+) → New App** si no la creó EAS. Bundle ID: `com.dayxo.app`.
   Nombre: Dayxo. SKU: cualquiera (ej. `dayxo-001`). Idioma principal: Español.
2. Esperá a que el build **termine de procesarse** (aparece en la pestaña **TestFlight**, ~10–30 min).
3. **Export Compliance**: te va a preguntar si la app usa encriptación. Dayxo sólo
   usa HTTPS estándar (Supabase) → normalmente respondés que **no usás encriptación
   no exenta**. (Si dudás, poné que usás sólo encriptación estándar/exenta.)
4. **Test Information** (pestaña TestFlight): completá email de contacto y un texto
   corto de "qué probar".

## Fase 6 — Agregar testers (🔵 vos)

- **Internal Testing** (recomendado para arrancar): hasta 100 personas de tu equipo
  (vos, el nun). **No requiere revisión de Apple**, está disponible apenas procesa el build.
  → TestFlight → Internal Testing → agregás las personas por su Apple ID.
- **External Testing**: para gente de afuera (hasta 10.000). **Requiere una revisión
  de Apple** (suele tardar 1–2 días la primera vez). Podés compartir un link público.

## Fase 7 — En el iPhone (🔵 vos y los testers)

1. Instalar la app **TestFlight** desde la App Store.
2. Aceptar la invitación (llega por email al Apple ID invitado, o por link público).
3. Abrir TestFlight → instalar **Dayxo** → probar.
4. Cada build nuevo que subas aparece ahí para actualizar.

---

## Ícono (lo que falta)

Necesitás **un PNG cuadrado de 1024×1024**, fondo sólido (sin transparencia ni
esquinas redondeadas — iOS las redondea solo). Cuando lo tengas:
1. Guardalo como `assets/icon.png`.
2. Avisame y agrego en `app.json`:
   ```json
   "icon": "./assets/icon.png"
   ```
   (y opcionalmente un `splash.image` para la pantalla de carga).

## Recordatorio de credenciales
- **Nunca** subas certificados `.p8/.p12`, ni el App-Specific Password, al repo.
  EAS los guarda cifrados en su nube. El `.gitignore` ya bloquea `*.p8/*.p12`.
