# challenge-deCampoaCampo

App React Native con **Expo SDK 54** que consume la [PokeAPI](https://pokeapi.co/) con Axios.

## Stack

- Expo SDK 54 + React Native
- React Navigation v6: **bottom tabs** + **native stack** anidado en cada tab
- Axios
- AsyncStorage + `expo-file-system` (favoritos y lectura offline)
- Compound Pattern en `PokemonCard`
- Jest + `jest-expo`

## Estructura

```
src/
  navigation/    # tabs Pokédex | Favorites; cada tab tiene su stack (lista + Detail)
  screens/       # Home, Favorites, Detail, Splash
  components/    # PokemonCard (compound), FilterSheet, Screen, sombras, states
  context/       # FavoritesProvider
  services/      # Axios, PokeAPI, storage, cache de imágenes
  theme/         # colores + contraste de tipos
  utils/         # search
```

## Navegación

```
Tabs
  HomeTab        stack: Home → Detail
  FavoritesTab   stack: Favorites → Detail
```

El detalle **no** tapa la tab bar: podés saltar a Favorites sin volver a la lista. Atrás (o un tap de nuevo en la tab activa) vuelve al listado de ese tab.

## Funciones

- **Lista** — grilla de 3, infinite scroll (`limit`/`offset`), pull to refresh.
- **Search** — filtro en tiempo real por nombre o `#id` sobre un catálogo de nombres.
- **Filter** — sheet por región, generación y tipo (se pueden combinar). Chips activos para sacar uno o limpiar todo.
- **Detalle** — types, stats, weakness/resistance/immunity, evoluciones, forms, abilities, shiny, generación.
- **Shiny** — en el detalle, el botón de estrella cambia el artwork (también en evoluciones y forms).
- **Evoluciones** — cadena completa. Línea simple en fila; ramificadas (Eevee, Wurmple) apiladas. Tap abre esa ficha.
- **Favoritos** — corazón en card y en el header del detalle. Tab Favorites con badge.
- **Offline** — favoritos (ficha + sprites en disco) y última lista de Home sin red.
- **Chrome** — status bar rojo, sombra bajo el header/buscador y arriba de la tab bar.

## Compound Pattern

`PokemonCard` es el padre (Context). Las piezas se componen en la **lista** y en el **detalle**:

```jsx
// Lista
<PokemonCard pokemon={item}>
  <PokemonCard.Frame onPress={...}>
    <PokemonCard.Image />
    <PokemonCard.Content>
      <PokemonCard.Id />
      <PokemonCard.Name />
    </PokemonCard.Content>
  </PokemonCard.Frame>
</PokemonCard>

// Detalle
<PokemonCard pokemon={pokemon} matchups={...} evolution={...}>
  <PokemonCard.Body>
    <PokemonCard.Hero>
      <PokemonCard.Generation />
      <PokemonCard.ShinyToggle />
      <PokemonCard.Artwork />
      <PokemonCard.Identity />
      <PokemonCard.HeroTypes />
    </PokemonCard.Hero>
    <PokemonCard.Matchups />
    <PokemonCard.Stats />
    <PokemonCard.Abilities />
    <PokemonCard.Evolutions />
    <PokemonCard.Dimensions />
    <PokemonCard.Forms />
  </PokemonCard.Body>
</PokemonCard>
```

## Cómo correr

```bash
npm install
npm start
```

Luego abrí Expo Go (SDK 54) o un emulador con `i` / `a`. En Android:

```bash
npm run android
```

## Tests

```bash
npm test
```

Jest + `jest-expo` cubren búsqueda, persistencia, errores, filtros, matchups, detalle (helpers), favoritos, estados de UI y el Compound Pattern de `PokemonCard`.

## Repo

https://github.com/ValentinaTarapow/challenge-deCampoaCampo
