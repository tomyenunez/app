# Plan de pruebas de seguridad · Dayxo (manual)

No hay framework de tests todavía, así que estas son pruebas **manuales paso a
paso**. Las de RLS (sección 1) son las más importantes: hacelas con 2 cuentas
reales después de aplicar las migraciones.

## 1. RLS — aislamiento entre usuarios (CRÍTICO)

Preparación: creá **Usuario A** y **Usuario B**. Logueate como A y creá una
tarea, un movimiento de plata y un hábito. Anotá el `id` de la tarea de A.

> Para probar accesos "crudos" sin tocar la app, usá el SQL Editor con el rol
> del usuario, o el REST endpoint con el access_token de cada uno. Lo más simple:
> probar desde la app logueado como B.

- [ ] **A no ve datos de B y viceversa**: logueado como B, ninguna tarea/plata/
      hábito de A aparece en las listas.
- [ ] **A no puede leer una tarea de B por id**: como B, intentar
      `from('todos').select('*').eq('id', '<id de A>')` → devuelve **0 filas**.
- [ ] **A no puede editar una tarea de B**: como B,
      `from('todos').update({texto:'hackeado'}).eq('id','<id de A>')` → **0 filas
      afectadas**, y al recargar como A el texto sigue intacto.
- [ ] **A no puede borrar una tarea de B**: `delete().eq('id','<id de A>')` como
      B → no borra nada.
- [ ] **Insertar a nombre de otro falla**: intentar insertar un todo con
      `user_id = '<id de A>'` estando logueado como B → **rechazado** por la
      policy `with check`.
- [ ] Repetir spot-checks en `transactions` y `deudas` (finanzas, sensibles).

## 2. Friendships / RPC

- [ ] Buscar por código de amigo devuelve sólo `id, username, avatar_color,
      avatar_url` (NO email, NO friend_code de otros).
- [ ] B no puede ver solicitudes de amistad en las que no participa.
- [ ] B no puede aceptar una solicitud ajena (update por id de una friendship de
      terceros → 0 filas).

## 3. Auth / sesión

- [ ] Sin sesión, la app sólo muestra `AuthScreen` (no se ve ninguna pantalla
      privada, ni un "flash" de ellas).
- [ ] Cerrar sesión y volver a abrir la app → pide login de nuevo.
- [ ] Mensajes de error de login son genéricos ("Email o contraseña incorrectos"),
      no revelan si el email existe.
- [ ] Tocar "Entrar" repetido rápido no dispara múltiples requests (el botón se
      deshabilita con `busy`).
- [ ] Tras logout y login con OTRA cuenta en el mismo device, no se ve XP/estado
      de la cuenta anterior (cache reseteado).

## 4. Inputs / validación

- [ ] Monto de un gasto con texto raro / vacío / negativo → no se guarda basura.
- [ ] (Cuando se wiren los validadores) título de tarea vacío → no se crea;
      título larguísimo → cortado al límite.

## 5. Uploads

- [ ] Elegir una imagen enorme (>5 MB) → la app la rechaza con mensaje claro.
- [ ] (Con bucket policy aplicada) intentar subir a la carpeta de otro user →
      rechazado por Storage.

## 6. Secretos / logs

- [ ] `git ls-files | grep -i env` → sólo `.env.example`.
- [ ] `grep -rni "service_role" app` → sin resultados.
- [ ] Build de producción: no aparecen `console.log` en la consola del device.
- [ ] Ningún log muestra tokens, emails, montos ni contenido de notas.

## 7. Regresión visual / funcional
- [ ] La app arranca, navega entre tabs, crea/edita/borra en cada sección sin
      romperse. (El hardening no debe cambiar el flujo ni el diseño.)
