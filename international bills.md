
GET
Get International Bills countries
https://sandbox.payscribe.ng/api/v1/international-bills/countries
The first step in vending any international bills is to get the country.
Please note, it is advisable that you save this response on the first all, to avoid API call limit on your account.

AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionWelcome to Payscribe API
HEADERS
Authorization
Bearer {{API Token}}

Content-Type
application/json

Example Request
Get International Bills countries
curl
curl --location 'https://sandbox.payscribe.ng/api/v1/international-bills/countries' \
--header 'Authorization: Bearer {{API Token}}' \
--header 'Content-Type: application/json'
200 OK
Example Response
Body
Headers (12)
View More
json
{
  "status": true,
  "description": "International bills countries fetched.",
  "message": {
    "details": [
      {
        "iso": "ZW",
        "title": "Zimbabwe",
        "prefix": "263"
      },
      {
        "iso": "ZM",
        "title": "Zambia",
        "prefix": "260"
      },
      {
        "iso": "ZA",
        "title": "South Africa",
        "prefix": "27"
      },
      {
        "iso": "YE",
        "title": "Yemen",
        "prefix": "967"
      },
      {
        "iso": "XK",
        "title": "Kosovo",
        "prefix": "383"
      },
      {
        "iso": "XG",
        "title": "Global",
        "prefix": ""
      },
      {
        "iso": "WS",
        "title": "Samoa",
        "prefix": "685"
      },
      {
        "iso": "VU",
        "title": "Vanuatu",
        "prefix": "678"
      },
      {
        "iso": "VN",
        "title": "Vietnam",
        "prefix": "84"
      },
      {
        "iso": "VG",
        "title": "British Virgin Islands",
        "prefix": "1284"
      },
      {
        "iso": "VE",
        "title": "Venezuela",
        "prefix": "58"
      },
      {
        "iso": "VC",
        "title": "St. Vincent",
        "prefix": "1784"
      },
      {
        "iso": "UZ",
        "title": "Uzbekistan",
        "prefix": "998"
      },
      {
        "iso": "UY",
        "title": "Uruguay",
        "prefix": "598"
      },
      {
        "iso": "US",
        "title": "United States",
        "prefix": "1"
      },
      {
        "iso": "UG",
        "title": "Uganda",
        "prefix": "256"
      },
      {
        "iso": "UA",
        "title": "Ukraine",
        "prefix": "380"
      },
      {
        "iso": "TZ",
        "title": "Tanzania",
        "prefix": "255"
      },
      {
        "iso": "TT",
        "title": "Trinidad and Tobago",
        "prefix": "1868"
      },
      {
        "iso": "TR",
        "title": "Turkey",
        "prefix": "90"
      },
      {
        "iso": "TO",
        "title": "Tonga",
        "prefix": "676"
      },
      {
        "iso": "TN",
        "title": "Tunisia",
        "prefix": "216"
      },
      {
        "iso": "TJ",
        "title": "Tajikistan",
        "prefix": "992"
      },
      {
        "iso": "TH",
        "title": "Thailand",
        "prefix": "66"
      },
      {
        "iso": "TG",
        "title": "Togo",
        "prefix": "228"
      },
      {
        "iso": "TD",
        "title": "Chad",
        "prefix": "235"
      },
      {
        "iso": "TC",
        "title": "Turks and Caicos",
        "prefix": "1649"
      },
      {
        "iso": "SZ",
        "title": "Eswatini",
        "prefix": "268"
      },
      {
        "iso": "SV",
        "title": "El Salvador",
        "prefix": "503"
      },
      {
        "iso": "SR",
        "title": "Suriname",
        "prefix": "597"
      },
      {
        "iso": "SN",
        "title": "Senegal",
        "prefix": "221"
      },
      {
        "iso": "SL",
        "title": "Sierra Leone",
        "prefix": "232"
      },
      {
        "iso": "SG",
        "title": "Singapore",
        "prefix": "65"
      },
      {
        "iso": "SE",
        "title": "Sweden",
        "prefix": "46"
      },
      {
        "iso": "SA",
        "title": "Saudi Arabia",
        "prefix": "966"
      },
      {
        "iso": "RW",
        "title": "Rwanda",
        "prefix": "250"
      },
      {
        "iso": "RO",
        "title": "Romania",
        "prefix": "40"
      },
      {
        "iso": "QA",
        "title": "Qatar",
        "prefix": "974"
      },
      {
        "iso": "PY",
        "title": "Paraguay",
        "prefix": "595"
      },
      {
        "iso": "PT",
        "title": "Portugal",
        "prefix": "351"
      },
      {
        "iso": "PR",
        "title": "Puerto Rico",
        "prefix": "1"
      },
      {
        "iso": "PL",
        "title": "Poland",
        "prefix": "48"
      },
      {
        "iso": "PK",
        "title": "Pakistan",
        "prefix": "92"
      },
      {
        "iso": "PH",
        "title": "Philippines",
        "prefix": "63"
      },
      {
        "iso": "PG",
        "title": "Papua New Guinea",
        "prefix": "675"
      },
      {
        "iso": "PE",
        "title": "Peru",
        "prefix": "51"
      },
      {
        "iso": "PA",
        "title": "Panama",
        "prefix": "507"
      },
      {
        "iso": "OM",
        "title": "Oman",
        "prefix": "968"
      },
      {
        "iso": "NP",
        "title": "Nepal",
        "prefix": "977"
      },
      {
        "iso": "NL",
        "title": "Netherlands",
        "prefix": "31"
      },
      {
        "iso": "NI",
        "title": "Nicaragua",
        "prefix": "505"
      },
      {
        "iso": "NG",
        "title": "Nigeria",
        "prefix": "234"
      },
      {
        "iso": "NE",
        "title": "Niger",
        "prefix": "227"
      },
      {
        "iso": "NA",
        "title": "Namibia",
        "prefix": "264"
      },
      {
        "iso": "MZ",
        "title": "Mozambique",
        "prefix": "258"
      },
      {
        "iso": "MY",
        "title": "Malaysia",
        "prefix": "60"
      },
      {
        "iso": "MX",
        "title": "Mexico",
        "prefix": "52"
      },
      {
        "iso": "MW",
        "title": "Malawi",
        "prefix": "265"
      },
      {
        "iso": "MS",
        "title": "Montserrat",
        "prefix": "1664"
      },
      {
        "iso": "MR",
        "title": "Mauritania",
        "prefix": "222"
      },
      {
        "iso": "MQ",
        "title": "Martinique",
        "prefix": "596"
      },
      {
        "iso": "MM",
        "title": "Myanmar",
        "prefix": "95"
      },
      {
        "iso": "ML",
        "title": "Mali",
        "prefix": "223"
      },
      {
        "iso": "MG",
        "title": "Madagascar",
        "prefix": "261"
      },
      {
        "iso": "MF",
        "title": "St. Martin",
        "prefix": "590"
      },
      {
        "iso": "MD",
        "title": "Moldova",
        "prefix": "373"
      },
      {
        "iso": "MA",
        "title": "Morocco",
        "prefix": "212"
      },
      {
        "iso": "LU",
        "title": "Luxembourg",
        "prefix": "352"
      },
      {
        "iso": "LT",
        "title": "Lithuania",
        "prefix": "370"
      },
      {
        "iso": "LR",
        "title": "Liberia",
        "prefix": "231"
      },
      {
        "iso": "LK",
        "title": "Sri Lanka",
        "prefix": "94"
      },
      {
        "iso": "LC",
        "title": "St. Lucia",
        "prefix": "1758"
      },
      {
        "iso": "LB",
        "title": "Lebanon",
        "prefix": "961"
      },
      {
        "iso": "LA",
        "title": "Laos",
        "prefix": "856"
      },
      {
        "iso": "KZ",
        "title": "Kazakhstan",
        "prefix": "7"
      },
      {
        "iso": "KY",
        "title": "Cayman Islands",
        "prefix": "1345"
      },
      {
        "iso": "KW",
        "title": "Kuwait",
        "prefix": "965"
      },
      {
        "iso": "KR",
        "title": "South Korea",
        "prefix": "82"
      },
      {
        "iso": "KN",
        "title": "St. Kitts",
        "prefix": "1869"
      },
      {
        "iso": "KM",
        "title": "Comoros",
        "prefix": "269"
      },
      {
        "iso": "KH",
        "title": "Cambodia",
        "prefix": "855"
      },
      {
        "iso": "KG",
        "title": "Kyrgyzstan",
        "prefix": "996"
      },
      {
        "iso": "KE",
        "title": "Kenya",
        "prefix": "254"
      },
      {
        "iso": "JO",
        "title": "Jordan",
        "prefix": "962"
      },
      {
        "iso": "JM",
        "title": "Jamaica",
        "prefix": "1876"
      },
      {
        "iso": "IT",
        "title": "Italy",
        "prefix": "39"
      },
      {
        "iso": "IQ",
        "title": "Iraq",
        "prefix": "964"
      },
      {
        "iso": "IN",
        "title": "India",
        "prefix": "91"
      },
      {
        "iso": "IE",
        "title": "Ireland",
        "prefix": "353"
      },
      {
        "iso": "ID",
        "title": "Indonesia",
        "prefix": "62"
      },
      {
        "iso": "HT",
        "title": "Haiti",
        "prefix": "509"
      },
      {
        "iso": "HN",
        "title": "Honduras",
        "prefix": "504"
      },
      {
        "iso": "GY",
        "title": "Guyana",
        "prefix": "592"
      },
      {
        "iso": "GW",
        "title": "Guinea Bissau",
        "prefix": "245"
      },
      {
        "iso": "GT",
        "title": "Guatemala",
        "prefix": "502"
      },
      {
        "iso": "GR",
        "title": "Greece",
        "prefix": "30"
      },
      {
        "iso": "GP",
        "title": "Guadeloupe",
        "prefix": "590"
      },
      {
        "iso": "GN",
        "title": "Guinea",
        "prefix": "224"
      },
      {
        "iso": "GM",
        "title": "Gambia",
        "prefix": "220"
      },
      {
        "iso": "GH",
        "title": "Ghana",
        "prefix": "233"
      },
      {
        "iso": "GF",
        "title": "French Guiana",
        "prefix": "594"
      },
      {
        "iso": "GE",
        "title": "Georgia",
        "prefix": "995"
      },
      {
        "iso": "GD",
        "title": "Grenada",
        "prefix": "1473"
      },
      {
        "iso": "FR",
        "title": "France",
        "prefix": "33"
      },
      {
        "iso": "FJ",
        "title": "Fiji",
        "prefix": "679"
      },
      {
        "iso": "ET",
        "title": "Ethiopia",
        "prefix": "251"
      },
      {
        "iso": "ES",
        "title": "Spain",
        "prefix": "34"
      },
      {
        "iso": "EG",
        "title": "Egypt",
        "prefix": "20"
      },
      {
        "iso": "EC",
        "title": "Ecuador",
        "prefix": "593"
      },
      {
        "iso": "DZ",
        "title": "Algeria",
        "prefix": "213"
      },
      {
        "iso": "DO",
        "title": "Dominican Republic",
        "prefix": "18"
      },
      {
        "iso": "DM",
        "title": "Dominica",
        "prefix": "1767"
      },
      {
        "iso": "DE",
        "title": "Germany",
        "prefix": "49"
      },
      {
        "iso": "CZ",
        "title": "Czech Republic",
        "prefix": "420"
      },
      {
        "iso": "CY",
        "title": "Cyprus",
        "prefix": "357"
      },
      {
        "iso": "CW",
        "title": "Curacao",
        "prefix": "599"
      },
      {
        "iso": "CV",
        "title": "Cape Verde",
        "prefix": "238"
      },
      {
        "iso": "CU",
        "title": "Cuba",
        "prefix": "53"
      },
      {
        "iso": "CR",
        "title": "Costa Rica",
        "prefix": "506"
      },
      {
        "iso": "CO",
        "title": "Colombia",
        "prefix": "57"
      },
      {
        "iso": "CN",
        "title": "China",
        "prefix": "86"
      },
      {
        "iso": "CM",
        "title": "Cameroon",
        "prefix": "237"
      },
      {
        "iso": "CL",
        "title": "Chile",
        "prefix": "56"
      },
      {
        "iso": "CI",
        "title": "Ivory Coast",
        "prefix": "225"
      },
      {
        "iso": "CH",
        "title": "Switzerland",
        "prefix": "41"
      },
      {
        "iso": "CG",
        "title": "Republic of the Congo",
        "prefix": "242"
      },
      {
        "iso": "CF",
        "title": "Central African Republic",
        "prefix": "236"
      },
      {
        "iso": "CD",
        "title": "Democratic Republic of  the Congo",
        "prefix": "243"
      },
      {
        "iso": "CA",
        "title": "Canada",
        "prefix": "1"
      },
      {
        "iso": "BZ",
        "title": "Belize",
        "prefix": "501"
      },
      {
        "iso": "BW",
        "title": "Botswana",
        "prefix": "267"
      },
      {
        "iso": "BT",
        "title": "Bhutan",
        "prefix": "975"
      },
      {
        "iso": "BS",
        "title": "The Bahamas",
        "prefix": "1242"
      },
      {
        "iso": "BR",
        "title": "Brazil",
        "prefix": "55"
      },
      {
        "iso": "BQ",
        "title": "Bonaire",
        "prefix": "599"
      },
      {
        "iso": "BO",
        "title": "Bolivia",
        "prefix": "591"
      },
      {
        "iso": "BM",
        "title": "Bermuda",
        "prefix": "1441"
      },
      {
        "iso": "BJ",
        "title": "Benin",
        "prefix": "229"
      },
      {
        "iso": "BI",
        "title": "Burundi",
        "prefix": "257"
      },
      {
        "iso": "BH",
        "title": "Bahrain",
        "prefix": "973"
      },
      {
        "iso": "BF",
        "title": "Burkina Faso",
        "prefix": "226"
      },
      {
        "iso": "BE",
        "title": "Belgium",
        "prefix": "32"
      },
      {
        "iso": "BD",
        "title": "Bangladesh",
        "prefix": "880"
      },
      {
        "iso": "BB",
        "title": "Barbados",
        "prefix": "1246"
      },
      {
        "iso": "AZ",
        "title": "Azerbaijan",
        "prefix": "994"
      },
      {
        "iso": "AW",
        "title": "Aruba",
        "prefix": "297"
      },
      {
        "iso": "AU",
        "title": "Australia",
        "prefix": "61"
      },
      {
        "iso": "AR",
        "title": "Argentina",
        "prefix": "54"
      },
      {
        "iso": "AO",
        "title": "Angola",
        "prefix": "244"
      },
      {
        "iso": "AM",
        "title": "Armenia",
        "prefix": "374"
      },
      {
        "iso": "AL",
        "title": "Albania",
        "prefix": "355"
      },
      {
        "iso": "AI",
        "title": "Anguilla",
        "prefix": "1264"
      },
      {
        "iso": "AG",
        "title": "Antigua",
        "prefix": "1268"
      },
      {
        "iso": "AF",
        "title": "Afghanistan",
        "prefix": "93"
      },
      {
        "iso": "AE",
        "title": "United Arab Emirates",
        "prefix": "971"
      }
    ]
  },
  "status_code": 200
}
GET
Get International Bills Providers
https://sandbox.payscribe.ng/api/v1/international-bills/providers?iso=GH
International bills providers

Get the providers of the country

Params	Type	Required	Description
iso	String	required	The country iso as seen when fetching th counties.
AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionWelcome to Payscribe API
HEADERS
Authorization
Bearer {{API Token}}

Content-Type
application/json

PARAMS
iso
GH

Example Request
Get International Bills Providers
curl
curl --location 'https://sandbox.payscribe.ng/api/v1/international-bills/providers?iso=AF' \
--header 'Authorization: Bearer {{API Token}}' \
--header 'Content-Type: application/json'
200 OK
Example Response
Body
Headers (11)
View More
json
{
  "status": true,
  "description": "Fetched successfully.",
  "message": {
    "details": [
      {
        "code": "RHAF",
        "name": "Roshan Afghanistan",
        "phone_regex": "^930?([0-9]{9})$",
        "logo_url": "https://app.payscribe.ng/assets/img/logos/RHAF.png"
      },
      {
        "code": "MTAF",
        "name": "MTN Afghanistan",
        "phone_regex": "^930?([0-9]{9})$",
        "logo_url": "https://app.payscribe.ng/assets/img/logos/MTAF.png"
      },
      {
        "code": "ETAF",
        "name": "Etisalat Afghanistan",
        "phone_regex": "^930?([0-9]{9})$",
        "logo_url": "https://app.payscribe.ng/assets/img/logos/ETAF.png"
      },
      {
        "code": "AWAF",
        "name": "AWCC Afghanistan",
        "phone_regex": "^930?([0-9]{9})$",
        "logo_url": "https://app.payscribe.ng/assets/img/logos/AWAF.png"
      },
      {
        "code": "AQAF",
        "name": "Salaam Afghanistan",
        "phone_regex": "^930?([0-9]{9})$",
        "logo_url": "https://app.payscribe.ng/assets/img/logos/AQAF.png"
      },
      {
        "code": "37AF",
        "name": "Afghan Telecom",
        "phone_regex": "^930?(20[0-9]{7})$",
        "logo_url": "https://app.payscribe.ng/assets/img/logos/37AF.png"
      }
    ]
  },
  "status_code": 200
}
GET


GET
Get International Bills Products
https://sandbox.payscribe.ng/api/v1/international-bills/products?iso=GH&code=MTGH
International bills products

Get the products of the respective country and provider

Params	Type	Required	Description
iso	String	required	The country iso as seen when fetching th counties.
code	String
required	The code as seen from the providers
Explanation on the response you will get

View More
Key	Description
sku	The product SKU, it will be required when you want to vend
uat	Use this uat as the account for testing.
country_iso	Returned back as passed when fetching the product
provider_code	The reference provider code
display_text	This can be interpreted as a label for the product
min_send	This is the minimum amount in USD that you can send
max_send	This is the maximum amount in USD that you can send
min_receive	The minimum amount that the recipient will receive, this is in the recipient currency value
max_receive	The maximum amount that the recipient will receive. This is equivalent to the recipient currency value
receive_currency	The recipient currency value
send_currency	Basically we are sending the value in USD
lookup_required	0 = false, 1 = true. Does the product require lookup. Applicable to electricity topup
vend_type	range
current_rate	The current USD to your account currency value (NGN)
AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionWelcome to Payscribe API
HEADERS
Authorization
Bearer {{API Token}}

Content-Type
application/json

PARAMS
iso
GH

code
MTGH

Example Request
Get International Bills Products
curl
curl --location 'https://sandbox.payscribe.ng/api/v1/international-bills/products?iso=GH&code=MTGH' \
--header 'Authorization: Bearer {{API Token}}' \
--header 'Content-Type: application/json'
200 OK
Example Response
Body
Headers (21)
View More
json
{
  "status": true,
  "description": "Products variation fetched successfully.",
  "message": {
    "details": [
      {
        "sku": "GH_MT_TopUp",
        "uat": "233000000000",
        "country_iso": "GH",
        "provider_code": "MTGH",
        "display_text": "GHS 1.20-573.04",
        "min_send": "0.11",
        "max_send": "52.73",
        "min_receive": "1.2",
        "max_receive": "573.0",
        "receive_currency": "GHS",
        "send_currency": "USD",
        "lookup_required": "0",
        "vend_type": "range",
        "current_rate": 1837.5
      }
    ]
  },
  "status_code": 200
}
GET
Get Estimate Rate
https://sandbox.payscribe.ng/api/v1/international-bills/rate?iso=GH&sku=GH_MT_TopUp&amount=1.2
International Estimate Rate

Use this endpoint to calculate how much we will charge from your wallet.

Params	Type	Required	Description
iso	String	required	The country iso as seen when fetching th counties.
sku	String	required	The sku as seen from the providers
amount	String	required	The amount recipient is expected to receive
Explanation on the response you will get

Key	Description
receive	This is the amount that the recipient is receiving
usd_rate	Current USD rate in NGN
amount	This is the USD equivalent that would be deducted from your USD wallet
AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionWelcome to Payscribe API
HEADERS
Authorization
Bearer pk_live_key_ungkvvMePYxWoVqxGsqGTaSzvIvHL10

Content-Type
application/jso{{API Token}}

PARAMS
iso
GH

sku
GH_MT_TopUp

amount
1.2

Example Request
Get Estimate Rate
View More
curl
curl --location 'https://sandbox.payscribe.ng/api/v1/international-bills/rate?iso=GH&sku=GH_MT_TopUp&amount=1.2' \
--header 'Authorization: Bearer {{API Token}}' \
--header 'Content-Type: application/json'
200 OK
Example Response
Body
Headers (17)
View More
json
{
    "status": true,
    "message": {
        "description": "Rate lookup successfully.",
        "details": {
            "usd_rate": 1778.589999999999918145476840436458587646484375, // 1 USD in NGN, You can use this to mockup how much you would charge your customer in NGN
            "send_value": 0.11000000000000000055511151231257827021181583404541015625,
            "send_currency": "USD",
            "receive_value": 1.1999999999999999555910790149937383830547332763671875,
            "receive_currency": "GHS"
        }
    },
    "status_code": 200
}
POST


POST
Vend International Bills
https://sandbox.payscribe.ng/api/v1/international-bills/vend
International Estimate Rate

Use this endpoint to process International bills

Params	Type	Required	Description
iso	String	required	The country iso as seen when fetching th counties.
provider_code	String	required	The code as seen from the get products endpoint
sku	String	required	As seen from the get products endpoint
amount	String	required	The amount recipient is expected to receive
account	String	required	The recipient account (phone number).
ref	String	optional	Your systm transaction ID
AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionWelcome to Payscribe API
HEADERS
Authorization
Bearer {{API Token}}

Content-Type
application/json

Body
raw
{
    "iso": "GH",
    "provider_code": "MTGH",
    "sku": "GH_MT_TopUp",
    "amount": "1.5",
    "account": "233547011800",
    "debit_currency": "ngn", // This is optional. Default is USD
    "ref": "f167b6ed-8e70-4abd-b994-aab41a3eb0c6"
}
Example Request
Vend International Bills
View More
curl
curl --location 'https://sandbox.payscribe.ng/api/v1/international-bills/vend' \
--header 'Authorization: Bearer {{API Token}}' \
--header 'Content-Type: application/json' \
--data '{
    "iso": "GH",
    "provider_code": "MTGH",
    "sku": "GH_MT_TopUp",
    "amount": "1.5",
    "account": "233547011800",
    "debit_currency": "ngn", // This is optional. Default is USD
    "ref": "7db5565d-6d25-4695-8eac-692bc8668b2c"
}'
200 OK
Example Response
Body
Headers (20)
View More
json
{
  "status": true,
  "description": "Order received. Transaction successful. Usually takes less than 5 min",
  "message": {
    "details": {
      "processed": 233547011800,
      "transaction_status": "success",
      "amount": 231.2167,
      "total_charge": 231.22,
      "discount": 0,
      "trans_id": "6369e2c2-1117-4b26-bc77-9abab758da0c",
      "datetime": "2024-12-18 14:40:59",
      "account": 233547011800,
      "country": "GH",
      "currency": "GHS",
      "sent": "0.13 USD",
      "receive": "1.41 GHS"
    }
  },
  "status_code": 200
}
Bills Payment Webhook
Webhook events fired when a bills payment transaction changes state.

AUTHORIZATION
Bearer Token
This folder is using Bearer Token from collectionWelcome to Payscribe API



POST
Webhook Reference - bills.status
https://your-server.com/webhook
Payscribe sends a POST request to your configured webhook URL when this event fires.

Event: bills.status

Security - Every webhook request includes an X-Payscribe-Signature header. Verify it before processing:

Plain Text
HMAC-SHA256(secret_key, raw_request_body)
Payload shape

View More
json
{
  "processed": [
    {
      "number": "07038067493",
      "amount": 2058,
      "id": "8c8c9ab3-9e4f-4ccc-a827-25ecadc47431",
      "response": ""
    }
  ],
  "transaction_status": "success",
  "ref": "eb282890-a5d4-4895-8ce7-d8d3f19a4ac4",
  "category": "airtime",
  "product": "mtn",
  "amount": 2058,
  "total_charge": 2006.55,
  "discount": 51.45,
  "trans_id": "8c8c9ab3-9e4f-4ccc-a827-25ecadc47431",
  "created_at": "2026-04-11 02:30:35",
  "event_id": "8c8c9ab3-9e4f-4ccc-a827-25ecadc47431",
  "event_type": "bills.status",
  "updated_at": "2026-04-11 02:30:40",
  "remark": "You have topped up N2,058.00 to 07038067493."
}
Responding — Return HTTP 200 to acknowledge. Any non-2xx response will trigger retries (up to 5 attempts, exponential back-off).

AUTHORIZATION
Bearer Token
This request is using Bearer Token from collectionWelcome to Payscribe API
Example Request
Webhook Reference - bills.status
curl
curl --location --request POST 'https://your-server.com/webhook'
Example Response
Body
Headers (0)
No response body
This request doesn't return any response body
My Account API.
We are making it easy for you to have access to your account data without much need to always login to Payscribe web portal.

With these endpoints you can retrieve your business profile, review wallet balances, audit the full double-entry ledger, and browse all transactions — all from a single authenticated API call.

AUTHORIZATION
Bearer Token
This folder is using Bearer Token from collectionWelcome to Payscribe API
