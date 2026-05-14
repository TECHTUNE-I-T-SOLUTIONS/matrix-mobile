Pay Electricity Bills
Our API covers the following electricity distribution in Nigeria.
Ikeja (ikedc) API endpoint, Eko (ekedc) API endpoint, Ibadan (ibedc) API endpoint, Abuja (aedc) endpoint, Porthacourt (phedc) API endpoint, Kaduna (kedco) API endpoint, Enugu (eedc) API endpoint.

When calling the electricity API, kindly make use of the service short name as the endpoint For example to validate for Ikeja electricity, the short name is ikedc.

Please note, we keep adding more discos, all you have to do is to use the short name even if you don't find it on this list.

View More
Provider Name	Short name
Ikeja Electric	ikedc
Abuja Electric	aedc
Enugu Disco	eedc
Eko Electric	ekedc
Ibadan Electric	ibedc
Porthacourt Electric	phedc
Kaduna Disco	kaduna
Kano Disco	kano
Jos Disco	jed
Aba Disco	aba
Benin Disco	bedc
IKEDC Covers the following cities in Lagos

Abule Egba, Akowonjo, Ikeja, Ikorodu, Oshodi and Shomolu

*EKEDC Covers the following:*

Southern Lagos State (Ojo, Festac, Ijora, Mushin (also covers Orile
areas), Apapa, Lekki (also covers Ibeju areas), Lagos Island (also
covers Ajele areas) & part of Ogun State (Agbara)

*AEDC Covers the following*

Federal Capital Territory, Niger State, Kogi State, and Nassarawa State.

*EEDC Covers*

five(5) states in the South East geo-political Zone, namely: Abia, Anambra, Ebonyi, Enugu and Imo State.

*IBEDC Covers*

largest franchise area in Nigeria, made up of Oyo, Ogun, Osun, Kwara and parts of Niger, Ekiti and Kogi States.

*PHED Covers*

Akwa Ibom, Bayelsa, Cross Rivers, Rivers, and parts of Delta States in Nigeria's industrial south-south zone.

AUTHORIZATION
Bearer Token
This folder is using Bearer Token from collectionWelcome to Payscribe API
POST
Validate Electricity
https://sandbox.payscribe.ng/api/v1/electricity/validate
Validate electricity to get customer details

Params	Type	Required	Description
meter_number	String	required	The user smart card.
meter_type	String	required	prepaid or postpaid
amount	String	required	The amount you are trying to purchase. Min of NGN1,000
service	String	required	The disco short name: ikedc, ekedc, eedc, phedc, aedc, ibedc, kedco,jed, please see above for more details
Sample Response

View More
javascript
{
    "status": true,
    "message": {
        "description": "IKEDC validation Successful.",
        "details": {
            "customer_name": "TESTMETER1",
            "address": "ABULE - EGBA BU ABULE",
            "arrears": 1500,
            "can_vend": true,
            "product_code": "emN3eDVGOFRwa1ZYU2NtbW9FQTBsRko2MmlZK3NmNDkyQ3krR0JwaHNMMEE1VHlNcVZrQ1NRRXEzYlp4R3hpaA=="
        }
    },
    "status_code": 200
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
	"meter_number": "0101340757",
	"meter_type" : "postpaid",
	"amount" : "30000",
	"service" : "ikedc"
}
Example Request
Validate Electricity Success
curl
curl --location 'https://sandbox.payscribe.ng/api/v1/electricity/validate' \
--header 'Authorization: Bearer {{API Token}}' \
--data '{
	"meter_number": "54150143102",
	"meter_type" : "prepaid",
	"amount" : "1000",
	"service" : "ikedc"
}'
200 OK
Example Response
Body
Headers (12)
View More
json
{
  "status": true,
  "description": "Validation successful",
  "message": {
    "details": {
      "customer_name": "FEMI AGBEBUNMI",
      "address": "26, DAISI OKEOWO AGBALA ,IKORODU",
      "outstanding_balance": 0,
      "account_number": "54150143102",
      "minimum_amount": 6.72,
      "debt_amount": null,
      "minimum_debt": null
    }
  },
  "status_code": 200
}
POST
Pay Electricity
https://sandbox.payscribe.ng/api/v1/electricity/vend
Make payment

View More
Params	Type	Required	Description
meter_number	String	required	The user smart card.
meter_type	String	required	prepaid or postpaid
amount	String	required	The amount you are trying to purchase. Min of NGN1,000
service	String	required	The disco short name: ikedc, ekedc, eedc, phedc, aedc, ibedc, kedco,jed, please see above for more details
email	String	optional	Customer email ID
phone	String	optional	Customer phone number. Disco sometimes send SMS to the customer
customer_name	String	required	The customer name and the address you got when you did validation
ref	String	optional	Your reference ID
Please take note, the details response may be more than these keys. It will contain lots of information when you go live. 

Also take note of the status code; in rare cases you may have 201, i.e pending. You are requied to reverify the transaction after few minutes. 

And for Postpaid, you will not get any information in the details key. 

SAMPLE RESPONSE

View More
javascript
{
    "status": true,
    "message": {
        "description": "IKEDC Payment Successful.",
        "details": {
            "service": "IKEDC Electricity Payment",
            "name": "WILLIAMS OMOLAJA A",
            "token": "Success: Successful, CreditToken:20407750462183362839",
            "detail": "6 TOWOLAWI ST IKORODU (Arrears: 0.00)",
            "meter_type": "prepaid",
            "amount": "100",
            "ref": "|PS6ja16687661465807uBx",
            "trans_id": "PS6ja16687661465807uBx"
        }
    },
    "status_code": 200
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
	"meter_number": "45083082250",
	"meter_type" : "prepaid",
	"amount" : 900,
	"service" : "phedc",
    "phone" : "07038067493",
    "customer_name" : "MR BODE ADEDEJI   .",
    "address"  : "11 Ada Road beside Maternity centre Agbenyangi  Ada OSUN",
    "ref": "e9f5333c-9a09-4e75-b5c4-ddb9b4e44c72"
}
Example Request
Pay Electricity Success
curl
curl --location 'https://sandbox.payscribe.ng/api/v1/electricity/vend' \
--header 'Authorization: Bearer {{API Token}}' \
--data '{
	"meter_number": "54150143102",
	"meter_type" : "prepaid",
	"amount" : 100,
	"service" : "ikedc",
    "phone" : "07038067493",
    "customer_name" : "26, Teresa Becker",
    "ref": "cebb7192-0ef3-4748-ae40-52a7183049dd"
}'
200 OK
Example Response
Body
Headers (12)
View More
json
{
  "status": true,
  "description": "IKEDC payment successful.",
  "message": {
    "details": {
      "trans_id": "dd866390-5226-4392-9283-3d4af5321034",
      "created_at": "2024-06-26 15:24:29",
      "token": "47601897867037093794",
      "token_amount": 93.02,
      "unit": 93.02,
      "reset_token": null,
      "configure_token": null,
      "tax_amount": 6.98,
      "tariff": 62.48,
      "meter_number": "54150143102",
      "meter_type": "prepaid",
      "service": "ikedc",
      "customer_name": "26, Angela Okuneva"
    }
  },
  "status_code": 200
}
GET
Requery Transaction
https://sandbox.payscribe.ng/api/v1/requery?trans_id=dd866390-5226-4392-9283-3d4af5321034
Requery Transaction
In rare cases the transaction status may fall into 201 - Pending.

Please you are advised to make a requery of the transaction, and this can ONLY be done once in a minute.
Request

The trans_id can either be the generated transaction id that was generated by Payscribe or the ref you passed to us when creating the transaction.  

Method: GET

URL: https://sandbox.payscribe.ng/api/v1//requery/?trans_id=dd866390-5226-4392-9283-3d4af5321034

AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionWelcome to Payscribe API
HEADERS
Authorization
Bearer {{API Token}}

PARAMS
trans_id
dd866390-5226-4392-9283-3d4af5321034

Example Request
Requery Transaction
View More
curl
curl --location 'https://sandbox.payscribe.ng/api/v1//requery/?trans_id=dd866390-5226-4392-9283-3d4af5321034' \
--header 'Authorization: Bearer {{API Token}}'
200 OK
Example Response
Body
Headers (12)
View More
json
{
  "status": true,
  "description": "Transaction success",
  "message": {
    "details": {
      "token": "47601897867037093794",
      "token_amount": null,
      "unit": 93.02,
      "reset_token": null,
      "configure_token": null,
      "tax_amount": 6.98,
      "tariff": 62.48,
      "meter_number": "54150143102",
      "trans_id": "dd866390-5226-4392-9283-3d4af5321034",
      "ref": "0ad214c1-b89e-43b6-8170-ac24a8",
      "status": "success",
      "created_at": "2024-06-26 15:24:25"
    }
  },
  "status_code": 200
}