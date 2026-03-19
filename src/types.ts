export type Segment = 'IN' | 'US' | 'MF';
export type Verdict = string;

export interface AssetScores {
  quality: number;
  growth: number;
  moat: number;
  mgmt: number;
  valuation: number;
  safety: number;
}

export interface AssetRisks {
  geopolitical: number;
  regulatory: number;
  competition: number;
  valuation: number;
  execution: number;
}

export interface Asset {
  ticker: string;
  name: string;
  seg: Segment;
  cat: string;
  inv: number;
  curr: number;
  ret: number;
  scores: AssetScores;
  verdict: Verdict;
  vclass: string;
  pe: number | string;
  roe: number | string;
  cagr5: number | string;
  debt: string;
  promoter: string;
  mktCap: string;
  news: string;
  bull: string;
  bear: string;
  tags: string[];
  risks: AssetRisks;
  trend: number[];
}
