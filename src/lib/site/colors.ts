export function buttonInk(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((channel) => {
      const c = parseInt(channel, 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return luminance > 0.179 ? "#000000" : "#ffffff";
}
