# Review · "Mi PC" (2026-11-03)

**Elegido:** B · Mi PC (zoom infinito), español + inglés, solo efectos. No se construyeron A (Iniciar sesión) ni C (La tipografía manda): ver `STORYLINES.md`.

## Decisiones
- La barra de direcciones arma la carrera (`C:\2016 Policía Federal\2024 Ministerio de Seguridad\2026 ACSYS\Investigación`); cada nivel entra por el ícono de la carpeta (zoom 14x, 0.55 s power3.in con motion blur).
- El payoff es Atlas Urbano a los 24 s (65 %): el dato inventado se tacha y el contador llega a 14 / 22. La métrica es real; el borrador "38 m" es ilustrativo y la barra de estado lo dice.
- La tarjeta final es la pantalla de bienvenida XP con la marca ZarateXP, el avatar y la URL; queda quieta 2.2 s.
- 37.4 s en vez de 32 s: se respetaron los tiempos de lectura de los globos en vez de recortarlos.

## Medido
- `hyperframes check`: sin errores. Avisos que quedan a propósito: estructura en un solo archivo generado por `build.py` (no en sub-composiciones), `line_unread` sobre la barra de menús y la ruta letra por letra (decorativos), contraste de etiquetas blancas del escritorio sobre cielo claro (tienen sombra como en XP).
- Render `delivery`: 1920x1080, 30 fps, 37.4 s, H.264 + AAC 48 kHz estéreo, sin clipping. Versión web (`assets/video/`): 1280x720, ~3 MB, -15.8 LUFS, true peak -1.0 dB.
- El sonido se midió (onsets en los clics del doble clic, golpe en 14 / 22), no se escuchó.

## Lo más flojo
- Los niveles "Mi PC" y "C:\" son tránsitos rápidos (~2 s) con poco contenido; con más tiempo, el disco podría mostrar la línea de tiempo dentro de la barra de uso.
- Sin música: si se quiere, un tema del catálogo de HeyGen o uno propio entra como `<audio>` en la raíz.

## Cómo regenerar
`python3 build.py` (o `python3 build.py en` para revisar el inglés con `./hf.sh snapshot`), `./hf.sh check`, y
`./hf.sh render --quality delivery --variables '{"lang":"es"}' --output renders/mi-pc-es.mp4` (igual con `en`).
La versión web se codifica con ffmpeg a 1280x720 CRF 23, +4 dB y `faststart` (comando en el commit que la agregó).
