export type Suit = "♠" | "♣" | "♦" | "♥";
export type Rank = "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | "2";

export interface Card {
    suit: Suit;
    rank: Rank;
    faceUp: boolean;
}

export const TLMN_SUITS: Suit[] = ["♠", "♣", "♦", "♥"];
export const TLMN_RANKS: Rank[] = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"];

export function getCardPower(card: Card): number {
    const rankPower = TLMN_RANKS.indexOf(card.rank); // 0 to 12
    const suitPower = TLMN_SUITS.indexOf(card.suit); // 0 to 3
    return rankPower * 4 + suitPower;
}

export function createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of TLMN_SUITS) {
        for (const rank of TLMN_RANKS) {
            deck.push({ suit, rank, faceUp: false });
        }
    }
    return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
}

export function sortCards(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => getCardPower(a) - getCardPower(b));
}

export type HandType = "single" | "pair" | "triple" | "quad" | "sequence" | "consecutive_pairs" | "invalid";

export interface HandInfo {
    type: HandType;
    cards: Card[];
    highestPower: number;
    length: number;
}

export function evaluateHand(cards: Card[]): HandInfo {
    if (cards.length === 0) return { type: "invalid", cards, highestPower: -1, length: 0 };

    const sorted = sortCards(cards);
    const highestPower = getCardPower(sorted[sorted.length - 1]);

    if (cards.length === 1) {
        return { type: "single", cards: sorted, highestPower, length: 1 };
    }

    const allSameRank = sorted.every(c => c.rank === sorted[0].rank);
    if (allSameRank) {
        if (cards.length === 2) return { type: "pair", cards: sorted, highestPower, length: 2 };
        if (cards.length === 3) return { type: "triple", cards: sorted, highestPower, length: 3 };
        if (cards.length === 4) return { type: "quad", cards: sorted, highestPower, length: 4 };
    }

    // Sequence (Sảnh) - 2 not allowed
    if (cards.length >= 3) {
        let isSeq = true;
        for (let i = 1; i < sorted.length; i++) {
            const prevRIdx = TLMN_RANKS.indexOf(sorted[i - 1].rank);
            const currRIdx = TLMN_RANKS.indexOf(sorted[i].rank);
            if (currRIdx - prevRIdx !== 1) { isSeq = false; break; }
        }
        const hasHeo = sorted.some(c => c.rank === "2");
        if (isSeq && !hasHeo) {
            return { type: "sequence", cards: sorted, highestPower, length: cards.length };
        }
    }

    // Consecutive pairs (Đôi thông) - 3+ pairs, 2 not allowed
    if (cards.length >= 6 && cards.length % 2 === 0) {
        let isConsecutive = true;
        const pairsCount = cards.length / 2;
        for (let i = 0; i < pairsCount; i++) {
            const c1 = sorted[i * 2];
            const c2 = sorted[i * 2 + 1];
            if (c1.rank !== c2.rank) { isConsecutive = false; break; }
            if (i > 0) {
                const prevRIdx = TLMN_RANKS.indexOf(sorted[i * 2 - 2].rank);
                const currRIdx = TLMN_RANKS.indexOf(c1.rank);
                if (currRIdx - prevRIdx !== 1) { isConsecutive = false; break; }
            }
        }
        const hasHeo = sorted.some(c => c.rank === "2");
        if (isConsecutive && !hasHeo && pairsCount >= 3) {
            return { type: "consecutive_pairs", cards: sorted, highestPower, length: pairsCount };
        }
    }

    return { type: "invalid", cards: sorted, highestPower: -1, length: 0 };
}

export function canBeat(play: HandInfo, current: HandInfo): boolean {
    if (play.type === "invalid") return false;
    if (current.type === "invalid") return true;

    // Normal override
    if (play.type === current.type && play.length === current.length) {
        return play.highestPower > current.highestPower;
    }

    // Special Hacks (Chặt)
    const isSingleHeo = current.type === "single" && current.cards[0].rank === "2";
    const isPairHeo = current.type === "pair" && current.cards[0].rank === "2";

    // 3 đôi thông chặt 1 heo
    if (play.type === "consecutive_pairs" && play.length === 3) {
        if (isSingleHeo) return true;
    }
    // Tứ quý chặt 1 heo, đôi heo, 3 đôi thông
    if (play.type === "quad") {
        if (isSingleHeo || isPairHeo) return true;
        if (current.type === "consecutive_pairs" && current.length === 3) return true;
    }
    // 4 đôi thông chặt 1 heo, đôi heo, 3 đôi thông, tứ quý
    if (play.type === "consecutive_pairs" && play.length === 4) {
        if (isSingleHeo || isPairHeo) return true;
        if (current.type === "consecutive_pairs" && current.length === 3) return true;
        if (current.type === "quad") return true;
    }

    return false;
}

export function checkToiTrang(cards: Card[]): string | null {
    if (cards.length !== 13) return null;
    const sorted = sortCards(cards);
    
    // Sảnh rồng
    const uniqueRanks = new Set(sorted.map(c => c.rank));
    if (uniqueRanks.size === 13) return "Sảnh Rồng";
    if (uniqueRanks.size === 12 && !uniqueRanks.has("2")) return "Sảnh Rồng";

    // Tứ quý heo
    if (sorted.filter(c => c.rank === "2").length === 4) return "Tứ Quý Heo";

    // 6 đôi
    let pairs = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].rank === sorted[i+1].rank) {
            pairs++;
            i++;
        }
    }
    if (pairs >= 6) return "Tới Trắng (6 Đôi)";

    return null;
}

export function getAllValidCombinations(hand: Card[]): HandInfo[] {
    const valid: HandInfo[] = [];
    const sorted = sortCards(hand);
    const rankGroups: Record<string, Card[]> = {};
    for (const c of sorted) {
        if (!rankGroups[c.rank]) rankGroups[c.rank] = [];
        rankGroups[c.rank].push(c);
    }

    // 1. Singles
    for (const c of sorted) valid.push(evaluateHand([c]));

    // 2. Pairs, Triples, Quads
    for (const rank in rankGroups) {
        const group = rankGroups[rank];
        if (group.length >= 2) {
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    valid.push(evaluateHand([group[i], group[j]]));
                }
            }
        }
        if (group.length >= 3) {
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    for (let k = j + 1; k < group.length; k++) {
                        valid.push(evaluateHand([group[i], group[j], group[k]]));
                    }
                }
            }
        }
        if (group.length === 4) valid.push(evaluateHand(group));
    }

    // 3. Sequences
    const sj = TLMN_RANKS.slice(0, 12);
    for (let len = 3; len <= 12; len++) {
        for (let s = 0; s <= sj.length - len; s++) {
            const sub = sj.slice(s, s + len);
            if (sub.every(r => rankGroups[r] && rankGroups[r].length > 0)) {
                // Just use lowest suit for each rank for bot play simulation
                valid.push(evaluateHand(sub.map(r => rankGroups[r][0])));
            }
        }
    }

    // 4. Consecutive Pairs
    for (let len = 3; len <= 4; len++) {
        for (let s = 0; s <= sj.length - len; s++) {
            const sub = sj.slice(s, s + len);
            if (sub.every(r => rankGroups[r] && rankGroups[r].length >= 2)) {
                const pc: Card[] = [];
                sub.forEach(r => pc.push(rankGroups[r][0], rankGroups[r][1]));
                valid.push(evaluateHand(pc));
            }
        }
    }

    return valid.filter(v => v.type !== "invalid");
}

export function getBotPlay(hand: Card[], current: HandInfo): Card[] {
    const all = getAllValidCombinations(hand);
    all.sort((a, b) => a.highestPower - b.highestPower);

    if (current.type === "invalid") {
        return all[0]?.cards || [];
    }

    for (const combo of all) {
        if (canBeat(combo, current)) return combo.cards;
    }

    return [];
}
