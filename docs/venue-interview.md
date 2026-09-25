# Preguntas para alguien que maneje un local

Guion para una charla con quien administre un restaurante, bar o cafetería. El objetivo no es venderle nada: es **entender cómo trabaja hoy** para decidir lo que quedó abierto en Feature 1. Está en español porque es para usar en la conversación; el resto de `docs/` está en inglés.

**Cómo llevarla (15 a 20 minutos):**
- Primero preguntá cómo funciona hoy, y recién al final, si hace falta, mostrale algo. Si le mostrás la pantalla antes, te responde sobre la pantalla y no sobre su local.
- Pedile ejemplos concretos ("la última vez que...") en lugar de opiniones ("¿te serviría...?"). Las opiniones sobre algo hipotético suelen ser amables y poco útiles.
- Anotá sus palabras textuales, sobre todo los nombres que usa para las cosas (cubierto, cubert, servicio, propina, comanda).
- Si podés, hacela con 2 o 3 personas de tipos distintos (bar, restaurante, café) y compará.

## Antes de todo: cómo trabaja hoy (siempre primero)

**0. Cómo toman y registran los pedidos hoy** (decide qué preguntas de abajo aplican y cuáles se saltean)
- Contame la última vez que una mesa pidió, paso por paso, desde que levantó la mano hasta que el pedido llegó a cocina.
- ¿Dónde queda anotado lo que pidió cada mesa? (comanda en papel, un sistema en pantalla, de memoria del mozo, otro). Si es un sistema: ¿cómo se llama? (marca y, si lo sabe, el plan). No le preguntes qué puede hacer, eso lo averiguamos nosotros después.
- ¿Cómo saben qué mesas están ocupadas y cuáles libres? (plano en papel, pantalla del sistema, de memoria). ¿Quién lo actualiza y cuándo?
- ¿Cómo se llama cada mesa ahí? Pedile que te las nombre tal cual las usa.
- ¿Entra algún pedido a ese sistema que no escribió una persona del local? (PedidosYa, Rappi, tienda online, WhatsApp). Si sí: ¿cómo aparece? ¿Se carga solo o alguien lo vuelve a tipear? ¿Hay una tablet o pantalla aparte solo para eso? ¿Les molesta tener ese aparato extra? Si no entra ninguno: anotalo, también es una respuesta.

Cómo usar lo que responda:
- **Papel o de memoria:** no hay historial hoy, así que el de Feature 1 es valor nuevo (pregunta 4). Las preguntas sobre "su sistema" no aplican.
- **Un sistema con mesas:** las preguntas 2, 4 y 7 son las críticas. Anotá la marca exacta.

## Las que bloquean F1-6 (preguntar sí o sí)

Estas definen el texto y el comportamiento de la página que ve el cliente.

**1. Extras sobre el consumo** (decide cómo se llama el valor que hoy es `menuSubtotal`)
- ¿Qué se suma a lo que consumió la persona cuando llega la cuenta? (servicio de mesa, cubierto, propina, impuestos, recargo por tarjeta)
- ¿Cómo se calcula cada uno y quién lo decide? ¿Cambia según el día o el horario?
- Si el cliente viera en el celular "Subtotal de tu pedido: $X", ¿qué entendería? ¿Se confundiría con lo que va a pagar?
- ¿Cómo lo llamaría él o ella? (palabras textuales)

**2. Cómo se entera el local de que entró un pedido** (decide si Feature 1 sirve sola o si hace falta algo más)
- Hoy, cuando alguien quiere pedir, ¿qué pasa exactamente, paso por paso, desde que levanta la mano?
- Si un pedido entrara desde el celular, ¿quién tendría que verlo y en qué pantalla? ¿Alguien está mirando una pantalla todo el tiempo, o tendría que sonar algo?
- ¿Qué pasa si nadie lo ve durante 10 minutos?
- ¿Usan comandas en papel, una impresora en la cocina, un sistema de punto de venta? ¿Cuál?

**3. Quién abre y cierra las mesas y cuándo** (define el flujo de sesiones)
- ¿Quién le da la bienvenida a la mesa y quién la despide?
- Si mañana un mozo tuviera que "abrir" la mesa desde el celular cuando se sientan la gente, ¿lo haría? ¿Se olvidaría?
- ¿Qué pasa cuando los clientes se van sin avisar? ¿Alguien limpia la mesa "en el sistema"?
- ¿Se sienta gente sin reservar, en barra, en tandas largas (sobremesa de horas)?

## Las que definen lo que viene después

**4. Historial de pedidos** (Feature 2, o un posible F1-7)
- ¿Alguna vez hubo un reclamo ("yo pedí otra cosa", "no me trajeron esto", "me cobraron de más")? ¿Cómo lo resolvieron?
- ¿Qué información necesitaron para resolverlo? (qué se pidió, a qué hora, en qué mesa, quién lo tomó)
- Si un cliente reclama a las 3 semanas, ¿qué miran hoy para saber qué pasó? Si la respuesta es "nada", ese es el valor real del historial.
- ¿Cuánto tiempo hacia atrás querrían poder mirar? ¿Una semana, un mes, un año?
- ¿Miran los pedidos por mesa, por día, por mozo?
- ¿Alguna vez necesitaron anular o corregir un pedido ya hecho? ¿Quién lo hace?

**5. Cocina, barra y mozos** (Feature 2 y 3)
- ¿Hay uno o varios puestos (cocina, barra, parrilla, postres)? ¿Cada uno recibe solo lo suyo?
- ¿Cuánto tarda un pedido típico y cómo se avisa que está listo?
- ¿Hay platos que se acaban durante el servicio? ¿Quién lo sabe primero y cómo se avisa al resto?

**6. Cobro** (fuera de alcance hoy; solo importa por cuándo se cierra la mesa)
- La última vez que una mesa pagó, ¿cómo fue? (posnet en la mesa, en caja, QR de una billetera, efectivo con la cuenta en papel)
- ¿Quién cierra la mesa después de que pagan, y dónde lo marca? (conecta con la pregunta 3)

## Para validar decisiones ya tomadas

**7. Números de mesa** (hoy solo se puede usar un número del 1 al 999)
- ¿Cómo llaman a sus mesas? ¿Solo números, o también "Barra 2", "Terraza 4", "Patio A", "VIP"?
- ¿Es el mismo nombre en su sistema o plano de ocupación, en el salón y en la comanda, o cada uno usa el suyo? Anotá los nombres textuales.
- ¿Cuántas mesas tienen? ¿Hay mesas que se juntan para grupos grandes?
- ¿Cambia la distribución de las mesas de un día a otro?

**8. Límites del pedido** (hoy: 5 pedidos abiertos por mesa, 30 platos distintos, 20 unidades por plato, 200 caracteres de aclaración)
- ¿Una mesa grande hace muchos pedidos seguidos? ¿Cuántos en una noche larga?
- ¿Pedir 20 unidades de algo tiene sentido? ¿Y 30 platos distintos?
- ¿Qué aclaraciones suelen dejar? ("sin cebolla", alergias, punto de cocción, "para compartir")
- ¿Necesitarían opciones (tamaños, adicionales, punto de cocción) o alcanza con una aclaración de texto libre? Hoy el menú es plano, sin variantes ni combos.

**9. El QR en la mesa**
- ¿Dónde pondrían el QR (pegado en la mesa, en un porta-menú, en el mantel)? ¿Se lo llevan los clientes o se rompe?
- Si alguien le saca una foto al QR y pide desde su casa mientras la mesa está abierta, ¿qué opinan? ¿Ya pasó algo parecido con otros medios?
- ¿Cambiarían el QR de vez en cuando?

**10. Los clientes**
- ¿Hay wifi para clientes, o dependen de sus datos móviles? ¿Se cae la señal en el local?
- ¿Qué proporción de clientes se sentiría cómoda pidiendo desde el celular? ¿Hay turistas, personas mayores?
- ¿Qué preferirían: pedir todo desde el celular o que el mozo siga pasando igual?

**11. Quién usaría el panel de administración**
- ¿Quién actualiza la carta y los precios hoy, y con qué frecuencia?
- ¿Lo haría desde el celular, la computadora o una tablet?
- ¿Hay varios usuarios? ¿Quién debería poder abrir y cerrar mesas y quién no?

**12. Más de un local** (para el escenario de varios restaurantes, hoy fuera de alcance)
- ¿Tiene o piensa tener más de un local? ¿Comparten la carta o cada uno tiene la suya?

## Cierre
- ¿Qué tendría que pasar para que no lo usen ni una semana? (la pregunta de las objeciones)
- ¿Con quién más debería hablar?
- ¿Puedo volver a preguntarte cuando tenga algo más armado?

## Cómo se traducen las respuestas en decisiones

| Pregunta | Qué decide |
|---|---|
| 0 | Qué preguntas aplican; si hay un sistema con mesas del que depender; si toleran una segunda pantalla |
| 1 | El texto del subtotal en la confirmación (F1-6) y cómo se llama en la UI |
| 2 | Si Feature 1 tiene valor sola, o si un aviso al local es lo siguiente |
| 3 | Si hace falta cierre automático de sesiones, y cuándo |
| 4 | Diseño del historial de pedidos (por sesión o por fecha, solo lectura o corregible) |
| 5 | Alcance de Features 2 y 3 |
| 6 | Cuándo se cierra una mesa (refuerza la 3) |
| 7 | Si el número entero alcanza o hay que aceptar el nombre tal cual lo usa el local ("Terraza 4") |
| 8 | Si los límites del pedido son razonables o hay que ajustarlos |
| 9 | Si el token del QR debe rotar, y el cierre automático de sesiones |
| 10 | Si el pedido desde el celular funciona en el local real |

## Espacio para anotar

| # | Quién / qué tipo de local | Respuesta (textual) | Decisión que cambia |
|---|---|---|---|
| | | | |
