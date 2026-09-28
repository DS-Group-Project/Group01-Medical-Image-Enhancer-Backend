import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'email',
      'password',
      'token',
      'filename',
      'imageKey',
      'originalKey',
      'enhancedKey',
      'user.email',
      'user.name',
      'req.headers.authorization'
    ],
    censor: '[REDACTED]'
  }
});

export default logger;
