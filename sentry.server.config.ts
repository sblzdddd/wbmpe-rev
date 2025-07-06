import * as Sentry from "@sentry/nuxt";
 
Sentry.init({
  dsn: "https://05f4efa085442291cc90200682c7b329@o4508415437307904.ingest.us.sentry.io/4509620413136896",

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  environment: process.env.NODE_ENV || 'development',

  _experiments: {
    enableLogs: true
  }
});
