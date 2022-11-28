import axios, { AxiosInstance } from 'axios';
import BigNumber from 'bignumber.js';
import memoizee from 'memoizee';

import { getFiatEndpoint } from '@onekeyhq/engine/src/endpoint';

import {
  IAdaAccount,
  IAdaAddress,
  IAdaHistory,
  IAdaTransaction,
  IAdaUTXO,
} from '../types';

class Client {
  readonly request: AxiosInstance;

  readonly backendRequest: AxiosInstance;

  constructor(url: string) {
    this.request = axios.create({
      baseURL: 'https://node.onekeytest.com/ada' ?? url,
      timeout: 20000,
    });

    this.backendRequest = axios.create({
      baseURL:
        'http://192.168.50.36:9000/cardano' ?? `${getFiatEndpoint()}/cardano`,
      timeout: 20000,
    });
  }

  async latestBlock() {
    const res = await this.request
      .get<{ height: number }>('/blocks/latest')
      .then((i) => i.data);
    return {
      height: Number(res.height ?? 0),
    };
  }

  async getAddress(address: string): Promise<IAdaAddress> {
    return this.request
      .get<IAdaAddress>(`/addresses/${address}`)
      .then((i) => i.data);
  }

  async getAccount(stakeAddress: string): Promise<IAdaAccount> {
    return this.request
      .get<IAdaAccount>(`/accounts/${stakeAddress}`)
      .then((i) => i.data);
  }

  async getBalance(stakeAddress: string): Promise<BigNumber> {
    const res = await this.request
      .get<IAdaAccount>(`/accounts/${stakeAddress}`)
      .then((i) => i.data);
    const balance = new BigNumber(res.controlled_amount) ?? 0;
    return balance;
  }

  getUTXOs = memoizee(
    async (stakeAddress: string): Promise<IAdaUTXO[]> =>
      this.backendRequest
        .get<IAdaUTXO[]>(`/utxos/${stakeAddress}`)
        .then((i) => i.data),
    {
      promise: true,
      maxAge: 1000 * 60,
    },
  );

  getHistory = memoizee(
    async (stakeAddress: string): Promise<IAdaHistory[]> =>
      this.backendRequest
        .get<IAdaHistory[]>(`/history/${stakeAddress}`)
        .then((i) => i.data),
    {
      promise: true,
      maxAge: 1000 * 60,
    },
  );

  async getRawTransaction(txid: string): Promise<IAdaTransaction> {
    return this.request
      .get<IAdaTransaction>(`/txs/${txid}`)
      .then((i) => i.data);
  }

  async submitTx(data: string) {
    return this.request.post('/tx/submit', { data });
  }
}

export default Client;
