# Dayxo

App de productividad y finanzas personales — React Native + Expo SDK 52.

## Cómo correrla

1. Instalá **Expo Go** en tu teléfono (App Store / Google Play).
2. En esta carpeta, ejecutá:

```
npx expo start
```

3. Escaneá el QR que aparece en la terminal con la cámara (iOS) o desde la app Expo Go (Android). El teléfono y la PC tienen que estar en la misma red Wi-Fi.

> Si `npx` no se reconoce, abrí una terminal nueva (el PATH se actualizó al instalar Node) o ejecutá antes:
> `$env:PATH = "$env:USERPROFILE\tools\nodejs;$env:PATH"`

## Secciones

| Tab | Sección | Color |
|-----|---------|-------|
| 🏠 | Home — score del día, racha, resumen | Violeta |
| ✅ | To-do — tareas con categorías | Violeta |
| 🔥 | Hábitos — por día de semana, con racha semanal | Naranja |
| 💰 | Mi Plata — ingresos/gastos en ARS | Azul |
| 📅 | Agenda — eventos + calendario mensual | Rosa |
| 📊 | Stats — métricas, actividad 7 días, hábitos 30 días | Violeta |

"Entre amigos" (deudas) se accede desde la card verde del Home.

## Estructura

```
/app
  /navigation   ← Bottom tabs (6 visibles + Deudas oculta)
  /screens      ← 7 pantallas
  /components   ← /home /shared
  /services     ← storage.ts (AsyncStorage, listo para swap a Supabase)
  /hooks        ← un hook por entidad, recargan al enfocar el tab
  /utils        ← fechas (date-fns, es-AR) y formato de moneda
  /constants    ← colores y layout
  /types        ← interfaces TypeScript
App.tsx         ← carga de fuentes Inter + NavigationContainer
```

## Datos

Todo persiste localmente en AsyncStorage con claves `@kitdeldia/*`. La lógica de datos está aislada en `app/services/storage.ts` para migrar a Supabase sin tocar pantallas.

- **Score de hoy** = (hábitos completados hoy + tareas done) / (hábitos que aplican hoy + total tareas) × 100
- **Racha** = días consecutivos abriendo la app (se actualiza al abrir; si faltaste un día vuelve a 1)
- **Hábitos** = índice 0 = Lunes … 6 = Domingo; completados guardados como `"YYYY-M-D-habitId"` sin reset semanal
