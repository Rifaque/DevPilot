require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('./middleware/auth');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));


app.use(morgan('common'));

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'DevPilot API' }));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/ai', require('./routes/ai'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err?.stack || err);
  res.status(500).json({ error: 'Server error' });
});

const expressJSDocSwagger = require('express-jsdoc-swagger');

const swaggerOptions = {
  info: {
    version: '1.0.0',
    title: 'DevPilot API',
    description: 'Auto-generated API documentation for DevPilot',
  },
  baseDir: __dirname, 
  filesPattern: './routes/*.js',
  swaggerUIPath: '/api-docs',
  exposeSwaggerJson: true,
  security: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
    },
  },
};

expressJSDocSwagger(app)(swaggerOptions);


if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`DevPilot backend running on port ${port}`));
}

module.exports = app;
