# geo-api

This is a demo of geo-api assessment.

## Table of Contents
 - [Getting Started](#getting-started)
 - [Basic Usage](#basic-usage)

## Getting Started

* Clone this repository.
* Set the System Variable GEO_APIKEY with your Google API_KEY.
* Run `npm install` from the project root.
* Run `node api` in a terminal from the project root.


## Basic Usage

Open browser:
Then, calling for checking /geocode
```bash
http://localhost:8080/geo-api/geocode?address=10710 State Bridge Road, Alpharetta, GA 30022
```

for checking /timezone
```bash
http://localhost:8080/geo-api/timezone?address=10710 State Bridge Road, Alpharetta, GA 30022&timestamp=1485403320
```