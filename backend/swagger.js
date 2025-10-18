const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'DevPilot API',
    description: 'Auto-generated API documentation for DevPilot',
    version: '1.0.0',
  },
  host: `localhost:${process.env.PORT || 5000}`,
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
    },
  },
};

const outputFile = './swagger-output.json'; // generated Swagger file
const endpointsFiles = ['./server.js'];       // your main server file

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require('./server.js'); // start server after generating docs
});
