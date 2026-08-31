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
