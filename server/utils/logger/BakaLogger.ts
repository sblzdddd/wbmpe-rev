/* eslint-disable no-control-regex */
import winston from "winston";
import path from "path";
import { levelColors, serviceBgColors, whiteText, resetColor } from "./ConsoleColors";
import fs from "fs";

import * as Sentry from "@sentry/nuxt";
import Transport from 'winston-transport';

const SentryWinstonTransport = Sentry.createSentryWinstonTransport(Transport);



// Get current date for log file names
const logFileName = new Date().toLocaleString('zh-CN').replaceAll("/", "-").replaceAll(" ", "_").replaceAll(/:/g, '.');

const logFolder = process.env.NODE_ENV === 'development' ? 'logs/dev/' : 'logs/';

// in development mode, clean logs folder
if (process.env.NODE_ENV === 'development') {
  fs.rmSync(path.join(process.cwd(), logFolder), { recursive: true, force: true });
}

const ansiRegex = /\u001b\[[0-9;]+m/g;

// Determine log level based on environment
const logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

// Custom format for console with colored text and service name
const consoleFormat = winston.format.printf((info) => {
  const color = levelColors[info.level as keyof typeof levelColors] || levelColors.info;
  const serviceBgColor = serviceBgColors[info.level as keyof typeof serviceBgColors] || serviceBgColors.info;
  
  // Extract service name - child logger metadata is merged into the info object
  const serviceName = info.service || 'BakaLogger';
  
  // Remove service from meta to avoid duplication in output
  const { service, timestamp, level, message, ...meta } = info;
  
  return `${color}${timestamp} ${serviceBgColor}${whiteText} ${serviceName} ${resetColor}: ${color}${message} ${Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : ''}${resetColor}`;
});

const logger = winston.createLogger({
  level: logLevel,
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    success: 3,
    debug: 4,
    verbose: 5,
    silly: 6
  },
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        consoleFormat
      )
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(process.cwd(), logFolder, `${logFileName}.log`),
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const newMessage = (message as string).replaceAll(ansiRegex, '');
          return `${timestamp} ${service} ${level.toUpperCase()}: ${newMessage} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join(process.cwd(), logFolder, `${logFileName}.err.log`),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, stack, service, ...meta }) => {
          message = (message as string).replaceAll(ansiRegex, '');
          return `${timestamp} ${service} ${level.toUpperCase()}: ${message}${stack ? '\n' + stack : ''} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      ),
    }),

    new SentryWinstonTransport({
      level: 'verbose',
      silent: process.env.NODE_ENV === 'development'
    }),
  ],
});

logger.log('success', 'Logger initialized', {service: 'BakaLogger'});

export default logger;
