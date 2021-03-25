import { tokens, EVM_REVERT } from './helpers'

const Token = artifacts.require('./Token')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Token', ([deployer, receiver, exchange]) => {
  const name = 'Dyrio Token'
  const symbol = 'DYRIO'
  const decimals = '18'
  const totalSupply = tokens(1000000).toString()
  let token 

  beforeEach(async () => {
    token = await Token.new()
      //Fetch token from blockchain
  })

  describe('deployment', () => {
    it('tracks the name', async () =>{
      const result = await token.name()
      //Read token name here...
      result.should.equal(name)
      //Check the token name is 'Darren!'
    })
    it('tracks the symbol', async () =>{
      const result = await token.symbol()
      result.should.equal(symbol)
    })
    it('tracks the decimal', async () =>{
      const result = await token.decimals()
      result.toString().should.equal(decimals)
    })
    it('tracks the total supply', async () =>{
      const result = await token.totalSupply()
      result.toString().should.equal(totalSupply.toString())
    })
    it('assigns the total supply to the deployer', async () => {
      const result = await token.balanceOf(deployer)
      result.toString().should.equal(totalSupply.toString())
    })
  })

  describe('sending tokens', () => {
    let result
    let amount

    describe('success', async () => {

      beforeEach(async () => {
        amount = tokens(100)
        result = await token.transfer(receiver, amount, { from: deployer})
      })
  
      it('transfers token balance', async () =>{
        let balanceOf
        //Before transfer
        // balanceOf = await token.balanceOf(deployer)
        // console.log("deployer balance before transfer", balanceOf.toString())
        // balanceOf = await token.balanceOf(receiver)
        // console.log("receiver balance before transfer", balanceOf.toString())
  
        //Transfer
        // await token.transfer(receiver, tokens(100), { from: deployer})
        
        //After transfer
        balanceOf = await token.balanceOf(deployer)
        balanceOf.toString().should.equal(tokens(999900).toString())
        // console.log("deployer balance after transfer", balanceOf.toString())
        balanceOf = await token.balanceOf(receiver)
        balanceOf.toString().should.equal(tokens(100).toString())
        // console.log("receiver balance after transfer", balanceOf.toString())
      })
  
      it('emits a transfer event', async () => {
        // console.log(result.logs)
        const log = result.logs[0]
        log.event.should.equal('Transfer')
        const event =log.args
        event.from.toString().should.equal(deployer, 'from is correct')
        event.to.should.equal(receiver, 'to is correct')
        event.value.toString().should.equal(amount.toString(),'value is correct')
      })
    })

    describe('failure', async () => {
      it('rejects insufficient balances', async() => {
        let invalidAmount
        invalidAmount = tokens(100000000) // 100 million - greater than total supply
        await token.transfer(receiver, invalidAmount, {from: deployer}).should.be.rejectedWith(EVM_REVERT);

        //Attempt transfer tokens, when you have none
        invalidAmount = tokens(10) //recepient has no tokens
        await token.transfer(deployer, invalidAmount, { from: receiver }).should.be.rejectedWith(EVM_REVERT);
      })

      it('rejects invalid recepients', async () =>{
        await token.transfer(0x0, amount, {from: deployer }).should.be.rejected;
      })

    })

  })

  describe('approving tokens', () => {
    let result
    let amount

    beforeEach(async () => {
      amount = tokens(100)
      result = await token.approve(exchange, amount, { from: deployer })
    })

    describe('success', () => {
      it('allocates an allowance for delegated token spending on exchange', async () => {
        const allowance = await token.allowance(deployer, exchange)
        allowance.toString().should.equal(amount.toString())
      })
    
      it('emits an approval event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Approval')
        const event =log.args
        event.owner.toString().should.equal(deployer, 'owner is correct')
        event.spender.should.equal(exchange, 'spender is correct')
        event.value.toString().should.equal(amount.toString(),'value is correct')
      })
    })

    describe('failure', () => {
      it('rejects invalid spenders', async () => {
        await token.approve(0x0, amount, { from: deployer }).should.be.rejected
      })
    })
  })

  describe('delegated token transfers', () => {
    let result
    let amount

    beforeEach(async () => {
      amount = tokens(100)
      await token.approve(exchange, amount, {from: deployer })
    })

    describe('success', async () => {
      beforeEach( async () => {
        result = await token.transferFrom(deployer, receiver, amount, { from: exchange })
      })
  
      it('transfers token balance', async () =>{
        let balanceOf
        balanceOf = await token.balanceOf(deployer)
        balanceOf.toString().should.equal(tokens(999900).toString())
        balanceOf = await token.balanceOf(receiver)
        balanceOf.toString().should.equal(tokens(100).toString())
      })

      it('resets the allowance', async () => {
        const allowance = await token.allowance(deployer, exchange)
        allowance.toString().should.equal('0')
      })
  
      it('emits a transfer event', async () => {
        const log = result.logs[0]
        log.event.should.equal('Transfer')
        const event =log.args
        event.from.toString().should.equal(deployer, 'from is correct')
        event.to.should.equal(receiver, 'to is correct')
        event.value.toString().should.equal(amount.toString(),'value is correct')
      })
    })

    describe('failure', async () => {
      it('rejects insufficient balances', async() => {
        //Attempt transfer too many tokens
        const invalidAmount = tokens(100000000) // 100 million - greater than total supply
        await token.transferFrom(deployer, receiver, invalidAmount, { from: exchange}).should.be.rejectedWith(EVM_REVERT);
      })
        
      it('rejects invalid recipients', async() => {
        await token.transferFrom(deployer, 0x0, amount, { from: exchange}).should.be.rejected
      })
    })
  })
})