const IUniswapV2Router = artifacts.require("IUniswapV2Router02");
const {ChainId, WETH, Route, Fetcher, Trade, TokenAmount, TradeType, Percent} = require('@uniswap/sdk');
const { BigNumber } = require('@ethersproject/bignumber');
const daiAbi = require('../abi.js');
// const BigNumber = require('bignumber.js');


contract('Router', (accounts) => {
    let UniswapRouter;
    let UniswapFactory; 
    let clientAddress = accounts[0];
    let daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
    let Router02Address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    before(async () => {
        UniswapRouter = await IUniswapV2Router.at(Router02Address);

    });
    it('Should swap exact Eth for tokens', async () => {

        const chainId = ChainId.MAINNET;
        const dai = await Fetcher.fetchTokenData(chainId, daiAddress);
        const weth = WETH[chainId];
        const pair = await Fetcher.fetchPairData(dai, weth);
        const route = new Route([pair], weth);
        const amountIn = '1000000000000000000'; // 1 WETH
        const trade = new Trade(route, new TokenAmount(weth, amountIn), TradeType.EXACT_INPUT);
        const slippageTollerance = new Percent("50", "10000");
        const amountOutMin = new BigNumber.from(trade.minimumAmountOut(slippageTollerance).raw.toString());
        const path = [weth.address, dai.address ];
        const deadline = Math.floor(Date.now() / 1000) + 60*20;
        const to = clientAddress;
        const value = new BigNumber.from(trade.inputAmount.raw.toString());
        // console.log(`amountOutMin : ` + amountOutMin);
        // console.log(`slippageTollerance : ` + slippageTollerance.toFixed(10));
        const daiContract = new web3.eth.Contract(daiAbi, daiAddress);
        let  initialDaiBalance = await daiContract.methods.balanceOf(clientAddress).call();
        // console.log(`initialDaiBalance :  ${initialDaiBalance}`);
        await UniswapRouter.swapExactETHForTokens(
            amountOutMin,
            path,
            to, 
            deadline, {value, from : clientAddress} );
    
        let finalDaiBalance = await daiContract.methods.balanceOf(clientAddress).call();
        // console.log(`finalDaiBalance : ${finalDaiBalance}`);
        let daiBalanceDiff = BigNumber.from(finalDaiBalance).sub(BigNumber.from(initialDaiBalance));
        // console.log(`daiBalanceDiff : ${daiBalanceDiff}`);
        // console.log(` Typeof daiBalanceDiff ` +  typeof(daiBalanceDiff));
        assert(amountOutMin <= daiBalanceDiff);
        
    });










})
