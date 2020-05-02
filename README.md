# Minimal HTTP Server for Dynamic Content

Simple Node.js server for static and dynamic content

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Purpose

This is a simple application written in Node.js without using any frameworks to serve static and dynamic content.

## Usage

1. Download the `index.js` file and place it in its own folder such as `minimal-dynamic-http-server/`
2. Import the server in your code
   `const server = require('./minimal-dynamic-http-server');`

3. If serving dynamic content, set the allowed paths and corresponding listeners by calling `server.setAllowedPaths()` method.

   ```
   const paths = {
       '/api/abc': abcHandler,
       '/api/def': defHandler
   };

   server.setAllowedPaths(paths);
   ```

4. Write the request handlers

   ```
   const abcHandler = (responseData, callback) => {
       // Code goes here...

       //Finally call the callback function with statusCode as the first argument and response as the second argument.
       callback(200, 'This is a test response');
   }

   const defHandler = (responseData, callback) => {
       // Code goes here...
   }
   ```

5. Start the server
   ```
   server.init(); // This will start the server on port 3000
   ```
   or, explictly specify the port
   ```
   server.init(3500); //This will start the server on port 3500
   ```

## Static Content

```
Example: http://localhost:3000/public/index.html
```
This will display `/public/index.html` page

## Dynamic Content
Based on the sample path shown above
```
http://localhost:3000/api/abc
```
will display "This is a test response"

## Complete Sample Usage
```
const server = require('./minimal-dynamic-http-server');

const paths = {
    '/api/abc': abcHandler,
    '/api/def': defHandler
};

server.setAllowedPaths(paths);

const abcHandler = (responseData, callback) => {
    // Code goes here...

    //Finally call the callback function with statusCode as the first argument and response as the second argument.
    callback(200, '{"foo":"bar"}');
}

const defHandler = (responseData, callback) => {
    // Code goes here...
    callback(200, '{"message":"Have a nice day!"}');
}

server.init(3500);
```
