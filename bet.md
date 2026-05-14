Fund Bet Wallet
Fund betting wallet.

AUTHORIZATION
Bearer Token
This folder is using Bearer Token from collectionWelcome to Payscribe API
GET
Betting Service Provider List
https://sandbox.payscribe.ng/api/v1/betting/list
The HTTP GET request retrieves the list of available Gaming and Sport service providers from the specified base URL.

Response
The response for this request is a JSON object with the following schema:

View More
json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "boolean"
    },
    "description": {
      "type": "string"
    },
    "message": {
      "type": "object",
      "properties": {
        "details": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "title": {
                "type": "string"
              }
            }
          }
        }
      }
    },
    "status_code": {
      "type": "integer"
    }
  }
}
AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionWelcome to Payscribe API
HEADERS
Authorization
Bearer {{API Token}}

Example Request
Betting Service Provider List
curl
curl --location 'https://sandbox.payscribe.ng/api/v1/betting/list' \
--header 'Authorization: Bearer {{API Token}}'
200 OK
Example Response
Body
Headers (12)
View More
json
{
  "status": true,
  "description": "Betting service provider fetched successully",
  "message": {
    "details": [
      {
        "id": "supabet",
        "title": "SupaBet"
      },
      {
        "id": "paripesa",
        "title": "Paripesa"
      },
      {
        "id": "onexbet",
        "title": "One X Bet"
      },
      {
        "id": "nairabet",
        "title": "Naira Bet"
      },
      {
        "id": "naijabet",
        "title": "Naija Bet"
      },
      {
        "id": "mylottohub",
        "title": "MyLotto Hub"
      },
      {
        "id": "merrybet",
        "title": "MerryBet"
      },
      {
        "id": "betway",
        "title": "BetWay"
      },
      {
        "id": "betking",
        "title": "BetKing"
      },
      {
        "id": "bet9ja",
        "title": "Bet9ja"
      },
      {
        "id": "bangbet",
        "title": "BangBet"
      }
    ]
  },
  "status_code": 200
}
GET


GET
Validate Bet Account / Lookup
https://sandbox.payscribe.ng/api/v1/betting/lookup?bet_id=bet9ja&customer_id=422984
Request Description
Lookup user details before vending.

Params	Type	Required	Description
bet_id	String	required	the betting ID
customer_id	String	required	The customer ID
Response
The response for this request can be represented as a JSON schema:

View More
json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "boolean"
    },
    "description": {
      "type": "string"
    },
    "message": {
      "type": "object",
      "properties": {
        "details": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "account": {
              "type": "string"
            }
          }
        }
      }
    },
    "status_code": {
      "type": "integer"
    }
  }
}
AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionWelcome to Payscribe API
HEADERS
Authorization
Bearer {{API Token}}

PARAMS
bet_id
bet9ja

customer_id
422984

Example Request
Validate Bet Account / Lookup
curl
curl --location 'https://sandbox.payscribe.ng/api/v1/betting/lookup/?bet_id=bet9ja&customer_id=422984' \
--header 'Authorization: Bearer {{API Token}}'
200 OK
Example Response
Body
Headers (11)
json
{
  "status": true,
  "description": "Validation successful",
  "message": {
    "details": {
      "name": "Olisaemeka Ezeuchenne",
      "account": "422984"
    }
  },
  "status_code": 200
}
POST


POST
Fund Wallet
https://sandbox.payscribe.ng/api/v1/betting/vend
HTTP POST /betting/vend
Add funds to user wallet based on the validated account ID.

Request Body
bet_id (String, required): The bet ID obtained from validation.

customer_id (String, required): The valid User ID.

customer_name (String, required): The customer name obtained during validation.

amount (Int, required): Minimum of NGN100, and maximum of NGN50,000./ transaction

ref (String, required): Your transaction ID.

Response
View More
json
{
    "status": true,
    "description": "",
    "message": {
        "details": {
            "trans_id": "",
            "ref": "",
            "account": "",
            "bet_id": "",
            "created_at": ""
        }
    },
    "status_code": 0
}
AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionWelcome to Payscribe API
HEADERS
Authorization
Bearer {{API Token}}

Body
raw (json)
json
{
	"bet_id" : "bet9ja",
	"customer_id": "422984",
	"customer_name": "obainolala",
	"amount": 100,
    "ref": "071ebf01-3a61-4da7-9ae4-79ade49d1287"
}
Example Request
Fund Wallet
curl
curl --location 'https://sandbox.payscribe.ng/api/v1/betting/vend' \
--header 'Authorization: Bearer {{API Token}}' \
--data '{
	"bet_id" : "bet9ja",
	"customer_id": "422984",
	"customer_name": "obainolala",
	"amount": 100,
    "ref": "92789609-ac55-4724-b212-d7b597b01a1b"
}'
200 OK
Example Response
Body
Headers (11)
View More
json
{
  "status": true,
  "description": "BET9JA payment successful.",
  "message": {
    "details": {
      "trans_id": "032bbf63-fbae-435e-bdd3-4b5eed08f42c",
      "ref": "6113942f-6f63-4b37-92d4-4c4d3a4f5ff9",
      "account": "422984",
      "bet_id": "bet9ja",
      "created_at": "2024-06-26 20:21:45"
    }
  },
  "status_code": 200
}
