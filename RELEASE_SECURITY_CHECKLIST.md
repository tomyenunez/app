# Checklist de seguridad de release · Dayxo

Repasar ANTES de cada subida a TestFlight y a App Store.

## Antes de TestFlight

### Backend
- [ ] Migraciones `0001` + `0002` aplicadas en el proyecto Supabase de **producción**.
- [ ] `0003_verify_rls.sql` corrido y OK (RLS en todas las tablas).
- [ ] Policies del bucket `avatars` configuradas.
- [ ] Rate-limits de Auth y email-confirmation activados.

### Secretos / config
- [ ] `.env` NO está en el commit (`git ls-files | grep env` → sólo `.env.example`).
- [ ] No hay `service_role` ni ninguna key privada en el código
      (`grep -rni "service_role" app`).
- [ ] El build apunta al **proyecto Supabase de producción** (no el de pruebas).
- [ ] EAS secrets configurados para cualquier credencial de build (no en el repo).

### App
- [ ] Build de **producción** (`eas build --profile production`) → confirma que
      `console.*` se stripea (babel `env.production`).
- [ ] Sin pantallas de debug / endpoints dev accesibles.
- [ ] Permisos mínimos en `app.json` con textos claros (fotos, notificaciones).
- [ ] `npx tsc --noEmit` sin errores.
- [ ] `npx expo-doctor` sin warnings críticos.

### Prueba funcional de seguridad
- [ ] Correr `SECURITY_TEST_PLAN.md` (al menos las pruebas de RLS con 2 usuarios).

## Antes de App Store (además de lo anterior)

- [ ] **Privacy labels** completas (ver `PRIVACY_APP_STORE_NOTES.md`).
- [ ] **Borrar cuenta** disponible dentro de la app (Apple lo exige si hay registro).
- [ ] Política de privacidad publicada y linkeada en App Store Connect.
- [ ] Textos de permisos (Info.plist) revisados y en el idioma correcto.
- [ ] Verificado que las notificaciones no muestran contenido sensible por defecto.
- [ ] Bundle identifier y versión correctos; sin flags de debug.

## Regla de oro
Si algo de esta lista no está ✅, **no se publica**. Ver
"NO NEGOCIABLES DE SEGURIDAD DAYXO" al final del resumen de hardening.
