import { useCallback, useMemo, useState } from 'react';
import { PokemonCardContext } from './context';
import {
  Content,
  Frame,
  Id,
  ImageSection,
  Name,
  Types,
} from './primitives';
import {
  Abilities,
  Artwork,
  Body,
  Dimensions,
  Evolutions,
  ExtrasError,
  Forms,
  FormsModal,
  Generation,
  Hero,
  HeroTypes,
  Identity,
  Immunities,
  Matchups,
  OfflineBanner,
  Resistances,
  ShinyToggle,
  Stats,
  TipDismiss,
  Weaknesses,
} from './detailParts';

function PokemonCard({
  pokemon,
  children,
  isFavorite = false,
  onToggleFavorite,
  shiny = false,
  onToggleShiny,
  generation,
  matchups,
  abilities,
  evolution,
  varieties,
  extrasFailed = false,
  extrasError,
  onRetryExtras,
  fromCache = false,
  onOpenPokemon,
}) {
  const [showWeaknessTip, setShowWeaknessTip] = useState(false);
  const [showResistanceTip, setShowResistanceTip] = useState(false);
  const [showImmunityTip, setShowImmunityTip] = useState(false);
  const [showFormsModal, setShowFormsModal] = useState(false);

  const closeTips = useCallback(() => {
    setShowWeaknessTip(false);
    setShowResistanceTip(false);
    setShowImmunityTip(false);
  }, []);

  const value = useMemo(
    () => ({
      pokemon,
      isFavorite,
      onToggleFavorite,
      shiny,
      onToggleShiny,
      generation,
      matchups,
      abilities,
      evolution,
      varieties,
      extrasFailed,
      extrasError,
      onRetryExtras,
      fromCache,
      onOpenPokemon,
      showWeaknessTip,
      showResistanceTip,
      showImmunityTip,
      toggleWeaknessTip: () => {
        setShowResistanceTip(false);
        setShowImmunityTip(false);
        setShowWeaknessTip((open) => !open);
      },
      toggleResistanceTip: () => {
        setShowWeaknessTip(false);
        setShowImmunityTip(false);
        setShowResistanceTip((open) => !open);
      },
      toggleImmunityTip: () => {
        setShowWeaknessTip(false);
        setShowResistanceTip(false);
        setShowImmunityTip((open) => !open);
      },
      closeTips,
      anyTipOpen: showWeaknessTip || showResistanceTip || showImmunityTip,
      showFormsModal,
      openForms: () => {
        closeTips();
        setShowFormsModal(true);
      },
      closeForms: () => setShowFormsModal(false),
    }),
    [
      pokemon,
      isFavorite,
      onToggleFavorite,
      shiny,
      onToggleShiny,
      generation,
      matchups,
      abilities,
      evolution,
      varieties,
      extrasFailed,
      extrasError,
      onRetryExtras,
      fromCache,
      onOpenPokemon,
      showWeaknessTip,
      showResistanceTip,
      showImmunityTip,
      closeTips,
      showFormsModal,
    ],
  );

  return (
    <PokemonCardContext.Provider value={value}>
      {children}
    </PokemonCardContext.Provider>
  );
}

PokemonCard.Frame = Frame;
PokemonCard.Image = ImageSection;
PokemonCard.Name = Name;
PokemonCard.Id = Id;
PokemonCard.Types = Types;
PokemonCard.Content = Content;
PokemonCard.Body = Body;
PokemonCard.OfflineBanner = OfflineBanner;
PokemonCard.Hero = Hero;
PokemonCard.Generation = Generation;
PokemonCard.ShinyToggle = ShinyToggle;
PokemonCard.Artwork = Artwork;
PokemonCard.Identity = Identity;
PokemonCard.HeroTypes = HeroTypes;
PokemonCard.Matchups = Matchups;
PokemonCard.Weaknesses = Weaknesses;
PokemonCard.Resistances = Resistances;
PokemonCard.Immunities = Immunities;
PokemonCard.ExtrasError = ExtrasError;
PokemonCard.Stats = Stats;
PokemonCard.Abilities = Abilities;
PokemonCard.Evolutions = Evolutions;
PokemonCard.Dimensions = Dimensions;
PokemonCard.Forms = Forms;
PokemonCard.FormsModal = FormsModal;
PokemonCard.TipDismiss = TipDismiss;

export { PokemonCard };
