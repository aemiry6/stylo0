// Picks a clearer emoji for a wardrobe item based on its type text and category.
// Emojis are rendered with a grayscale filter on top of the item's actual color
// background, so the emoji acts as a silhouette and its own built-in color
// (e.g. pink sweater, cream jacket) does not clash with the real garment color.

type MinimalItem = {
  category?: string;
  emoji?: string;
  type_en?: string;
  type_tr?: string;
};

export const getItemEmoji = (item: MinimalItem): string => {
  const t = `${item.type_en || ""} ${item.type_tr || ""}`.toLowerCase();
  const cat = (item.category || "").toLowerCase();

  // ============ OUTERWEAR (must come BEFORE sweater so "ceket" wins) ============
  if (/(puffer|şişme|sisme|down jacket)/.test(t)) return "🧥";
  if (/(trench|trençkot|trenckot)/.test(t)) return "🧥";
  if (/(blazer|ceket)/.test(t)) return "🥼";
  if (/(coat|palto|mont|parka|overcoat|kaban)/.test(t)) return "🧥";
  if (/(cardigan|hırka|hirka)/.test(t)) return "🥼";
  if (/(kimono|poncho|panço|cape|pelerin)/.test(t)) return "🥻";
  if (/(yelek|vest|gilet)/.test(t)) return "🦺";
  if (/(jacket|rüzgarlık|ruzgarlik|bomber|biker)/.test(t)) return "🧥";

  // ============ TOPS ============
  // Short-sleeve / sleeveless
  if (/(crop top|crop-top|crop t)/.test(t)) return "🎽";
  if (/(tank|atlet|singlet|kolsuz|halter|askılı|askili|camisole|kamisol)/.test(t)) return "🎽";
  if (/(t-?shirt|tee|tişört|tisort|tshirt)/.test(t)) return "👕";
  if (/(polo)/.test(t)) return "👕";
  // Long-sleeve knits
  if (/(hoodie|kapşonlu|kapsonlu|sweatshirt|fleece|polar)/.test(t)) return "👘";
  if (/(sweater|kazak|triko|knit|jumper|pullover|turtleneck|balıkçı yaka|balikci yaka)/.test(t)) return "👘";
  // Shirts / blouses
  if (/(blouse|bluz|tunic|tunik|kaftan|kaftan)/.test(t)) return "👚";
  if (/(shirt|gömlek|gomlek)/.test(t)) return "👔";
  // Bodysuit
  if (/(bodysuit|body|leotard)/.test(t)) return "🩱";

  // ============ BOTTOMS ============
  if (/(short|şort|sort|bermuda)/.test(t)) return "🩳";
  if (/(legging|tayt|tights|çorap)/.test(t)) return "🧦";
  if (/(skirt|etek)/.test(t)) return "👗";
  if (/(jean|kot|denim)/.test(t)) return "👖";
  if (/(jogger|sweatpant|eşofman|esofman|tracksuit)/.test(t)) return "👖";
  if (/(pant|trouser|chino|pantolon|slack|culotte)/.test(t)) return "👖";

  // ============ ONE-PIECE ============
  if (/(jumpsuit|tulum|romper|playsuit|overall|salopet)/.test(t)) return "🩱";
  if (/(gown|abiye|evening dress)/.test(t)) return "👗";
  if (/(dress|elbise|sundress|şile|sile)/.test(t)) return "👗";

  // ============ SWIM / INTIMATES ============
  if (/(bikini|mayo|swim|swimsuit|tankini)/.test(t)) return "👙";
  if (/(bra|sütyen|sutyen|bralette|lingerie|iç çamaşır|ic camasir)/.test(t)) return "👙";

  // ============ SHOES ============
  if (/(sneaker|trainer|spor ayakkab)/.test(t)) return "👟";
  if (/(boot|bot|çizme|cizme)/.test(t)) return "🥾";
  if (/(stiletto|pump|topuklu|heel)/.test(t)) return "👠";
  if (/(ballerina|babet|flat)/.test(t)) return "🥿";
  if (/(sandal|sandalet)/.test(t)) return "👡";
  if (/(terlik|slipper|flip|thong)/.test(t)) return "🩴";
  if (/(loafer|moccasin|oxford|derby|brogue|klasik ayakkab|mokasen)/.test(t)) return "👞";
  if (/(shoe|ayakkab)/.test(t)) return "👟";

  // ============ ACCESSORIES ============
  if (/(beanie|bere)/.test(t)) return "🧢";
  if (/(hat|cap|şapka|sapka|kasket|fedora|panama)/.test(t)) return "👒";
  if (/(glass|sunglass|gözlük|gozluk)/.test(t)) return "🕶️";
  if (/(backpack|sırt çantası|sirt cantasi)/.test(t)) return "🎒";
  if (/(clutch|portföy|portfoy)/.test(t)) return "👛";
  if (/(bag|tote|purse|çanta|canta|handbag)/.test(t)) return "👜";
  if (/(watch|saat)/.test(t)) return "⌚";
  if (/(scarf|atkı|atki|şal|sal|fular)/.test(t)) return "🧣";
  if (/(glove|eldiven)/.test(t)) return "🧤";
  if (/(belt|kemer)/.test(t)) return "➰";
  if (/(tie|kravat|papyon|bow tie)/.test(t)) return "👔";
  if (/(necklace|kolye)/.test(t)) return "📿";
  if (/(ring|yüzük|yuzuk)/.test(t)) return "💍";
  if (/(earring|küpe|kupe)/.test(t)) return "💎";
  if (/(bracelet|bileklik|bilezik)/.test(t)) return "💫";
  if (/(jewel|takı|taki)/.test(t)) return "💍";

  // ============ FALLBACK BY CATEGORY ============
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

// Inline style to render emoji as a near-monochrome silhouette so its built-in
// color (e.g. pink top, cream jacket) doesn't clash with the colored swatch
// background showing the real garment color.
export const emojiSilhouetteStyle: React.CSSProperties = {
  filter: "grayscale(1) brightness(0.35) contrast(1.4)",
  WebkitFilter: "grayscale(1) brightness(0.35) contrast(1.4)",
};
