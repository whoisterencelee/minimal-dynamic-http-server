const assert = require('assert').strict;
const server = require('./index');

// Should return appropriate content type
(function() {
  try {
    let contentType = server.getContentType('/public/index.html');
    assert.strictEqual(contentType, 'text/html');

    contentType = server.getContentType('/public/image.png');
    assert.strictEqual(contentType, 'image/png');
  } catch (error) {
    console.log(error);
  }
})();

// Should successfully serve static content
(function() {
  try {
    let _headerType, _headerValue, _data, _statusCode;
    let response = {
      setHeader: (headerType, headerValue) => {
        _headerType = headerType;
        _headerValue = headerValue;
      },
      end: data => {
        _data = data;
      },
      writeHead: statusCode => {
        _statusCode = statusCode;
      },
    };
    server.serveStaticContent('/public/index.html', response);
    assert.strictEqual(_headerType, 'Content-Type');
    assert.strictEqual(_headerValue, 'text/html');
    // Set timeout to wait for the response.
    setTimeout(() => {
      assert.strictEqual(_statusCode, 200);
      assert.ok(_data instanceof Buffer);
    }, 100);
  } catch (error) {
    console.log(error);
  }
})();

// Should handle 404 situation
(function() {
  try {
    let _headerType, _headerValue, _data, _statusCode;
    let response = {
      setHeader: (headerType, headerValue) => {
        _headerType = headerType;
        _headerValue = headerValue;
      },
      end: data => {
        _data = data;
      },
      writeHead: statusCode => {
        _statusCode = statusCode;
      },
    };
    // index2.html does not exist
    server.serveStaticContent('/public/index2.html', response);
    assert.strictEqual(_headerType, 'Content-Type');
    assert.strictEqual(_headerValue, 'text/html');
    // Set timeout to wait for the response.
    setTimeout(() => {
      assert.strictEqual(_statusCode, 404);
      assert(!(_data instanceof Buffer));
    }, 100);
  } catch (error) {
    console.log(error);
  }
})();

// Should get the allowed dynamic path, or return false if a dynamic path does not exists
(function() {
  try {
    server.setAllowedPaths({
      '/api/employees': null,
    });
    let dynamicPath = server.getAllowedDynamicPath('/api/employees');
    assert.strictEqual(dynamicPath, '/api/employees');

    dynamicPath = server.getAllowedDynamicPath('/api/anotherpath');
    assert.strictEqual(dynamicPath, false);
  } catch (error) {
    console.log(error);
  }
})();

// Should successfully server dynamic content
(function() {
  try {
    let _data, _statusCode;
    let response = {
      end: data => {
        _data = data;
      },
      writeHead: statusCode => {
        _statusCode = statusCode;
      },
    };

    let request = {
      method: 'GET',
      url: '/api/employees',
    };
    server.setAllowedPaths({
      '/api/employees': callback => {
        callback(200, { name: 'John Smith' });
      },
    });
    server.serveDynamicContent(request, response);

    // Set timeout to wait for the response.
    setTimeout(() => {
      assert.strictEqual(_statusCode, 200);
      assert.ok(_data instanceof Object);
      assert.deepStrictEqual(_data, { name: 'John Smith' });
    }, 100);
  } catch (error) {
    console.log(error);
  }
})();
