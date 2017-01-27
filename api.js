/**
 * Created by Vladimir Kusto on 1/26/2017.
 */

const request = require('request'),
	express = require('express'),
	app = express(),
	GOOGLE_GEO_URL = 'https://maps.googleapis.com/maps/api/',
	PARAMS = {
		ADDRESS: 'address',
		TIMESTAMP: 'timestamp'
	},
	STATUS_CODE = {
		OK: 200,
		NO_CONTENT: 204,
		BAD_REQUEST: 400,
		INTERNAL_SERVER_ERROR: 500
	},
	DEBUG = process.env.DEBUG_GEOAPI,
	API_KEY = process.env.GEO_APIKEY,
	PORT = process.env.PORT || 8080,
	router = express.Router();

/**
 * Checking exist or empty request parameter.
 * @param req - request
 * @param res - response
 * @param paramName - queryString parameter
 * @returns string value or false if not exist or empty
 */
var existsParameter = function( req, res, paramName ){
	var value = req.body && req.body[paramName] || req.query[paramName] || req.headers['x-access-' + paramName];
	if (!value) {
		if(DEBUG) console.log('No property',paramName);
		res.status(STATUS_CODE.BAD_REQUEST).json({
			message: 'Invalid request. Invalid \''+paramName+'\' parameter.'
		});
		return '';
	}else{
		return value;
	}
};

/**
 * Call Google Services
 * @param url - for Google API
 * @param cb - callback
 */
var callGoogleService = function( url, cb ) {
	request.get(url, function (err, geoResp, data) {
		if (err) {
			if(DEBUG) console.log('GoogleService err:', err);
			cb( STATUS_CODE.INTERNAL_SERVER_ERROR, err);
		} else {
			var objData = JSON.parse( data || '{}');
			if(DEBUG) console.log('GoogleService url:', url);
			if(DEBUG) console.log('GoogleService data:', objData);

			var status = STATUS_CODE.NO_CONTENT;
			if( objData.status ){
				if(['OK', 'ZERO_RESULTS'].indexOf(objData.status) >= 0){
					status = STATUS_CODE.OK;
				}
			}
			cb(status, objData);
		}
	});
};

/**
 * Sent Requests to GeoCode service.
 * @param req - request
 * @param res - response
 * @param address of street
 * @param cb - callback
 */
var getGeoCode = function( req, res, address, cb ) {
		var url = GOOGLE_GEO_URL + 'geocode/json?address=' + address + '&key=' + API_KEY;
		callGoogleService( url, function(status, data){
			if(DEBUG) console.log('GeoCode:', status, data);
			if( cb ){
				cb(status, data);
			} else {
				res.status(status);
				res.json(data);
			}
		});
};

/**
 * Sent Requests to Timezone service.
 * @param req - request
 * @param res - response
 * @param address - string
 * @param timestamp - number
 * @param cb - callback
 */
var getTimeZone = function( req, res, address, timestamp, cb ) {
  // call for geocode
	getGeoCode( req, res, address, function(status, geocode) {
		if (DEBUG) console.log('tz geocode', status, geocode);
		if (status == STATUS_CODE.OK && geocode.results && geocode.results.length > 0) {

			var location = geocode.results[0].geometry.location;

			if (location && location.lat && location.lng) {

				// call for geocode timezone.
				var url = GOOGLE_GEO_URL
					+ 'timezone/json?location=' + location.lat + ',' + location.lng
					+ '&timestamp=' + timestamp
					+ '&key=' + API_KEY;

				if (DEBUG) console.log('tz url', url);

				callGoogleService(url, function (status, data) {
					if (cb) {
						cb(status, data);
					} else {
						if (DEBUG) console.log('TimeZone:', data);
						res.status(status).json(data);
					}
				});
			}
		}else{
			// no geocode
			if (DEBUG) console.log('tz no geocode', status, geocode);
			res.status(status).json(geocode);
		}
	});
};

router.use( function(req, res, next){
	next();
});

router.get('/', function(req, res) {
	res.status(STATUS_CODE.OK).json({
		message: 'Please call /geo-api/geocode or /geo-api/timezone with address and timestamp parameters.'
	});
});

router.route('/geocode').get( function( req, res ){
	var address;
	if ((address = existsParameter( req, res, PARAMS.ADDRESS))) {
		if(DEBUG) console.log('/geocode address:', address);
		getGeoCode(req, res, address);
	}
});

router.route('/timezone').get( function( req, res ){
	var address, timestamp;
	if ( (address = existsParameter( req, res, PARAMS.ADDRESS)) && (timestamp = existsParameter( req, res, PARAMS.TIMESTAMP))) {
		if(DEBUG) console.log('/timezone address:', address, 'timestamp:', timestamp);
		getTimeZone( req, res, address, timestamp );
	}
});

app.use('/geo-api', router);
app.listen(PORT);
console.log('Proxy Google Geo Service running http://localhost:' + PORT);