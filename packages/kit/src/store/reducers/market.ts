import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { ISimpleSearchHistoryToken } from '@onekeyhq/engine/src/dbs/simple/entity/SimpleDbEntityMarket';

import { TokenChartData } from './tokens';

export const MARKET_SEARCH_HISTORY_MAX = 10;
type CoingeckoId = string;
type CategoryId = string;

export enum MarketCategoryType {
  MRKET_CATEGORY_TYPE_TAB = 'tab',
  MRKET_CATEGORY_TYPE_SEARCH = 'search',
}

export const MARKET_TAB_NAME = 'Market';
export const SWAP_TAB_NAME = 'Swap';

export type MarketTokenDetail = {
  stats?: MarketStats;
  about?: string;
  explorers?: MarketEXplorer[];
  news?: MarketNews[];
  priceSubscribe?: boolean;
};

export type MarketEXplorer = {
  iconUrl?: string;
  contractAddress?: string;
  name?: string;
  url?: string;
};

export type MarketNews = {
  url?: string;
  title?: string;
  origin?: string;
  date?: string;
  imageUrl?: string;
};

export type MarketPerformance = {
  priceChangePercentage1h?: number;
  priceChangePercentage24h?: number;
  priceChangePercentage7d?: number;
  priceChangePercentage14d?: number;
  priceChangePercentage30d?: number;
  priceChangePercentage1y?: number;
};

export type MarketStats = {
  performance?: MarketPerformance;
  marketCap?: number;
  marketCapDominance?: string;
  marketCapRank?: number;
  trandingVolume?: string;
  volume24h?: number;
  low7d?: string;
  high7d?: string;
  low24h?: number;
  high24h?: number;
  atl?: {
    time?: string;
    value?: number;
  };
  ath?: {
    time?: string;
    value?: number;
  };
};

type ChartsPayloadAction = {
  coingeckoId: CoingeckoId;
  days: string;
  chart: TokenChartData;
};

type MarketTokenDetailPayloadAction = {
  coingeckoId: CoingeckoId;
  data: MarketTokenDetail;
};

type MarketTokenPriceSubscribeStatusAction = {
  coingeckoIds: CoingeckoId[];
  enable: boolean;
};

type SearchHistoryPayloadAction = {
  token: ISimpleSearchHistoryToken;
};

type SearchHistorySyncPayloadAction = {
  tokens: ISimpleSearchHistoryToken[];
};

type SearchTokenPayloadAction = {
  searchKeyword: string;
  coingeckoIds: CoingeckoId[];
};

export type MarketTopTabName = 'Market' | 'Swap';

export type MarketInitialState = {
  searchTabCategoryId?: CategoryId;
  charts: Record<CoingeckoId, Record<string, TokenChartData>>;
  details: Record<CoingeckoId, MarketTokenDetail>;
  marktTobTapName: MarketTopTabName;
  searchHistory?: ISimpleSearchHistoryToken[];
  searchTokens: Record<string, CoingeckoId[]>;
  searchKeyword?: string;
};

const initialState: MarketInitialState = {
  charts: {},
  details: {},
  searchTokens: {},
  marktTobTapName: MARKET_TAB_NAME,
};

export const MarketSlicer = createSlice({
  name: 'market',
  initialState,
  reducers: {
    updateSearchTabCategory(
      state,
      action: PayloadAction<CategoryId | undefined>,
    ) {
      const { payload } = action;
      state.searchTabCategoryId = payload;
    },
    updateMarketChats(state, action: PayloadAction<ChartsPayloadAction>) {
      const { coingeckoId, chart, days } = action.payload;
      state.charts[coingeckoId] = state.charts[coingeckoId] || {};
      state.charts[coingeckoId][days] = chart;
    },
    updateMarketTokenDetail(
      state,
      action: PayloadAction<MarketTokenDetailPayloadAction>,
    ) {
      const { coingeckoId, data } = action.payload;
      const detail = state.details[coingeckoId] || {};
      state.details[coingeckoId] = { ...detail, ...data };
    },
    updateMarketTokenPriceSubscribe(
      state,
      action: PayloadAction<MarketTokenPriceSubscribeStatusAction>,
    ) {
      const { coingeckoIds, enable } = action.payload;
      coingeckoIds.forEach((id) => {
        const detail = state.details[id] || {};
        detail.priceSubscribe = enable;
        state.details[id] = detail;
      });
    },
    switchMarketTopTab(state, action: PayloadAction<MarketTopTabName>) {
      state.marktTobTapName = action.payload;
    },
    saveMarketSearchTokenHistory(
      state,
      action: PayloadAction<SearchHistoryPayloadAction>,
    ) {
      const { token } = action.payload;
      const historys = state.searchHistory ? [...state.searchHistory] : [];
      const findIndex = historys.findIndex(
        (t) => t.coingeckoId === token.coingeckoId,
      );
      if (findIndex !== -1) {
        historys.splice(findIndex, 1);
      }
      if (historys.length >= MARKET_SEARCH_HISTORY_MAX) {
        historys.pop();
      }
      state.searchHistory = [token, ...historys];
    },
    clearMarketSearchTokenHistory(state) {
      state.searchHistory = [];
    },
    syncMarketSearchTokenHistorys(
      state,
      action: PayloadAction<SearchHistorySyncPayloadAction>,
    ) {
      state.searchHistory = action.payload.tokens;
    },
    updateSearchTokens(state, action: PayloadAction<SearchTokenPayloadAction>) {
      const { searchKeyword, coingeckoIds } = action.payload;
      state.searchTokens[searchKeyword] = coingeckoIds;
    },
    updateSearchKeyword(state, action: PayloadAction<string>) {
      state.searchKeyword = action.payload;
    },
  },
});

export const {
  updateMarketChats,
  updateMarketTokenDetail,
  switchMarketTopTab,
  syncMarketSearchTokenHistorys,
  clearMarketSearchTokenHistory,
  saveMarketSearchTokenHistory,
  updateSearchTabCategory,
  updateSearchTokens,
  updateSearchKeyword,
  updateMarketTokenPriceSubscribe,
} = MarketSlicer.actions;

export default MarketSlicer.reducer;
