// Pictogramas de Yield Fit (bloque 10): DATOS PUROS, sin React ni DOM, para que los use la web,
// el servidor (lista cerrada de iconos de rutina) y, más adelante, la app de React Native.
// Origen: el lienzo de diseño "Imágenes de ejercicios" (artefacto de claude.ai, estilo C). Si se
// redibuja una figura allí, se actualiza aquí; no se edita a mano por separado.
//
// Cambios respecto a lo que exporta el lienzo:
//   - PICTOGRAMA_POR_PRESET usa como clave el presetId del ejercicio (que es el id de su figura),
//     no el nombre: así la figura se encuentra aunque el usuario renombre el ejercicio.
//   - Sin COLORES: los colores son tokens del design system (--color-pictograma-* y
//     --color-accent), nunca valores fijos en los datos.
//
// OJO (despliegue): el servidor de Render tiene Root Directory = server. Un cambio SOLO en esta
// carpeta no lanza su despliegue a menos que compartido/** esté en sus Build Filters (ver
// docs/operaciones.md). Sin eso, la web tendría iconos que el servidor aún rechaza.
//
// Cada figura vive en una caja de 120 × 120:
//   cab      cabeza [x, y], círculo de radio 6,5 en gris
//   g / v    polilíneas grises / verdes, trazo 8 y extremos redondeados:
//            "x,y x,y x,y" separadas por "|"
//   gr       torsos de frente, trazo 18: [x1, y1, x2, y2, esVerde]
//   eq / eg  material: trazo 3 / trazo 5
//   ca       cables, trazo 1,5
//   d        discos y mancuernas [cx, cy, r], rellenos, delante del cuerpo y con un
//            borde de 2 del color del fondo
//   relleno  forma rellena en verde (corazón de cardio, rayo de HIIT)
// Orden de dibujo: eq, eg, ca, gr grises, gr verdes, g, v, relleno, d, cab.

// id de la figura → sus trazos.
export const PICTOGRAMAS = {
  "banca-barra": {"cab":[26,72],"g":"52,74 70,74 85,64 90,104","v":"36,74 52,74|42,74 42,50","eq":"M18 82 H102 M28 82 V104 M92 82 V104","d":[[42,40,10]]},
  "banca-mancuernas": {"cab":[26,72],"g":"52,74 70,74 85,64 90,104","v":"36,74 52,74|42,74 42,52","eq":"M18 82 H102 M28 82 V104 M92 82 V104","d":[[42,47,6.5]]},
  "inclinado-barra": {"cab":[37,51],"g":"54,67 66,78 82,72 86,104","v":"44,58 54,67|46,60 46,42","eq":"M28 62 L58 88 H96 M62 88 V106 M90 88 V106","d":[[46,32,10]]},
  "inclinado-mancuernas": {"cab":[37,51],"g":"54,67 66,78 82,72 86,104","v":"44,58 54,67|46,60 46,44","eq":"M28 62 L58 88 H96 M62 88 V106 M90 88 V106","d":[[46,39,6.5]]},
  "aperturas": {"cab":[60,20],"g":"52,36 38,42 24,40|68,36 82,42 96,40|56,72 52,90 50,106|64,72 68,90 70,106","gr":[[60,40,60,66,0],[60,36,60,46,1]],"eq":"M49 14 H71 V88 H49 Z","d":[[22,40,5.5],[98,40,5.5]]},
  "cruces-polea": {"cab":[60,27],"g":"56,70 55,88 55,104|64,70 65,88 65,104|52,40 46,54 57,64|68,40 74,54 63,64","gr":[[60,46,60,64,0],[60,46,60,50,1]],"eq":"M12 6 V106 M108 6 V106","ca":"M18 12 L56 63 M102 12 L64 63","d":[[16,10,3.5],[104,10,3.5]]},
  "press-maquina-pecho": {"cab":[46,30],"g":"46,56 46,74 66,74 68,100 75,100|46,46 62,48 78,46","v":"46,42 46,56","eq":"M38 44 L40 76 H64 M52 76 V104 M96 20 V106 M80 46 H96","eg":"M80 38 V54"},
  "fondos-paralelas": {"cab":[67,25],"g":"62,50 60,64 64,82 52,92|64,40 56,50 66,60","v":"64,38 62,50","eq":"M50 62 H90 M56 62 V106 M84 62 V106"},
  "flexiones": {"cab":[95,76],"g":"70,85 52,90 22,101|84,80 84,103","v":"84,80 70,85","eq":"M12 106 H108"},
  "dominadas": {"cab":[60,28],"g":"56,76 56,104|64,76 64,104","v":"40,14 42,34 51,43|80,14 78,34 69,43","gr":[[60,48,60,68,1]],"eq":"M20 14 H100"},
  "jalon": {"cab":[60,28],"g":"36,44 44,56 52,42|84,44 76,56 68,42|55,72 55,82 55,104|65,72 65,82 65,104","gr":[[60,46,60,64,1]],"eq":"M30 44 H90 M44 82 H76 M60 82 V106 M60 44 V8","eg":"M46 72 H74","d":[[60,7,3.5]]},
  "remo-barra": {"cab":[86,44],"g":"74,51 62,66 70,78|50,62 56,82 50,104 57,104","v":"50,62 76,50","eq":"M20 106 H100","d":[[70,82,10]]},
  "remo-mancuerna": {"cab":[80,52],"g":"68,56 66,66|40,58 38,67 22,67|42,58 48,82 46,104 53,104|70,56 60,46 62,62","v":"40,58 70,56","eq":"M22 70 H72 M28 70 V106 M66 70 V106 M14 106 H100","d":[[62,66,6]]},
  "remo-maquina": {"cab":[66,34],"g":"60,48 42,54 60,56|46,78 66,80 70,104 77,104","v":"46,76 60,48","eq":"M30 80 H54 M42 80 V106 M96 14 V106 M62 56 H96","eg":"M68 44 V68 M62 50 V62"},
  "remo-polea-baja": {"cab":[44,42],"g":"42,58 30,66 52,70|40,86 62,80 82,90","v":"40,84 42,56","eq":"M24 88 H52 M38 88 V106 M98 98 V106","eg":"M86 80 V100 M52 66 V74","ca":"M54 70 L98 92","d":[[100,94,3.5]]},
  "pullover-polea": {"cab":[72,28],"g":"66,42 80,60|56,64 58,84 56,104 63,104","v":"56,64 66,40","eq":"M98 4 V106 M98 8 H92 M24 106 H100","ca":"M90 14 L80 60","d":[[92,12,3.5]]},
  "peso-muerto": {"cab":[80,44],"g":"70,52 69,80|48,62 60,82 55,104 62,104","v":"48,60 70,50","eq":"M20 106 H100","d":[[68,82,12]]},
  "militar-barra": {"cab":[60,27],"g":"44,26 44,10|76,26 76,10|56,70 55,88 55,104|64,70 65,88 65,104","v":"52,40 44,26|68,40 76,26","gr":[[60,46,60,64,0]],"eq":"M22 8 H98","eg":"M22 0 V16 M98 0 V16 M27 2 V14 M93 2 V14"},
  "militar-mancuernas": {"cab":[60,27],"g":"44,26 44,12|76,26 76,12|56,70 55,88 55,104|64,70 65,88 65,104","v":"52,40 44,26|68,40 76,26","gr":[[60,46,60,64,0]],"d":[[44,12,6],[76,12,6]]},
  "press-maquina-hombros": {"cab":[42,30],"g":"52,32 54,14|42,44 42,76 62,76 64,102 71,102","v":"42,46 52,32","eq":"M34 40 V78 H58 M46 78 V106 M92 6 V106 M54 14 H92","eg":"M48 14 H60"},
  "laterales-mancuernas": {"cab":[60,27],"g":"38,42 24,44|82,42 96,44|56,70 55,88 55,104|64,70 65,88 65,104","v":"52,40 38,42|68,40 82,42","gr":[[60,46,60,64,0]],"d":[[21,44,5.5],[99,44,5.5]]},
  "laterales-polea": {"cab":[60,27],"g":"82,42 96,44|52,40 50,56 50,70|56,70 55,88 55,104|64,70 65,88 65,104","v":"68,40 82,42","gr":[[60,46,60,64,0]],"eq":"M10 20 V106","ca":"M18 98 L96 45","d":[[16,100,3.5]]},
  "frontales": {"cab":[60,22],"g":"74,39 90,40|60,36 60,64 61,84 60,104 67,104","v":"60,38 74,39","d":[[93,40,6]]},
  "pajaros": {"cab":[60,40],"g":"38,54 24,60|82,54 96,60|56,66 52,86 56,104|64,66 68,86 64,104","v":"52,50 38,54|68,50 82,54","gr":[[60,52,60,60,0]],"d":[[23,62,5.5],[97,62,5.5]]},
  "face-pull": {"cab":[62,22],"g":"50,30 70,30|60,36 60,64 61,84 60,104 67,104","v":"60,40 50,30","eq":"M98 4 V106 M24 106 H100","eg":"M72 25 V35","ca":"M92 30 L74 30","d":[[94,30,3.5]]},
  "curl-barra": {"cab":[60,22],"g":"61,58 76,48|60,36 60,64 61,84 60,104 67,104","v":"60,38 61,58","d":[[79,46,9]]},
  "curl-mancuernas": {"cab":[60,22],"g":"61,58 76,48|60,36 60,64 61,84 60,104 67,104","v":"60,38 61,58","d":[[79,46,6]]},
  "curl-martillo": {"cab":[60,22],"g":"60,36 60,64 61,84 60,104 67,104","v":"60,38 61,58 76,48","eq":"M78 38 V54","eg":"M75 38 H82 M75 54 H82"},
  "curl-polea": {"cab":[60,22],"g":"61,58 76,48|60,36 60,64 61,84 60,104 67,104","v":"60,38 61,58","eq":"M98 4 V106 M24 106 H100","eg":"M73 48 H80","ca":"M92 99 L76 50","d":[[94,100,3.5]]},
  "curl-predicador": {"cab":[52,34],"g":"68,66 76,50|44,78 48,48|44,80 60,80 62,104 69,104","v":"50,50 68,66","eq":"M34 80 H56 M45 80 V106 M62 74 V106","eg":"M50 60 L66 76","d":[[78,46,8]]},
  "triceps-polea": {"cab":[65,22],"g":"62,58 68,74|62,38 58,64 60,84 58,104 65,104","v":"62,40 62,58","eq":"M96 4 V106 M96 9 H88 M24 106 H100","eg":"M64 76 H72","ca":"M84 15 L68 74","d":[[86,13,3.5]]},
  "press-frances": {"cab":[26,72],"g":"38,52 28,58|36,74 70,74 85,64 90,104","v":"42,74 38,52","eq":"M18 82 H102 M28 82 V104 M92 82 V104","d":[[24,56,8]]},
  "fondos-banco": {"cab":[46,32],"g":"34,55 34,64|44,46 44,74 66,86 90,102","v":"44,46 34,55","eq":"M12 66 H40 M16 66 V106 M36 66 V106 M12 106 H108"},
  "triceps-mancuerna": {"cab":[64,22],"g":"56,16 46,26|60,36 60,64 61,84 60,104 67,104","v":"58,38 56,16","d":[[44,28,6]]},
  "sentadilla": {"cab":[69,37],"g":"52,78 61,52 70,61 50,47|76,84 66,104 78,104","v":"52,78 76,84","eq":"M22 106 H98","d":[[47,46,11]]},
  "sentadilla-frontal": {"cab":[62,34],"g":"52,78 58,50|58,52 70,60 68,48|76,84 68,104 80,104","v":"52,78 76,84","eq":"M22 106 H98","d":[[74,50,10]]},
  "bulgara": {"cab":[58,28],"g":"72,80 70,104 78,104|54,70 46,92 34,74|54,70 56,42|56,44 54,60 52,74","v":"54,70 72,80","eq":"M12 74 H40 M18 74 V106 M34 74 V106 M10 106 H100","d":[[52,78,6]]},
  "prensa": {"cab":[22,50],"g":"70,62 86,36|48,82 28,60|30,62 42,76","v":"48,82 70,62","eq":"M18 56 L40 88 H58 M48 88 V106 M60 100 L100 36","eg":"M78 24 L98 44"},
  "extension-cuadriceps": {"cab":[44,30],"g":"64,72 86,64|44,72 44,44|44,46 50,60 54,72","v":"46,72 64,72","eq":"M34 40 V74 H58 M46 74 V106 M62 78 L84 70","d":[[87,67,4]]},
  "femoral-tumbado": {"cab":[20,62],"g":"84,68 78,46|28,68 62,68|34,68 30,78","v":"62,68 84,68","eq":"M16 74 H92 M24 74 V106 M84 74 V106","d":[[78,44,4]]},
  "femoral-sentado": {"cab":[44,30],"g":"64,72 58,94|44,72 44,44|44,46 50,60 54,72","v":"46,72 64,72","eq":"M34 40 V74 H58 M46 74 V106","eg":"M50 66 H66","d":[[56,98,4]]},
  "rumano": {"cab":[86,44],"g":"56,82 54,104 61,104|52,58 76,48|74,50 74,78","v":"52,58 56,82","eq":"M20 106 H100","d":[[74,82,10]]},
  "hip-thrust": {"cab":[24,56],"g":"34,63 48,58|70,58 80,62 82,104 89,104|40,62 56,48","v":"48,58 60,55 70,58","eq":"M10 68 H36 M16 68 V106 M32 68 V106 M10 106 H100","d":[[60,44,10]]},
  "zancadas": {"cab":[58,26],"g":"74,80 72,104 80,104|56,68 50,90 36,102|56,68 57,40|57,42 58,60 58,74","v":"56,68 74,80","eq":"M14 106 H100","d":[[58,78,6]]},
  "talones": {"cab":[60,22],"g":"60,36 60,64 61,84|61,98 66,102","v":"61,84 61,98","eq":"M76 6 V106 M40 106 H90","eg":"M50 34 H72 M58 102 H76"},
  "plancha": {"cab":[90,78],"g":"50,90 20,101|80,84 80,101 96,101","v":"50,90 80,84","eq":"M12 106 H108"},
  "plancha-lateral": {"cab":[92,60],"g":"52,84 18,101|82,68 82,100|82,68 78,40","v":"52,84 82,68","eq":"M12 106 H108"},
  "crunch": {"cab":[30,72],"g":"54,98 70,82 82,102 89,102|36,84 26,82","v":"54,98 42,92 34,82","eq":"M12 106 H108"},
  "crunch-polea": {"cab":[84,82],"g":"50,102 54,80|50,102 30,102|76,70 82,74","v":"54,80 66,66 78,72","eq":"M100 4 V106 M12 106 H108","ca":"M94 10 L82 72","d":[[96,8,3.5]]},
  "elevacion-piernas": {"cab":[67,30],"g":"60,12 60,36|60,64 84,64 104,64","v":"60,38 60,64","eq":"M44 10 H76"},
  "rueda": {"cab":[84,70],"g":"74,76 92,98|46,84 34,102 18,102","v":"46,84 74,76","eq":"M12 106 H108","d":[[94,100,6]]},
  "russian-twist": {"cab":[36,60],"g":"52,96 70,82 86,90|40,76 56,74 66,70","v":"52,96 40,72","eq":"M12 106 H108","d":[[68,68,7]]},
  "carrera": {"cab":[63,22],"g":"61,36 58,62|58,62 50,82 36,88|60,40 52,52 60,58|60,40 70,48 76,40","v":"58,62 72,76 70,100 77,100","eq":"M20 106 H100"},
  "cinta": {"cab":[57,18],"g":"55,32 52,58|52,58 44,78 32,82|54,36 46,48 54,54|54,36 64,44 70,36","v":"52,58 66,72 64,94 71,94","eq":"M18 98 H92 M88 98 L94 50 M86 50 H100 M22 98 V106 M88 98 V106"},
  "bici": {"cab":[66,30],"g":"46,66 60,42|60,44 78,56","v":"46,66 64,72 62,92","eq":"M38 68 H52 M45 68 L66 98 H84 L80 58 M74 56 H90 M24 106 H100","d":[[66,96,7]]},
  "eliptica": {"cab":[58,24],"g":"56,38 56,64|56,40 66,50 74,46","v":"56,64 64,82 62,96|56,64 50,84 42,98","eq":"M20 102 H86 M80 102 L88 30 M84 42 L72 50","eg":"M56 98 H68 M36 100 H48"},
  "remo-cardio": {"cab":[48,50],"g":"46,64 34,72 50,72|40,92 46,64","v":"40,92 62,88 82,96","eq":"M12 100 H100","eg":"M34 94 H46","ca":"M50 72 L92 82","d":[[98,84,9]]},
  "comba": {"cab":[60,27],"g":"52,40 44,56 40,66|68,40 76,56 80,66","v":"56,70 55,86 55,98|64,70 65,86 65,98","gr":[[60,46,60,64,0]],"eq":"M28 108 H92","ca":"M40 66 C30 120 90 120 80 66"},
  "r-empuje": {"cab":[26,72],"g":"52,74 70,74 85,64 90,104","v":"36,74 52,74|42,74 42,50","eq":"M18 82 H102 M28 82 V104 M92 82 V104","d":[[42,40,10]]},
  "r-tiron": {"cab":[60,28],"g":"56,76 56,104|64,76 64,104","v":"40,14 42,34 51,43|80,14 78,34 69,43","gr":[[60,48,60,68,1]],"eq":"M20 14 H100"},
  "r-pierna": {"cab":[60,27],"g":"52,40 50,56 50,72|68,40 70,56 70,72","v":"56,70 55,88 55,104|64,70 65,88 65,104","gr":[[60,46,60,64,0]]},
  "r-torso": {"cab":[60,27],"g":"56,70 55,88 55,104|64,70 65,88 65,104","v":"52,40 50,56 50,72|68,40 70,56 70,72","gr":[[60,46,60,64,1]]},
  "r-cuerpo": {"cab":[60,27],"v":"52,40 50,56 50,72|68,40 70,56 70,72|56,70 55,88 55,104|64,70 65,88 65,104","gr":[[60,46,60,64,1]]},
  "r-pecho": {"cab":[60,27],"g":"52,40 50,56 50,72|68,40 70,56 70,72|56,70 55,88 55,104|64,70 65,88 65,104","gr":[[60,46,60,64,0],[60,46,60,50,1]]},
  "r-hombros": {"cab":[60,27],"g":"38,42 24,44|82,42 96,44|56,70 55,88 55,104|64,70 65,88 65,104","v":"52,40 38,42|68,40 82,42","gr":[[60,46,60,64,0]],"d":[[21,44,5.5],[99,44,5.5]]},
  "r-brazos": {"cab":[60,27],"g":"56,70 55,88 55,104|64,70 65,88 65,104","v":"52,40 50,56 50,72|68,40 70,56 70,72","gr":[[60,46,60,64,0]]},
  "r-core": {"cab":[60,27],"g":"52,40 50,56 50,72|68,40 70,56 70,72|56,70 55,88 55,104|64,70 65,88 65,104","gr":[[60,46,60,64,0],[60,58,60,64,1]]},
  "r-gluteo": {"cab":[24,56],"g":"34,63 48,58|80,62 82,104 89,104|40,62 56,48","v":"48,58 60,55 70,58 80,62","eq":"M10 68 H36 M16 68 V106 M32 68 V106 M10 106 H100","d":[[60,44,10]]},
  "r-fuerza": {"cab":[69,37],"g":"61,52 70,61 50,47","v":"52,78 61,52|52,78 76,84 66,104 78,104","eq":"M22 106 H98","d":[[47,46,11]]},
  "r-cardio": {"cab":[63,22],"g":"61,36 58,62|60,40 52,52 60,58|60,40 70,48 76,40","v":"58,62 72,76 70,100 77,100|58,62 50,82 36,88","eq":"M20 106 H100"},
  "r-hiit": {"cab":[60,27],"g":"52,40 50,56 50,72|68,40 70,56 70,72|56,70 55,88 55,104|64,70 65,88 65,104","gr":[[60,46,60,64,0]],"relleno":"M63 39 L53 55 H59.5 L57 66 L67.5 49 H61 L63 39 Z"},
  "g-pecho": {"cab":[60,27],"g":"52,40 50,56 50,72|68,40 70,56 70,72|56,70 55,88 55,104|64,70 65,88 65,104","gr":[[60,46,60,64,0],[60,46,60,50,1]]},
  "g-espalda": {"cab":[60,27],"g":"52,40 44,26 42,12|68,40 76,26 78,12|56,70 55,88 55,104|64,70 65,88 65,104","gr":[[60,46,60,64,0],[60,46,60,64,1]]},
  "g-hombros": {"cab":[60,27],"g":"48,48 44,58 42,72|72,48 76,58 78,72|56,70 55,88 55,104|64,70 65,88 65,104","v":"52,40 48,48|68,40 72,48","gr":[[60,46,60,64,0]]},
  "g-brazos": {"cab":[60,27],"g":"56,70 55,88 55,104|64,70 65,88 65,104","v":"52,40 40,48 42,32|68,40 80,48 78,32","gr":[[60,46,60,64,0]]},
  "g-piernas": {"cab":[60,27],"g":"52,40 50,56 50,72|68,40 70,56 70,72","v":"56,70 55,88 55,104|64,70 65,88 65,104","gr":[[60,46,60,64,0]]},
  "g-core": {"cab":[60,27],"g":"52,40 50,56 50,72|68,40 70,56 70,72|56,70 55,88 55,104|64,70 65,88 65,104","gr":[[60,46,60,64,0],[60,58,60,64,1]]},
  "g-cardio": {"cab":[60,27],"g":"52,40 50,56 50,72|68,40 70,56 70,72|56,70 55,88 55,104|64,70 65,88 65,104","gr":[[60,46,60,64,0]],"relleno":"M60 60 C53 55 50.5 51 52 47.5 C53.5 44 57.5 44 60 47.5 C62.5 44 66.5 44 68 47.5 C69.5 51 67 55 60 60 Z"},
};

// presetId → id de la figura. Hoy son iguales; la tabla existe para poder redibujar o compartir
// una figura sin tocar los presetId guardados en la base de datos.
export const PICTOGRAMA_POR_PRESET = {
  "banca-barra": "banca-barra",
  "banca-mancuernas": "banca-mancuernas",
  "inclinado-barra": "inclinado-barra",
  "inclinado-mancuernas": "inclinado-mancuernas",
  "aperturas": "aperturas",
  "cruces-polea": "cruces-polea",
  "press-maquina-pecho": "press-maquina-pecho",
  "fondos-paralelas": "fondos-paralelas",
  "flexiones": "flexiones",
  "dominadas": "dominadas",
  "jalon": "jalon",
  "remo-barra": "remo-barra",
  "remo-mancuerna": "remo-mancuerna",
  "remo-maquina": "remo-maquina",
  "remo-polea-baja": "remo-polea-baja",
  "pullover-polea": "pullover-polea",
  "peso-muerto": "peso-muerto",
  "militar-barra": "militar-barra",
  "militar-mancuernas": "militar-mancuernas",
  "press-maquina-hombros": "press-maquina-hombros",
  "laterales-mancuernas": "laterales-mancuernas",
  "laterales-polea": "laterales-polea",
  "frontales": "frontales",
  "pajaros": "pajaros",
  "face-pull": "face-pull",
  "curl-barra": "curl-barra",
  "curl-mancuernas": "curl-mancuernas",
  "curl-martillo": "curl-martillo",
  "curl-polea": "curl-polea",
  "curl-predicador": "curl-predicador",
  "triceps-polea": "triceps-polea",
  "press-frances": "press-frances",
  "fondos-banco": "fondos-banco",
  "triceps-mancuerna": "triceps-mancuerna",
  "sentadilla": "sentadilla",
  "sentadilla-frontal": "sentadilla-frontal",
  "bulgara": "bulgara",
  "prensa": "prensa",
  "extension-cuadriceps": "extension-cuadriceps",
  "femoral-tumbado": "femoral-tumbado",
  "femoral-sentado": "femoral-sentado",
  "rumano": "rumano",
  "hip-thrust": "hip-thrust",
  "zancadas": "zancadas",
  "talones": "talones",
  "plancha": "plancha",
  "plancha-lateral": "plancha-lateral",
  "crunch": "crunch",
  "crunch-polea": "crunch-polea",
  "elevacion-piernas": "elevacion-piernas",
  "rueda": "rueda",
  "russian-twist": "russian-twist",
  "carrera": "carrera",
  "cinta": "cinta",
  "bici": "bici",
  "eliptica": "eliptica",
  "remo-cardio": "remo-cardio",
  "comba": "comba",
};

// Imagen provisional para ejercicios sin presetId (propios), por grupo muscular.
export const PICTOGRAMA_POR_GRUPO = {
  "Pecho": "g-pecho",
  "Espalda": "g-espalda",
  "Hombros": "g-hombros",
  "Brazos": "g-brazos",
  "Piernas": "g-piernas",
  "Core": "g-core",
  "Cardio": "g-cardio",
};

// Iconos de rutina: valor guardado en Workout.icono → [id de la figura, etiqueta]. Sus claves
// son la lista cerrada que valida el servidor; no se cambian (hay rutinas que las guardan).
export const ICONOS_RUTINA = {
  "empuje": ["r-empuje","Empuje"],
  "tiron": ["r-tiron","Tirón"],
  "pierna": ["r-pierna","Pierna"],
  "torso": ["r-torso","Torso"],
  "cuerpo": ["r-cuerpo","Cuerpo entero"],
  "pecho": ["r-pecho","Pecho"],
  "hombros": ["r-hombros","Hombros"],
  "brazos": ["r-brazos","Brazos"],
  "core": ["r-core","Core"],
  "gluteo": ["r-gluteo","Glúteo"],
  "fuerza": ["r-fuerza","Fuerza"],
  "cardio": ["r-cardio","Cardio"],
  "hiit": ["r-hiit","HIIT"],
};
