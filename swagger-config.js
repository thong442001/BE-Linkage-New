const swaggerJSDoc = require('swagger-jsdoc');
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dự Án Tốt Nghiệp',
      version: '1.0.0',
      description: "App Linkage là app về mạng xã hội",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          in: 'header',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
  },
  // Đường dẫn đến các file định nghĩa API
  apis: ['./routes/*.js'],
};
const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;

