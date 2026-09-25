# Preguntas para alguien que maneje un local

Guion para hablar con quien administre un restaurante, bar o cafetería. El objetivo no es venderle nada: es **entender cómo trabaja hoy** para decidir lo que quedó abierto en Feature 1. Está en español porque es para usar en la conversación; el resto de `docs/` está en inglés.

## Dos rondas, no una

No se pregunta todo en la misma charla. Hay dos rondas y la segunda se hace después, volviendo a contactar a la persona.

| Ronda | Cuándo | Para qué | Tiempo |
|---|---|---|---|
| **1. Destraba F1-6** | Ahora | Lo mínimo para terminar la página que ve el cliente (`/t/[token]`) | 10 a 15 min |
| **2. Después** | Cuando haya algo más armado | Features 2 y 3, y validar decisiones ya tomadas | 15 min, o dos charlas cortas |

Si en la ronda 1 la persona menciona algo de la ronda 2, anotalo tal cual y seguí; no lo profundices ese día.

**Cómo llevarlas:**
- Primero preguntá cómo funciona hoy, y recién al final, si hace falta, mostrale algo. Si le mostrás la pantalla antes, te responde sobre la pantalla y no sobre su local.
- Pedile ejemplos concretos ("la última vez que...") en lugar de opiniones ("¿te serviría...?"). Las opiniones sobre algo hipotético suelen ser amables y poco útiles.
- Anotá sus palabras textuales, sobre todo los nombres que usa para las cosas (cubierto, cubert, servicio, propina, comanda).
- Si podés, hacela con 2 o 3 personas de tipos distintos (bar, restaurante, café) y compará.

---

# RONDA 1: destraba F1-6

Estas cinco definen el texto y el comportamiento de la página que ve el cliente. No hace falta nada más para terminar F1-6.

**1. Cómo trabaja hoy** (siempre primero: decide qué otras preguntas aplican)
- Contame la última vez que una mesa pidió, paso por paso, desde que levantó la mano hasta que el pedido llegó a cocina.
- ¿Dónde queda anotado lo que pidió cada mesa? (comanda en papel, un sistema en pantalla, de memoria del mozo, otro). Si es un sistema: ¿cómo se llama? (marca y, si lo sabe, el plan). No le preguntes qué puede hacer, eso lo averiguamos nosotros después.
- ¿Cómo saben qué mesas están ocupadas y cuáles libres? (plano en papel, pantalla del sistema, de memoria). ¿Quién lo actualiza y cuándo?

Cómo usar lo que responda:
- **Papel o de memoria:** no hay historial hoy, así que el de Feature 1 es valor nuevo (pregunta 7). Las preguntas sobre "su sistema" no aplican.
- **Un sistema con mesas:** las preguntas 3, 5 y 7 son las críticas. Anotá la marca exacta.

**2. Extras sobre el consumo** (decide cómo se llama el valor que hoy es `menuSubtotal`)
- ¿Qué se suma a lo que consumió la persona cuando llega la cuenta? (servicio de mesa, cubierto, propina, impuestos, recargo por tarjeta)
- ¿Cómo se calcula cada uno y quién lo decide? ¿Cambia según el día o el horario?
- Si el cliente viera en el celular "Subtotal de tu pedido: $X", ¿qué entendería? ¿Se confundiría con lo que va a pagar?
- ¿Cómo lo llamaría él o ella? (palabras textuales)

**3. Cómo se entera el local de que entró un pedido** (decide qué promete la pantalla de confirmación y si Feature 1 sirve sola)
- Si un pedido entrara desde el celular, ¿quién tendría que verlo y en qué pantalla? ¿Alguien está mirando una pantalla todo el tiempo, o tendría que sonar algo?
- ¿Qué pasa si nadie lo ve durante 10 minutos?

**4. Quién abre y cierra las mesas y cuándo** (define el flujo de sesiones)
- ¿Quién le da la bienvenida a la mesa y quién la despide?
- Si mañana un mozo tuviera que "abrir" la mesa desde el celular cuando se sientan, ¿lo haría? ¿Se olvidaría?
- La última vez que una mesa pagó, ¿cómo fue? (posnet en la mesa, en caja, QR de una billetera, efectivo con la cuenta en papel). ¿Quién cierra la mesa después, y dónde lo marca?
- ¿Qué pasa cuando los clientes se van sin avisar? ¿Alguien limpia la mesa "en el sistema"?
- ¿Se sienta gente sin reservar, en barra, en tandas largas (sobremesa de horas)?

**5. Cómo se llaman las mesas** (hoy solo se puede usar un número del 1 al 999; si el local usa otros nombres, cambia la página y la base)
- ¿Cómo llaman a sus mesas? ¿Solo números, o también "Barra 2", "Terraza 4", "Patio A", "VIP"?
- ¿Es el mismo nombre en su sistema o plano de ocupación, en el salón y en la comanda, o cada uno usa el suyo? Anotá los nombres textuales.

## Cierre de la ronda 1
- ¿Qué tendría que pasar para que no lo usen ni una semana? (la pregunta de las objeciones)
- ¿Con quién más debería hablar?
- ¿Puedo volver a preguntarte cuando tenga algo más armado? (**imprescindible**: es lo que habilita la ronda 2)

---

# RONDA 2: después

**No preguntar en la ronda 1.** Se hace cuando F1-6 esté terminada y haya algo para mostrar, o cuando se decida avanzar con Features 2 y 3.

## 2A. Features 2 y 3 (aviso al local, historial, cocina)

**6. Pedidos que entran de afuera** (decide si un aviso o una integración con su sistema es viable, y si toleran una segunda pantalla)
- ¿Entra algún pedido a su sistema que no escribió una persona del local? (PedidosYa, Rappi, tienda online, WhatsApp). Si sí: ¿cómo aparece? ¿Se carga solo o alguien lo vuelve a tipear? ¿Hay una tablet o pantalla aparte solo para eso? ¿Les molesta tener ese aparato extra? Si no entra ninguno: anotalo, también es una respuesta.

**7. Historial de pedidos** (Feature 2, o un posible F1-7)
- ¿Alguna vez hubo un reclamo ("yo pedí otra cosa", "no me trajeron esto", "me cobraron de más")? ¿Cómo lo resolvieron?
- ¿Qué información necesitaron para resolverlo? (qué se pidió, a qué hora, en qué mesa, quién lo tomó)
- Si un cliente reclama a las 3 semanas, ¿qué miran hoy para saber qué pasó? Si la respuesta es "nada", ese es el valor real del historial.
- ¿Cuánto tiempo hacia atrás querrían poder mirar? ¿Una semana, un mes, un año?
- ¿Miran los pedidos por mesa, por día, por mozo?
- ¿Alguna vez necesitaron anular o corregir un pedido ya hecho? ¿Quién lo hace?

**8. Cocina, barra y mozos** (Features 2 y 3)
- ¿Hay uno o varios puestos (cocina, barra, parrilla, postres)? ¿Cada uno recibe solo lo suyo?
- ¿Cuánto tarda un pedido típico y cómo se avisa que está listo?
- ¿Hay platos que se acaban durante el servicio? ¿Quién lo sabe primero y cómo se avisa al resto?

## 2B. Validar decisiones ya tomadas

**9. Distribución de las mesas**
- ¿Cuántas mesas tienen? ¿Hay mesas que se juntan para grupos grandes?
- ¿Cambia la distribución de las mesas de un día a otro?

**10. Límites del pedido** (hoy: 5 pedidos abiertos por mesa, 30 platos distintos, 20 unidades por plato, 200 caracteres de aclaración)
- ¿Una mesa grande hace muchos pedidos seguidos? ¿Cuántos en una noche larga?
- ¿Pedir 20 unidades de algo tiene sentido? ¿Y 30 platos distintos?
- ¿Qué aclaraciones suelen dejar? ("sin cebolla", alergias, punto de cocción, "para compartir")
- ¿Necesitarían opciones (tamaños, adicionales, punto de cocción) o alcanza con una aclaración de texto libre? Hoy el menú es plano, sin variantes ni combos.

**11. El QR en la mesa**
- ¿Dónde pondrían el QR (pegado en la mesa, en un porta-menú, en el mantel)? ¿Se lo llevan los clientes o se rompe?
- Si alguien le saca una foto al QR y pide desde su casa mientras la mesa está abierta, ¿qué opinan? ¿Ya pasó algo parecido con otros medios?
- ¿Cambiarían el QR de vez en cuando?

**12. Los clientes**
- ¿Hay wifi para clientes, o dependen de sus datos móviles? ¿Se cae la señal en el local?
- ¿Qué proporción de clientes se sentiría cómoda pidiendo desde el celular? ¿Hay turistas, personas mayores?
- ¿Qué preferirían: pedir todo desde el celular o que el mozo siga pasando igual?

**13. Quién usaría el panel de administración**
- ¿Quién actualiza la carta y los precios hoy, y con qué frecuencia?
- ¿Lo haría desde el celular, la computadora o una tablet?
- ¿Hay varios usuarios? ¿Quién debería poder abrir y cerrar mesas y quién no?

**14. Más de un local** (para el escenario de varios restaurantes, hoy fuera de alcance)
- ¿Tiene o piensa tener más de un local? ¿Comparten la carta o cada uno tiene la suya?

---

## Cómo se traducen las respuestas en decisiones

| Ronda | Pregunta | Qué decide |
|---|---|---|
| 1 | 1 | Qué preguntas aplican; si hay un sistema con mesas del que depender |
| 1 | 2 | El texto del subtotal en la confirmación (F1-6) y cómo se llama en la UI |
| 1 | 3 | Qué promete la confirmación; si Feature 1 tiene valor sola, o si un aviso al local es lo siguiente |
| 1 | 4 | Si hace falta cierre automático de sesiones, y cuándo |
| 1 | 5 | Si el número entero alcanza o hay que aceptar el nombre tal cual lo usa el local ("Terraza 4") |
| 2 | 6 | Si un aviso o integración con su sistema es viable; si toleran una segunda pantalla |
| 2 | 7 | Diseño del historial de pedidos (por sesión o por fecha, solo lectura o corregible) |
| 2 | 8 | Alcance de Features 2 y 3 |
| 2 | 9 | Si hace falta juntar mesas (una sesión en varias mesas) |
| 2 | 10 | Si los límites del pedido son razonables o hay que ajustarlos |
| 2 | 11 | Si el token del QR debe rotar, y el cierre automático de sesiones |
| 2 | 12 | Si el pedido desde el celular funciona en el local real |
| 2 | 13 | Si alcanza con un solo usuario admin (hoy es así) |
| 2 | 14 | Si tiene sentido priorizar multi-tenant (stretch) |

## Espacio para anotar

| Ronda | # | Quién / qué tipo de local | Respuesta (textual) | Decisión que cambia |
|---|---|---|---|---|
| | | | | |
