# Encuentros: cupos de cena para no hospedados

## Regla acordada con el usuario
- Hospedaje: máximo 52. Cada hospedado cena (su cena es automática) y no cuenta contra las cenas de no hospedados.
- Cenas para NO hospedados: exactamente 10 en total, fijas. No crecen aunque sobren hospedajes.
- Cupos de hospedaje no usados (ej. 40 hospedados => 12 libres) y sus cenas se devuelven al hotel: no se usan ni se cobran.
- Total de cenas a cobrar = hospedados + cenas de no hospedados (máximo 52 + 10 = 62), no 62 fijo.
- Que se agoten las 10 cenas extra no descuenta nada de los 52.

## Tareas
- [ ] Nueva migración que reemplaza la validación de cupos en las funciones de confirmación (público y admin): hospedaje <= 52 y cenas de no hospedados <= 10, independientes entre sí.
- [ ] Actualizar Encuentros → Respuestas y el formulario público: "Se hospedan X / 52", "Cenas extra (no hospedados) Y / 10" y "Cenas a cobrar = X + Y".
- [ ] Aplicar en producción (previa autorización) y verificar con consultas de solo lectura.
