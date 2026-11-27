# Bloque 12a — Prueba de viabilidad de la app móvil

[← Índice](../README.md)

Estado: **pendiente**

## Objetivo

Comprobar que la app móvil es viable con **React Native y Expo**, para iOS y Android, como otro
cliente de la misma API ([0058](../../DECISIONS.md)). La web sigue igual.

Primera versión de la app (bloque 12): iniciar sesión, empezar una rutina, sesión activa con el
temporizador de descanso animado con el móvil bloqueado (Live Activity en iOS, notificación fija
con cuenta atrás en Android) y un widget en los dos sistemas. El resto sigue en la web de momento.
El cardio, bloqueado como en la web hasta el 6b, con la sesión activa pensada para añadirlo.

## Qué hay que plantear antes de escribir código

1. **Estructura:** ¿carpeta `mobile/` en este repo o repo aparte? Qué código se comparte con la
   web (utils puras como formato, esfuerzo y 1RM) y cómo, sin duplicarlo.
2. **Expo:** development build en vez de Expo Go (por las piezas nativas); qué es EAS y qué cuesta.
3. **Auth nativa:** refresh token en almacenamiento seguro (Keychain y Keystore) en vez de cookie.
   Qué cambia en el servidor sin romper la web, y su seguridad.
4. **Descanso:** Live Activity en SwiftUI (iOS) y notificación con cuenta atrás (Android). Qué
   librerías, qué pasa con la app cerrada y qué límites pone cada sistema.
5. **Widgets:** iOS con SwiftUI y Android con qué. Cómo comparten datos con la app y cada cuánto se
   actualizan.
6. **Gráficas:** Recharts no funciona en React Native. Qué librería y por qué.
7. **Design system en React Native** (colores, Geist, tamaños) sin copiar los valores a mano.
8. **Cuentas:** Apple (99 €/año) y Google Play Console; riesgos en la revisión de cada tienda.
9. **Cold start de Render** en una app, y si conviene el plan de pago antes de dársela a los amigos.

David no sabe Swift: la parte nativa se explica concepto a concepto antes de usarla.
