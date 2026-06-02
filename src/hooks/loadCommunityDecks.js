const loadCommunityDecks = async (search = "") => {
    let query = supabase
      .from("flashcard_decks")
      .select("*")
      .eq("is_public", true)
      
      .order("created_at", { ascending: false })
      .limit(20);

    if (search && search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data: publicDecks, error } = await query;
    
    if (error) {
      console.error("Community search error:", error);
      return [];
    }
    
    if (!publicDecks || publicDecks.length === 0) return [];

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