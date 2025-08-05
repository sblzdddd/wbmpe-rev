// Define colors for different log levels (foreground colors)
export const levelColors = {
  error: '\x1b[31m',    // Red text
  warn: '\x1b[33m',     // Yellow text
  info: '\x1b[34m',     // Blue text
  success: '\x1b[32m',  // Green text
  debug: '\x1b[32m',    // Green text
  verbose: '\x1b[35m',  // Magenta text
  silly: '\x1b[36m',    // Cyan text
  orange: '\x1b[38;5;208m', // Orange text
  purple: '\x1b[38;5;99m',  // Purple text
  pink: '\x1b[38;5;213m',   // Pink text
  brown: '\x1b[38;5;130m',  // Brown text
  gray: '\x1b[38;5;240m',   // Gray text
  cyan: '\x1b[36m',    // Cyan text
  lightBlue: '\x1b[38;5;87m',   // Light blue text
  lightGreen: '\x1b[38;5;120m', // Light green text
  lightYellow: '\x1b[38;5;229m', // Light yellow text
  lightRed: '\x1b[38;5;203m',   // Light red text
  lightPurple: '\x1b[38;5;147m', // Light purple text
  lightCyan: '\x1b[38;5;159m',  // Light cyan text
  darkBlue: '\x1b[38;5;18m',    // Dark blue text
  darkGreen: '\x1b[38;5;22m',   // Dark green text
  darkRed: '\x1b[38;5;52m'      // Dark red text
};

// Define background colors for service name
export const serviceBgColors = {
  error: '\x1b[41m',    // Red background
  warn: '\x1b[43m',     // Yellow background
  info: '\x1b[44m',     // Blue background
  success: '\x1b[42m',  // Green background
  debug: '\x1b[42m',    // Green background
  verbose: '\x1b[45m',  // Magenta background
  silly: '\x1b[46m',    // Cyan background
  orange: '\x1b[48;5;208m' // Orange background
};

export const resetColor = '\x1b[0m';
export const whiteText = '\x1b[37m'; // White foreground text