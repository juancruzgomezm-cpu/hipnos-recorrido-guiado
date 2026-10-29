# Hipnos – Recorrido Guiado

Segunda aplicación independiente basada en `Hipnos_Web_GitHub_Pages.zip`. La aplicación original no fue editada, reemplazada, renombrada ni desplegada de nuevo.

## Recorrido
1. Presentación de Hipnos.
2. Dos microclimas: demostración visual de 26 y 18 °C, dentro del rango original de 16–28 °C.
3. Cuatro capas: despiece y materiales, destacados automáticamente.
4. Agua: suministro y retorno por dos circuitos, con conexiones posteriores.
5. Hub: apertura y explicación automática de los componentes existentes.
6. Control RF: representación funcional del visor original.
7. Medidas: Dos plazas 1,40 × 1,90 m; Queen 1,60 × 2,00 m; King 2,00 × 2,00 m.
8. Cierre nocturno.

Anterior y Continuar siguen esta secuencia. Al finalizar se puede reiniciar. Las flechas del teclado permiten avanzar y retroceder. No hay selector de secciones, cámara libre ni caminos alternativos.

Se conservaron el modelo, las texturas, Raleway, la paleta y los sistemas de animación de la base. Los controles exploratorios se mantienen como implementaciones internas de la copia, sin acceso en la experiencia guiada. Los activos AR se conservaron, pero no se ofrece el selector libre de AR: sacaría al visitante del recorrido. La versión original mantiene sus funciones.

El interior sigue siendo ilustrativo. El control RF es la representación funcional ya incluida en el visor. Los tamaños son adaptaciones dimensionales del modelo de origen, no CAD de fabricación. La demostración no controla hardware.

## Independencia
Esta copia tiene otra identidad de alojamiento, repositorio, URL, manifiesto PWA y claves de caché. No comparte repositorio ni despliegue con la original. Su service worker solo administra las cachés `hipnos-guided-*`.

## Validación
- Ocho etapas, ida, retroceso, reinicio y protección contra clics repetidos: prueba CPU/DOM con el GLB real.
- Hash del GLB y sus buffers de geometría conservados.
- Distribución del texto y controles comprobada en Chrome a 390 × 844 y 375 × 667 mediante fixtures CSS/DOM.
- El Chrome de QA tiene WebGL deshabilitado; no se validó el render GPU ni se probó un iPhone físico. La aplicación requiere WebGL 2, igual que la original.
- Ver `docs/guided-validation.json`, `docs/guided-mobile-validation.json` y `docs/original-preservation.json`.

## Desarrollo de esta segunda aplicación
`npm ci`, `npm run check`, `npm run build`. El sitio preparado se genera en `dist/`. Las fuentes de la narrativa están en `src/guided-tour.js`; las adaptaciones visuales en `assets/guided.css`. No usar la identidad de alojamiento ni los archivos del proyecto original para publicar esta versión.
