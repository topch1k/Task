const IUniswapV2Factory = artifacts.require("IUniswapV2Factory");
const IUniswapV2Router = artifacts.require("IUniswapV2Router02");
const IERC20 = artifacts.require("IERC20");
const Token1 = artifacts.require("Token1");
const UniswapV2FactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const UniswapV2Router02Address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const {ChainId, WETH, Route, Fetcher, Trade, TokenAmount, TradeType, Percent, Token} = require('@uniswap/sdk');
const {BigNumber} = require('@ethersproject/bignumber');

contract('Factory', function(){
    it('should create pair and add liquidity', async () => {
    let Factory = await IUniswapV2Factory.at(UniswapV2FactoryAddress);
    let Router = await IUniswapV2Router.at(UniswapV2Router02Address);
    let DAIAdrress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    // let clientAddress = "0xF9930a9d65cc57d024CF9149AE67e66c7a77E167"; 
    // let clientAddress = "0x16463c0fdB6BA9618909F5b120ea1581618C1b9E"; *
    let clientAddress = "0xd1669ac6044269b59fa12c5822439f609ca54f41"; 

    let Token1Address = await Token1.address;
    let token1 = await Token1.at(Token1Address);
    let dai = await IERC20.at(DAIAdrress);
    console.log(`1) Token1 address : ${Token1.address}`);
    let pairAddress;
    await Factory.createPair(Token1Address, DAIAdrress)
        .then(() => Factory.getPair(Token1Address, DAIAdrress))
        .then(pair => pairAddress = pair);
    console.log(`pairAddress : ${pairAddress}`);
    let token1Decimals = 18;
    let daiDecimals = 18;
    console.log(`Token1 decimals : ` + token1Decimals);
    console.log(`DAI decimals : ` + daiDecimals);
    const amountMint = BigNumber.from(100, 10).mul(BigNumber.from(10, 10).pow(BigNumber.from(token1Decimals))); 
    console.log(`amountMint : ${amountMint}`);
    await token1.mint(clientAddress, amountMint);
  
    let clientBalance0Before = (await token1.balanceOf(clientAddress)).toString();
    let clientBalance1Before = (await dai.balanceOf(clientAddress)).toString();
    console.log(`clientBalance0Before : ${clientBalance0Before}`);
    console.log(`clientBalance1Before : ${clientBalance1Before}`);
    console.log(`client Token1 balance after minting:` + await token1.balanceOf(clientAddress));
    const approvedAmount1 = BigNumber.from(70).mul(BigNumber.from(10).pow(BigNumber.from(token1Decimals, 10))); //70 Token1
    const approvedAmount2 = BigNumber.from(1).mul(BigNumber.from(10).pow(BigNumber.from(daiDecimals, 10)));  //1 DAI
    console.log(`approvedAmount1 : ${approvedAmount1}`);
    console.log(`approvedAmount2 : ${approvedAmount2}`);
    await token1.approve(UniswapV2Router02Address, approvedAmount1, {from : clientAddress});
    await dai.approve(UniswapV2Router02Address, approvedAmount2, {from : clientAddress});
    // console.log(`Status : ${approveStatus}` );
    console.log(`Allowance Token1 : ` + await token1.allowance(clientAddress, UniswapV2Router02Address));
    console.log(`Allowance DAI : ` + await dai.allowance(clientAddress, UniswapV2Router02Address));
    await Router.addLiquidity(
        Token1Address,
        DAIAdrress,
        BigNumber.from("50000000000000000000"), //50 Token1
        BigNumber.from("1000000000000000"), // 0.001 DAI
        BigNumber.from("30000000000000000000"), //30 Token1
        BigNumber.from("100000000000000"), // 0.0001 DAI
        clientAddress,
        Math.floor((Date.now() / 1000) + 20*60),
        {from : clientAddress}
    );
    let clientBalance0After = (await token1.balanceOf(clientAddress)).toString();
    let clientBalance1After = (await dai.balanceOf(clientAddress)).toString();
    console.log(`2) Balance 0 After : ` + clientBalance0After);
    console.log(`2) Balance 1 After : ` + clientBalance1After);
    let token1BalanceDiff = (BigNumber.from(clientBalance0Before).sub(BigNumber.from(clientBalance0After))).abs();
    let daiBalanceDiff = (BigNumber.from(clientBalance1Before).sub(BigNumber.from(clientBalance1After))).abs();
    console.log(`Token1 balance Diff : ` + token1BalanceDiff);
    console.log(`Dai balance Diff : ` + daiBalanceDiff);
    assert(token1BalanceDiff > 0);
    assert(daiBalanceDiff > 0);
})
    it('should swap token1 to dai', async () => {
        let Router = await IUniswapV2Router.at(UniswapV2Router02Address);
        let clientAddress = "0xd1669ac6044269b59fa12c5822439f609ca54f41"; 
        let DAIAdrress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
        let Token1Address = await Token1.address;
        const dai = await IERC20.at(DAIAdrress);
        const token1 = await Token1.at(Token1Address);
        const amountIn = BigNumber.from(30).mul(BigNumber.from(10).pow(BigNumber.from(18))); //3 Token1
        const amountOutMin = 0;
        console.log(`amountOutMin : ` + amountOutMin );
        const path = [Token1Address, DAIAdrress];
        const deadline = Math.floor(Date.now() / 1000) + 60*20;
        let to = clientAddress;
        await token1.approve(UniswapV2Router02Address, amountIn, {from : clientAddress});
        let initToken1Balance = (await  token1.balanceOf(clientAddress)).toString();
        let initDaiBalance = (await dai.balanceOf(clientAddress)).toString();
        console.log(`1) Token1 Balance : ${initToken1Balance}`);
        console.log(`1) Dai Balance : ${initDaiBalance}`);
        await Router.swapExactTokensForTokens(
            amountIn, 
            amountOutMin,
            path, 
            to,
            deadline, {from : clientAddress});
        let finalToken1Balance = (await token1.balanceOf(clientAddress)).toString();
        let finalDaiBalance = (await dai.balanceOf(clientAddress)).toString();
        let token1Diff = (BigNumber.from(finalToken1Balance).sub(BigNumber.from(initToken1Balance)).abs());
        let daiDiff = (BigNumber.from(finalDaiBalance).sub(BigNumber.from(initDaiBalance)));
        console.log(`Token1 Diff : ${token1Diff} `);
        console.log(`Dai Diff : ${daiDiff} `);
        assert(token1Diff > 0 );
        assert(daiDiff > 0 );
    })
})