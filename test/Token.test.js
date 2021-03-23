const { default: Web3 } = require('web3')

const Token = artifacts.require('./Token')

require('chai')
  .use(require('chai-as-promised'))
  .should()

const tokens = (n) => {
    return new web3.utils.BN(
    web3.utils.toWei(n.toString(), 'ether')
  )
}

contract('Token', ([deployer, receiver]) => {
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
    it('transfers token blaance', async () =>{
      let balanceOf
      //Before transfer
      balanceOf = await token.balanceOf(deployer)
      console.log("deployer balance before transfer", balanceOf.toString)
      balanceOf = await token.balanceOf(receiver)
      console.log("receiver balance before transfer", balanceOf.toString)

      //Transfer
      await token.transfer(receiver,tokens(100), { from: deployer})

      //After transfer
      balanceOf = await token.balanceOf(deployer)
      console.log("deployer balance after transfer", balanceOf.toString)
      balanceOf = await token.balanceOf(receiver)
      console.log("receiver balance after transfer", balanceOf.toString)
    })
  })
})