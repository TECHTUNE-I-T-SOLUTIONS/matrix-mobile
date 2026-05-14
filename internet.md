
GET
List Internet Services
https://sandbox.payscribe.ng/api/v1/internet/list
GET /internet/list
This endpoint is used to get the active internet subscription and its associated ids.

Response
The response of this request can be documented as a JSON schema:

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
              },
              "active": {
                "type": "boolean"
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
Example Response
View More
json
{
  "status": true,
  "description": "",
  "message": {
    "details": [
      {
        "id": "",
        "title": "",
        "active": true
      }
    ]
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
raw
{
    "type": "smile",
    "account": "1906003293"
}
Example Request
List Internet Subscription Services
curl
curl --location 'https://sandbox.payscribe.ng/api/v1/internet/list' \
--header 'Authorization: Bearer {{API Token}}'
200 OK
Example Response
Body
Headers (20)
View More
json
{
  "status": true,
  "description": "Internet service provider fetched successfully",
  "message": {
    "details": [
      {
        "id": "spectranet",
        "title": "Spectranet",
        "active": true
      },
      {
        "id": "ntel-internet",
        "title": "Ntel Internet",
        "active": true
      },
      {
        "id": "ntel-bundle",
        "title": "Ntel Bundle",
        "active": true
      }
    ]
  },
  "status_code": 200
}
GET


GET
Spectranet Pin Plans
https://sandbox.payscribe.ng/api/v1/internet/spectranet/pins/plans
Get Sepectranet pins plan

AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionWelcome to Payscribe API
HEADERS
Authorization
Bearer {{API Token}}

Example Request
List Internet Services Copy
curl
curl --location -g 'https://sandbox.payscribe.ng/api/v1/}internet/spectranet/pins/plans' \
--header 'Authorization: Bearer {{API Token}}'
200 OK
Example Response
Body
Headers (20)
View More
json
{
  "status": true,
  "description": "Spectranet pins plans fetched",
  "message": {
    "details": [
      {
        "id": "PSPLAN_1274",
        "title": "SpecPlan_10000",
        "amount": 10000
      },
      {
        "id": "PSPLAN_1273",
        "title": "SpecPlan_7000",
        "amount": 7000
      },
      {
        "id": "PSPLAN_1272",
        "title": "SpecPlan_5000",
        "amount": 5000
      },
      {
        "id": "PSPLAN_1271",
        "title": "SpecPlan_1000",
        "amount": 1000
      },
      {
        "id": "PSPLAN_1270",
        "title": "SpecPlan_500",
        "amount": 500
      }
    ]
  },
  "status_code": 200
}
POST


POST
Purchase Spectranet Pins
https://sandbox.payscribe.ng/api/v1/internet/spectranet/pins/vend
This endpoint allows you to validate user's smart card and before purchasing a plan.

Params	Type	Required	description
account	String	required	The smart card number
type	String	required	The internet type ( spectranet or ntel )
View More
json
Sample Response Below
array(3) { ["status"]=> bool(true) ["message"]=> array(2) { ["description"]=> string(23) " Validation Successful." ["details"]=> array(2) { ["customer_name"]=> string(18) "Chika Mercy Nwaode" ["productCode"]=> string(853) "D7770DA3362C75F98353A54E6B0068AD91CB545F|eyJzZXJ2aWNlIjoic21pbGUiLCJjaGFubmVsIjoiQjJCIiwidHlwZSI6ImFjY291bnQiLCJhY2NvdW50IjoiMTUxMDAwMDkxOCIsImF1dGgiOnsiaXNzIjoiaXRleHZhcyIsInN1YiI6IjkxNjE4NjM1Iiwid2FsbGV0IjoiOTE2MTg2MzUiLCJ0ZXJtaW5hbCI6IjkxNjE4NjM1IiwidXNlcm5hbWUiOiJwaGlsbzR1MmNAZ21haWwuY29tIiwiaWRlbnRpZmllciI6Inplcm9uZXMiLCJrZXkiOiJhZTQ3YWI5NGMwZTIwNjUwYjMyODk2YjRhMzcxZDU2NiIsInZlbmRUeXBlIjoiQjJCIiwibW9kZSI6ImxpdmUiLCJlbWFpbCI6InBoaWxvNHUyY0BnbWFpbC5jb20iLCJmdWxsTmFtZSI6IlNva295YSBQaGlsaXAiLCJvcmdhbmlzYXRpb25Db2RlIjoiMDAxMDExMzIiLCJpYXQiOjE2Mzg3MDI5MzYsImV4cCI6MTYzODcxMDEzNn0sImVudmlyb25tZW50IjoibGl2ZSIsInN0YXJ0VGltZSI6MTYzODcwMjkzNy42Mzc5MTgsImVycm9yIjpmYWxzZSwibWVzc2FnZSI6IkN1c3RvbWVyIEZvdW5kIiwiY3VzdG9tZXJOYW1lIjoiQ2hpa2EgTWVyY3kgTndhb2RlICIsInJlc3BvbnNlQ29kZSI6IjAwIiwiZGVzY3JpcHRpb24iOiJDdXN0b21lciBWYWxpZGF0aW9uIFN1Y2Nlc3NmdWwifQ==" } } ["status_code"]=> int(200) }
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
    "plan_id": "PSPLAN_1270",
    "qty" : 1,
    "ref": "1da5f8b6-4e07-4df3-9d07-d922fa6c5dd0"
}
Example Request
Purchase spectranet epins
curl
curl --location 'https://sandbox.payscribe.ng/api/v1/internet/spectranet/pins/vend' \
--header 'Authorization: Bearer {{API Token}}' \
--data '{
    "plan_id": "PSPLAN_1270",
    "qty" : 1,
    "ref": "f9bc852f-fa4f-4c03-a315-a0b29e4f9823"
}
'
200 OK
Example Response
Body
Headers (21)
View More
json
{
  "status": true,
  "description": "Order received. Transaction successful.",
  "message": {
    "details": {
      "processed": {
        "pin": "89546619",
        "serial": "2024103110001386",
        "expiry_at": "2028-10-31"
      },
      "transaction_status": "success",
      "product": "spectranet_epins",
      "ref": "54df6866-1713-4d1e-8191-49d07c414295",
      "amount": 500,
      "total_charge": 490,
      "discount": 10,
      "trans_id": "a3904edb-95ba-4bdf-af2b-2dd54b7dfdc9",
      "created_at": "2024-12-21 08:55:42"
    }
  },
  "status_code": 200
}
