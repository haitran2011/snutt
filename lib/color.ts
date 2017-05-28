const legacypastel9 = [
    { fg: "#2B8728", bg: "#B6F9B2"},
    { fg: "#45B2B8", bg: "#BFF7F8"},
    { fg: "#1579C2", bg: "#94E6FE"},
    { fg: "#A337A1", bg: "#F6B5F5"},
    { fg: "#B8991B", bg: "#FFF49A"},
    { fg: "#BA313B", bg: "#FFB2BC"},
    { fg: "#649624", bg: "#DAF9B2"},
    { fg: "#5249D7", bg: "#DBD9FD"},
    { fg: "#E27B35", bg: "#FFDAB7"}
  ];

const legacyname9 = [
    "초록색",
    "하늘색",
    "파랑색",
    "보라색",
    "노랑색",
    "빨강색",
    "라임색",
    "남색",
    "오렌지색"];

const vivid9_ios = [
    { fg: "#ffffff", bg: "#e54459"},
    { fg: "#ffffff", bg: "#f58d3d"},
    { fg: "#ffffff", bg: "#fac52d"},
    { fg: "#ffffff", bg: "#a6d930"},
    { fg: "#ffffff", bg: "#2bc366"},
    { fg: "#ffffff", bg: "#1bd0c9"},
    { fg: "#ffffff", bg: "#1d99e9"},
    { fg: "#ffffff", bg: "#4f48c4"},
    { fg: "#ffffff", bg: "#af56b3"}
  ];

const vividname9 = [
  "Red",
  "Orange",
  "Yellow",
  "Pea",
  "JadeGreen",
  "Aqua",
  "WaterBlue",
  "blueishPurple",
  "SoftPurple"
]

class Color {
  static numColor = 9;
  static CUSTOM_COLOR = 0;

  static get_random_color_legacy(): { fg:string, bg:string } {
    return legacypastel9[Math.floor(Math.random() * legacypastel9.length)]
  };

  static getLegacyColors() {
    return legacypastel9;
  }

  static getLegacyNames() {
    return legacyname9;
  }

  static getColorList(name:string) {
    if (name == 'legacy' || name == 'pastel') return { colors: legacypastel9, names: legacyname9 };
    if (name == 'vivid_ios') return { colors:vivid9_ios, names: vividname9 };
    return null;
  }
}

export = Color;