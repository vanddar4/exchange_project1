const Token = artifacts.require('./Token')

require('chai')
  .use(require('chai-as-promised'))
  .should()


contract('Token', (accounts) => {
  const name = 'Dyrio Token'
  const symbol = 'DYRIO'
  const decimals = '18'
  const totalSupply = '1000000000000000000000000'
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
      result.toString().should.equal(totalSupply)
    })

  })
})