export type ActivityId = 'warmup' | 'habits' | 'wishlist' | 'race' | 'scenario';
export type WarmMark = 'using' | 'worse' | 'none';
export type Bin = 'outdated' | 'useful' | 'new';
export type Verdict = 'match' | 'mismatch' | 'nosource';
export type Role = 'human' | 'agent';
export type WishBin = 'now' | 'build' | 'learn';
export type SectionId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface LiveSession { slideIndex: number; revealed: Partial<Record<ActivityId, boolean>> }
export interface WarmupEntry { marks: Record<string, WarmMark>; note: string }
export interface HabitsEntry { placements: Record<string, Bin> }
export interface WishItem { text: string; repeats: boolean; rulesWritable: boolean; sourceCheckable: boolean; optInName: boolean }
export interface WishEntry { items: WishItem[] }
export interface ScenarioEntry { what: string; files: string; gain: string; optInName: boolean }
export interface Owned<T> { uid: string; value: T }
export interface RaceEntry { role: Role | null; pairCode: string; findings: Record<string, Verdict> }
export interface MockRelease { title: string; sentences: { id: string; text: string }[] }
export type AnswerKey = Record<string, { verdict: Exclude<Verdict, 'match'>; explanation: string }>;
export interface RoleScore { entries: number; caughtAvg: number; missedAvg: number; falseAlarmsAvg: number; perSentence: Record<string, number> }
export interface RaceResults { human: RoleScore; agent: RoleScore; planted: string[]; explanations: Record<string, string> }
