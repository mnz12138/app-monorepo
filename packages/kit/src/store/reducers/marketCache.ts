import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import natsort from 'natsort';

import { Token } from '../typings';

export const MARKET_FAVORITES_CATEGORYID = 'favorites';

type CoingeckoId = string;
type CategoryId = string;

type RecomentToken = {
  coingeckoId: string;
  iconUrl?: string;
  name?: string;
  symbol?: string;
};

export type MarketCategory = {
  name?: string;
  categoryId: CategoryId;
  type: 'tab' | 'search';
  coingeckoIds?: CoingeckoId[];
  defaultSelected?: boolean;
  recommendedTokens?: RecomentToken[];
};

export type MarketTokenItem = {
  name?: string;
  symbol?: string;
  // serialNumber?: number; // token 序号
  coingeckoId: CoingeckoId;
  image?: string;
  logoURI?: string;
  price?: number;
  priceChangePercentage24H?: number;
  sparkline?: number[];
  marketCap?: number;
  totalVolume?: number;
  favorited?: boolean;
  tokens?: Token[]; // all netWork tokens
};

export type MarketListSortType = {
  id: number;
  direction: 'up' | 'down';
};

type MarketCategoryTokensPayloadAction = {
  categoryId?: string;
  marketTokens: MarketTokenItem[];
};

type MarketTokenBasePayloadAction = {
  coingeckoId: CoingeckoId;
  tokens: Token[];
  logoURI?: string;
};

export type MarketInitialState = {
  categorys: Record<CategoryId, MarketCategory>;
  marketTokens: Record<CoingeckoId, MarketTokenItem>;
  listSort: MarketListSortType | null;
  selectedCategoryId?: CategoryId;
};

const initialState: MarketInitialState = {
  categorys: {},
  marketTokens: {},
  listSort: null,
};

function equalStringArr(arr1: string[], arr2: string[]) {
  return (
    arr1.length === arr2.length &&
    arr1.every((value, index) => value === arr2[index])
  );
}

export const MarketCacheSlicer = createSlice({
  name: 'marketCache',
  initialState,
  reducers: {
    updateSelectedCategory(state, action: PayloadAction<CategoryId>) {
      const { payload } = action;
      state.selectedCategoryId = payload;
    },
    saveMarketCategorys(state, action: PayloadAction<MarketCategory[]>) {
      const { payload } = action;
      payload.forEach((c) => {
        const { recommendedTokens } = c;
        const resCategory = { ...c };
        if (recommendedTokens?.length) {
          resCategory.recommendedTokens = recommendedTokens.map((t) => {
            t.symbol = t.symbol ? t.symbol.toUpperCase() : '';
            return t;
          });
        }
        state.categorys[c.categoryId] = resCategory;
      });
    },
    updateMarketTokens(
      state,
      action: PayloadAction<MarketCategoryTokensPayloadAction>,
    ) {
      const { categoryId, marketTokens } = action.payload;
      const { categorys } = state;
      // check categorys
      if (categoryId) {
        const cacheCategory = categorys[categoryId];
        if (cacheCategory) {
          const fetchCoingeckoIds = marketTokens.map((t) => t.coingeckoId);
          if (!cacheCategory.coingeckoIds) {
            cacheCategory.coingeckoIds = fetchCoingeckoIds;
          } else if (
            // ban favorite category coingecko ids change
            cacheCategory.categoryId !== MARKET_FAVORITES_CATEGORYID &&
            !equalStringArr(cacheCategory.coingeckoIds, fetchCoingeckoIds) &&
            state.listSort === null
          ) {
            cacheCategory.coingeckoIds = fetchCoingeckoIds;
          }
        }
      }
      // check favorites
      const favoriteCategory = categorys[MARKET_FAVORITES_CATEGORYID];
      marketTokens.forEach((t) => {
        t.favorited =
          favoriteCategory &&
          favoriteCategory.coingeckoIds?.includes(t.coingeckoId);
        t.symbol = t.symbol ? t.symbol.toUpperCase() : '';
        const cacheMarketToken = state.marketTokens[t.coingeckoId];
        if (cacheMarketToken) {
          Object.assign(cacheMarketToken, t);
        } else {
          state.marketTokens[t.coingeckoId] = t;
        }
      });
    },
    saveMarketFavorite(state, action: PayloadAction<string[]>) {
      const { payload } = action;
      const { categorys } = state;
      const favoriteCategory = categorys[MARKET_FAVORITES_CATEGORYID];
      payload.forEach((id) => {
        if (favoriteCategory && !favoriteCategory.coingeckoIds?.includes(id)) {
          favoriteCategory.coingeckoIds?.push(id);
        }
        if (state.marketTokens[id]) {
          state.marketTokens[id].favorited = true;
        } else {
          state.marketTokens[id] = { favorited: true, coingeckoId: id };
        }
      });
    },
    cancleMarketFavorite(state, action: PayloadAction<string>) {
      const { payload } = action;
      const { categorys } = state;
      const favoriteCategory = categorys[MARKET_FAVORITES_CATEGORYID];
      if (favoriteCategory) {
        const index = favoriteCategory.coingeckoIds?.indexOf(payload);
        if (index !== undefined && index !== -1) {
          favoriteCategory.coingeckoIds?.splice(index, 1);
        }
      }
      state.marketTokens[payload].favorited = false;
    },
    moveTopMarketFavorite(state, action: PayloadAction<string>) {
      const { payload } = action;
      const { categorys } = state;
      const favoriteCategory = categorys[MARKET_FAVORITES_CATEGORYID];
      if (favoriteCategory) {
        const favoriteCoingeckoIds = favoriteCategory.coingeckoIds || [];
        const index = favoriteCoingeckoIds?.indexOf(payload);
        if (index !== undefined && index !== -1) {
          favoriteCoingeckoIds?.splice(index, 1);
          favoriteCategory.coingeckoIds = [payload, ...favoriteCoingeckoIds];
        }
      }
    },
    updateMarketListSort(
      state,
      action: PayloadAction<MarketListSortType | null>,
    ) {
      const { payload } = action;
      state.listSort = payload;
      if (payload) {
        const { selectedCategoryId, marketTokens, categorys } = state;
        if (selectedCategoryId) {
          const categoryTokenIds = categorys[selectedCategoryId].coingeckoIds;
          if (categoryTokenIds) {
            let sortIds = [...categoryTokenIds];
            sortIds = sortIds.sort((id1, id2) => {
              switch (payload.id) {
                case 2: {
                  return payload.direction === 'down'
                    ? natsort({ insensitive: true })(
                        marketTokens[id2]?.symbol ?? '',
                        marketTokens[id1]?.symbol ?? '',
                      )
                    : natsort({ insensitive: true })(
                        marketTokens[id1]?.symbol ?? '',
                        marketTokens[id2]?.symbol ?? '',
                      );
                }
                case 3: {
                  return payload.direction === 'down'
                    ? (marketTokens[id2]?.price ?? 0) -
                        (marketTokens[id1]?.price ?? 0)
                    : (marketTokens[id1]?.price ?? 0) -
                        (marketTokens[id2]?.price ?? 0);
                }
                case 4:
                case 7: {
                  return payload.direction === 'down'
                    ? (marketTokens[id2]?.priceChangePercentage24H ?? 0) -
                        (marketTokens[id1]?.priceChangePercentage24H ?? 0)
                    : (marketTokens[id1]?.priceChangePercentage24H ?? 0) -
                        (marketTokens[id2]?.priceChangePercentage24H ?? 0);
                }
                case 5: {
                  return payload.direction === 'down'
                    ? (marketTokens[id2]?.totalVolume ?? 0) -
                        (marketTokens[id1]?.totalVolume ?? 0)
                    : (marketTokens[id1]?.totalVolume ?? 0) -
                        (marketTokens[id2]?.totalVolume ?? 0);
                }
                case 6: {
                  return payload.direction === 'down'
                    ? (marketTokens[id2]?.marketCap ?? 0) -
                        (marketTokens[id1]?.marketCap ?? 0)
                    : (marketTokens[id1]?.marketCap ?? 0) -
                        (marketTokens[id2]?.marketCap ?? 0);
                }
                default:
                  return 0;
              }
            });
            state.categorys[selectedCategoryId].coingeckoIds = sortIds;
          }
        }
      }
    },
    updateMarketTokensBaseInfo(
      state,
      action: PayloadAction<MarketTokenBasePayloadAction[]>,
    ) {
      const { payload } = action;
      payload.forEach((tokenBase) => {
        const token = state.marketTokens[tokenBase.coingeckoId] || {};
        token.tokens = tokenBase.tokens;
        if (tokenBase.logoURI?.length) {
          token.logoURI = tokenBase.logoURI;
        } else if (token.image) {
          token.logoURI = token.image;
        } else {
          token.logoURI = '';
        }
        state.marketTokens[tokenBase.coingeckoId] = token;
      });
    },
  },
});

export const {
  updateSelectedCategory,
  saveMarketCategorys,
  updateMarketTokens,
  cancleMarketFavorite,
  saveMarketFavorite,
  moveTopMarketFavorite,
  updateMarketListSort,
  updateMarketTokensBaseInfo,
} = MarketCacheSlicer.actions;

export default MarketCacheSlicer.reducer;
