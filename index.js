/**
 * Minimal HTTP Server
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

// Container Object
const server = {};

// Base directory - Assuming minimal-http-server will be accessed from its own folder
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
 * Object to hold allowed dynamic paths. Use the setAllowedPaths() public method to set the dynamic paths and the corresponding handlers.
 * {string}path/{function}handler
 * Example:
 * allowedPaths = {
 *                 '/api/somepath': somehandler,
 *                 '/api/anotherpath': anotherhandler
 *               }
 */
let allowedPaths = {};

/**
 * If incoming path is one of the allowed dynamic paths then return the path
 * else return false
 * @param {string} path
 */
server.getAllowedDynamicPath = path => {
  let dynamicPath;
  for (const key in allowedPaths) {
    if (allowedPaths.hasOwnProperty(key)) {
      dynamicPath = path === key ? path : false;
    }
  }
  return dynamicPath;
};

/**
 * Serve the dynamic content
 * @param {string} pathname - dynamic path
 * @param {Object} response - response object expected by the http.createServer callback
 * @todo Enhance this to handle different method types - get, post, etc. and query object
 */
server.serveDynamicContent = (request, response) => {
  const { method, url } = request;
  if (method.toLowerCase() === 'get') {
    // retrieve the handler
    const handler = allowedPaths[url];
    handler((statusCode = 200, data = {}) => {
      response.writeHead(statusCode);
      response.end(data);
    });
  } else {
    response.writeHead(405);
    response.end('Only GET HTTP request is allowed');
  }
};
/**
 * CREATE SERVER INSTANCE
 *
 */
const httpServer = http.createServer((request, response) => {
  const pathname = request.url;
  const dynamicPath = server.getAllowedDynamicPath(pathname);

  if (dynamicPath) {
    server.serveDynamicContent(request, response);
  } else {
    server.serveStaticContent(pathname, response);
  }
});

/**
 *
 * PUBLIC METHODS
 *
 */
/**
 * Set allowed paths
 * @param {Object} paths - Object containing all the allowed paths
 */
server.setAllowedPaths = paths => {
  allowedPaths = paths;
};

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
