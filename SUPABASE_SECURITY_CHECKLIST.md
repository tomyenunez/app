# Checklist de seguridad · Supabase (Dayxo)

Tareas que se hacen en el **Dashboard de Supabase**, no en el código.

## 1. Diagnóstico primero (CRÍTICO)
- [ ] Correr `supabase/migrations/0005_security_audit.sql` en el SQL Editor.
- [ ] Pegarle a Claude las 5 tablas de resultado. Revisar:
  - [ ] **Query 1:** ninguna tabla con datos debe tener `rls_activo = false`.
  - [ ] **Query 2:** `anon` NO debe aparecer con permisos en tablas de datos.
  - [ ] **Query 3:** toda función `security_definer = true` debe tener
        `search_path` en `settings` (si es NULL → riesgo).

## 2. Activar RLS (tablas de dueño único)
- [ ] Correr `supabase/migrations/0006_rls_hardening.sql`. Cubre: todos,
      transactions, deudas, habitos, habit_done, opciones_gasto, familias,
      game_state, notas, eventos, feedback, profiles, friendships + endurece
      `find_user_by_friend_code`.
- [ ] Volver a correr 0005 → confirmar que esas tablas quedaron `rls_activo = true`.

## 3. Tablas de GRUPOS (no se pudieron blindar a ciegas)
Estas usan lógica de membresía y su schema lo definió el equipo. Con el
resultado de 0005 a la vista, escribir policies para:
- [ ] `groups`, `group_members`, `group_invites`, `group_activity`
- [ ] `shared_groups`, `shared_group_members`, `shared_expenses`
- [ ] Regla: un usuario solo ve/edita datos de grupos donde **es miembro**;
      solo owner/admin puede borrar el grupo, expulsar o cambiar settings.
- [ ] Auditar las RPCs de grupos (`create_group`, `join_group_by_code`,
      `accept_group_invite`, `leave_group`, `create_shared_group`, etc.):
      `SECURITY DEFINER` + `search_path=public` + validar membresía adentro.

## 4. Auth
- [ ] **Confirm email** activado (el flujo usa OTP de signup → debe estar ON).
- [ ] **Rate limits** (Authentication → Rate Limits): bajar sign-in / sign-up /
      OTP a valores razonables (frena fuerza bruta y spam de cuentas = costos).
- [ ] **CAPTCHA** (Bot protection) si empieza a haber abuso en signup.
- [ ] Password mínimo 8+ (hoy el cliente pide 6).

## 5. Storage — bucket `avatars`
Path usado: `{uid}/avatar.jpg`. Policies:
- [ ] Escritura (insert/update/delete) solo en la carpeta propia:
  ```sql
  create policy avatars_write_own on storage.objects for insert to authenticated
  with check (bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  -- (repetir para update y delete con USING)
  ```
- [ ] Lectura pública (los avatars se muestran por URL) — decisión consciente.
- [ ] Bucket: límite de tamaño (5 MB) y MIME permitidos (image/jpeg, png, webp).

## 6. Costos / abuso / DDoS
- [ ] **Spend cap / budget alerts** activados (un pico de abuso no puede
      convertirse en factura sorpresa).
- [ ] Alertas de uso de DB / Auth / Storage.
- [ ] (App) Los botones críticos ya tienen anti doble-submit. Desde el cliente
      no se "resuelve" DDoS — se mitiga con los rate limits de Supabase y el
      spend cap.
