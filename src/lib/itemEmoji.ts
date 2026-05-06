// Picks a clearer emoji for a wardrobe item based on its type text and category.
// The AI sometimes returns generic or confusing emojis (e.g. a yarn ball for a
// knit sweater), so we override with subtype-aware choices that visually
// distinguish long-sleeve vs short-sleeve tops, shorts vs pants, etc.

type MinimalItem = {
  category?: string;
  emoji?: string;
  type_en?: string;
  type_tr?: string;
};

export const getItemEmoji = (item: MinimalItem): string => {
  const t = `${item.type_en || ""} ${item.type_tr || ""}`.toLowerCase();
  const cat = (item.category || "").toLowerCase();

  // --- Outerwear (jackets/coats) — must come BEFORE sweater so "ceket" wins ---
  if (/(coat|jacket|blazer|parka|trench|puffer|mont|ceket|palto|yelek|vest)/.test(t)) return "🧥";

  // --- Tops: long-sleeve vs short-sleeve ---
  if (/(t-?shirt|tee|tişört|tisort|tshirt|atlet|tank|singlet|kolsuz|crop top)/.test(t)) return "👕";
  if (/(sweater|sweat|hoodie|kazak|triko|knit|jumper|pullover|sweatshirt|fleece|polar|kapşonlu|kapsonlu|uzun kollu)/.test(t)) return "👚";
  if (/(shirt|gömlek|gomlek|blouse|bluz|polo)/.test(t)) return "👔";

  // --- Bottoms: shorts vs pants vs skirt ---
  if (/(short|şort|sort|bermuda)/.test(t)) return "🩳";
  if (/(skirt|etek)/.test(t)) return "👗"; // no dedicated skirt emoji; use dress as closest
  if (/(jean|kot|denim)/.test(t)) return "👖";
  if (/(pant|trouser|chino|legging|tayt|pantolon|eşofman|esofman|jogger|sweatpant)/.test(t)) return "👖";

  // --- Dresses / one-piece ---
  if (/(dress|elbise|gown|tulum|jumpsuit|romper)/.test(t)) return "👗";

  // --- Shoes ---
  if (/(sneaker|trainer|spor ayakkab)/.test(t)) return "👟";
  if (/(boot|bot|çizme|cizme)/.test(t)) return "🥾";
  if (/(heel|topuk|stiletto|pump)/.test(t)) return "👠";
  if (/(sandal|sandalet|terlik|slipper|flip)/.test(t)) return "🩴";
  if (/(loafer|moccasin|oxford|derby|brogue|klasik ayakkab)/.test(t)) return "👞";
  if (/(shoe|ayakkab)/.test(t)) return "👟";

  // --- Accessories ---
  if (/(hat|cap|beanie|şapka|sapka|bere|kasket|fedora)/.test(t)) return "🧢";
  if (/(glass|sunglass|gözlük|gozluk)/.test(t)) return "🕶️";
  if (/(bag|backpack|tote|purse|clutch|çanta|canta|sırt|sirt)/.test(t)) return "👜";
  if (/(watch|saat)/.test(t)) return "⌚";
  if (/(scarf|atkı|atki|şal|sal)/.test(t)) return "🧣";
  if (/(glove|eldiven)/.test(t)) return "🧤";
  if (/(belt|kemer)/.test(t)) return "➰";
  if (/(tie|kravat|papyon|bow tie)/.test(t)) return "👔";
  if (/(necklace|kolye|bracelet|bileklik|ring|yüzük|yuzuk|earring|küpe|kupe|jewel|takı|taki)/.test(t)) return "💍";

  // --- Fallback by category ---
  switch (cat) {
    case "shoes": return "👟";
    case "bottom": return "👖";
    case "dress": return "👗";
    case "outer": return "🧥";
    case "accessory": return "👜";
    case "top":
    case "underwear":
    default:
      return item.emoji || "👕";
  }
};
