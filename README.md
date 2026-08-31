# challenge-deCampoaCampo

App React Native con **Expo SDK 54** que consume la [PokeAPI](https://pokeapi.co/) con Axios.

## Stack

- Expo SDK 54 + React Native
- React Navigation v6 (native stack)
- Axios
- Compound Pattern en componentes (`PokemonCard`)

## Estructura

```
src/
  services/      # cliente Axios + servicios PokeAPI
  components/    # Compound Pattern (PokemonCard)
  navigation/    # React Navigation
  screens/       # Home (lista) + Detail
  theme/         # colores
```

## Funciones

- **Shiny** — en el detalle, el botón de estrella cambia el artwork al shiny (también en evoluciones y forms).
- **Evoluciones** — cadena completa de la especie. Si tiene una sola línea (Charmander → Charmeleon → Charizard) va en fila; si se ramifica (Eevee, Wurmple) se apilan las etapas. Tap para abrir esa ficha.
- **Weakness** — tipos a los que le pegan más fuerte, combinando ambos tipos del Pokémon.
- **Resistance** — tipos a los que le pegan más flojo o no le pegan. Weakness y resistance tienen un tip explicativo.
- **Forms** — variedades de la especie (Alola, Hisui, Megas, etc.). Carrusel + modal “See all” si hay varias.
- **Filter** — en Home, sheet para filtrar por región, generación y tipo (se pueden combinar). Chips activos para sacar uno o limpiar todo.

## Compound Pattern

`PokemonCard` expone piezas composables:

```jsx
<PokemonCard pokemon={item} onPress={...}>
  <PokemonCard.Image />
  <PokemonCard.Content>
    <PokemonCard.Id />
    <PokemonCard.Name />
    <PokemonCard.Types />
  </PokemonCard.Content>
</PokemonCard>
```

## Cómo correr

```bash
npm install
npm start
```

Luego abrí Expo Go (SDK 54) o un simulador con `i` / `a`.

## Repo

https://github.com/ValentinaTarapow/challenge-deCampoaCampo
