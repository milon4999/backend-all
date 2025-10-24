const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

exports.handler = async (event, context) => {
  try {
    const parsedUrl = parse(event.path, true);
    
    // Handle API routes
    if (event.path.startsWith('/api/')) {
      // This is where you would handle your API routes
      // For now, we'll just return a simple response
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'API is working!' }),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }

    // For non-API routes, let Next.js handle them
    await app.prepare();
    return await handle(event, context);
  } catch (err) {
    console.error('Error occurred handling', event.path, err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
