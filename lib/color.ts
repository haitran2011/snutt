const pastel9 = [
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

const name9 = [
    "초록색",
    "하늘색",
    "파랑색",
    "보라색",
    "노랑색",
    "빨강색",
    "라임색",
    "남색",
    "오렌지색"];

class Color {
  static numColor = 9;
  static CUSTOM_COLOR = 0;

  static get_random_color_legacy(): { fg:string, bg:string } {
    return pastel9[Math.floor(Math.random() * pastel9.length)]
  };

  static getLegacyColors() {
    return pastel9;
  }

  static getLegacyNames() {
    return name9;
  }

  static getColorList(name:string) {
    if (name == 'legacy' || name == 'pastel') return { colors: pastel9, names: name9 };
    return null;
  }
}

export = Color;