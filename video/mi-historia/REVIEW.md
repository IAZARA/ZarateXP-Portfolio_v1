# Review · "Mi historia" (2026-11-03)

Reemplaza al video "Mi PC" (estética XP), que Ivan rechazó. Pedido: autobiográfico, que arranque con "Soy Iván Zárate", motion de calidad sin temática Windows, contado por un avatar (sin fotos personales), con su voz. Versión en inglés = misma voz con subtítulos en inglés.

## Decisiones
- La voz de Ivan es el reloj: todo cae sobre las palabras (`build.py`, V = 0.5 s). La toma salió de una sola grabación de 45 s.
- Avatar ilustrado (vector plano) con boca sincronizada por sílaba en "Soy Iván Zárate" al inicio y al cierre (parches de boca a/e/o y parpadeo sobre el recorte).
- Nueve escenas, cada una entra por algo que ya está en pantalla: zoom a la cara, a través del monitor CRT, a través de la pared de monitores, la fila con error que se vuelve la pizarra blanca, barrido lateral, zoom por el "38 m" inventado, barrido vertical del mapa a la terraza, fundido al cierre.
- Atlas Urbano usa su propia marca (fondo #061012, turquesa #61D4C6, cálido #E6BB68, Inter). El resto: azul noche #0B1220, ámbar #E6BB68, Anton para nombre y años.
- El pago es 14 / 22 a los 37.4 s (79 %), con riser e impacto.
- Español sin subtítulos; inglés con subtítulos por frase (la voz sigue en español).

## Medido
- `hyperframes check`: sin errores. Avisos que quedan: estructura en un solo archivo generado por `build.py`; `line_unread` sobre el nombre letra por letra, el tipeo del chat y la URL de Atlas (son decorativos o se leen en la voz).
- Mezcla del borrador: -17 LUFS, pico -1.5 dB, sin clipping. El sonido se midió, no se escuchó.

## Lo más flojo
- La escena de la terraza (38-43 s) no tiene nada que pase además del empuje lento de cámara.
- El logo de ACSYS es un PNG de 133 px: en la pizarra se ve chico para que no se pixele.
- Los labios solo se mueven en las dos frases a cámara; en el resto el avatar no habla (es voz en off a propósito).

## Cómo regenerar
`python3 build.py` (o `python3 build.py en`), `./hf.sh check`, y
`./hf.sh render --quality delivery --variables '{"lang":"es"}' --output renders/mi-historia-es.mp4` (igual con `en`).
Versión web: ffmpeg a 1280x720, CRF 23, AAC 128k, `faststart` (comando en el commit que la agregó).
