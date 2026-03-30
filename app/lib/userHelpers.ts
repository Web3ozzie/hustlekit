export function makeDefaultUsername(email: string | null): string {
  if (!email) return "Hustler";
  const prefix = email.split("@")[0] || "";
  const firstTwo = prefix.slice(0, 2).toUpperCase();
  return `${firstTwo}Hustler`;
}

export function makeHustleId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `HK-${num}`;
}