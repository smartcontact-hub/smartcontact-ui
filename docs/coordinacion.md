# Coordinación — un hilo que abre hilos (piloto)

> Piloto desde el 2026-11-13, en el frente del Supervisor (Horarios). Es el manual del **coordinador**: el hilo fijo de
> un Project de la app de Claude que habla con el usuario, abre un hilo por tarea y lo lleva hasta su PR. Los hilos
> trabajan como cualquier sesión (`CLAUDE.md`, `AGENTS.md`, su hand-off); aquí solo está lo que cambia por encima.

## Por qué

- Un hilo con varias tandas se compacta y se para en cada espera (un CI tarda unos 17 min; un sabotaje de sondas, 30).
  Con un hilo por PR cada uno empieza limpio y las esperas corren a la vez.
- El repo ya aguanta varias sesiones a la vez: frentes con su hand-off ([`NEXT-SESSION.md`](../NEXT-SESSION.md)),
  `npm run sesiones`, la DD repetida se renumera (lo vigila `docs:coherence`) y un hook avisa si `origin/main` cambió
  ficheros de tu rama (LEARNINGS #21). En la nube, además, cada hilo tiene su contenedor: no comparten `dist/` ni puertos.

## Qué hace el coordinador

1. Al empezar: `NEXT-SESSION.md`, el hand-off del frente, el índice de [`LEARNINGS.md`](../LEARNINGS.md) y qué hilos
   siguen vivos (`list_sessions`).
2. Decide con el usuario qué entra y en qué orden. El usuario habla con el coordinador, no con los hilos.
3. Abre un hilo por PR con `create_session` (mismo entorno y repositorio), con el encargo como primer mensaje.
4. Lo sigue con `list_events` y le contesta con `send_message`. No hace el trabajo del hilo.
5. Funde de uno en uno y solo cuando el usuario lo pide; después lee el CI de `main` (`npm run ci:verdict`).
6. Tras cada fusión, a cada hilo vivo: «trae `main` (`git merge origin/main`) y vuelve a pasar tus pruebas».
7. Al acabar un hilo: su parte al usuario, en llano, y el hilo archivado.

## El encargo

```
Frente: docs/handoff/<frente>.md
Qué: <una frase: lo que verá el usuario cuando esté hecho>
No toques: <pantallas, componentes o ficheros que lleva otro hilo>
Parte de: <DD, ficheros y líneas>
DD reservada: DD-<n>
Se comprueba con: <la sonda, en rojo con el fallo puesto>
Para y pregunta si: <decisiones de producto o visuales>
Cierra con: PR con la plantilla, CI leído con `ci:verdict`, su tramo del hand-off y el parte en llano
```

## Tres reglas para no pisarse

1. **Una pantalla, un hilo.** Dos hilos no tocan a la vez la misma pantalla ni el mismo componente del DS: lo que
   comparte ficheros va en serie.
2. **El número de DD lo reparte el coordinador**: el siguiente libre en `origin/main` más los ya repartidos a hilos
   vivos. Si aun así chocan, renumera el que funde después (cabecera de [`DECISIONS.md`](./DECISIONS.md)).
3. **Cada hilo escribe solo su tramo** del hand-off de su frente. Los registros compartidos (`DECISIONS.md`,
   `CHANGELOG.md`, `LEARNINGS.md`) van en el PR del hilo; si chocan, los resuelve el que funde después, trayendo `main`.

## Cuándo no abrir hilo

- Una decisión visual que pide al usuario en cada paso: el coordinador solo añadiría un salto.
- Una pregunta de una respuesta: la contesta el coordinador.
- Algo que espera a otro (un export del Kit, una respuesta de producto): queda en el hand-off, sin hilo abierto.

## El piloto

Tres hilos en Horarios:

1. «Ahora» con la hora del cambio en la lista («Abierto · cierra 18:00», «Cerrado · abre lun 09:00»), pendiente
   desde DD-251.
2. El hueco a la derecha del tooltip: capturas de tres opciones para que el usuario decida (DD-254, «Descartadas»).
3. «El nombre es obligatorio» en una línea: se abre cuando llegue a `main` el export del Kit con el ancho de 252.

Al acabar se cuenta: tiempo de encargo a PR verde, rondas de CI por PR, choques (ficheros o DD repetidos) y veces
que hubo que preguntar al usuario. Con eso se decide si se extiende a los otros frentes.

## Instrucciones del Project, para pegar en la app

```
Eres el coordinador de este repositorio (smartcontact-ui). Tu manual es docs/coordinacion.md: léelo al empezar,
junto con NEXT-SESSION.md y el hand-off del frente. Hablas tú con el usuario; el trabajo lo hace un hilo por PR,
que abres con un encargo cerrado. No fundes nada sin que el usuario lo pida.
```
