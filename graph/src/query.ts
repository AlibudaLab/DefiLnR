import axios from 'axios'
import { gql, GraphQLClient } from 'graphql-request'
//require('dotenv').config()

const CRITERIA_NUM_INTERACTION_GEARBOX = 2;

// Define the GraphQL query
function generateSchema(address: string): string {
  return gql`
        query MyQuery {
        openCreditAccounts(where: { onBehalfOf: "${address}" }) {
            id,
            transactionHash,
            onBehalfOf
        }
        }
    `
}

async function getRecentReceipt(hash: string) {
  return await axios
    .post(
      process.env.NEXT_PUBLIC_ALCHEMY_URI_GOERLI as string,
      {
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [hash],
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
      }
    )
    .then((response) => {
      return response.data.result
    })
    .catch((error) => {
      console.error('There was an error!', error)
    })
}

function findLogIdx(logs: any[]) {
  const targetTopic =
    '0xfa2baf5d3eb95569f312f22477b246f9d4c50276f1cb3ded8e1aeadcbc07a763'

  return logs.findIndex((log) => log.topics[0] === targetTopic)
}

// TypeScript function to execute the query
async function fetchOpenCreditAccounts(address: string): Promise<any> {
  const client = new GraphQLClient(
    'https://api.studio.thegraph.com/query/58827/gearbox-creditfacade/version/latest'
  )

  try {
    const data = await client.request(generateSchema(address))
    return data
  } catch (error) {
    console.error('Error fetching open credit accounts:', error)
    throw error
  }
}

async function fetchGearBoxTx(address: string): Promise<any> {
  try {
    // Call the query function from query.ts
    const result = await fetchOpenCreditAccounts(address)

    // Process the result
    console.log(
      address,
      ' have opened CA ',
      result.openCreditAccounts.length,
      ' times'
    )
    
    let logArray = []
    let txHashArray = []
    let blockNumberArray = []
    let logIdxArray = []
    for (let i = 0; i < CRITERIA_NUM_INTERACTION_GEARBOX; i++) {
      const txReceipt = await getRecentReceipt(
        result.openCreditAccounts[i].transactionHash
      )
      
      logArray.push(txReceipt.logs)
      txHashArray.push(result.openCreditAccounts[i].transactionHash)
      blockNumberArray.push(txReceipt.blockNumber)
      logIdxArray.push(findLogIdx(txReceipt.logs))
      /* console.log(result.openCreditAccounts[i].transactionHash)
      console.log(Number(txReceipt.blockNumber))
      console.log(Number(txReceipt.transactionIndex))
      console.log(Number(findLogIdx(txReceipt.logs))) */
    }
    return {
      log: logArray,
      txHash: txHashArray,
      blockNumber: blockNumberArray,
      logIdx: logIdxArray,
    }

    /* 
    return 
    const log = uniswapTx?.log;
    const txHash = log?.transactionHash;
    const blockNumber = log?.blockNumber;
    const logIdx = uniswapTx?.logIdx;
    */

  } catch (error) {
    console.error('An error occurred:', error)
  }
}

// Export the function if needed
export { fetchGearBoxTx }
