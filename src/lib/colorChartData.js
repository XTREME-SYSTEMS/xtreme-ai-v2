// ============================================================
// Real Manufacturer Color Chart Data
// ============================================================
// Extracted from real manufacturer product catalogs:
// - Metallic (Liquid + Powder): Xtreme Polishing Systems (XPS)
// - Flake (Torginol polymer flakes): XPS
// - Quartz: XPS
// - Solid: XPS
// - Glitter: XPS
// - Dye Stain: Ameripolish
//
// Each entry: { system, color_name, code, hex, image_url, collection, sheen, in_stock, rank }
// Used by the Floor Visualizer to show real product swatches.
// ============================================================

export const COLOR_DATA = [
  // ── METALLIC — Liquid Pigments (CM codes) ──
  { system: "metallic", color_name: "Metallic Silver", code: "CM-101", hex: "#C8C9CB", collection: "Liquid Metallic", sheen: "High Gloss", in_stock: true, rank: 1, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_XPS_Liquid_MetallicPigments_no_TEXT_0015_ColorCard_Metallic_CM101_Silver_b01a5b49-8cee-4d60-988b-117bdfb8c3fb.jpg" },
  { system: "metallic", color_name: "Charcoal", code: "CM-124", hex: "#3A3A3A", collection: "Liquid Metallic", sheen: "High Gloss", in_stock: true, rank: 2, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_XPS_Liquid_MetallicPigments_no_TEXT_0010_ColorCard_Metallic_CM124_Charcoal_a333ad93-8924-4429-a8f0-4b72d286482c.jpg" },
  { system: "metallic", color_name: "Hot Chocolate", code: "CM-148", hex: "#4A3020", collection: "Liquid Metallic", sheen: "High Gloss", in_stock: true, rank: 3, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_XPS_Liquid_MetallicPigments_no_TEXT_0002_ColorCard_Metallic_CM148_HotChocolate_3061784d-6337-4499-b19c-8ad70814a3c2.jpg" },
  { system: "metallic", color_name: "Ruby", code: "CM-135", hex: "#8E1B2E", collection: "Liquid Metallic", sheen: "High Gloss", in_stock: true, rank: 4, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_XPS_Liquid_MetallicPigments_no_TEXT_0005_ColorCard_Metallic_CM135_Ruby_62b9595e-f103-450f-a29b-75202bdfb27e.jpg" },
  { system: "metallic", color_name: "Blue Mist", code: "CM-112", hex: "#8AA8C8", collection: "Liquid Metallic", sheen: "High Gloss", in_stock: true, rank: 5, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_XPS_Liquid_MetallicPigments_no_TEXT_0013_ColorCard_Metallic_CM112_BlueMist_0f4cc2da-2bd3-424c-96ad-9048ae06c3aa.jpg" },
  { system: "metallic", color_name: "Aqua", code: "CM-143", hex: "#5AC8D8", collection: "Liquid Metallic", sheen: "High Gloss", in_stock: true, rank: 6, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_XPS_Liquid_MetallicPigments_no_TEXT_0003_ColorCard_Metallic_CM143_Aqua_581d365c-8219-4873-b91a-9bd5e24a2f9c.jpg" },
  { system: "metallic", color_name: "Olive Green", code: "CM-113", hex: "#6A7A3A", collection: "Liquid Metallic", sheen: "High Gloss", in_stock: true, rank: 7, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_XPS_Liquid_MetallicPigments_no_TEXT_0012_ColorCard_Metallic_CM113_OliveGreen_06291da4-ae37-4946-86e1-f48909c24d29.jpg" },
  { system: "metallic", color_name: "Copper", code: "CM-129", hex: "#B06A32", collection: "Liquid Metallic", sheen: "High Gloss", in_stock: true, rank: 8, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_XPS_Liquid_MetallicPigments_no_TEXT_0007_ColorCard_Metallic_CM129_Copper_dcdbc372-2fbb-4761-968e-5da2594a2a56.jpg" },

  // ── METALLIC — Powder Pigments (XPS codes) ──
  { system: "metallic", color_name: "Gold Pearl", code: "XPS-0300", hex: "#D4AF37", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 9, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-0300_GoldPearl.jpg" },
  { system: "metallic", color_name: "Gold Satin", code: "XPS-0302", hex: "#C8A848", collection: "Powder Metallic", sheen: "Satin", in_stock: true, rank: 10, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-0302_GoldSatin.jpg" },
  { system: "metallic", color_name: "Royal Gold", code: "XPS-0303", hex: "#C89028", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 11, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-0303_RoyalGold.jpg" },
  { system: "metallic", color_name: "Mayan Gold", code: "XPS-0304", hex: "#B88020", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 12, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-0304_MayanGold.jpg" },
  { system: "metallic", color_name: "Bright Gold", code: "XPS-0320", hex: "#E8C830", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 13, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-0320_BrightGold.jpg" },
  { system: "metallic", color_name: "Bronze", code: "XPS-0500", hex: "#8C6A3A", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 14, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-0500_Bronze.jpg" },
  { system: "metallic", color_name: "Pearl Red", code: "XPS-0508", hex: "#C83040", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 15, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-0508_PearlRed.jpg" },
  { system: "metallic", color_name: "Coffee", code: "XPS-0510", hex: "#5A3820", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 16, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-0510_Coffee.jpg" },
  { system: "metallic", color_name: "Rose Red", code: "XPS-6021", hex: "#C84050", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 17, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/XPS6021_RoseRedMetallic.jpg" },
  { system: "metallic", color_name: "Shine Red", code: "XPS-6026", hex: "#E83838", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 18, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/XPS6026_ShineRed.jpg" },
  { system: "metallic", color_name: "Ocean Blue", code: "XPS-6040", hex: "#1E5A8A", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 19, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-6040_OceanBlue.jpg" },
  { system: "metallic", color_name: "Iridescent Blue", code: "XPS-6042", hex: "#4A8AC8", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 20, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-6042_IridescentBlue.jpg" },
  { system: "metallic", color_name: "Sky Blue", code: "XPS-6043", hex: "#6AB8E8", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 21, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-6043_SkyBlue.jpg" },
  { system: "metallic", color_name: "Bright Blue", code: "XPS-6045", hex: "#2868E8", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 22, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-6045_BrightBlue.jpg" },
  { system: "metallic", color_name: "Iridescent Green", code: "XPS-6058", hex: "#48B888", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 24, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-6058_IridescentGreen.jpg" },
  { system: "metallic", color_name: "Peacock Green", code: "XPS-6060", hex: "#1A8868", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 26, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-6060_PeacockGreen.jpg" },
  { system: "metallic", color_name: "Chestnut Brown", code: "XPS-6081", hex: "#6A4828", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 27, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-6081_ChestnutBrown.jpg" },
  { system: "metallic", color_name: "Luster Gray", code: "XPS-6090", hex: "#8A8A8A", collection: "Powder Metallic", sheen: "High Gloss", in_stock: true, rank: 29, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Metallic_Powder_500x500_XPS-6090_LusterGray.jpg" },

  // ── FLAKE — Torginol Polymer Flakes (FB codes) ──
  { system: "flake", color_name: "Tidal Wave", code: "FB-807", hex: "#3A6A8A", collection: "In-Stock Collection", sheen: "Semi-Gloss", in_stock: true, rank: 1, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_FLAKE-FLOOR_FB-807_TIDALWAVE_1.4_IN-STOCK.jpg" },
  { system: "flake", color_name: "Gracious", code: "FB-916", hex: "#B8A89A", collection: "In-Stock Collection", sheen: "Semi-Gloss", in_stock: true, rank: 2, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_FLAKE-FLOOR_FB-916_GRACIOUS_1_IN-STOCK.jpg" },
  { system: "flake", color_name: "Stony Creek", code: "FB-806", hex: "#8A8278", collection: "In-Stock Collection", sheen: "Semi-Gloss", in_stock: true, rank: 3, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_FLAKE-FLOOR_FB-806_STONYCREEK_1.4_INSTOCK.jpg" },
  { system: "flake", color_name: "Domino", code: "FB-411", hex: "#2A2A2A", collection: "In-Stock Collection", sheen: "Semi-Gloss", in_stock: true, rank: 4, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_FLAKE-FLOOR_FB-411_DOMINO_IN-STOCK.jpg" },
  { system: "flake", color_name: "Polar", code: "FB-330", hex: "#E8E8E0", collection: "In-Stock Collection", sheen: "Semi-Gloss", in_stock: true, rank: 5, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_FLAKE-FLOOR_FB-330_POLAR_IN-STOCK.jpg" },
  { system: "flake", color_name: "Mist", code: "FB-700", hex: "#D8D8D0", collection: "In-Stock Collection", sheen: "Semi-Gloss", in_stock: true, rank: 6, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_FLAKE-FLOOR_FB-700_MIST_IN-STOCK.jpg" },
  { system: "flake", color_name: "Sandstone", code: "FB-710", hex: "#C8B898", collection: "In-Stock Collection", sheen: "Semi-Gloss", in_stock: true, rank: 7, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_FLAKE-FLOOR_FB-710_SANDSTONE_IN-STOCK.jpg" },
  { system: "flake", color_name: "Key Largo", code: "FB-820", hex: "#3A8A8A", collection: "In-Stock Collection", sheen: "Semi-Gloss", in_stock: true, rank: 8, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_FLAKE-FLOOR_FB-820_KEYLARGO_IN-STOCK.jpg" },
  { system: "flake", color_name: "Cottage Cheese", code: "FB-500", hex: "#E8E0D0", collection: "In-Stock Collection", sheen: "Semi-Gloss", in_stock: true, rank: 9, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_FLAKE-FLOOR_FB-500_COTTAGECHEESE_IN-STOCK.jpg" },
  { system: "flake", color_name: "Oyster", code: "FB-711", hex: "#D0C8B8", collection: "In-Stock Collection", sheen: "Semi-Gloss", in_stock: true, rank: 10, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_FLAKE-FLOOR_FB-711_OYSTER_IN-STOCK.jpg" },

  // ── QUARTZ (QB codes) ──
  { system: "quartz", color_name: "Crystal", code: "QB-1001", hex: "#E8E8E0", collection: "Cool Collection", sheen: "Textured", in_stock: true, rank: 1, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/QB-1001_CRYSTAL_40-S_IN-STOCK.jpg" },
  { system: "quartz", color_name: "Tundra", code: "QB-1002", hex: "#C8C8C0", collection: "Cool Collection", sheen: "Textured", in_stock: true, rank: 2, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/QB-1002_TUNDRA_40-S.jpg" },
  { system: "quartz", color_name: "Solstice", code: "QB-1003", hex: "#D8C8A8", collection: "Cool Collection", sheen: "Textured", in_stock: true, rank: 3, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/QB-1003_SOLSTICE_40-S.jpg" },
  { system: "quartz", color_name: "Glacier", code: "QB-1004", hex: "#A8C8C8", collection: "Cool Collection", sheen: "Textured", in_stock: true, rank: 4, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/QB-1004_GLACIER_40-S.jpg" },
  { system: "quartz", color_name: "Frost", code: "QB-1005", hex: "#D0E0E0", collection: "Cool Collection", sheen: "Textured", in_stock: true, rank: 5, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/QB-1005_FROST_40-S.jpg" },
  { system: "quartz", color_name: "Pearl", code: "QB-1006", hex: "#E0D8C8", collection: "Cool Collection", sheen: "Textured", in_stock: true, rank: 6, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/QB-1006_PEARL_40-S.jpg" },
  { system: "quartz", color_name: "Sahara", code: "QB-2001", hex: "#C8A888", collection: "Warm Collection", sheen: "Textured", in_stock: true, rank: 7, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/QB-2001_SAHARA_40-S.jpg" },
  { system: "quartz", color_name: "Desert", code: "QB-2002", hex: "#B89878", collection: "Warm Collection", sheen: "Textured", in_stock: true, rank: 8, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/QB-2002_DESERT_40-S.jpg" },
  { system: "quartz", color_name: "Canyon", code: "QB-2003", hex: "#A87858", collection: "Warm Collection", sheen: "Textured", in_stock: true, rank: 9, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/QB-2003_CANYON_40-S.jpg" },
  { system: "quartz", color_name: "Terracotta", code: "QB-2004", hex: "#C87858", collection: "Warm Collection", sheen: "Textured", in_stock: true, rank: 10, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/QB-2004_TERRACOTTA_40-S.jpg" },

  // ── SOLID (Standard Liquid) ──
  { system: "solid", color_name: "Silver", code: "#524", hex: "#C8C8C8", collection: "Standard Liquid", sheen: "Satin", in_stock: true, rank: 1, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Solid_500x500_524_Silver.jpg" },
  { system: "solid", color_name: "Light Gray", code: "#885", hex: "#C0C0C0", collection: "Standard Liquid", sheen: "Satin", in_stock: true, rank: 2, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Solid_500x500_885_LightGray.jpg" },
  { system: "solid", color_name: "Medium Gray", code: "#305", hex: "#8A8A8A", collection: "Standard Liquid", sheen: "Satin", in_stock: true, rank: 3, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Solid_500x500_305_MediumGray.jpg" },
  { system: "solid", color_name: "Dark Gray", code: "#306", hex: "#4A4A4A", collection: "Standard Liquid", sheen: "Satin", in_stock: true, rank: 4, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Solid_500x500_306_DarkGray.jpg" },
  { system: "solid", color_name: "Black", code: "#501", hex: "#1A1A1A", collection: "Standard Liquid", sheen: "Satin", in_stock: true, rank: 5, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Solid_500x500_501_Black.jpg" },
  { system: "solid", color_name: "White", code: "#500", hex: "#F0F0E8", collection: "Standard Liquid", sheen: "Satin", in_stock: true, rank: 6, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Solid_500x500_500_White.jpg" },
  { system: "solid", color_name: "Tile Red", code: "#621", hex: "#A83828", collection: "Standard Liquid", sheen: "Satin", in_stock: true, rank: 7, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Solid_500x500_621_TileRed.jpg" },
  { system: "solid", color_name: "Royal Blue", code: "#635", hex: "#2848A8", collection: "Standard Liquid", sheen: "Satin", in_stock: true, rank: 8, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Solid_500x500_635_RoyalBlue.jpg" },
  { system: "solid", color_name: "Forest Green", code: "#642", hex: "#2A6A3A", collection: "Standard Liquid", sheen: "Satin", in_stock: true, rank: 9, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Solid_500x500_642_ForestGreen.jpg" },
  { system: "solid", color_name: "Desert Tan", code: "#883", hex: "#C8A878", collection: "Standard Liquid", sheen: "Satin", in_stock: true, rank: 10, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ColorCard_Solid_500x500_883_DesertTan.jpg" },

  // ── GLITTER ──
  { system: "glitter", color_name: "Arctic Frost", code: "CG-001", hex: "#E8F0F8", collection: "Glitter Collection", sheen: "High Gloss", in_stock: true, rank: 1, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/arctic-frost.jpg" },
  { system: "glitter", color_name: "Clear Radiance", code: "CG-002", hex: "#F0F0F0", collection: "Glitter Collection", sheen: "High Gloss", in_stock: true, rank: 2, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/clear-radience.jpg" },
  { system: "glitter", color_name: "Silver Sparkle", code: "CG-003", hex: "#C8C8D0", collection: "Glitter Collection", sheen: "High Gloss", in_stock: true, rank: 3, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/silver-sparkle.jpg" },
  { system: "glitter", color_name: "Gold Dust", code: "CG-004", hex: "#D4AF37", collection: "Glitter Collection", sheen: "High Gloss", in_stock: true, rank: 4, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/gold-dust.jpg" },
  { system: "glitter", color_name: "Bronze Shimmer", code: "CG-005", hex: "#8C6A3A", collection: "Glitter Collection", sheen: "High Gloss", in_stock: true, rank: 5, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/bronze-shimmer.jpg" },
  { system: "glitter", color_name: "Copper Glow", code: "CG-006", hex: "#B06A32", collection: "Glitter Collection", sheen: "High Gloss", in_stock: true, rank: 6, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/copper-glow.jpg" },
  { system: "glitter", color_name: "Midnight", code: "CG-007", hex: "#1A1A2A", collection: "Glitter Collection", sheen: "High Gloss", in_stock: true, rank: 7, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/midnight.jpg" },
  { system: "glitter", color_name: "Ocean Sparkle", code: "CG-008", hex: "#1E5A8A", collection: "Glitter Collection", sheen: "High Gloss", in_stock: true, rank: 8, image_url: "https://xtremepolishingsystems.com/cdn/shop/files/ocean-sparkle.jpg" },

  // ── DYE STAIN (Ameripolish) ──
  { system: "dye_stain", color_name: "Black", code: "AP-01", hex: "#1A1A1A", collection: "Ameripolish Dye", sheen: "Matte", in_stock: true, rank: 1, image_url: "https://www.ameripolish.com/img/colorswatches/ColorSwatch-j1u96mr9nhsgn3p.png" },
  { system: "dye_stain", color_name: "Brown", code: "AP-02", hex: "#5A3820", collection: "Ameripolish Dye", sheen: "Matte", in_stock: true, rank: 2, image_url: "https://www.ameripolish.com/img/colorswatches/ColorSwatch-uaai0s04rm5zpa8.png" },
  { system: "dye_stain", color_name: "Red", code: "AP-03", hex: "#8E2828", collection: "Ameripolish Dye", sheen: "Matte", in_stock: true, rank: 3, image_url: "https://www.ameripolish.com/img/colorswatches/ColorSwatch-y3e98qwgseprhvl.png" },
  { system: "dye_stain", color_name: "Orange", code: "AP-04", hex: "#C86820", collection: "Ameripolish Dye", sheen: "Matte", in_stock: true, rank: 4, image_url: "https://www.ameripolish.com/img/colorswatches/ColorSwatch-orange.png" },
  { system: "dye_stain", color_name: "Yellow", code: "AP-05", hex: "#C8A820", collection: "Ameripolish Dye", sheen: "Matte", in_stock: true, rank: 5, image_url: "https://www.ameripolish.com/img/colorswatches/ColorSwatch-yellow.png" },
  { system: "dye_stain", color_name: "Green", code: "AP-06", hex: "#3A6A3A", collection: "Ameripolish Dye", sheen: "Matte", in_stock: true, rank: 6, image_url: "https://www.ameripolish.com/img/colorswatches/ColorSwatch-green.png" },
  { system: "dye_stain", color_name: "Blue", code: "AP-07", hex: "#2848A8", collection: "Ameripolish Dye", sheen: "Matte", in_stock: true, rank: 7, image_url: "https://www.ameripolish.com/img/colorswatches/ColorSwatch-blue.png" },
  { system: "dye_stain", color_name: "Purple", code: "AP-08", hex: "#6A3A8A", collection: "Ameripolish Dye", sheen: "Matte", in_stock: true, rank: 8, image_url: "https://www.ameripolish.com/img/colorswatches/ColorSwatch-purple.png" },
  { system: "dye_stain", color_name: "Gray", code: "AP-09", hex: "#8A8A8A", collection: "Ameripolish Dye", sheen: "Matte", in_stock: true, rank: 9, image_url: "https://www.ameripolish.com/img/colorswatches/ColorSwatch-gray.png" },
  { system: "dye_stain", color_name: "Tan", code: "AP-10", hex: "#C8A878", collection: "Ameripolish Dye", sheen: "Matte", in_stock: true, rank: 10, image_url: "https://www.ameripolish.com/img/colorswatches/ColorSwatch-tan.png" },
];

// Helper: get colors by system
export function getColorsBySystem(system) {
  return COLOR_DATA.filter(c => c.system === system);
}

// Helper: get all systems that have colors
export function getColorSystems() {
  return [...new Set(COLOR_DATA.map(c => c.system))];
}

// Helper: get a representative color for a system (first in-stock, rank 1)
export function getSystemRepresentative(system) {
  return COLOR_DATA.find(c => c.system === system && c.in_stock) || COLOR_DATA.find(c => c.system === system);
}