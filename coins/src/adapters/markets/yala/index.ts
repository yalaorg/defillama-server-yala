import getWrites from "../../utils/getWrites";
import { getApi } from "../../utils/sdk";

const projectName = "yala";

const slot0Abi =
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint32 feeProtocol, bool unlocked)";

const config: any = {
  // [token]: uniV3pool
  ethereum: {
    // YU-USDC
    "0xE868084cf08F3c3db11f4B73a95473762d9463f7":
      "0xB7DD85fE94686A9b5CA04fBc49E0CCc2746D50a2",
  },
};

async function getTokenPrice(chain: string, timestamp: number) {
  const api = await getApi(chain, timestamp);
  const pricesObject: any = {};
  const pools: any = Object.values(config[chain]);
  const tokens = Object.keys(config[chain]);
  const token0s = await api.multiCall({ abi: "address:token0", calls: pools });
  const token1s = await api.multiCall({ abi: "address:token1", calls: pools });
  const slot0s = await api.multiCall({ abi: slot0Abi, calls: pools });
  const tokens0Decimals = await api.multiCall({
    abi: "erc20:decimals",
    calls: token0s,
  });
  const tokens1Decimals = await api.multiCall({
    abi: "erc20:decimals",
    calls: token1s,
  });

  slot0s.forEach((v: any, i: number) => {
    const token = tokens[i].toLowerCase();
    let token0 = token0s[i].toLowerCase();
    let price =
      Math.pow(1.0001, v.tick) *
      10 ** (tokens0Decimals[i] - tokens1Decimals[i]);
    if (token !== token0) price = 1 / price;
    pricesObject[token] = {
      underlying: token0 === token ? token1s[i] : token0,
      price,
    };
  });
  return getWrites({ chain, timestamp, pricesObject, projectName });
}

function yala(timestamp: number = 0) {
  return Promise.all(
    Object.keys(config).map((chain) => getTokenPrice(chain, timestamp))
  );
}

export const adapters = {
  yala,
};
