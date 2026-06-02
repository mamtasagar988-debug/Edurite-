import { useState, useEffect, useCallback } from "react";
import { useAuth }  from "../store/AuthContext";
import { supabase } from "../services/supabase";

/* ── helpers ── */
async function fetchDeckWithCards(deckId) {
  const [{ data: deck }, { data: cards }] = await Promise.all([
    supabase.from("flashcard_decks").select("*").eq("id", deckId).single(),
    supabase.from("flashcard_cards").select("*").eq("deck_id", deckId).order("created_at"),
  ]);
  return deck ? { ...deck, cards: cards ?? [] } : null;
}

export function useFlashcards() {
  const { user }              = useAuth();
  const [decks,    setDecks]  = useState([]);
  const [loading,  setLoading]= useState(true);

  /* ── Load user's own decks ── */
  const loadDecks = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("flashcard_decks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");

    if (!data) { setLoading(false); return; }

    /* Load cards for each deck */
    const full = await Promise.all(data.map(d => fetchDeckWithCards(d.id)));
    setDecks(full.filter(Boolean));
    setLoading(false);
  }, [user]);

  useEffect(() => { loadDecks(); }, [loadDecks]);

  /* ── Create deck ── */
  const createDeck = async ({ name, emoji, color }) => {
    if (!user) return null;
    const { data } = await supabase
      .from("flashcard_decks")
      .insert({ user_id: user.id, name, emoji, color })
      .select()
      .single();
    if (data) {
      const full = { ...data, cards: [] };
      setDecks(ds => [...ds, full]);
      return full;
    }
    return null;
  };

  /* ── Update deck meta ── */
  const updateDeck = async (id, updates) => {
    const { data } = await supabase
      .from("flashcard_decks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (data) {
      setDecks(ds => ds.map(d => d.id === id ? { ...d, ...data } : d));
    }
  };

  /* ── Delete deck ── */
  const deleteDeck = async (id) => {
    await supabase.from("flashcard_decks").delete().eq("id", id);
    setDecks(ds => ds.filter(d => d.id !== id));
  };

  /* ── Toggle public/private ── */
  const togglePublic = async (id) => {
    const deck = decks.find(d => d.id === id);
    if (!deck) return;
    await updateDeck(id, { is_public: !deck.is_public });
  };

  /* ── Add card to deck ── */
  const addCard = async (deckId, { front, back }) => {
    const { data } = await supabase
      .from("flashcard_cards")
      .insert({ deck_id: deckId, front, back })
      .select()
      .single();
    if (data) {
      setDecks(ds => ds.map(d =>
        d.id === deckId ? { ...d, cards: [...d.cards, data] } : d
      ));
    }
  };

  /* ── Update card ── */
  const updateCard = async (deckId, cardId, updates) => {
    const { data } = await supabase
      .from("flashcard_cards")
      .update(updates)
      .eq("id", cardId)
      .select()
      .single();
    if (data) {
      setDecks(ds => ds.map(d =>
        d.id === deckId
          ? { ...d, cards: d.cards.map(c => c.id === cardId ? data : c) }
          : d
      ));
    }
  };

  /* ── Delete card ── */
  const deleteCard = async (deckId, cardId) => {
    await supabase.from("flashcard_cards").delete().eq("id", cardId);
    setDecks(ds => ds.map(d =>
      d.id === deckId
        ? { ...d, cards: d.cards.filter(c => c.id !== cardId) }
        : d
    ));
  };

  /* ── Update rating (after study session) ── */
  const rateCard = async (deckId, cardId, rating) => {
    await updateCard(deckId, cardId, { rating });
  };

  /* ── Save full deck (from editor) ── */
  const saveDeck = async (deck) => {
    const existing = decks.find(d => d.id === deck.id);

    if (existing) {
      /* Update meta */
      await updateDeck(deck.id, {
        name: deck.name, emoji: deck.emoji, color: deck.color,
      });

      /* Delete removed cards */
      for (const c of existing.cards) {
        if (!deck.cards.find(nc => nc.id === c.id)) {
          await supabase.from("flashcard_cards").delete().eq("id", c.id);
        }
      }
      
      /* Add new cards or update existing */
      for (const c of deck.cards) {
        if (typeof c.id === "number") {
          // New card (local numeric ID)
          await supabase.from("flashcard_cards")
            .insert({ deck_id: deck.id, front: c.front, back: c.back });
        } else if (typeof c.id === "string" && c.id.length > 10) {
          // Existing card (UUID) - update it
          await supabase.from("flashcard_cards")
            .update({ front: c.front, back: c.back })
            .eq("id", c.id);
        }
        // Skip sample cards (like "s1c1") - don't try to update them
      }
      await loadDecks();
    } else {
      /* New deck */
      const created = await createDeck({
        name: deck.name, emoji: deck.emoji, color: deck.color,
      });
      if (created) {
        for (const c of deck.cards) {
          await supabase.from("flashcard_cards")
            .insert({ deck_id: created.id, front: c.front, back: c.back });
        }
        await loadDecks();
      }
    }
  };

  /* ── Copy a public deck to your own collection ── */
  const copyDeck = async (sourceDeck) => {
    if (!user) return;
    const created = await createDeck({
      name:  `${sourceDeck.name} (copy)`,
      emoji: sourceDeck.emoji,
      color: sourceDeck.color,
    });
    if (created) {
      for (const c of sourceDeck.cards) {
        await supabase.from("flashcard_cards")
          .insert({ deck_id: created.id, front: c.front, back: c.back });
      }
      await loadDecks();
    }
  };

  /* ── Load public community decks ── */
  const loadCommunityDecks = async (search = "") => {
    let query = supabase
      .from("flashcard_decks")
      .select("*")
      .eq("is_public", true)
      
      .order("created_at", { ascending: false })
      .limit(20);

    if (search.trim()) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: publicDecks } = await query;
    if (!publicDecks) return [];

    const full = await Promise.all(
      publicDecks.map(async d => {
        const { data: cards } = await supabase
          .from("flashcard_cards")
          .select("*")
          .eq("deck_id", d.id)
          .order("created_at");
        return { ...d, cards: cards ?? [] };
      })
    );
    return full;
  };

  return {
    decks, loading, loadDecks,
    createDeck, updateDeck, deleteDeck, saveDeck,
    togglePublic, addCard, updateCard, deleteCard,
    rateCard, copyDeck, loadCommunityDecks,
  };
}