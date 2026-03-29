/**
 * Real Octant epoch data, parsed and calibrated from:
 *   - Octant-Epochs-1-10-Funding-from-app-CSV
 *   - The-History-of-Octant-Epoch-by-epoch PDF
 *
 * Key findings used to calibrate the model:
 * - Average leverage (matching/donations): ~33x across epochs
 * - Gini coefficient range: 0.37 (E7, curated regen) to 0.77 (E3, algorithm anomaly)
 * - Typical funded projects: 20–30 per epoch
 * - Funding volatility: many recurring projects see 50–250x swings epoch to epoch
 * - Sufficiency floor (implicit from match=0 cutoff): ~$10k–$15k USD
 * - Epoch 3 anomaly: algorithm overhaul caused extreme polarization (median ~$428 USD)
 */

export interface OctantEpoch {
  id: string;
  label: string;
  theme: string;
  rewardsPool: number;        // ETH
  matchingToProjects: number; // ETH
  userDonations: number;      // ETH
  totalToProjects: number;    // ETH
  fundedProjects: number;
  donors: number;
  leverage: number;           // matching/donations ratio
  gini: number;               // measured from project distribution
  ethPriceUSD: number;        // approximate mid-epoch price
  topProject: string;
  topProjectETH: number;
  medianProjectETH: number;
  strandeProjects: number;    // received 0 matching
  notes?: string;
}

export interface OctantProject {
  name: string;
  epoch: string;
  donationsETH: number;
  donors: number;
  matchETH: number;
  totalETH: number;
  totalUSD: number;
  gotMatching: boolean;
}

export const OCTANT_EPOCHS: OctantEpoch[] = [
  {
    id: 'epoch1', label: 'Epoch 1', theme: 'Open-source infrastructure',
    rewardsPool: 412.042, matchingToProjects: 244.215, userDonations: 5.527,
    totalToProjects: 249.743, fundedProjects: 24, donors: 347, leverage: 44,
    gini: 0.513, ethPriceUSD: 1650, topProject: 'Protocol Guild',
    topProjectETH: 43.52, medianProjectETH: 6.82, strandeProjects: 5,
    notes: 'First epoch. 5 projects fell below matching threshold — received only donations.'
  },
  {
    id: 'epoch2', label: 'Epoch 2', theme: 'Shortlisted public goods',
    rewardsPool: 966.657, matchingToProjects: 227.322, userDonations: 3.925,
    totalToProjects: 231.246, fundedProjects: 24, donors: 332, leverage: 58,
    gini: 0.455, ethPriceUSD: 2200, topProject: 'Protocol Guild',
    topProjectETH: 36.55, medianProjectETH: 8.95, strandeProjects: 5,
    notes: 'Largest rewards pool in history (966 ETH). 58x leverage — donations alone barely mattered.'
  },
  {
    id: 'epoch3', label: 'Epoch 3', theme: 'General (algorithm overhaul)',
    rewardsPool: 959.849, matchingToProjects: 335.973, userDonations: 25.484,
    totalToProjects: 361.457, fundedProjects: 30, donors: 285, leverage: 13,
    gini: 0.774, ethPriceUSD: 3200, topProject: 'Protocol Guild',
    topProjectETH: 77.37, medianProjectETH: 0.134, strandeProjects: 21,
    notes: 'Major algorithm overhaul + Participation Promotion Fund. Extreme polarization: 21/30 projects got 0 matching. Median $428 USD vs top $247k.'
  },
  {
    id: 'epoch4', label: 'Epoch 4', theme: 'General public goods',
    rewardsPool: 850.134, matchingToProjects: 304.978, userDonations: 17.630,
    totalToProjects: 302.361, fundedProjects: 30, donors: 279, leverage: 17,
    gini: 0.582, ethPriceUSD: 3000, topProject: 'Protocol Guild',
    topProjectETH: 48.81, medianProjectETH: 8.31, strandeProjects: 0,
    notes: 'All 30 projects received matching. High concentration in top 5.'
  },
  {
    id: 'epoch5', label: 'Epoch 5', theme: 'General public goods',
    rewardsPool: 871.274, matchingToProjects: 304.978, userDonations: 17.631,
    totalToProjects: 322.610, fundedProjects: 30, donors: 422, leverage: 17,
    gini: 0.412, ethPriceUSD: 2600, topProject: 'Protocol Guild',
    topProjectETH: 32.86, medianProjectETH: 8.27, strandeProjects: 0,
    notes: 'Most donors of any epoch (422). Most equitable distribution — Gini 0.41. All projects above floor.'
  },
  {
    id: 'epoch6', label: 'Epoch 6', theme: 'General public goods',
    rewardsPool: 782.428, matchingToProjects: 273.885, userDonations: 14.313,
    totalToProjects: 288.197, fundedProjects: 30, donors: 455, leverage: 19,
    gini: 0.518, ethPriceUSD: 2800, topProject: 'L2BEAT',
    topProjectETH: 37.09, medianProjectETH: 4.57, strandeProjects: 0,
    notes: 'First epoch where L2BEAT topped Protocol Guild. More diverse top 10.'
  },
  {
    id: 'epoch7', label: 'Epoch 7', theme: 'Regenerative / environmental',
    rewardsPool: 840.282, matchingToProjects: 294.141, userDonations: 4.526,
    totalToProjects: 298.667, fundedProjects: 20, donors: 586, leverage: 65,
    gini: 0.367, ethPriceUSD: 2500, topProject: 'Blue Energy Reef Restoration',
    topProjectETH: 35.19, medianProjectETH: 10.10, strandeProjects: 0,
    notes: 'Most donors ever (586). Regen theme. Fewest projects (20) but most equitable Gini (0.37). 65x leverage.'
  },
  {
    id: 'epoch8', label: 'Epoch 8', theme: 'Ethereum core tooling',
    rewardsPool: 787.217, matchingToProjects: 275.580, userDonations: 14.048,
    totalToProjects: 289.630, fundedProjects: 30, donors: 336, leverage: 20,
    gini: 0.373, ethPriceUSD: 2700, topProject: 'growthepie',
    topProjectETH: 23.87, medianProjectETH: 8.94, strandeProjects: 0,
    notes: 'Solidity, Remix, Vyper, Ethers.js funded. More compressed top/bottom ratio than most epochs.'
  },
  {
    id: 'epoch9', label: 'Epoch 9', theme: 'Content / media / education',
    rewardsPool: 680.738, matchingToProjects: 238.308, userDonations: 3.869,
    totalToProjects: 242.182, fundedProjects: 30, donors: 213, leverage: 62,
    gini: 0.579, ethPriceUSD: 2400, topProject: 'ZachXBT',
    topProjectETH: 42.98, medianProjectETH: 4.04, strandeProjects: 0,
    notes: 'Lowest donors (213) but 62x leverage. Media/content focus. ZachXBT was top project.'
  },
  {
    id: 'epoch10', label: 'Epoch 10', theme: 'Mixed / general',
    rewardsPool: 765.840, matchingToProjects: 268.097, userDonations: 14.836,
    totalToProjects: 282.931, fundedProjects: 24, donors: 254, leverage: 18,
    gini: 0.414, ethPriceUSD: 2200, topProject: 'Solidity',
    topProjectETH: 46.29, medianProjectETH: 8.92, strandeProjects: 0,
    notes: 'Last v1 epoch. Solidity topped at 46 ETH. 24 projects — smaller cohort.'
  },
];

// Per-project data for the longitudinal view — top recurring projects
export const RECURRING_PROJECTS = [
  { name: 'Protocol Guild', epochs: [1,2,3,4,5,6,8,10], ethByEpoch: [43.52,36.55,77.37,48.81,32.86,32.57,17.22,14.65] },
  { name: 'L2BEAT', epochs: [2,3,4,5,6,8,10], ethByEpoch: [16.11,0.14,16.12,15.64,37.09,11.79,30.69] },
  { name: 'Rotki', epochs: [1,2,3,4,5,6,10], ethByEpoch: [33.92,11.06,19.76,11.46,28.91,8.66,9.42] },
  { name: 'Revoke.cash', epochs: [2,3,4,5,6], ethByEpoch: [15.31,0.10,24.74,22.29,29.21] },
  { name: 'Ethereum Cat Herders', epochs: [1,2,3,4,5,6], ethByEpoch: [8.04,6.19,0.09,8.31,15.73,19.22] },
  { name: 'Tor Project', epochs: [1,2,3,4,5,6], ethByEpoch: [26.19,8.95,0.39,45.44,19.92,18.24] },
  { name: 'EthStaker', epochs: [1,2,3,4,5,6,10], ethByEpoch: [6.82,18.35,0.06,10.45,5.70,3.35,7.57] },
  { name: 'Open Source Observer', epochs: [2,3,4,5,6,8,10], ethByEpoch: [12.96,0.28,18.73,12.24,13.54,13.88,5.19] },
  { name: 'Hypercerts', epochs: [1,2,3,4,5], ethByEpoch: [27.72,16.38,27.74,13.08,12.69] },
  { name: 'Funding the Commons', epochs: [2,3,4,5,6,10], ethByEpoch: [12.15,0.11,9.53,9.91,15.71,8.92] },
];

// Sufficiency floor estimates (USD) — derived from match=0 cutoff in epochs 1-3
// Projects below this received only direct donations, effectively stranded
export const SUFFICIENCY_FLOORS = {
  epoch1: 9500,   // min funded project: $9,513
  epoch2: 10800,  // min funded project: $10,827
  epoch3: 42600,  // extreme outlier due to algorithm change
  typical: 12000, // representative floor for model calibration (~$10k-$15k range)
};

// Key structural facts for model calibration
export const OCTANT_CALIBRATION = {
  avgLeverage: 33,             // average matching/donations across epochs
  avgFundedProjects: 27,       // average projects per epoch
  avgMatchingETH: 276.7,       // average matching pool
  avgDonorsPerEpoch: 349,      // average unique donors
  sufficiencyFloorUSD: 12000,  // approximate viability floor per project
  topProjectShare: 0.17,       // top project typically gets ~17% of total funding
  giniRange: [0.37, 0.77],     // observed Gini coefficient range
  volatilityNote: 'Projects see 50-250x funding swings across epochs — extremely high instability',
  epoch3Anomaly: 'Epoch 3 had 21/30 projects stranded (algorithm overhaul). Not representative.',
};
