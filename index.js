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

// Base directory - Assuming minimal-dynamic-http-server will be accessed from its own folder
const baseDir = path.join(__dirname, '../');

/**
 *
 * HANDLE STATIC CONTENT
 *
 */

// Allowed Mime types for static content
const mimeTypes = {
  '.html': 'text/html',
  '.jgp': 'image/jpeg',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

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
  // Set the Content-Type response header
  response.setHeader('Content-Type', contentType);

  // Read the file and send the response
  fs.readFile(`${baseDir}${pathname}`, (error, data) => {
    if (!error) {
      response.writeHead(200);
      response.end(data);
    } else {
      response.writeHead(404);
      response.end('404 - File Not Found');
    }
  });
};

/**
 * HANDLE DYNAMIC CONTENT
 *
 */

/**
 * If incoming path is one of the allowed dynamic paths then return the path
 * else return false
 * @param {string} path
 */
server.getAllowedDynamicPath = path => {
  for (const key in server.router) {
    if (server.router.hasOwnProperty(key)) {
      if (path === key) {
        return path;
      }
    }
  }
  return false;
};

/**
 * Serve the dynamic content
 * @param {string} pathname - dynamic path
 * @param {Object} response - response object expected by the http.createServer callback
 *
 */
server.serveDynamicContent = (request, response) => {
  // Retrieve the HTTP method
  const method = request.method.toLowerCase();
  // Parse the incoming request url
  const parsedUrl = url.parse(request.url, true);
  // Retrieve the pathname and query object from the parsed url
  const { pathname, query } = parsedUrl;

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
    const request = {
      method,
      pathname,
      query,
      buffer,
    };

    // Retrieve the handler for the path
    const handler = server.router[pathname];
    /**
     * Call the handler for the path
     * @param {Object} responseData
     * @param {function} callback function definition
     *
     */
    handler( request , (statusCode = 200, data = {}) => {
      response.writeHead(statusCode);
      response.end(data);
    });
  });
};
/**
 * CREATE SERVER INSTANCE
 *
 */
const httpServer = http.createServer((request, response) => {
  let pathname = url.parse(request.url, false).pathname;
  const dynamicPath = server.getAllowedDynamicPath(pathname);
  if (dynamicPath) {
    server.serveDynamicContent(request, response);
    console.log( " Dynamic " + pathname )
  } else {
    pathname == "/" ? pathname = "/index.html" : true
    server.serveStaticContent(pathname, response);
    console.log( " Static " + pathname )
  }
});

server.router = {}

/**
 * Main method to start the server
 * @param {integer} port - default value 3000
 * @param {string} host - default value 127.0.0.1
 *
 */
server.init = (port = 3000, host = '127.0.0.1') => {
  httpServer.listen(port, host, () => {
    console.log(`Server is listening at http://${host}:${port}`);
  });
};

// Export module
module.exports = server;
