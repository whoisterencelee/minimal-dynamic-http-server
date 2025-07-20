/**
Based of below code
but modified to suit my style
**/
/**
 * Minimal Dynamic HTTP Server
 * @author Amit Gupta
 * @description Minimal HTTP server written in Node.js to serve static and dynamic content.
 * 1. Place this code in folder such as 'minimal-http-server'
 * 2. Import the server in your code
 *       const server = require('./minimal-http-server');
 */

// Dependencies
const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Container Object
const server = {};
server.router = {}  // handles dynamic content with a data chunks receive complete
server.express = {} // don't even handles data chunks just pass request to middleware with some additional express properties

// Base directory - Assuming minimal-dynamic-http-server will be accessed from its own folder
const baseDir = path.join(__dirname, '../www/');  // remember the slash at the end

/**
 *
 * HANDLE STATIC CONTENT
 *
 */

// Allowed Mime types for static content
const mimeTypes = {
  '.txt' : 'text/plain',
  '.html': 'text/html',
  '.jgp': 'image/jpeg',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.rss': 'application/rss+xml',
  '.xml': 'application/xml',
};

const corheaders = {  // reference https://bigcodenerd.org/enable-cors-node-js-without-express/
	'Access-Control-Allow-Origin': '*' ,
	'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, PATCH, DELETE' ,
	'Access-Control-Allow-Headers' : 'Origin,Authorization,X-Requested-With,content-type,Accept' ,
	'Access-Control-Max-Age': 2592000, // 30 days
	//'Access-Control-Allow-Credentials' : true
	/** add other headers as per requirement */

	//'Set-Cookie' : 'user=chocochipchip; Secure; Path' ,  
	// thought about using cookie to store user, but is won't work
	// since cookie will only be store for the form submit url at functional.limited
	// Path won't work, because the url is still fixed functional.limited/subscribe
	// Domain is used for only subdomain cookie
	// cookie needs expire date otherwise become session cookie
	// seems cookie wont work for me, just use devicekey
};

// JSON.stringify for request object which has circular references
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value#Examples
const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
                if (typeof value === "object" && value !== null) {
                        if (seen.has(value)) {
                                return;
                        }
                        seen.add(value);
                }
                return value;
        };
};
var json = ( c ) => JSON.stringify( c, getCircularReplacer() )
server.json = json

/**
 * Get the content type for a given path
 * @param {string} url - url extracted from request.url
 */
server.getContentType = url => {
  // Set the default content type to application/octet-stream
  let contentType = 'application/octet-stream';

  // Get the file extension
  const extname = path.extname(url);

  // Set the contentType based on the mime type
  for (let key in mimeTypes) {
    if (mimeTypes.hasOwnProperty(key)) {
      if (extname === key) {
        contentType = mimeTypes[key];
      }
    }
  }
  return contentType;
};

/**
 * Serve the static content
 * @param {string} pathname - request.url - such as /public/index.html
 * @param {Object} response - response object expected by the http.createServer callback
 */
server.serveStaticContent = (pathname, response) => {
  // Get content type based on the file extension passed in the request url
  const contentType = server.getContentType(pathname);

  // Read the file and send the response
  fs.readFile(`${baseDir}${pathname}`, (error, data) => {
    if (!error) {
      response.writeHead(200 , Object.assign( { 'Content-Type' : contentType } , corheaders ) )
      response.end(data);
    } else {
      response.writeHead(404 , corheaders );
      response.end('404 - File Not Found');
    }
  });
};

/**
 * HANDLE DYNAMIC CONTENT
 *
 */

/**
 * Serve the dynamic content
 * @param {string} pathname - dynamic path
 * @param {Object} response - response object expected by the http.createServer callback
 *
 */
server.serveDynamicContent = (request, response) => {
  // Parse the incoming request url
  const parsedUrl = url.parse(request.url, true);
  // Retrieve the pathname and query object from the parsed url
  const { pathname, query } = parsedUrl;
  request.pathname = pathname
  request.query = query

  // buffer holds the request body that might come with a POST or PUT request.
  let buffer = [];

  request.on('error', error => {
    console.log('Error Occurred', error);
    response.writeHead(500);
    response.end('Error occurred while processing HTTP request', error);
  });

  request.on('data', chunk => {
    buffer.push(chunk);
  });

  request.on('end', () => {
    buffer = Buffer.concat(buffer);

    // Prepare the request data object to pass to the handler function
    request.buffer = buffer

    // Retrieve the handler for the path
    const handler = server.router[pathname];
    /**
     * Call the handler for the path
     * @param {Object} responseData
     * @param {function} callback function definition
     *
     */
    handler( request , (statusCode = 200, data = {}) => {
	    if( statusCode == 301 ){
		    response.writeHead( 301 , Object.assign( { Location: data } , corheaders ) )
		    response.end();
	    }else{
		    response.writeHead( statusCode , corheaders );
		    response.end(data);
	    }
    });
  });
};
/**
 * CREATE SERVER INSTANCE
 *
 */
const httpServer = http.createServer((request, response) => {

  // Cross Domain Allowed
  if( request.method == "OPTIONS" ){
	console.log( "cross domain option allowed" )
  	response.writeHead( 204 , corheaders )
	response.end()
	return
  }
  
  let pathname = url.parse(request.url, false).pathname.replace( /\.\./g , "" )  // prevent parent directory traversal

  if( server.express.hasOwnProperty( pathname ) ){  // check own property and not prototype properties HAZARD
	console.log( " Express " + pathname )
	request.query = url.parse( request.url , true ).query
	//console.log( request.query )
	server.express[ pathname ]( request , response )
  } else if ( server.router.hasOwnProperty( pathname ) ){  // dynamic routing
	console.log( " Dynamic " + pathname )
	server.serveDynamicContent(request, response);
  } else {
	pathname == "/" ? pathname = "/index.html" : true  // static routing
	console.log( " Static " + pathname )
	server.serveStaticContent(pathname, response);
  }
});

/**
 * Main method to start the server
 * @param {integer} port - default value 3000
 *
 */
server.init = (port = 3000 ) => {
  httpServer.listen(port, () => {
    console.log(`Server is listening at ${port}`);
  });
};

// Export module
module.exports = server;
