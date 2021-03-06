// Copyright Zaiste. All rights reserved.
// Licensed under the Apache License, Version 2.0

const crypto = require('crypto');
const Stream = require('stream');
const { NotModified } = require('../response');
const fs = require('fs').promises;

module.exports = () => {
  return async (context, next) => {
    const response = await next();

    const { body, headers, statusCode } = response;

    if (!body || 'ETag' in headers) return response;

    const status = (statusCode / 100) | 0;
    if (2 != status) return response;

    let content;
    if (body instanceof Stream) {
      // FIXME for now don't cache streams
      return response;
    } else if ('string' == typeof body || Buffer.isBuffer(body)) {
      content = body;
    } else {
      content = JSON.stringify(body);
    }

    const hash = crypto
        .createHash('sha1')
        .update(content, 'utf8')
        .digest('base64')
        .substring(0, 27);

    const length = typeof content === 'string'
          ? Buffer.byteLength(content, 'utf8')
          : entity.length

    const etag = `"${length.toString(16)}-${hash}"`;
    headers.ETag = etag;

    if (isFresh(context.request.headers, headers)) {
      return NotModified(headers);
    }

    return response;
  };
};

// TODO Handle the RFC properly (header names casing etc)
// the `fresh` package doesn't handle that
const isFresh = (requestHeaders, responseHeaders) => {
  const fromRequest = requestHeaders['if-none-match'];
  const fromResponse = responseHeaders['ETag'];

  return fromResponse === fromRequest;
};
