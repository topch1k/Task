const IUniswapV2Router = artifacts.require("IUniswapV2Router02");
const IERC20 = artifacts.require("IERC20");
const {ChainId, WETH, Route, Fetcher, Trade, TokenAmount, TradeType, Percent, Token} = require('@uniswap/sdk');
const { BigNumber } = require('@ethersproject/bignumber');


contract('Router', accounts => {
    it('swapExactTokensForTokens', async () => {
    let Router02Address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    let WBTCAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    let USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    let Router = await IUniswapV2Router.at(Router02Address);
    let wbtcToken = await IERC20.at(WBTCAddress);
    let usdtToken = await IERC20.at(USDCAddress);
    let clientAddress = "0xF9930a9d65cc57d024CF9149AE67e66c7a77E167";

    const chainId = ChainId.MAINNET;
    const wbtc = await Fetcher.fetchTokenData(chainId, WBTCAddress);
    const usdc = await Fetcher.fetchTokenData(chainId, USDCAddress);
    const pair = await Fetcher.fetchPairData(wbtc, usdc);
    const route = new Route([pair], wbtc);
    const amountIn = BigNumber.from(3).mul(BigNumber.from(10).pow(BigNumber.from(wbtc.decimals - 2)));
    const trade = new Trade(route, new TokenAmount(wbtc, amountIn), TradeType.EXACT_INPUT);
    const slippageTollerance = new Percent("50", "10000");
    const amountOutMin = BigNumber.from(trade.minimumAmountOut(slippageTollerance).raw.toString());
    const path = [wbtc.address, usdc.address];
    const deadline = Math.floor(Date.now() / 1000) + 60*20;
    const to = clientAddress;
    const value = amountIn;
    // await wbtcToken.transferFrom(clientAddress, Router02Address, amountIn);
    await wbtcToken.approve(Router02Address, amountIn, {from : clientAddress});

    let initWbtcBalance = (await wbtcToken.balanceOf(clientAddress)).toString();
    let initUsdcBalance = (await usdtToken.balanceOf(clientAddress)).toString();
    console.log(`1) WBTC Balance : ` + initWbtcBalance);
    console.log(`1) USDC Balance : ` + initUsdcBalance);
    await Router.swapExactTokensForTokens(
        amountIn, 
        amountOutMin,
        path, 
        to,
        deadline, {from : clientAddress});
    let finalWbtcBalance = (await wbtcToken.balanceOf(clientAddress)).toString();
    let finalUsdcBalance = (await usdtToken.balanceOf(clientAddress)).toString();    
    console.log(`2) WBTC Balance : ` + finalWbtcBalance);
    console.log(`2) USDC Balance : ` + finalUsdcBalance);
    let wbtcDiff = (BigNumber.from(finalWbtcBalance).sub(BigNumber.from(initWbtcBalance)).abs());
    let usdcDiff = BigNumber.from(finalUsdcBalance).sub(BigNumber.from(initUsdcBalance));
    console.log(` WBTC Diff : ${wbtcDiff}`);
    console.log(` USDC Diff : ${usdcDiff}`);
    assert(wbtcDiff > 0 );
    assert(usdcDiff >0);
        
    
});

})