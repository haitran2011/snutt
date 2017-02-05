class Color {
  static colors = [
    { fg: "#2B8728", bg: "#B6F9B2"},
    { fg: "#45B2B8", bg: "#BFF7F8"},
    { fg: "#1579C2", bg: "#94E6FE"},
    { fg: "#A337A1", bg: "#F6B5F5"},
    { fg: "#B8991B", bg: "#FFF49A"},
    { fg: "#BA313B", bg: "#FFB2BC"}
  ];

  static get_random_color(): { fg:string, bg:string } {
    return this.colors[Math.floor(Math.random() * this.colors.length)]
  };
}

export = Color;