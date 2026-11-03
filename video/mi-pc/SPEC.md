GOAL:    que quien lo ve recuerde "10 años de datos críticos y seguridad, hoy arquitecto de IA que investiga cuándo un agente inventa", y entre al portfolio.
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps. Dos renders: lang=es y lang=en (variable `lang`).
TIME:    32 s x 30 fps = 960 frames. Sin música: el reloj son los clics y los zooms.
LOOK:    el medio es la interfaz Luna de Windows XP a escala ~2x (una ventana maximizada llena el cuadro).
         Barra de título 60 px, degradé Luna #0A246A > #2B6CF2 > #0A3FB8 (el propio del medio), texto blanco con sombra 1 px.
         Panel de tareas izquierdo 420 px, degradé #7BA2E7 > #6375D6; sus cajas #D6DFF7 con encabezado #FFFFFF > #C6D3F7.
         Área de contenido #FFFFFF; barra de dirección #ECE9D8 con campo blanco y borde #7F9DB9.
         Barra de tareas fija 64 px (#245EDC > #3F8CF3, botón Inicio verde #3C8F3C > #59B24C, reloj en #0F8EE8). Es el hogar: no se mueve nunca.
         Tipografía: Libre Franklin 800 para globos y títulos grandes (56-96 px, tracking -1%); Libre Franklin 700 30 px en barras de título;
         Noto Sans 400/700 para etiquetas de íconos y textos de interfaz (26-30 px).
         Acento: globo de notificación XP #FFFFE1 con borde #1A1A1A 2 px y sombra 4 px 4 px 0 rgba(0,0,0,.25); un globo por nivel.
         Rojo #D8282F solo para el dato inventado en Atlas; verde #2E9E4F solo para la corrección.
         Atlas Urbano usa su propia marca: fondo #071318, turquesa #3FD0B0.
OBJECTS: ícono Mi PC (Tango, dominio público), disco "IVAN (C:)" con barra de uso 2016 > 2026, carpetas manila XP (dibujadas),
         archivos con su tipo legible por forma (base de datos = cilindro, documento = hoja con renglones, planilla = grilla verde, mapa = pliego con pin),
         cursor flecha XP blanco con borde negro 44 px, ventana Atlas con borrador, dato inventado tachado y "dato faltante", contador 14 / 22,
         Bloc de notas con la pregunta, pantalla de bienvenida XP como tarjeta final (avatar, nombre, rol, link).
MOTION:  zoom a través de un ícono: escala 1 > 14 alrededor del ícono en 0.55 s power3.in, con motion blur; el nivel nuevo entra desde
         el centro del ícono, escala 0.07 > 1 en 0.75 s expo.out (arranca 0.15 s antes de que termine el zoom anterior).
         Cursor: trayectos power2.inOut de 0.5-0.8 s; doble clic = dos hundidas de 0.06 s (escala 0.88) separadas 0.14 s.
         Globos: aparecen desde la punta de la cola, escala 0.6 > 1 back.out(1.6) 0.3 s; se van en 0.15 s power2.in.
         Tipeo en la barra de dirección y en el Bloc de notas: 1 carácter cada 0.035 s.
         Contador 0 > 14 en 1.3 s power2.out, "/ 22" aterriza al final; después el número queda quieto.
SHOTS:   0.0-2.6  L0 escritorio: ícono Mi PC grande + globo "¿Qué hay en mi PC?" (hook, cuadro 0). Cursor llega y hace doble clic. Zoom.
         2.6-4.4  L1 Mi PC: disco IVAN (C:) con barra 2016 > 2026. Doble clic. Zoom.
         4.4-6.2  L2 C:\: carpetas de sistema en gris y "2016 Policía Federal". Doble clic. Zoom.
         6.2-10.4 L3 Policía Federal: bases de datos públicas, privacidad, OSINT, equipo. Globo 2016-2024. Zoom a "2024 Ministerio".
         10.4-14.4 L4 Ministerio: SIFEBU, CUFRE, CRIACO. Globo 2024-2026. Zoom a "2026 ACSYS".
         14.4-17.8 L5 ACSYS: discovery, arquitectura de IA, RAG seguro, PoC. Globo AI Solution Architect. Zoom a "Investigación".
         17.8-23.0 L6 Investigación > Atlas Urbano: el ícono crece y se vuelve la ventana; dato inventado en rojo, la revisión lo tacha y escribe
                   "dato faltante"; contador 14 / 22 (payoff, ~66%).
         23.0-26.0 Bloc de notas: se tipea la pregunta de investigación.
         26.0-27.2 salida del zoom: los niveles pasan hacia atrás hasta el escritorio.
         27.2-32.0 bandas azules de la bienvenida XP entran desde arriba y abajo; tarjeta final quieta 3 s.
SOUND:   clic en cada clic visible, whoosh en cada zoom (3 tomas rotando), pop en cada globo, teclas suaves en el tipeo, un impacto en 14 / 22.
BANNED:  vacío oscuro con cosas flotando; glow, partículas, lens flares; todo entrando con fade + subida; títulos que siguen moviéndose;
         tres tarjetas en fila; logo de esquina; crossfade entre mundos; sonidos sintetizados.
QA:      t=0 (cuadro miniatura legible), 3.0, 5.0, 8.5, 12.5, 16.0, 20.0, 21.5, 25.0, 30.0; y cada costura de zoom +/- 0.1 s.
